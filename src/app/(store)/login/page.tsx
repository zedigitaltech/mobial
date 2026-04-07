"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/components/providers/auth-provider"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoading, openAuthModal } = useAuth()
  const rawCallback = searchParams.get("callbackUrl") || "/"
  const callbackUrl =
    rawCallback.startsWith("/") && !rawCallback.startsWith("//")
      ? rawCallback
      : "/"

  useEffect(() => {
    if (isLoading) return

    if (user) {
      router.replace(callbackUrl)
      return
    }

    openAuthModal("login")
    router.replace("/")
  }, [user, isLoading, callbackUrl, router, openAuthModal])

  return (
    <div className="flex-1 flex flex-col items-center justify-center space-y-4 min-h-[50vh]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}
