"use client"

import { useEffect, useState, useMemo } from "react"
import { motion } from "framer-motion"
import {
  Download,
  DollarSign,
  Clock,
  CheckCircle,
  Wallet,
  CalendarIcon,
} from "lucide-react"
import { format, subDays } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useAffiliateAuth } from "@/hooks/use-affiliate-auth"
import { useToast } from "@/hooks/use-toast"
import { CommissionStatus } from "@prisma/client"

interface Commission {
  id: string
  amount: number
  status: CommissionStatus
  createdAt: string
  type: string
  baseAmount?: number
  order?: {
    orderNumber: string
    total: number
  } | null
}

interface CommissionStats {
  totalPending: number
  totalApproved: number
  totalPaid: number
  thisMonth: number
  lastMonth: number
}

const statusConfig: Record<CommissionStatus, { label: string; className: string; icon: typeof DollarSign }> = {
  PENDING: {
    label: "Pending",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    icon: Clock,
  },
  APPROVED: {
    label: "Approved",
    className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    icon: CheckCircle,
  },
  PAID: {
    label: "Paid",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    icon: Wallet,
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    icon: DollarSign,
  },
  REFUNDED: {
    label: "Refunded",
    className: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
    icon: DollarSign,
  },
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export default function CommissionsPage() {
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [stats, setStats] = useState<CommissionStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateFrom, setDateFrom] = useState<Date | undefined>(subDays(new Date(), 30))
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date())
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [statusFilter, dateFrom, dateTo])

  async function fetchData() {
    setIsLoading(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      // Build query params
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.append("status", statusFilter)
      if (dateFrom) params.append("startDate", dateFrom.toISOString())
      if (dateTo) params.append("endDate", dateTo.toISOString())
      params.append("limit", "100")

      const [commissionsRes, statsRes] = await Promise.all([
        fetch(`/api/affiliate/commissions?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/affiliate/commissions/stats", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      if (commissionsRes.ok) {
        const result = await commissionsRes.json()
        if (result.success) {
          setCommissions(result.data)
        }
      }

      if (statsRes.ok) {
        const result = await statsRes.json()
        if (result.success) {
          setStats(result.data)
        }
      }
    } catch (error) {
      console.error("Fetch error:", error)
      toast({
        title: "Error",
        description: "Failed to load commissions data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredCommissions = useMemo(() => {
    return commissions
  }, [commissions])

  function exportToCSV() {
    if (filteredCommissions.length === 0) {
      toast({
        title: "No data",
        description: "No commissions to export",
        variant: "destructive",
      })
      return
    }

    const headers = ["Date", "Order ID", "Type", "Amount", "Base Amount", "Status"]
    const rows = filteredCommissions.map((c) => [
      format(new Date(c.createdAt), "yyyy-MM-dd"),
      c.order?.orderNumber || "-",
      c.type,
      c.amount.toFixed(2),
      c.baseAmount?.toFixed(2) || "-",
      c.status,
    ])

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `commissions-${format(new Date(), "yyyy-MM-dd")}.csv`
    a.click()
    URL.revokeObjectURL(url)

    toast({
      title: "Export complete",
      description: "Your commissions have been exported to CSV",
    })
  }

  if (isLoading && !stats) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

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
          <h1 className="text-2xl font-bold tracking-tight">Commissions</h1>
          <p className="text-muted-foreground">
            Track your earnings and commission history
          </p>
        </div>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </motion.div>

      {/* Stats Cards */}
      {stats && (
        <motion.div variants={item} className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending
              </CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">${stats.totalPending.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Approved
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">${stats.totalApproved.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Paid Out
              </CardTitle>
              <Wallet className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">${stats.totalPaid.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                This Month
              </CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">${stats.thisMonth.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Last month: ${stats.lastMonth.toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Filters */}
      <motion.div variants={item}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    <SelectItem value="REFUNDED">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">From Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[180px] justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, "PPP") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">To Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[180px] justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, "PPP") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex items-end">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setStatusFilter("all")
                    setDateFrom(subDays(new Date(), 30))
                    setDateTo(new Date())
                  }}
                >
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Commissions Table */}
      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Commission History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : filteredCommissions.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No commissions found</h3>
                <p className="text-muted-foreground">
                  {statusFilter !== "all"
                    ? "Try changing your filters"
                    : "Your commissions will appear here when you make sales"}
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Base Amount</TableHead>
                      <TableHead className="text-right">Commission</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCommissions.map((commission) => {
                      const config = statusConfig[commission.status]
                      const StatusIcon = config.icon
                      return (
                        <TableRow key={commission.id}>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(commission.createdAt), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="font-medium">
                            {commission.order?.orderNumber || "-"}
                          </TableCell>
                          <TableCell>{commission.type}</TableCell>
                          <TableCell className="text-right">
                            {commission.baseAmount
                              ? `$${commission.baseAmount.toFixed(2)}`
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            ${commission.amount.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn("font-medium", config.className)}
                            >
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {config.label}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
