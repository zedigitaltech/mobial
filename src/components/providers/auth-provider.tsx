"use client"

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from "react"
import { useRouter } from "next/navigation"
import { AuthModal } from "@/components/auth/auth-modal"
import { getAccessToken, setAccessToken, clearAccessToken, authHeaders } from "@/lib/auth-token"

interface User {
  id: string
  email: string
  name: string | null
  role: "ADMIN" | "CUSTOMER"
  avatar?: string | null
  twoFactorEnabled?: boolean
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  logout: () => Promise<void>
  refresh: () => Promise<void>
  openAuthModal: (view?: "login" | "register") => void
  closeAuthModal: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalView, setModalView] = useState<"login" | "register">("login")

  const router = useRouter()
  const fetchPromiseRef = useRef<Promise<void> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const fetchAuth = useCallback(async () => {
    // Dedup: if already in flight, return existing promise
    if (fetchPromiseRef.current) return fetchPromiseRef.current

    const controller = new AbortController()
    abortRef.current = controller
    const { signal } = controller

    const promise = (async () => {
      try {
        const token = getAccessToken()

        // First try the access token (if present in memory)
        if (token) {
          const response = await fetch("/api/user/me", {
            headers: { Authorization: `Bearer ${token}` },
            signal,
            credentials: "include",
          })
          if (signal.aborted) return

          if (response.ok) {
            const userData = await response.json()
            if (userData.success && userData.data?.user) {
              setUser(userData.data.user)
            }
            return
          }
        }

        // Access token missing or rejected — attempt refresh via HttpOnly cookie.
        // No body needed: the refreshToken is read from the `mobial_refresh` cookie.
        const refreshResponse = await fetch("/api/auth/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
          signal,
          credentials: "include",
        })

        if (signal.aborted) return

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json()
          if (refreshData?.data?.accessToken) {
            setAccessToken(refreshData.data.accessToken)
            const retryResponse = await fetch("/api/user/me", {
              headers: { Authorization: `Bearer ${refreshData.data.accessToken}` },
              signal,
              credentials: "include",
            })
            if (signal.aborted) return
            if (retryResponse.ok) {
              const userData = await retryResponse.json()
              if (userData.success && userData.data?.user) {
                setUser(userData.data.user)
                return
              }
            }
          }
        }

        // Refresh failed — clear any local access token and mark unauthenticated.
        clearAccessToken()
        // Legacy cleanup — older sessions may still have these stored.
        try { localStorage.removeItem("token") } catch {}
        try { localStorage.removeItem("refreshToken") } catch {}
        setUser(null)
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === "AbortError") return
        setUser(null)
      } finally {
        if (!signal.aborted) {
          setIsLoading(false)
        }
        fetchPromiseRef.current = null
      }
    })()

    fetchPromiseRef.current = promise
    return promise
  }, [])

  useEffect(() => {
    fetchAuth()
    return () => {
      abortRef.current?.abort()
    }
  }, [fetchAuth])

  const logout = useCallback(async () => {
    try {
      // Server reads refreshToken from the HttpOnly cookie; body is empty.
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          ...authHeaders(),
          "Content-Type": "application/json",
        },
        body: "{}",
        credentials: "include",
      })
    } catch {
      // Logout cleanup proceeds regardless
    } finally {
      clearAccessToken()
      try { localStorage.removeItem("token") } catch {}
      try { localStorage.removeItem("refreshToken") } catch {}
      setUser(null)
      router.push("/")
    }
  }, [router])

  const refresh = useCallback(async () => {
    await fetchAuth()
  }, [fetchAuth])

  const openAuthModal = (view: "login" | "register" = "login") => {
    setModalView(view)
    setIsModalOpen(true)
  }

  const closeAuthModal = () => setIsModalOpen(false)

  const contextValue: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === "ADMIN",
    logout,
    refresh,
    openAuthModal,
    closeAuthModal,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
      <AuthModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        defaultView={modalView}
      />
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
