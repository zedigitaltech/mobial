"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  Wifi,
  WifiOff,
  Clock,
  Search,
  Loader2,
  AlertCircle,
  TrendingUp,
  Zap,
  RefreshCw,
  ArrowRight,
  Hash,
  CreditCard,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { usePostHog } from "posthog-js/react"

interface UsageData {
  orderId: string
  orderNumber: string | null
  iccid: string
  dataUsed: number
  dataTotal: number
  dataUnit: string
  percentage: number
  remainingDays: number
  isActive: boolean
  status: "active" | "expired" | "not_activated"
}

type LookupType = "iccid" | "order_number"

function formatData(amount: number, unit: string): string {
  if (unit === "MB" && amount >= 1000) {
    return `${(amount / 1000).toFixed(2)} GB`
  }
  if (unit === "MB") {
    return `${Math.round(amount)} MB`
  }
  return `${amount.toFixed(2)} ${unit}`
}

function getStatusConfig(status: string) {
  switch (status) {
    case "active":
      return {
        label: "active",
        color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        dot: "bg-emerald-500",
        icon: Wifi,
      }
    case "expired":
      return {
        label: "expired",
        color: "bg-red-500/10 text-red-400 border-red-500/20",
        dot: "bg-red-500",
        icon: WifiOff,
      }
    case "not_activated":
      return {
        label: "notActivated",
        color: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        dot: "bg-amber-500",
        icon: Clock,
      }
    default:
      return {
        label: "unknown",
        color: "bg-muted text-muted-foreground border-border",
        dot: "bg-muted-foreground",
        icon: AlertCircle,
      }
  }
}

export default function CheckUsagePage() {
  const t = useTranslations("checkUsage")
  const [lookupType, setLookupType] = useState<LookupType>("order_number")
  const [inputValue, setInputValue] = useState("")
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const posthog = usePostHog()

  async function handleLookup() {
    if (!inputValue.trim()) return

    setIsLoading(true)
    setError(null)
    setUsage(null)

    try {
      const res = await fetch("/api/usage/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: lookupType, value: inputValue.trim() }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.error || "Failed to fetch usage data")
        return
      }

      setUsage(data.data)
      posthog?.capture("usage_checked", {
        lookup_type: lookupType,
        iccid: data.data.iccid,
        status: data.data.status,
        percentage: data.data.percentage,
        remaining_days: data.data.remainingDays,
      })
    } catch {
      setError(t("networkError"))
    } finally {
      setIsLoading(false)
    }
  }

  const statusConfig = usage ? getStatusConfig(usage.status) : null
  const progressColor = usage
    ? usage.percentage >= 90
      ? "bg-red-500"
      : usage.percentage >= 70
        ? "bg-amber-500"
        : "bg-primary"
    : "bg-primary"

  return (
    <>
      {/* Hero */}
        <section className="relative pt-20 pb-12 overflow-hidden">
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--primary)_0%,_transparent_70%)] opacity-[0.03]" />
            <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
          </div>

          <div className="container mx-auto px-4 text-center space-y-6">
            <Badge className="bg-primary/10 text-primary border-0 px-4 py-1.5 text-xs font-black uppercase tracking-wider">
              <TrendingUp className="h-3 w-3 mr-1" /> {t("badge")}
            </Badge>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1]">
              {t("title")}{" "}
              <span className="text-primary italic">{t("titleHighlight")}</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
              {t("subtitle")}
            </p>
          </div>
        </section>

        {/* Lookup Form */}
        <section className="py-8">
          <div className="container mx-auto px-4 max-w-xl">
            <Card className="border-white/5 bg-white/[0.03] backdrop-blur-2xl">
              <CardContent className="p-6 space-y-6">
                {/* Lookup Type Toggle */}
                <div className="flex gap-2">
                  <Button
                    variant={lookupType === "order_number" ? "default" : "outline"}
                    size="sm"
                    onClick={() => { setLookupType("order_number"); setInputValue(""); setError(null); setUsage(null) }}
                    className="flex-1 rounded-xl font-bold text-xs"
                  >
                    <CreditCard className="h-3.5 w-3.5 mr-2" />
                    {t("orderNumber")}
                  </Button>
                  <Button
                    variant={lookupType === "iccid" ? "default" : "outline"}
                    size="sm"
                    onClick={() => { setLookupType("iccid"); setInputValue(""); setError(null); setUsage(null) }}
                    className="flex-1 rounded-xl font-bold text-xs"
                  >
                    <Hash className="h-3.5 w-3.5 mr-2" />
                    {t("iccid")}
                  </Button>
                </div>

                {/* Input */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    {lookupType === "order_number" ? t("orderNumber") : t("iccidNumber")}
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder={
                        lookupType === "order_number"
                          ? t("orderNumberPlaceholder")
                          : t("iccidPlaceholder")
                      }
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                      className="rounded-xl h-12 font-mono text-sm"
                    />
                    <Button
                      onClick={handleLookup}
                      disabled={isLoading || !inputValue.trim()}
                      className="rounded-xl h-12 px-6 font-black uppercase tracking-widest text-[10px]"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {lookupType === "order_number"
                      ? t("orderNumberHelp")
                      : t("iccidHelp")}
                  </p>
                </div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20"
                    >
                      <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
                      <p className="text-sm text-red-400">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Usage Results */}
        <AnimatePresence>
          {usage && statusConfig && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="py-8"
            >
              <div className="container mx-auto px-4 max-w-xl">
                <Card className="border-white/5 bg-white/[0.03] backdrop-blur-2xl overflow-hidden">
                  <CardContent className="p-6 space-y-6">
                    {/* Status Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                          <TrendingUp className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            {t("dataUsage")}
                          </p>
                          <p className="font-bold text-sm">{t("esimTracker")}</p>
                        </div>
                      </div>
                      <Badge
                        className={cn(
                          "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border",
                          statusConfig.color
                        )}
                      >
                        <div className={cn("h-1.5 w-1.5 rounded-full mr-1 animate-pulse", statusConfig.dot)} />
                        {t(statusConfig.label)}
                      </Badge>
                    </div>

                    {/* Progress */}
                    <div className="space-y-3">
                      <div className="flex items-end justify-between">
                        <div>
                          <span className="text-3xl font-black tracking-tight">
                            {formatData(usage.dataUsed, usage.dataUnit)}
                          </span>
                          <span className="text-sm font-medium text-muted-foreground ml-1">
                            {t("of")} {formatData(usage.dataTotal, usage.dataUnit)}
                          </span>
                        </div>
                        <span className="text-2xl font-black text-muted-foreground">
                          {usage.percentage}%
                        </span>
                      </div>
                      <div className="relative h-3 w-full overflow-hidden rounded-full bg-primary/10">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${usage.percentage}%` }}
                          transition={{ duration: 0.7, ease: "easeOut" }}
                          className={cn("h-full rounded-full", progressColor)}
                        />
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          {t("remaining")}
                        </p>
                        <p className="text-lg font-black">
                          {formatData(Math.max(0, usage.dataTotal - usage.dataUsed), usage.dataUnit)}
                        </p>
                      </div>
                      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          {t("daysLeft")}
                        </p>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <p className="text-lg font-black">
                            {usage.remainingDays > 0 ? `${usage.remainingDays}d` : t("expired")}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* ICCID Info */}
                    {usage.iccid && (
                      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                          {t("iccid")}
                        </p>
                        <p className="font-mono text-xs text-muted-foreground">{usage.iccid}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                      <Button
                        asChild
                        className="flex-1 rounded-xl font-black uppercase tracking-widest text-[10px] h-11 bg-primary text-primary-foreground shadow-xl shadow-primary/20"
                      >
                        <Link href="/topup">
                          <Zap className="h-4 w-4 mr-2 fill-current" />
                          {t("topUpData")}
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleLookup}
                        disabled={isLoading}
                        className="rounded-xl h-11 w-11 border-white/10"
                      >
                        <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* How It Works */}
        {!usage && (
          <section className="py-16">
            <div className="container mx-auto px-4 max-w-3xl">
              <h2 className="text-2xl font-black tracking-tight text-center mb-8">
                {t("howToFind")}
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-white/5 bg-white/[0.03]">
                  <CardContent className="p-6 space-y-3">
                    <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-bold">{t("orderNumberTitle")}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t("orderNumberDesc")}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-white/5 bg-white/[0.03]">
                  <CardContent className="p-6 space-y-3">
                    <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Hash className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-bold">{t("iccidTitle")}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t("iccidDesc")}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="text-center mt-12">
                <p className="text-sm text-muted-foreground mb-4">
                  {t("needMoreData")}
                </p>
                <Button variant="outline" className="rounded-2xl px-8 h-12 font-bold" asChild>
                  <Link href="/topup">
                    {t("topUpEsim")} <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        )}
    </>
  )
}
