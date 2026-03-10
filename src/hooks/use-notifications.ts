"use client"

import { useState, useEffect, useCallback } from "react"

interface UseNotificationsReturn {
  isSupported: boolean
  permission: NotificationPermission | "unsupported"
  requestPermission: () => Promise<NotificationPermission>
  subscribe: () => Promise<PushSubscription | null>
}

export function useNotifications(): UseNotificationsReturn {
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("unsupported")

  useEffect(() => {
    if (typeof window === "undefined") return

    const supported =
      "Notification" in window &&
      "serviceWorker" in navigator &&
      "PushManager" in window

    setIsSupported(supported)

    if (supported) {
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) return "denied"

    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      return result
    } catch (error) {
      console.error("[Notifications] Permission request failed:", error)
      return "denied"
    }
  }, [isSupported])

  const subscribe = useCallback(async (): Promise<PushSubscription | null> => {
    if (!isSupported) return null

    try {
      const registration = await navigator.serviceWorker.ready

      // Check for existing subscription
      const existing = await registration.pushManager.getSubscription()
      if (existing) return existing

      // Create new subscription
      // In production, replace with your VAPID public key
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidPublicKey) {
        console.warn("[Notifications] VAPID public key not configured")
        return null
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      })

      console.log("[Notifications] Push subscription created")
      return subscription
    } catch (error) {
      console.error("[Notifications] Subscription failed:", error)
      return null
    }
  }, [isSupported])

  return { isSupported, permission, requestPermission, subscribe }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
