"use client"

import { useEffect } from "react"
import * as Sentry from "@sentry/nextjs"
import { AlertTriangle, RefreshCw, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function StoreError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-20">
      <div className="text-center space-y-6 max-w-md mx-auto">
        <div className="w-16 h-16 bg-red-500/10 rounded-[2rem] flex items-center justify-center mx-auto">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black tracking-tight">Something went wrong</h2>
          <p className="text-muted-foreground font-medium text-sm">
            An unexpected error occurred. Your payment has not been charged.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            className="rounded-2xl px-6 h-12 font-black w-full sm:w-auto"
            onClick={reset}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button
            variant="outline"
            className="rounded-2xl px-6 h-12 font-black border-2 w-full sm:w-auto"
            asChild
          >
            <Link href="/products">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Browse Plans
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
