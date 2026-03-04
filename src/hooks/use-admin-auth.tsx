"use client"

import { useState, useEffect, createContext, useContext, ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"

interface AdminUser {
  id: string
  email: string
  name: string | null
  role: string
}

interface AdminAuthContextType {
  user: AdminUser | null
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const fetchAuth = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setUser(null)
        return
      }

      const userRes = await fetch("/api/user/me", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!userRes.ok) {
        localStorage.removeItem("token")
        localStorage.removeItem("refreshToken")
        setUser(null)
        return
      }

      const userData = await userRes.json()
      if (userData.success && userData.data) {
        // Check if user is admin
        if (userData.data.user.role !== "ADMIN") {
          setUser(null)
          return
        }
        setUser(userData.data.user)
      }
    } catch (error) {
      console.error("Admin auth fetch error:", error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAuth()
  }, [])

  useEffect(() => {
    if (isLoading) return

    if (!user) {
      router.push("/")
      return
    }
  }, [user, isLoading, pathname, router])

  const logout = async () => {
    try {
      const token = localStorage.getItem("token")
      if (token) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        })
      }
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      localStorage.removeItem("token")
      localStorage.removeItem("refreshToken")
      setUser(null)
      router.push("/")
    }
  }

  const refresh = async () => {
    await fetchAuth()
  }

  const contextValue: AdminAuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: !!user && user.role === "ADMIN",
    logout,
    refresh,
  }

  return (
    <AdminAuthContext.Provider value={contextValue}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider")
  }
  return context
}
