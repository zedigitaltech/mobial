"use client"

import { Suspense, useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Loader2, CheckCircle, XCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type VerificationState = "loading" | "success" | "error"

function VerifyEmailContent() {
  const t = useTranslations("verifyEmail")
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [state, setState] = useState<VerificationState>("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (!token) {
      setState("error")
      setMessage(t("noToken"))
      return
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || "Verification failed")
        }

        setState("success")
        setMessage(result.message || "Email verified successfully!")
      } catch (err) {
        setState("error")
        setMessage(err instanceof Error ? err.message : "Verification failed. Please try again.")
      }
    }

    verifyEmail()
  }, [token, t])

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

              {state === "error" && (
                <div className="flex flex-col gap-3">
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
