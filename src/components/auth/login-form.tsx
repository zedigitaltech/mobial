"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { motion } from "framer-motion"
import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { setAccessToken } from "@/lib/auth-token"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { toast } from "sonner"
import { useTranslations } from "next-intl"
import { GoogleSignIn } from "./google-sign-in"
import { Separator } from "@/components/ui/separator"

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

type LoginFormValues = z.infer<typeof loginSchema>

interface LoginFormProps {
  callbackUrl?: string
  onSuccess?: () => void
  onSwitchToRegister?: () => void
}

export function LoginForm({ callbackUrl, onSuccess, onSwitchToRegister }: LoginFormProps) {
  const t = useTranslations("auth")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Login failed")
      }

      // If the server signals that 2FA is required, redirect to the 2FA challenge
      // page before setting any tokens.
      if (result.data?.requires2FA) {
        const tempToken = result.data.tempToken ?? ''
        router.push(`/2fa?token=${encodeURIComponent(tempToken)}&callbackUrl=${encodeURIComponent(callbackUrl ?? "/dashboard")}`)
        return
      }

      // Access token lives in an in-memory store (XSS-proof across refreshes
      // because /api/auth/refresh will re-mint it from the HttpOnly cookie).
      // Refresh token is set as an HttpOnly cookie by the server.
      if (result.data?.tokens) {
        setAccessToken(result.data.tokens.accessToken)
      }

      toast.success(t("welcomeBackToast"))
      if (onSuccess) {
        onSuccess()
        router.refresh()
      } else {
        router.refresh()
        router.push(callbackUrl ?? "/dashboard")
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("loginFailed"))
      form.setError("root", {
        message: error instanceof Error ? error.message : "Login failed",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-6"
    >
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold">{t("welcomeBack")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("enterCredentials")}
        </p>
      </div>

      <GoogleSignIn onSuccess={onSuccess} text="signin_with" />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">{t("or")}</span>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {form.formState.errors.root && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {form.formState.errors.root.message}
            </div>
          )}

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("email")}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="you@example.com"
                      className="pl-10"
                      type="email"
                      autoComplete="email"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("password")}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="••••••••"
                      type={showPassword ? "text" : "password"}
                      className="pl-10 pr-10"
                      autoComplete="current-password"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center justify-end">
            <Button variant="link" className="px-0 text-sm" type="button" asChild>
              <Link href="/reset-password">{t("forgotPassword")}</Link>
            </Button>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("signIn")}
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm">
        <span className="text-muted-foreground">{t("noAccount")} </span>
        {onSwitchToRegister ? (
          <Button
            variant="link"
            className="px-0"
            type="button"
            onClick={onSwitchToRegister}
          >
            {t("signUp")}
          </Button>
        ) : (
          <Button variant="link" className="px-0" type="button" asChild>
            <Link
              href={
                callbackUrl
                  ? `/register?callbackUrl=${encodeURIComponent(callbackUrl)}`
                  : "/register"
              }
            >
              {t("signUp")}
            </Link>
          </Button>
        )}
      </div>
    </motion.div>
  )
}
