"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  DollarSign,
  Clock,
  MousePointer,
  TrendingUp,
  Link2,
  Plus,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { StatsCard } from "@/components/affiliate/stats-card"
import { EarningsChart } from "@/components/affiliate/earnings-chart"
import { CommissionsTable } from "@/components/affiliate/commissions-table"
import { ClicksTable } from "@/components/affiliate/clicks-table"
import { LinkCard } from "@/components/affiliate/link-card"
import { useAffiliateAuth } from "@/hooks/use-affiliate-auth"
import { useToast } from "@/hooks/use-toast"

interface DashboardStats {
  totalEarnings: number
  pendingEarnings: number
  totalClicks: number
  conversionRate: number
}

interface DashboardData {
  profile: {
    id: string
    affiliateCode: string
    companyName?: string | null
    status: string
    commissionRate: number
  }
  stats: DashboardStats
  recentClicks: Array<{
    id: string
    createdAt: string
    country?: string | null
    converted: boolean
    conversionValue?: number | null
  }>
  recentCommissions: Array<{
    id: string
    amount: number
    status: string
    createdAt: string
    type: string
    order?: {
      orderNumber: string
      total: number
    } | null
  }>
  topLinks: Array<{
    id: string
    name: string | null
    code: string
    clicks: number
    conversions: number
    conversionRate: number
  }>
  earningsChart: Array<{
    date: string
    earnings: number
    clicks: number
    conversions: number
  }>
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export default function AffiliateDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { affiliate } = useAffiliateAuth()
  const { toast } = useToast()

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const token = localStorage.getItem("token")
        if (!token) return

        const res = await fetch("/api/affiliate/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!res.ok) {
          throw new Error("Failed to fetch dashboard")
        }

        const result = await res.json()
        if (result.success) {
          setData(result.data)
        }
      } catch (error) {
        console.error("Dashboard fetch error:", error)
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboard()
  }, [toast])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-[350px]" />
          <Skeleton className="h-[350px]" />
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Unable to load dashboard data</p>
      </div>
    )
  }

  // Calculate trend (mock - in real app you'd compare with previous period)
  const trend = data.stats.totalClicks > 0 ? 5.2 : 0

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={item} className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back{affiliate?.companyName ? `, ${affiliate.companyName}` : ""}!
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s an overview of your affiliate performance
          </p>
        </div>
        <Button asChild className="gradient-accent">
          <Link href="/affiliate/links">
            <Plus className="mr-2 h-4 w-4" />
            Create New Link
          </Link>
        </Button>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={item} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Earnings"
          value={`$${data.stats.totalEarnings.toFixed(2)}`}
          icon={DollarSign}
          description="All time"
          trend={{ value: trend, isPositive: true }}
        />
        <StatsCard
          title="Pending Commissions"
          value={`$${data.stats.pendingEarnings.toFixed(2)}`}
          icon={Clock}
          description="Awaiting approval"
        />
        <StatsCard
          title="Total Clicks"
          value={data.stats.totalClicks.toLocaleString()}
          icon={MousePointer}
          description="All time"
        />
        <StatsCard
          title="Conversion Rate"
          value={`${data.stats.conversionRate.toFixed(1)}%`}
          icon={TrendingUp}
          description="Clicks to orders"
          trend={{
            value: data.stats.conversionRate > 2 ? 2.3 : -1.5,
            isPositive: data.stats.conversionRate > 2,
          }}
        />
      </motion.div>

      {/* Charts Row */}
      <motion.div variants={item} className="grid gap-6 lg:grid-cols-2">
        <EarningsChart data={data.earningsChart} />
        
        {/* Top Performing Links */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Top Performing Links</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/affiliate/links">
                View all
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {data.topLinks.length === 0 ? (
              <div className="text-center py-8">
                <Link2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No links created yet</p>
                <Button asChild>
                  <Link href="/affiliate/links">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Link
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {data.topLinks.slice(0, 3).map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{link.name || "Unnamed Link"}</p>
                      <p className="text-sm text-muted-foreground">
                        {link.clicks} clicks • {link.conversions} conversions
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-primary">
                        {link.conversionRate.toFixed(1)}%
                      </p>
                      <p className="text-xs text-muted-foreground">conv. rate</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Tables Row */}
      <motion.div variants={item} className="grid gap-6 lg:grid-cols-2">
        <ClicksTable
          clicks={data.recentClicks.map((c) => ({
            ...c,
            createdAt: new Date(c.createdAt),
          }))}
        />
        <CommissionsTable
          commissions={data.recentCommissions.map((c) => ({
            ...c,
            createdAt: new Date(c.createdAt),
            status: c.status as "PENDING" | "APPROVED" | "PAID" | "CANCELLED" | "REFUNDED",
          }))}
        />
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/affiliate/links">
                  <Link2 className="mr-2 h-4 w-4" />
                  Manage Links
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/affiliate/commissions">
                  <DollarSign className="mr-2 h-4 w-4" />
                  View Commissions
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/affiliate/payouts">
                  <Clock className="mr-2 h-4 w-4" />
                  Request Payout
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/affiliate/settings">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Account Settings
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
