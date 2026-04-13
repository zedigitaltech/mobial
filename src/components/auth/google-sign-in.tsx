"use client"

import { useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { setAccessToken } from "@/lib/auth-token"

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential: string }) => void
            auto_select?: boolean
          }) => void
          renderButton: (
            element: HTMLElement,
            config: {
              type?: string
              theme?: string
              size?: string
              width?: number
              text?: string
              shape?: string
            }
          ) => void
        }
      }
    }
  }
}

interface GoogleSignInProps {
  onSuccess?: () => void
  text?: "signin_with" | "signup_with" | "continue_with"
}

export function GoogleSignIn({ onSuccess, text = "continue_with" }: GoogleSignInProps) {
  const t = useTranslations("auth")
  const buttonRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  useEffect(() => {
    if (!clientId || !buttonRef.current) return

    const initGoogle = () => {
      if (!window.google?.accounts?.id || !buttonRef.current) return

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
      })

      window.google.accounts.id.renderButton(buttonRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        width: 360,
        text,
        shape: "pill",
      })
    }

    // GSI script might already be loaded
    if (window.google?.accounts?.id) {
      initGoogle()
    } else {
      // Wait for script to load
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval)
          initGoogle()
        }
      }, 100)
      return () => clearInterval(interval)
    }
  }, [clientId, text])

  const handleCredentialResponse = async (response: { credential: string }) => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Google sign-in failed")
      }

      // Access token in-memory only; refresh token in HttpOnly cookie.
      if (data.data?.tokens) {
        setAccessToken(data.data.tokens.accessToken)
      }

      toast.success(t("welcome"))
      onSuccess?.()
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("googleSignInFailed"))
    } finally {
      setIsLoading(false)
    }
  }

  if (!clientId) return null

  return (
    <div className="w-full">
      <div
        ref={buttonRef}
        className={`flex justify-center ${isLoading ? "opacity-50 pointer-events-none" : ""}`}
      />
    </div>
  )
}
