"use client"

import { getAccessToken } from "@/lib/auth-token"
import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Users,
  Package,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  MousePointer,
  ShoppingCart,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

interface RecentOrder {
  id: string
  orderNumber: string
  email: string
  status: string
  paymentStatus: string
  total: number
  currency: string
  createdAt: string
}

interface DashboardStats {
  totalAffiliates: number
  pendingAffiliates: number
  activeAffiliates: number
  totalOrders: number
  pendingOrders: number
  completedOrders: number
  totalRevenue: number
  pendingCommissions: number
  totalClicks: number
  conversionRate: number
  totalUsers: number
  walletBalance: number | null
  recentOrders: RecentOrder[]
  ordersByStatus: Record<string, number>
}

interface RecentActivity {
  id: string
  type: "order" | "affiliate" | "commission"
  message: string
  timestamp: string
  status?: string
}

interface StatsCardProps {
  title: string
  value: string | number
  description: string
  icon: React.ElementType
  trend?: { value: number; isPositive: boolean }
  href?: string
}

function StatsCard({ title, value, description, icon: Icon, trend, href }: StatsCardProps) {
  const content = (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
            {trend && (
              <div className={`flex items-center gap-1 mt-2 text-xs ${trend.isPositive ? "text-green-600" : "text-red-600"}`}>
                <TrendingUp className={`h-3 w-3 ${!trend.isPositive && "rotate-180"}`} />
                <span>{trend.value}% vs last month</span>
              </div>
            )}
          </div>
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }
  return content
}

function ActivityItem({ activity }: { activity: RecentActivity }) {
  const getIcon = () => {
    switch (activity.type) {
      case "order":
        return <ShoppingCart className="h-4 w-4" />
      case "affiliate":
        return <Users className="h-4 w-4" />
      case "commission":
        return <DollarSign className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getStatusColor = () => {
    switch (activity.status) {
      case "COMPLETED":
      case "ACTIVE":
      case "APPROVED":
        return "bg-green-500/10 text-green-600"
      case "PENDING":
        return "bg-yellow-500/10 text-yellow-600"
      case "CANCELLED":
      case "SUSPENDED":
        return "bg-red-500/10 text-red-600"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="flex items-start gap-3 py-3">
      <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${getStatusColor()}`}>
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm">{activity.message}</p>
        <p className="text-xs text-muted-foreground">
          {new Date(activity.timestamp).toLocaleString()}
        </p>
      </div>
      {activity.status && (
        <Badge variant="outline" className="text-xs">
          {activity.status}
        </Badge>
      )}
    </div>
  )
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activities, setActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = getAccessToken()

      const statsResponse = await fetch("/api/admin/stats", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (statsResponse.ok) {
        const data = await statsResponse.json()
        const statsData = data.data || data
        setStats(statsData)

        if (statsData.recentOrders?.length) {
          setActivities(
            statsData.recentOrders.map((order: RecentOrder) => ({
              id: order.id,
              type: "order" as const,
              message: `Order ${order.orderNumber} - ${order.email} ($${order.total.toFixed(2)})`,
              timestamp: order.createdAt,
              status: order.status,
            }))
          )
        }
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your affiliate platform performance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Orders"
          value={stats?.totalOrders || 0}
          description={`${stats?.pendingOrders || 0} pending`}
          icon={Package}
          href="/admin/orders"
        />
        <StatsCard
          title="Total Revenue"
          value={`$${(stats?.totalRevenue || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          description="From paid orders"
          icon={DollarSign}
        />
        <StatsCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          description={`${stats?.totalAffiliates || 0} affiliates`}
          icon={Users}
        />
        <StatsCard
          title="Affiliates"
          value={stats?.totalAffiliates || 0}
          description={`${stats?.pendingAffiliates || 0} pending approval`}
          icon={TrendingUp}
          href="/admin/affiliates"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Pending Affiliates</p>
                <p className="text-2xl font-bold text-primary">{stats?.pendingAffiliates || 0}</p>
              </div>
              <Button asChild>
                <Link href="/admin/affiliates?status=PENDING">
                  Review
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/5 to-amber-500/10 border-amber-500/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Package className="h-6 w-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Pending Orders</p>
                <p className="text-2xl font-bold text-amber-600">{stats?.pendingOrders || 0}</p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/admin/orders?status=PENDING">
                  Process
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Pending Commissions</p>
                <p className="text-2xl font-bold text-green-600">
                  ${(stats?.pendingCommissions || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/admin/affiliates">
                  View
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tables Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {activities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Performance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Completed Orders</p>
                    <p className="text-sm text-muted-foreground">Successfully delivered</p>
                  </div>
                </div>
                <p className="text-2xl font-bold">{stats?.completedOrders || 0}</p>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Active Affiliates</p>
                    <p className="text-sm text-muted-foreground">Currently earning</p>
                  </div>
                </div>
                <p className="text-2xl font-bold">{stats?.activeAffiliates || 0}</p>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <MousePointer className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Total Clicks</p>
                    <p className="text-sm text-muted-foreground">All time affiliate clicks</p>
                  </div>
                </div>
                <p className="text-2xl font-bold">{(stats?.totalClicks || 0).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
