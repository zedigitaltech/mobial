"use client"

import { getAccessToken } from "@/lib/auth-token"
import { useEffect, useState } from "react"
import Link from "next/link"
import {
  DollarSign,
  Package,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Wifi,
  WifiOff,
  Mail,
  MailX,
  ExternalLink,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { RevenueChart } from "./revenue-chart"

// ── Types ──────────────────────────────────────────────────────────────────────

interface ChartEntry {
  date: string
  amount: number
}

interface RevenueStats {
  today: number
  week: number
  month: number
  chart: ChartEntry[]
}

interface OrderStats {
  total: number
  fulfilled: number
  failed: number
  pending: number
  refunded: number
}

interface SystemHealth {
  mobimatterApiUp: boolean
  stripeWebhookLastReceived: string | null
  emailServiceUp: boolean
}

interface FailedOrder {
  id: string
  orderNumber: string
  email: string
  total: number
  currency: string
  createdAt: string
}

interface DashboardStats {
  revenue: RevenueStats
  orders: OrderStats
  fulfillmentRate: number
  systemHealth: SystemHealth
  // Legacy fields (kept for backward compat with existing UI if any)
  recentOrders: FailedOrder[]
  ordersByStatus: Record<string, number>
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatUsd(amount: number): string {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function relativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// ── Sub-components ─────────────────────────────────────────────────────────────

interface RevenueCardProps {
  label: string
  amount: number
}

function RevenueCard({ label, amount }: RevenueCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-bold">{formatUsd(amount)}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <DollarSign className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface OrderCardProps {
  label: string
  count: number
  color: "blue" | "green" | "red" | "amber"
}

const colorMap: Record<
  OrderCardProps["color"],
  { bg: string; text: string; icon: string }
> = {
  blue: {
    bg: "bg-blue-500/10",
    text: "text-blue-600",
    icon: "text-blue-600",
  },
  green: {
    bg: "bg-green-500/10",
    text: "text-green-600",
    icon: "text-green-600",
  },
  red: {
    bg: "bg-red-500/10",
    text: "text-red-600",
    icon: "text-red-600",
  },
  amber: {
    bg: "bg-amber-500/10",
    text: "text-amber-600",
    icon: "text-amber-600",
  },
}

function OrderCard({ label, count, color }: OrderCardProps) {
  const c = colorMap[color]
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className={`mt-1 text-2xl font-bold ${c.text}`}>
              {count.toLocaleString()}
            </p>
          </div>
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${c.bg}`}>
            <Package className={`h-5 w-5 ${c.icon}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface HealthRowProps {
  label: string
  up: boolean
  sub?: string
  icon: React.ReactNode
  downIcon: React.ReactNode
}

function HealthRow({ label, up, sub, icon, downIcon }: HealthRowProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <div
          className={`h-9 w-9 rounded-lg flex items-center justify-center ${
            up ? "bg-green-500/10" : "bg-red-500/10"
          }`}
        >
          <span className={up ? "text-green-600" : "text-red-600"}>
            {up ? icon : downIcon}
          </span>
        </div>
        <div>
          <p className="text-sm font-medium">{label}</p>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
      </div>
      <Badge
        variant="outline"
        className={
          up
            ? "border-green-500/30 bg-green-500/10 text-green-600"
            : "border-red-500/30 bg-red-500/10 text-red-600"
        }
      >
        {up ? "UP" : "DOWN"}
      </Badge>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [failedOrders, setFailedOrders] = useState<FailedOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void loadStats()
  }, [])

  async function loadStats() {
    try {
      const token = getAccessToken()
      const res = await fetch("/api/admin/stats", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const json: { data: DashboardStats & { recentOrders?: FailedOrder[]; ordersByStatus?: Record<string, number> } } = await res.json()
        const data = json.data
        setStats(data)

        // Derive failed orders from recentOrders filtered by status
        const failed = (data.recentOrders ?? []).filter(
          (o) => (o as FailedOrder & { status?: string }).status === "FAILED"
        )
        setFailedOrders(failed)
      }
    } finally {
      setLoading(false)
    }
  }

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="lg:col-span-2 h-80" />
          <Skeleton className="h-80" />
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  const revenue = stats?.revenue ?? { today: 0, week: 0, month: 0, chart: [] }
  const orders = stats?.orders ?? { total: 0, fulfilled: 0, failed: 0, pending: 0, refunded: 0 }
  const health = stats?.systemHealth ?? {
    mobimatterApiUp: false,
    stripeWebhookLastReceived: null,
    emailServiceUp: false,
  }
  const fulfillmentRate = stats?.fulfillmentRate ?? 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Overview</h2>
        <p className="text-sm text-muted-foreground">{today}</p>
      </div>

      {/* Row 1 — Revenue stat cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <RevenueCard label="Revenue Today" amount={revenue.today} />
        <RevenueCard label="Revenue This Week" amount={revenue.week} />
        <RevenueCard label="Revenue This Month" amount={revenue.month} />
      </div>

      {/* Row 2 — Order stat cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <OrderCard label="Total Orders" count={orders.total} color="blue" />
        <OrderCard label="Fulfilled" count={orders.fulfilled} color="green" />
        <OrderCard label="Failed" count={orders.failed} color="red" />
        <OrderCard label="Pending" count={orders.pending} color="amber" />
      </div>

      {/* Row 3 — Revenue chart + System health */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Revenue — Last 30 Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={revenue.chart} />
          </CardContent>
        </Card>

        {/* System health */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            <HealthRow
              label="MobiMatter API"
              up={health.mobimatterApiUp}
              icon={<Wifi className="h-4 w-4" />}
              downIcon={<WifiOff className="h-4 w-4" />}
            />
            <HealthRow
              label="Stripe Webhook"
              up={health.stripeWebhookLastReceived !== null}
              sub={
                health.stripeWebhookLastReceived
                  ? `Last: ${relativeTime(health.stripeWebhookLastReceived)}`
                  : "No webhook recorded"
              }
              icon={<CheckCircle2 className="h-4 w-4" />}
              downIcon={<XCircle className="h-4 w-4" />}
            />
            <HealthRow
              label="Email Service"
              up={health.emailServiceUp}
              icon={<Mail className="h-4 w-4" />}
              downIcon={<MailX className="h-4 w-4" />}
            />
            {/* Fulfillment rate summary */}
            <div className="pt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Fulfillment Rate</span>
                <span
                  className={`font-semibold ${
                    fulfillmentRate >= 90
                      ? "text-green-600"
                      : fulfillmentRate >= 70
                      ? "text-amber-600"
                      : "text-red-600"
                  }`}
                >
                  {fulfillmentRate}%
                </span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    fulfillmentRate >= 90
                      ? "bg-green-500"
                      : fulfillmentRate >= 70
                      ? "bg-amber-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${Math.min(fulfillmentRate, 100)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 4 — Recent failed orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold">
            Recent Failed Orders
          </CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/orders?status=FAILED">
              Retry All
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {failedOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <p className="text-sm text-muted-foreground">No failed orders</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="pb-2 text-left font-medium">Order #</th>
                    <th className="pb-2 text-left font-medium">Email</th>
                    <th className="pb-2 text-right font-medium">Amount</th>
                    <th className="pb-2 text-right font-medium">Date</th>
                    <th className="pb-2 w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {failedOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 pr-4 font-mono font-medium">
                        {order.orderNumber}
                      </td>
                      <td className="py-2.5 pr-4 text-muted-foreground truncate max-w-[200px]">
                        {order.email}
                      </td>
                      <td className="py-2.5 pr-4 text-right">
                        {formatUsd(order.total)}
                      </td>
                      <td className="py-2.5 pr-4 text-right text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 text-right">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="inline-flex items-center justify-center h-7 w-7 rounded hover:bg-muted"
                          aria-label={`View order ${order.orderNumber}`}
                        >
                          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
