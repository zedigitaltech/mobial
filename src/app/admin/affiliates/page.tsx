"use client"

import { getAccessToken } from "@/lib/auth-token"
import { useEffect, useState } from "react"
import {
  Users,
  Search,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  MoreHorizontal,
  Shield,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

interface Affiliate {
  id: string
  code: string
  userId: string
  userName: string | null
  userEmail: string
  status: string
  commissionRate: number
  clicks: number
  orders: number
  commission: number
  createdAt: string
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "ACTIVE":
      return (
        <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Active
        </Badge>
      )
    case "PENDING":
      return (
        <Badge className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 border-yellow-500/20">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      )
    case "SUSPENDED":
      return (
        <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-500/20">
          <XCircle className="h-3 w-3 mr-1" />
          Suspended
        </Badge>
      )
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export default function AdminAffiliatesPage() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    fetchAffiliates()
  }, [])

  const fetchAffiliates = async () => {
    try {
      const token = getAccessToken()
      const params = new URLSearchParams()
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter)
      if (search) params.set("search", search)

      const res = await fetch(`/api/admin/affiliates?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setAffiliates(data.data.affiliates)
        }
      }
    } catch (error) {
      console.error("Failed to fetch affiliates:", error)
      toast.error("Failed to load affiliates")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAffiliates()
    }, 300)
    return () => clearTimeout(timer)
  }, [search, statusFilter])

  const updateStatus = async (affiliateId: string, status: string) => {
    setUpdating(affiliateId)
    try {
      const token = getAccessToken()
      const res = await fetch(`/api/admin/affiliates/${affiliateId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })

      if (res.ok) {
        toast.success(`Affiliate ${status.toLowerCase()}`)
        await fetchAffiliates()
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to update affiliate")
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setUpdating(null)
    }
  }

  const totalPending = affiliates.filter((a) => a.status === "PENDING").length
  const totalCommission = affiliates.reduce((sum, a) => sum + a.commission, 0)

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Affiliates</h1>
        <p className="text-muted-foreground">
          Manage affiliate partners and track performance
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Affiliates</p>
                <p className="text-2xl font-bold">{affiliates.length}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Approval</p>
                <p className="text-2xl font-bold text-yellow-600">{totalPending}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Commission</p>
                <p className="text-2xl font-bold text-green-600">
                  ${totalCommission.toFixed(2)}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="text-lg">All Affiliates</CardTitle>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, code..."
                className="pl-9 w-full sm:w-64"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {affiliates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No affiliates found</p>
              <p className="text-sm">
                {search || statusFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Affiliates will appear here once they register"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {affiliates.map((affiliate) => (
                    <TableRow key={affiliate.id}>
                      <TableCell className="font-medium">
                        {affiliate.userName || "N/A"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {affiliate.userEmail}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {affiliate.code}
                        </code>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={affiliate.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        {affiliate.clicks.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {affiliate.orders}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${affiliate.commission.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={updating === affiliate.id}
                            >
                              {updating === affiliate.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <MoreHorizontal className="h-4 w-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {affiliate.status !== "ACTIVE" && (
                              <DropdownMenuItem
                                onClick={() => updateStatus(affiliate.id, "ACTIVE")}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                                Approve
                              </DropdownMenuItem>
                            )}
                            {affiliate.status !== "SUSPENDED" && (
                              <DropdownMenuItem
                                onClick={() => updateStatus(affiliate.id, "SUSPENDED")}
                                className="text-red-600"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Suspend
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
