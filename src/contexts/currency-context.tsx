"use client"

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react"
import { DEFAULT_CURRENCY, formatPrice as formatPriceFn } from "@/lib/currency"

interface CurrencyContextType {
  currency: string
  setCurrency: (code: string) => void
  rates: Record<string, number>
  formatPrice: (amountUsd: number) => string
  convertPrice: (amountUsd: number) => number
  isLoading: boolean
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

const STORAGE_KEY = "mobial_currency"
const RATES_CACHE_KEY = "mobial_exchange_rates"
const RATES_CACHE_TTL = 1000 * 60 * 60 // 1 hour

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState(DEFAULT_CURRENCY)
  const [rates, setRates] = useState<Record<string, number>>({ USD: 1 })
  const [isLoading, setIsLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Load saved currency preference after hydration
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) setCurrencyState(saved)
    setIsMounted(true)
  }, [])

  // Fetch exchange rates
  useEffect(() => {
    async function fetchRates() {
      // Check cache first
      const cached = localStorage.getItem(RATES_CACHE_KEY)
      if (cached) {
        try {
          const { rates: cachedRates, timestamp } = JSON.parse(cached)
          if (Date.now() - timestamp < RATES_CACHE_TTL) {
            setRates(cachedRates)
            return
          }
        } catch {}
      }

      setIsLoading(true)
      try {
        const res = await fetch("/api/exchange-rates")
        if (res.ok) {
          const data = await res.json()
          const fetchedRates = data.data?.rates || { USD: 1 }
          setRates(fetchedRates)
          localStorage.setItem(
            RATES_CACHE_KEY,
            JSON.stringify({ rates: fetchedRates, timestamp: Date.now() })
          )
        }
      } catch {
        // Fallback: keep USD: 1
      } finally {
        setIsLoading(false)
      }
    }

    fetchRates()
  }, [])

  const setCurrency = useCallback((code: string) => {
    setCurrencyState(code)
    localStorage.setItem(STORAGE_KEY, code)
  }, [])

  const activeCurrency = isMounted ? currency : DEFAULT_CURRENCY

  const formatPrice = useCallback(
    (amountUsd: number) => formatPriceFn(amountUsd, activeCurrency, rates),
    [activeCurrency, rates]
  )

  const convertPrice = useCallback(
    (amountUsd: number) => {
      const rate = rates[activeCurrency] || 1
      return amountUsd * rate
    },
    [activeCurrency, rates]
  )

  return (
    <CurrencyContext.Provider
      value={{ currency: activeCurrency, setCurrency, rates, formatPrice, convertPrice, isLoading }}
    >
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (!context) {
    throw new Error("useCurrency must be used within CurrencyProvider")
  }
  return context
}
