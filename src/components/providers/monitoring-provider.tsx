"use client"

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from "react"
import { usePathname } from "next/navigation"

// ==================== SESSION ID ====================

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return ""
  const key = "mobial_session_id"
  let id = sessionStorage.getItem(key)
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem(key, id)
  }
  return id
}

// ==================== USER-AGENT PARSING ====================

function detectDevice(): string {
  if (typeof window === "undefined") return "unknown"
  const ua = navigator.userAgent
  if (/Mobi|Android/i.test(ua)) return "mobile"
  if (/Tablet|iPad/i.test(ua)) return "tablet"
  return "desktop"
}

function detectBrowser(): string {
  if (typeof window === "undefined") return "unknown"
  const ua = navigator.userAgent
  if (ua.includes("Firefox")) return "firefox"
  if (ua.includes("Edg/")) return "edge"
  if (ua.includes("OPR/") || ua.includes("Opera")) return "opera"
  if (ua.includes("Chrome") && !ua.includes("Edg/")) return "chrome"
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "safari"
  return "other"
}

function detectOS(): string {
  if (typeof window === "undefined") return "unknown"
  const ua = navigator.userAgent
  if (ua.includes("Win")) return "windows"
  if (ua.includes("Mac")) return "macos"
  if (ua.includes("iPhone") || ua.includes("iPad")) return "ios"
  if (ua.includes("Android")) return "android"
  if (ua.includes("Linux")) return "linux"
  return "other"
}

// ==================== ANALYTICS CONTEXT ====================

interface AnalyticsContextValue {
  trackEvent: (
    name: string,
    properties?: Record<string, unknown>,
    value?: number
  ) => void
}

const AnalyticsContext = createContext<AnalyticsContextValue>({
  trackEvent: () => {},
})

export function useAnalytics() {
  return useContext(AnalyticsContext)
}

// ==================== BEACON SENDER ====================

function sendBeacon(endpoint: string, data: Record<string, unknown>): void {
  const body = JSON.stringify(data)
  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" })
    const sent = navigator.sendBeacon(`/api/monitoring/${endpoint}`, blob)
    if (!sent) {
      fetch(`/api/monitoring/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {})
    }
  } else {
    fetch(`/api/monitoring/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {})
  }
}

// ==================== PROVIDER ====================

interface MonitoringProviderProps {
  children: ReactNode
  userId?: string
}

export function MonitoringProvider({ children, userId }: MonitoringProviderProps) {
  const pathname = usePathname()
  const lastPathRef = useRef<string>("")
  const sessionIdRef = useRef<string>("")
  const userIdRef = useRef<string | undefined>(userId)

  useEffect(() => {
    userIdRef.current = userId
  }, [userId])

  useEffect(() => {
    sessionIdRef.current = getOrCreateSessionId()
  }, [])

  // Auto-track page views on route changes
  useEffect(() => {
    if (!pathname || pathname === lastPathRef.current) return
    if (!sessionIdRef.current) return

    // Skip admin and API routes
    if (pathname.startsWith("/admin") || pathname.startsWith("/api")) return

    lastPathRef.current = pathname

    // Defer to avoid impacting page load performance
    const timeout = setTimeout(() => {
      const loadTimeMs =
        typeof performance !== "undefined" &&
        performance.getEntriesByType("navigation").length > 0
          ? Math.round(
              (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming)
                .loadEventEnd
            )
          : undefined

      sendBeacon("pageview", {
        path: pathname,
        referrer: document.referrer || undefined,
        sessionId: sessionIdRef.current,
        userId: userIdRef.current,
        device: detectDevice(),
        browser: detectBrowser(),
        os: detectOS(),
        loadTimeMs: loadTimeMs && loadTimeMs > 0 ? loadTimeMs : undefined,
      })
    }, 100)

    return () => clearTimeout(timeout)
  }, [pathname])

  // Global error handler
  useEffect(() => {
    function handleError(event: ErrorEvent) {
      sendBeacon("error", {
        message: event.message || "Unhandled error",
        stack: event.error?.stack,
        path: window.location.pathname,
        userId: userIdRef.current,
      })
    }

    function handleUnhandledRejection(event: PromiseRejectionEvent) {
      const reason = event.reason
      sendBeacon("error", {
        message:
          reason instanceof Error
            ? reason.message
            : typeof reason === "string"
            ? reason
            : "Unhandled promise rejection",
        stack: reason instanceof Error ? reason.stack : undefined,
        path: window.location.pathname,
        userId: userIdRef.current,
        metadata: { type: "unhandledRejection" },
      })
    }

    window.addEventListener("error", handleError)
    window.addEventListener("unhandledrejection", handleUnhandledRejection)

    return () => {
      window.removeEventListener("error", handleError)
      window.removeEventListener("unhandledrejection", handleUnhandledRejection)
    }
  }, [])

  const trackEvent = useCallback(
    (
      name: string,
      properties?: Record<string, unknown>,
      value?: number
    ) => {
      if (!sessionIdRef.current) return

      sendBeacon("event", {
        name,
        properties,
        value,
        sessionId: sessionIdRef.current,
        userId: userIdRef.current,
        path: window.location.pathname,
      })
    },
    []
  )

  return (
    <AnalyticsContext.Provider value={{ trackEvent }}>
      {children}
    </AnalyticsContext.Provider>
  )
}
