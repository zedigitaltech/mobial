"use client"

import { useState, useEffect, createContext, useContext, ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"

interface User {
  id: string
  email: string
  name: string | null
  role: string
}

interface AffiliateProfile {
  id: string
  affiliateCode: string
  companyName?: string | null
  status: string
  commissionRate: number
}

interface AffiliateAuthContextType {
  user: User | null
  affiliate: AffiliateProfile | null
  isLoading: boolean
  isAuthenticated: boolean
  isAffiliate: boolean
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AffiliateAuthContext = createContext<AffiliateAuthContextType | null>(null)

export function AffiliateAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [affiliate, setAffiliate] = useState<AffiliateProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const fetchAuth = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setUser(null)
        setAffiliate(null)
        return
      }

      const userRes = await fetch("/api/user/me", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!userRes.ok) {
        localStorage.removeItem("token")
        localStorage.removeItem("refreshToken")
        setUser(null)
        setAffiliate(null)
        return
      }

      const userData = await userRes.json()
      if (userData.success && userData.data) {
        setUser(userData.data.user)
        setAffiliate(userData.data.affiliateProfile)
      }
    } catch (error) {
      console.error("Auth fetch error:", error)
      setUser(null)
      setAffiliate(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAuth()
  }, [])

  useEffect(() => {
    if (isLoading) return

    const isRegisterPage = pathname === "/affiliate/register"

    if (!user && !isRegisterPage) {
      router.push("/")
      return
    }

    if (user && !affiliate && !isRegisterPage) {
      router.push("/affiliate/register")
      return
    }

    if (user && affiliate && isRegisterPage) {
      router.push("/affiliate")
      return
    }
  }, [user, affiliate, isLoading, pathname, router])

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
      setAffiliate(null)
      router.push("/")
    }
  }

  const refresh = async () => {
    await fetchAuth()
  }

  const contextValue: AffiliateAuthContextType = {
    user,
    affiliate,
    isLoading,
    isAuthenticated: !!user,
    isAffiliate: !!affiliate && affiliate.status === "ACTIVE",
    logout,
    refresh,
  }

  return (
    <AffiliateAuthContext.Provider value={contextValue}>
      {children}
    </AffiliateAuthContext.Provider>
  )
}

export function useAffiliateAuth() {
  const context = useContext(AffiliateAuthContext)
  if (!context) {
    throw new Error("useAffiliateAuth must be used within an AffiliateAuthProvider")
  }
  return context
}
