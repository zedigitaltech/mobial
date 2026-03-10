"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Lock, Loader2, Eye, EyeOff, CheckCircle, XCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ResetPasswordConfirmPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/password/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to reset password")
      }

      setIsSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md"
          >
            <Card className="border-border/50 shadow-2xl">
              <CardHeader className="text-center space-y-2">
                <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
                  <XCircle className="h-8 w-8 text-destructive" />
                </div>
                <CardTitle className="text-2xl font-bold">Invalid link</CardTitle>
                <CardDescription>
                  This password reset link is invalid or has expired. Please request a new one.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  <Button className="w-full" asChild>
                    <Link href="/reset-password">Request new link</Link>
                  </Button>
                  <Button variant="ghost" className="w-full" asChild>
                    <Link href="/">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to home
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <Card className="border-border/50 shadow-2xl">
            <CardHeader className="text-center space-y-2">
              {isSuccess ? (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2"
                  >
                    <CheckCircle className="h-8 w-8 text-primary" />
                  </motion.div>
                  <CardTitle className="text-2xl font-bold">Password reset!</CardTitle>
                  <CardDescription>
                    Your password has been successfully reset. You can now log in with your new password.
                  </CardDescription>
                </>
              ) : (
                <>
                  <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <Lock className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl font-bold">Set new password</CardTitle>
                  <CardDescription>
                    Enter your new password below. Make sure it&apos;s at least 8 characters and includes uppercase, lowercase, numbers, and special characters.
                  </CardDescription>
                </>
              )}
            </CardHeader>

            <CardContent>
              {isSuccess ? (
                <div className="flex flex-col gap-3">
                  <Button className="w-full" asChild>
                    <Link href="/">Log in</Link>
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium">
                      New password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter new password"
                        className="pl-10 pr-10"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="text-sm font-medium">
                      Confirm password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm new password"
                        className="pl-10 pr-10"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading || !password || !confirmPassword}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Reset password
                  </Button>

                  <Button variant="ghost" className="w-full" asChild>
                    <Link href="/reset-password">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Link>
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>

      <Footer />
    </div>
  )
}
