"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { motion, AnimatePresence } from "framer-motion"
import { Bell, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useNotifications } from "@/hooks/use-notifications"
import { useCompare } from "@/contexts/compare-context"

const STORAGE_KEY = "mobial-notification-dismissed"
const PAGE_VIEW_KEY = "mobial-page-views"
const PAGE_VIEW_THRESHOLD = 3

export function NotificationPrompt() {
  const t = useTranslations("notifications")
  const [visible, setVisible] = useState(false)
  const { isSupported, permission, requestPermission, subscribe } = useNotifications()
  const { items: compareItems } = useCompare()

  useEffect(() => {
    if (!isSupported) return
    if (permission === "granted" || permission === "denied") return

    // Check if already dismissed
    const dismissed = localStorage.getItem(STORAGE_KEY)
    if (dismissed) return

    // Increment page view count
    const views = parseInt(localStorage.getItem(PAGE_VIEW_KEY) || "0", 10) + 1
    localStorage.setItem(PAGE_VIEW_KEY, String(views))

    // Show after threshold page views
    if (views >= PAGE_VIEW_THRESHOLD) {
      const timer = setTimeout(() => setVisible(true), 2000)
      return () => clearTimeout(timer)
    }
  }, [isSupported, permission])

  async function handleEnable() {
    const result = await requestPermission()
    if (result === "granted") {
      await subscribe()
    }
    setVisible(false)
    localStorage.setItem(STORAGE_KEY, "true")
  }

  function handleDismiss() {
    setVisible(false)
    localStorage.setItem(STORAGE_KEY, "true")
  }

  if (compareItems.length > 0) return null

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 80 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-[420px] z-50"
        >
          <div className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl p-5 shadow-2xl shadow-black/40">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-sm">{t("stayInLoop")}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("notifDesc")}
                    </p>
                  </div>
                  <button
                    onClick={handleDismiss}
                    className="text-muted-foreground hover:text-foreground transition-colors p-1 -mt-1 -mr-1"
                    aria-label="Dismiss notification prompt"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="rounded-xl text-xs font-bold h-8 px-4"
                    onClick={handleEnable}
                  >
                    {t("enable")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-xl text-xs font-bold h-8 px-4 text-muted-foreground"
                    onClick={handleDismiss}
                  >
                    {t("notNow")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
