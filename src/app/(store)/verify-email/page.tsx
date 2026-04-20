"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Loader2, CheckCircle, XCircle, ArrowLeft, Mail } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getAccessToken } from "@/lib/auth-token"

type VerificationState = "loading" | "success" | "error" | "required"

const RESEND_COOLDOWN_SECONDS = 60

function ResendButton() {
  const [cooldown, setCooldown] = useState(0)
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")
  const [resendError, setResendError] = useState("")
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN_SECONDS)
    intervalRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!)
          intervalRef.current = null
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleResend = async () => {
    setResendStatus("sending")
    setResendError("")

    try {
      const token = getAccessToken()
      const headers: Record<string, string> = { "Content-Type": "application/json" }
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      const response = await fetch("/api/auth/verify-email/resend", {
        method: "POST",
        headers,
        credentials: "include",
      })

      const result = await response.json() as { error?: string; message?: string }

      if (!response.ok) {
        throw new Error(result.error ?? "Failed to resend verification email")
      }

      setResendStatus("sent")
      startCooldown()
    } catch (err) {
      setResendStatus("error")
      setResendError(err instanceof Error ? err.message : "Failed to resend. Please try again.")
    }
  }

  const isDisabled = cooldown > 0 || resendStatus === "sending"

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="outline"
        className="w-full"
        onClick={handleResend}
        disabled={isDisabled}
      >
        {resendStatus === "sending" ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending…
          </>
        ) : cooldown > 0 ? (
          <>
            <Mail className="mr-2 h-4 w-4" />
            Resend in {cooldown}s
          </>
        ) : (
          <>
            <Mail className="mr-2 h-4 w-4" />
            Resend verification email
          </>
        )}
      </Button>
      {resendStatus === "sent" && cooldown > 0 && (
        <p className="text-sm text-center text-muted-foreground">
          Verification email sent! Check your inbox.
        </p>
      )}
      {resendStatus === "error" && resendError && (
        <p className="text-sm text-center text-destructive">{resendError}</p>
      )}
    </div>
  )
}

function VerifyEmailContent() {
  const t = useTranslations("verifyEmail")
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const required = searchParams.get("required") === "1"

  const [state, setState] = useState<VerificationState>(() => {
    if (!token && required) return "required"
    return "loading"
  })
  const [message, setMessage] = useState("")

  useEffect(() => {
    // If redirected here without a token (required=1), show the "please verify" state
    if (!token) {
      if (required) {
        setState("required")
      } else {
        setState("error")
        setMessage(t("noToken"))
      }
      return
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
        const result = await response.json() as { error?: string; message?: string }

        if (!response.ok) {
          throw new Error(result.error ?? "Verification failed")
        }

        setState("success")
        setMessage(result.message ?? "Email verified successfully!")
      } catch (err) {
        setState("error")
        setMessage(err instanceof Error ? err.message : "Verification failed. Please try again.")
      }
    }

    verifyEmail()
  }, [token, required, t])

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <Card className="border-border/50 shadow-2xl">
          <CardHeader className="text-center space-y-2">
            {state === "loading" && (
              <>
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ repeat: Infinity, repeatType: "reverse", duration: 1 }}
                  className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2"
                >
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </motion.div>
                <CardTitle className="text-2xl font-bold">{t("verifyingTitle")}</CardTitle>
                <CardDescription>
                  {t("verifyingDesc")}
                </CardDescription>
              </>
            )}

            {state === "required" && (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2"
                >
                  <Mail className="h-8 w-8 text-primary" />
                </motion.div>
                <CardTitle className="text-2xl font-bold">Verify your email</CardTitle>
                <CardDescription>
                  You need to verify your email address before accessing this page.
                  Check your inbox for a verification link.
                </CardDescription>
              </>
            )}

            {state === "success" && (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2"
                >
                  <CheckCircle className="h-8 w-8 text-primary" />
                </motion.div>
                <CardTitle className="text-2xl font-bold">{t("successTitle")}</CardTitle>
                <CardDescription>{message}</CardDescription>
              </>
            )}

            {state === "error" && (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-2"
                >
                  <XCircle className="h-8 w-8 text-destructive" />
                </motion.div>
                <CardTitle className="text-2xl font-bold">{t("errorTitle")}</CardTitle>
                <CardDescription>{message}</CardDescription>
              </>
            )}
          </CardHeader>

          <CardContent>
            {state === "success" && (
              <div className="flex flex-col gap-3">
                <Button className="w-full" asChild>
                  <Link href="/">{t("logIn")}</Link>
                </Button>
              </div>
            )}

            {state === "required" && (
              <div className="flex flex-col gap-3">
                <ResendButton />
                <Button variant="ghost" className="w-full" asChild>
                  <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t("backToHome")}
                  </Link>
                </Button>
              </div>
            )}

            {state === "error" && (
              <div className="flex flex-col gap-3">
                <ResendButton />
                <Button variant="ghost" className="w-full" asChild>
                  <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t("backToHome")}
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <VerifyEmailContent />
    </Suspense>
  )
}
