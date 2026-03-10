"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { motion } from "framer-motion"
import {
  Activity,
  Database,
  Wifi,
  CreditCard,
  Mail,
  RefreshCw,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ShoppingCart,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"

interface HealthCheck {
  status: string
  message?: string
  responseTime?: number
}

interface HealthData {
  status: string
  checks: Record<string, HealthCheck>
  lastProductSync: string | null
  uptime: string
  uptimeMs: number
  orders: {
    last24h: number
    last7d: number
    last30d: number
  }
  timestamp: string
}

interface AuditEntry {
  id: string
  action: string
  entity: string | null
  entityId: string | null
  userId: string | null
  createdAt: string
  newValues: string | null
  user?: { name: string | null; email: string }
}

function ServiceStatusCard({
  name,
  icon: Icon,
  status,
  message,
  responseTime,
}: {
  name: string
  icon: React.ElementType
  status: string
  message?: string
  responseTime?: number
}) {
  const statusConfig: Record<string, { color: string; bgColor: string; label: string; icon: React.ElementType }> = {
    healthy: { color: "text-green-600", bgColor: "bg-green-500/10", label: "Healthy", icon: CheckCircle2 },
    down: { color: "text-red-600", bgColor: "bg-red-500/10", label: "Down", icon: XCircle },
    not_configured: { color: "text-yellow-600", bgColor: "bg-yellow-500/10", label: "Not Configured", icon: AlertTriangle },
    degraded: { color: "text-yellow-600", bgColor: "bg-yellow-500/10", label: "Degraded", icon: AlertTriangle },
  }

  const config = statusConfig[status] || statusConfig.down
  const StatusIcon = config.icon

  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 rounded-lg ${config.bgColor} flex items-center justify-center`}>
          <Icon className={`h-5 w-5 ${config.color}`} />
        </div>
        <div>
          <p className="font-medium">{name}</p>
          {message && (
            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{message}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {responseTime !== undefined && (
          <span className="text-xs text-muted-foreground">{responseTime}ms</span>
        )}
        <Badge variant="outline" className={`${config.bgColor} ${config.color} border-transparent`}>
          <StatusIcon className="h-3 w-3 mr-1" />
          {config.label}
        </Badge>
      </div>
    </div>
  )
}

export default function AdminMonitoringPage() {
  const [health, setHealth] = useState<HealthData | null>(null)
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([])
  const [errorLogs, setErrorLogs] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const getToken = () => localStorage.getItem("token")

  const fetchHealth = useCallback(async () => {
    try {
      const token = getToken()
      const res = await fetch("/api/admin/health", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const data = await res.json()
      setHealth(data.data)
    } catch (error) {
      console.error("Failed to fetch health:", error)
    }
  }, [])

  const fetchAuditLogs = useCallback(async () => {
    try {
      const token = getToken()
      const res = await fetch("/api/admin/settings", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
    } catch (error) {
      console.error("Failed to fetch audit logs:", error)
    }
  }, [])

  const fetchAll = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true)
    await Promise.all([fetchHealth(), fetchAuditLogs()])
    setLastRefresh(new Date())
    if (showRefreshing) setRefreshing(false)
  }, [fetchHealth, fetchAuditLogs])

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await fetchAll()
      setLoading(false)
    }
    init()

    intervalRef.current = setInterval(() => {
      fetchAll()
    }, 30000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fetchAll])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    )
  }

  const checks = health?.checks || {}

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Monitoring</h1>
          <p className="text-muted-foreground">
            System health and activity overview
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            Last refresh: {lastRefresh.toLocaleTimeString()}
          </span>
          <Badge variant="outline" className="text-xs">
            Auto-refresh: 30s
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAll(true)}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Overall Status Banner */}
      {health && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className={
            health.status === "healthy"
              ? "border-green-500/30 bg-green-500/5"
              : health.status === "degraded"
              ? "border-yellow-500/30 bg-yellow-500/5"
              : "border-red-500/30 bg-red-500/5"
          }>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {health.status === "healthy" ? (
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  ) : health.status === "degraded" ? (
                    <AlertTriangle className="h-6 w-6 text-yellow-600" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-600" />
                  )}
                  <div>
                    <p className="font-semibold capitalize">
                      System {health.status}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Uptime: {health.uptime}
                    </p>
                  </div>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <p>Last check: {new Date(health.timestamp).toLocaleTimeString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Health
            </CardTitle>
            <CardDescription>Status of all connected services</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ServiceStatusCard
              name="Database"
              icon={Database}
              status={checks.database?.status || "down"}
              message={checks.database?.message}
              responseTime={checks.database?.responseTime}
            />
            <ServiceStatusCard
              name="MobiMatter API"
              icon={Wifi}
              status={checks.mobimatter?.status || "down"}
              message={checks.mobimatter?.message}
              responseTime={checks.mobimatter?.responseTime}
            />
            <ServiceStatusCard
              name="Stripe"
              icon={CreditCard}
              status={checks.stripe?.status || "not_configured"}
              message={checks.stripe?.message}
            />
            <ServiceStatusCard
              name="Resend Email"
              icon={Mail}
              status={checks.resend?.status || "not_configured"}
              message={checks.resend?.message}
            />
          </CardContent>
        </Card>

        {/* API Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Order Statistics
            </CardTitle>
            <CardDescription>Order volume over time</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-3xl font-bold">{health?.orders?.last24h || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Last 24h</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-3xl font-bold">{health?.orders?.last7d || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-3xl font-bold">{health?.orders?.last30d || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Last Product Sync</span>
                <span>
                  {health?.lastProductSync
                    ? new Date(health.lastProductSync).toLocaleString()
                    : "Never"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Server Uptime</span>
                <span>{health?.uptime || "N/A"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              System Information
            </CardTitle>
            <CardDescription>Environment and configuration overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="p-4 rounded-lg bg-muted/50 space-y-1">
                <p className="text-xs text-muted-foreground">Platform</p>
                <p className="font-medium">Next.js (App Router)</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 space-y-1">
                <p className="text-xs text-muted-foreground">Database</p>
                <p className="font-medium">SQLite (Prisma)</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 space-y-1">
                <p className="text-xs text-muted-foreground">eSIM Provider</p>
                <p className="font-medium">MobiMatter</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 space-y-1">
                <p className="text-xs text-muted-foreground">Payments</p>
                <p className="font-medium">Stripe</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
