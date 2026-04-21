"use client"

import { useQuery } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import {
  RefreshCw,
  Wifi,
  WifiOff,
  Clock,
  Zap,
  Loader2,
  AlertCircle,
  TrendingUp,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface UsageData {
  orderId: string
  iccid: string
  dataUsed: number
  dataTotal: number
  dataUnit: string
  percentage: number
  remainingDays: number
  isActive: boolean
  status: "active" | "expired" | "not_activated"
}

interface UsageTrackerProps {
  orderId: string
  orderNumber: string
  className?: string
}

async function fetchUsage(orderId: string, orderNumber: string): Promise<UsageData> {
  const res = await fetch(`/api/orders/${orderId}/usage`, {
    headers: {
      "x-order-number": orderNumber,
    },
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data?.error || "Failed to fetch usage data")
  }

  const json = await res.json()
  return json.data
}

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
        icon: Wifi,
        dot: "bg-emerald-500",
      }
    case "expired":
      return {
        label: "expired",
        color: "bg-red-500/10 text-red-400 border-red-500/20",
        icon: WifiOff,
        dot: "bg-red-500",
      }
    case "not_activated":
      return {
        label: "notActivated",
        color: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        icon: Clock,
        dot: "bg-amber-500",
      }
    default:
      return {
        label: "unknown",
        color: "bg-muted text-muted-foreground border-border",
        icon: AlertCircle,
        dot: "bg-muted-foreground",
      }
  }
}

export function UsageTracker({ orderId, orderNumber, className }: UsageTrackerProps) {
  const t = useTranslations("usageTracker")
  const {
    data: usage,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["usage", orderId],
    queryFn: () => fetchUsage(orderId, orderNumber),
    refetchInterval: 5 * 60 * 1000,
    retry: 2,
    staleTime: 60 * 1000,
  })

  if (isLoading) {
    return (
      <Card className={cn("border-white/5 bg-white/[0.03] backdrop-blur-2xl", className)}>
        <CardContent className="p-8 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            {t("loadingData")}
          </p>
        </CardContent>
      </Card>
    )
  }

  if (isError) {
    return (
      <Card className={cn("border-white/5 bg-white/[0.03] backdrop-blur-2xl", className)}>
        <CardContent className="p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-red-500/10 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="font-bold text-sm">{t("unavailable")}</p>
              <p className="text-xs text-muted-foreground">
                {error instanceof Error ? error.message : t("couldNotLoad")}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="rounded-xl font-bold text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-2" />
            {t("tryAgain")}
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!usage) return null

  const statusConfig = getStatusConfig(usage.status)
  const usedFormatted = formatData(usage.dataUsed, usage.dataUnit)
  const totalFormatted = formatData(usage.dataTotal, usage.dataUnit)

  const progressColor =
    usage.percentage >= 90
      ? "bg-red-500"
      : usage.percentage >= 70
        ? "bg-amber-500"
        : "bg-primary"

  return (
    <Card className={cn("border-white/5 bg-white/[0.03] backdrop-blur-2xl overflow-hidden", className)}>
      <CardContent className="p-6 space-y-6">
        {/* Header */}
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
          <Badge className={cn("text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border", statusConfig.color)}>
            <div className={cn("h-1.5 w-1.5 rounded-full mr-1 animate-pulse", statusConfig.dot)} />
            {t(statusConfig.label)}
          </Badge>
        </div>

        {/* Progress */}
        <div className="space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-3xl font-black tracking-tight">{usedFormatted}</span>
              <span className="text-sm font-medium text-muted-foreground ml-1">
                {t("of")} {totalFormatted}
              </span>
            </div>
            <span className="text-2xl font-black text-muted-foreground">
              {usage.percentage}%
            </span>
          </div>
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-primary/10">
            <div
              className={cn("h-full rounded-full transition-all duration-700 ease-out", progressColor)}
              style={{ width: `${usage.percentage}%` }}
            />
          </div>
        </div>

        {/* Stats */}
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

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button
            asChild
            className="flex-1 rounded-xl font-black uppercase tracking-widest text-[10px] h-11 bg-primary text-primary-foreground shadow-xl shadow-primary/20"
          >
            <a href={`/products?search=topup`}>
              <Zap className="h-4 w-4 mr-2 fill-current" />
              {t("topUp")}
            </a>
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
            aria-label="Refresh usage data"
            className="rounded-xl h-11 w-11 border-white/10"
          >
            <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
