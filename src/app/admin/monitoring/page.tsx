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
  Bug,
  Eye,
  BarChart3,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  TrendingUp,
  Filter,
  ArrowRight,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"

// ==================== TYPES ====================

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

interface ErrorEntry {
  id: string
  level: string
  source: string
  message: string
  path: string | null
  statusCode: number | null
  occurrences: number
  resolved: boolean
  createdAt: string
  lastSeenAt: string
  fingerprint: string | null
}

interface ErrorStats {
  errors: ErrorEntry[]
  unresolvedCount: number
  criticalCount: number
  topErrors: ErrorEntry[]
  period: string
}

interface ConversionFunnel {
  visitors: number
  productViews: number
  addToCarts: number
  checkoutStarts: number
  purchases: number
}

interface AnalyticsOverview {
  totalPageViews: number
  uniqueVisitors: number
  topPages: { path: string; views: number }[]
  topEvents: { name: string; count: number }[]
  deviceBreakdown: { device: string; count: number }[]
  countryBreakdown: { country: string; count: number }[]
  conversionFunnel: ConversionFunnel
  period: string
}

type Period = "24h" | "7d" | "30d" | "90d"

// ==================== COMPONENTS ====================

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

function FunnelStep({
  label,
  value,
  prevValue,
  icon: Icon,
}: {
  label: string
  value: number
  prevValue?: number
  icon: React.ElementType
}) {
  const conversionRate = prevValue && prevValue > 0 ? ((value / prevValue) * 100).toFixed(1) : null

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{label}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold">{value.toLocaleString()}</span>
            {conversionRate && (
              <Badge variant="outline" className="text-[10px]">
                {conversionRate}%
              </Badge>
            )}
          </div>
        </div>
        {prevValue !== undefined && (
          <Progress
            value={prevValue > 0 ? (value / prevValue) * 100 : 0}
            className="h-2"
          />
        )}
      </div>
    </div>
  )
}

function ErrorLevelBadge({ level }: { level: string }) {
  const config: Record<string, string> = {
    CRITICAL: "bg-red-500/20 text-red-400",
    ERROR: "bg-orange-500/20 text-orange-400",
    WARNING: "bg-yellow-500/20 text-yellow-400",
    INFO: "bg-blue-500/20 text-blue-400",
    DEBUG: "bg-gray-500/20 text-gray-400",
  }

  return (
    <Badge variant="outline" className={`text-[10px] border-transparent ${config[level] || config.INFO}`}>
      {level}
    </Badge>
  )
}

function DeviceIcon({ device }: { device: string }) {
  switch (device) {
    case "mobile":
      return <Smartphone className="h-4 w-4" />
    case "tablet":
      return <Tablet className="h-4 w-4" />
    case "desktop":
      return <Monitor className="h-4 w-4" />
    default:
      return <Globe className="h-4 w-4" />
  }
}

// ==================== PAGE ====================

export default function AdminMonitoringPage() {
  const [health, setHealth] = useState<HealthData | null>(null)
  const [errorStats, setErrorStats] = useState<ErrorStats | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [period, setPeriod] = useState<Period>("7d")
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

  const fetchErrors = useCallback(async (p: Period) => {
    try {
      const token = getToken()
      const res = await fetch(`/api/admin/monitoring/errors?period=${p}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const data = await res.json()
      setErrorStats(data.data)
    } catch (error) {
      console.error("Failed to fetch errors:", error)
    }
  }, [])

  const fetchAnalytics = useCallback(async (p: Period) => {
    try {
      const token = getToken()
      const res = await fetch(`/api/admin/monitoring/analytics?period=${p}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const data = await res.json()
      setAnalytics(data.data)
    } catch (error) {
      console.error("Failed to fetch analytics:", error)
    }
  }, [])

  const fetchAll = useCallback(async (showRefreshing = false, p?: Period) => {
    const activePeriod = p || period
    if (showRefreshing) setRefreshing(true)
    await Promise.all([fetchHealth(), fetchErrors(activePeriod), fetchAnalytics(activePeriod)])
    setLastRefresh(new Date())
    if (showRefreshing) setRefreshing(false)
  }, [fetchHealth, fetchErrors, fetchAnalytics, period])

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await fetchAll(false, period)
      setLoading(false)
    }
    init()

    intervalRef.current = setInterval(() => {
      fetchAll(false, period)
    }, 30000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [period]) // eslint-disable-line react-hooks/exhaustive-deps

  const handlePeriodChange = (newPeriod: Period) => {
    setPeriod(newPeriod)
  }

  const resolveError = async (errorId: string) => {
    try {
      const token = getToken()
      await fetch("/api/admin/monitoring/errors", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ errorId, action: "resolve" }),
      })
      await fetchErrors(period)
    } catch (error) {
      console.error("Failed to resolve error:", error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    )
  }

  const checks = health?.checks || {}
  const funnel = analytics?.conversionFunnel

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Monitoring & Analytics</h1>
          <p className="text-muted-foreground">
            System health, error tracking, and visitor analytics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            {(["24h", "7d", "30d", "90d"] as Period[]).map((p) => (
              <Button
                key={p}
                variant={period === p ? "default" : "ghost"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => handlePeriodChange(p)}
              >
                {p}
              </Button>
            ))}
          </div>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            {lastRefresh.toLocaleTimeString()}
          </span>
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
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className={
            health.status === "healthy"
              ? "border-green-500/30 bg-green-500/5"
              : health.status === "degraded"
              ? "border-yellow-500/30 bg-yellow-500/5"
              : "border-red-500/30 bg-red-500/5"
          }>
            <CardContent className="p-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  {health.status === "healthy" ? (
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  ) : health.status === "degraded" ? (
                    <AlertTriangle className="h-6 w-6 text-yellow-600" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-600" />
                  )}
                  <div>
                    <p className="font-semibold capitalize">System {health.status}</p>
                    <p className="text-sm text-muted-foreground">Uptime: {health.uptime}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{analytics?.totalPageViews?.toLocaleString() || 0}</p>
                    <p className="text-xs text-muted-foreground">Page Views</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{analytics?.uniqueVisitors?.toLocaleString() || 0}</p>
                    <p className="text-xs text-muted-foreground">Visitors</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-400">{errorStats?.unresolvedCount || 0}</p>
                    <p className="text-xs text-muted-foreground">Errors</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="errors" className="gap-2">
            <Bug className="h-4 w-4" />
            Errors
            {errorStats && errorStats.unresolvedCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 text-[10px]">
                {errorStats.unresolvedCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="health" className="gap-2">
            <Activity className="h-4 w-4" />
            Health
          </TabsTrigger>
        </TabsList>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Conversion Funnel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Conversion Funnel
                </CardTitle>
                <CardDescription>Visitor journey from browse to purchase</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {funnel ? (
                  <>
                    <FunnelStep label="Visitors" value={funnel.visitors} icon={Eye} />
                    <FunnelStep label="Viewed Products" value={funnel.productViews} prevValue={funnel.visitors} icon={ShoppingCart} />
                    <FunnelStep label="Added to Cart" value={funnel.addToCarts} prevValue={funnel.productViews} icon={ShoppingCart} />
                    <FunnelStep label="Started Checkout" value={funnel.checkoutStarts} prevValue={funnel.addToCarts} icon={CreditCard} />
                    <FunnelStep label="Purchased" value={funnel.purchases} prevValue={funnel.checkoutStarts} icon={CheckCircle2} />
                    <Separator />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Overall conversion</span>
                      <span className="font-bold">
                        {funnel.visitors > 0
                          ? ((funnel.purchases / funnel.visitors) * 100).toFixed(2)
                          : "0.00"}%
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground text-sm text-center py-8">No data yet</p>
                )}
              </CardContent>
            </Card>

            {/* Top Pages */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Top Pages
                </CardTitle>
                <CardDescription>Most visited pages</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics && analytics.topPages.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.topPages.slice(0, 10).map((page, i) => (
                      <div key={page.path} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs text-muted-foreground w-5">{i + 1}</span>
                          <span className="text-sm truncate">{page.path}</span>
                        </div>
                        <span className="text-sm font-medium ml-2">{page.views.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm text-center py-8">No data yet</p>
                )}
              </CardContent>
            </Card>

            {/* Device Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Devices
                </CardTitle>
                <CardDescription>Visitor device breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics && analytics.deviceBreakdown.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.deviceBreakdown.map((item) => {
                      const total = analytics.deviceBreakdown.reduce((sum, d) => sum + d.count, 0)
                      const pct = total > 0 ? (item.count / total) * 100 : 0
                      return (
                        <div key={item.device} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <DeviceIcon device={item.device} />
                              <span className="text-sm capitalize">{item.device}</span>
                            </div>
                            <span className="text-sm font-medium">
                              {item.count.toLocaleString()} ({pct.toFixed(1)}%)
                            </span>
                          </div>
                          <Progress value={pct} className="h-2" />
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm text-center py-8">No data yet</p>
                )}
              </CardContent>
            </Card>

            {/* Country Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Top Countries
                </CardTitle>
                <CardDescription>Where your visitors come from</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics && analytics.countryBreakdown.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.countryBreakdown.map((item, i) => (
                      <div key={item.country} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-5">{i + 1}</span>
                          <span className="text-sm">{item.country}</span>
                        </div>
                        <span className="text-sm font-medium">{item.count.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm text-center py-8">No data yet</p>
                )}
              </CardContent>
            </Card>

            {/* Top Events */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Top Events
                </CardTitle>
                <CardDescription>Most tracked user actions</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics && analytics.topEvents.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {analytics.topEvents.map((event) => (
                      <div
                        key={event.name}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <span className="text-sm">{event.name.replace(/_/g, " ")}</span>
                        <Badge variant="outline" className="font-bold">
                          {event.count.toLocaleString()}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm text-center py-8">No events tracked yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Errors Tab */}
        <TabsContent value="errors" className="space-y-6">
          {/* Error Summary */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-red-400">{errorStats?.unresolvedCount || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Unresolved Errors</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-orange-400">{errorStats?.criticalCount || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Critical</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold">{errorStats?.errors?.length || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Total ({period})</p>
              </CardContent>
            </Card>
          </div>

          {/* Most Frequent Errors */}
          {errorStats?.topErrors && errorStats.topErrors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Most Frequent Errors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {errorStats.topErrors.map((error) => (
                    <div
                      key={error.id}
                      className="flex items-start justify-between gap-4 p-3 rounded-lg bg-muted/50"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <ErrorLevelBadge level={error.level} />
                          <Badge variant="outline" className="text-[10px]">{error.source}</Badge>
                          {error.path && (
                            <span className="text-[10px] text-muted-foreground truncate">{error.path}</span>
                          )}
                        </div>
                        <p className="text-sm truncate">{error.message}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Last seen: {new Date(error.lastSeenAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-bold">{error.occurrences}x</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Errors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bug className="h-5 w-5" />
                Recent Errors
              </CardTitle>
              <CardDescription>All errors in the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              {errorStats?.errors && errorStats.errors.length > 0 ? (
                <div className="space-y-2">
                  {errorStats.errors.map((error) => (
                    <div
                      key={error.id}
                      className={`flex items-start justify-between gap-4 p-3 rounded-lg border ${
                        error.resolved
                          ? "border-border/50 bg-muted/20 opacity-60"
                          : "border-border bg-muted/50"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <ErrorLevelBadge level={error.level} />
                          <Badge variant="outline" className="text-[10px]">{error.source}</Badge>
                          {error.statusCode && (
                            <Badge variant="outline" className="text-[10px]">{error.statusCode}</Badge>
                          )}
                          {error.path && (
                            <span className="text-[10px] text-muted-foreground">{error.path}</span>
                          )}
                        </div>
                        <p className="text-sm">{error.message}</p>
                        <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                          <span>{new Date(error.createdAt).toLocaleString()}</span>
                          {error.occurrences > 1 && (
                            <span className="font-medium text-orange-400">{error.occurrences}x occurrences</span>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {!error.resolved && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => resolveError(error.id)}
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Resolve
                          </Button>
                        )}
                        {error.resolved && (
                          <Badge variant="outline" className="text-green-400 text-[10px]">
                            Resolved
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground">No errors in this period</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Health Tab */}
        <TabsContent value="health" className="space-y-6">
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

            {/* Order Stats */}
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

            {/* System Info */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  System Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="p-4 rounded-lg bg-muted/50 space-y-1">
                    <p className="text-xs text-muted-foreground">Platform</p>
                    <p className="font-medium">Next.js 16 (App Router)</p>
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
