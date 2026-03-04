"use client";

import { useState, useEffect, useCallback, useSyncExternalStore, useMemo } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface UsePWAReturn {
  /** Whether the app can be installed (install prompt is available) */
  canInstall: boolean;
  /** Whether the app is currently running as a PWA */
  isPWA: boolean;
  /** Whether the app is running in standalone mode */
  isStandalone: boolean;
  /** Whether the device supports PWA */
  isSupported: boolean;
  /** Prompt the user to install the app */
  promptInstall: () => Promise<boolean>;
  /** Check if service worker is registered */
  isServiceWorkerRegistered: boolean;
  /** Whether the app is offline */
  isOffline: boolean;
}

// Helper functions to check PWA status without setState
function getIsSupported(): boolean {
  if (typeof window === "undefined") return false;
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

function getIsPWA(): boolean {
  if (typeof window === "undefined") return false;

  // Check if running in standalone mode (PWA)
  const isStandaloneMode = window.matchMedia("(display-mode: standalone)").matches;
  
  // Check iOS standalone mode
  const isIosStandalone = ("standalone" in window.navigator && 
    (window.navigator as Navigator & { standalone: boolean }).standalone);
  
  // Check if launched from homescreen on iOS
  const isIosHomescreen = document.referrer.includes("homescreen.html");
  
  return isStandaloneMode || isIosStandalone || isIosHomescreen;
}

function getIsOffline(): boolean {
  if (typeof window === "undefined") return false;
  return !navigator.onLine;
}

function getStandaloneFromMediaQuery(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches;
}

// External store subscriptions
function subscribeToOnlineStatus(callback: () => void): () => void {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function subscribeToDisplayMode(callback: () => void): () => void {
  const mediaQuery = window.matchMedia("(display-mode: standalone)");
  mediaQuery.addEventListener("change", callback);
  return () => mediaQuery.removeEventListener("change", callback);
}

// External store for install prompt
let deferredPromptInstance: BeforeInstallPromptEvent | null = null;
const installPromptListeners = new Set<() => void>();

function getCanInstall(): boolean {
  return deferredPromptInstance !== null;
}

function subscribeToInstallPrompt(callback: () => void): () => void {
  installPromptListeners.add(callback);
  return () => installPromptListeners.delete(callback);
}

function notifyInstallPromptListeners() {
  installPromptListeners.forEach(callback => callback());
}

// Initialize install prompt listener
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e: Event) => {
    e.preventDefault();
    deferredPromptInstance = e as BeforeInstallPromptEvent;
    notifyInstallPromptListeners();
  });

  window.addEventListener("appinstalled", () => {
    deferredPromptInstance = null;
    notifyInstallPromptListeners();
  });
}

/**
 * Hook for Progressive Web App functionality
 * 
 * Provides utilities for:
 * - Checking if app is installed/running as PWA
 * - Prompting user to install the app
 * - Detecting offline status
 * - Service worker registration status
 */
export function usePWA(): UsePWAReturn {
  // Use useSyncExternalStore for values that change based on external events
  const isOffline = useSyncExternalStore(
    subscribeToOnlineStatus,
    getIsOffline,
    () => false // Server snapshot
  );

  const isStandaloneFromMediaQuery = useSyncExternalStore(
    subscribeToDisplayMode,
    getStandaloneFromMediaQuery,
    () => false // Server snapshot
  );

  const canInstallFromStore = useSyncExternalStore(
    subscribeToInstallPrompt,
    getCanInstall,
    () => false // Server snapshot
  );

  const [isServiceWorkerRegistered, setIsServiceWorkerRegistered] = useState(false);

  // Compute derived values using useMemo
  const isSupported = useMemo(() => getIsSupported(), []);
  
  const isStandalone = useMemo(() => {
    if (isStandaloneFromMediaQuery) return true;
    return getIsPWA();
  }, [isStandaloneFromMediaQuery]);

  const isPWA = isStandalone;

  // Register service worker
  useEffect(() => {
    if (typeof window === "undefined" || !getIsSupported()) return;

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        console.log("[PWA] Service Worker registered:", registration.scope);
        
        // Check for updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                console.log("[PWA] New content available, refresh to update");
              }
            });
          }
        });

        setIsServiceWorkerRegistered(true);
      } catch (error) {
        console.error("[PWA] Service Worker registration failed:", error);
        setIsServiceWorkerRegistered(false);
      }
    };

    registerSW();
  }, []);

  // Prompt install
  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPromptInstance) {
      console.log("[PWA] Install prompt not available");
      return false;
    }

    try {
      // Show the install prompt
      await deferredPromptInstance.prompt();

      // Wait for user response
      const { outcome } = await deferredPromptInstance.userChoice;

      console.log("[PWA] Install prompt outcome:", outcome);

      // Clear the deferred prompt
      deferredPromptInstance = null;
      notifyInstallPromptListeners();

      return outcome === "accepted";
    } catch (error) {
      console.error("[PWA] Install prompt error:", error);
      return false;
    }
  }, []);

  return {
    canInstall: canInstallFromStore,
    isPWA,
    isStandalone,
    isSupported,
    promptInstall,
    isServiceWorkerRegistered,
    isOffline,
  };
}

export default usePWA;
