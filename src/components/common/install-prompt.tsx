"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { X, Download, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePWA } from "@/hooks/use-pwa"

function isDismissedInStorage(): boolean {
  if (typeof window === "undefined") return true
  const wasDismissed = localStorage.getItem("mobial_install_dismissed")
  if (!wasDismissed) return false
  const dismissedAt = parseInt(wasDismissed, 10)
  return Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000
}

export function InstallPrompt() {
  const { canInstall, isPWA, promptInstall } = usePWA()
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (isPWA || isDismissedInStorage() || !canInstall) {
      return
    }

    // Show after user has browsed for 30 seconds
    timerRef.current = setTimeout(() => {
      setVisible(true)
    }, 30000)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [canInstall, isPWA])

  const handleDismiss = useCallback(() => {
    setVisible(false)
    localStorage.setItem("mobial_install_dismissed", Date.now().toString())
  }, [])

  const handleInstall = useCallback(async () => {
    const accepted = await promptInstall()
    if (accepted) {
      setVisible(false)
    }
  }, [promptInstall])

  if (!visible || isPWA) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-card border border-border/50 rounded-2xl shadow-2xl shadow-black/20 p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Smartphone className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-bold text-sm">Add MobiaL to Home Screen</p>
              <p className="text-xs text-muted-foreground">
                Quick access, offline browsing, instant eSIM management
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <Button
          onClick={handleInstall}
          size="sm"
          className="w-full font-bold text-xs"
        >
          <Download className="mr-2 h-3.5 w-3.5" />
          Install App
        </Button>
      </div>
    </div>
  )
}
