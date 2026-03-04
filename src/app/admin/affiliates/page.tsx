"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Search,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  DollarSign,
  MoreHorizontal,
  Loader2,
  ExternalLink,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  userId: string
  affiliateCode: string
  companyName: string | null
  status: string
  commissionRate: number
  totalClicks: number
  totalConversions: number
  totalEarnings: number
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string
  }
}

interface AffiliatesResponse {
  affiliates: Affiliate[]
  pagination: {
    total: number
    hasMore: boolean
  }
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
  ACTIVE: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  SUSPENDED: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  REJECTED: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
}

export default function AdminAffiliatesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [affiliates, setAffiliates] = useState<Affiliate[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "")
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null)
  const [actionDialog, setActionDialog] = useState<"approve" | "suspend" | "rate" | null>(null)
  const [newRate, setNewRate] = useState("")
  const [suspendReason, setSuspendReason] = useState("")
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchAffiliates()
  }, [statusFilter])

  const fetchAffiliates = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (statusFilter) params.set("status", statusFilter)
      
      const response = await fetch(`/api/admin/affiliates?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) throw new Error("Failed to fetch affiliates")
      
      const data: AffiliatesResponse = await response.json()
      setAffiliates(data.affiliates)
    } catch (error) {
      console.error("Failed to fetch affiliates:", error)
      toast.error("Failed to load affiliates")
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchAffiliates()
  }

  const handleApprove = async () => {
    if (!selectedAffiliate) return
    
    setProcessing(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/admin/affiliates/${selectedAffiliate.id}/approve`, {
        method: "PATCH",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      })

      if (!response.ok) throw new Error("Failed to approve affiliate")
      
      toast.success("Affiliate approved successfully")
      setActionDialog(null)
      setSelectedAffiliate(null)
      fetchAffiliates()
    } catch (error) {
      console.error("Failed to approve affiliate:", error)
      toast.error("Failed to approve affiliate")
    } finally {
      setProcessing(false)
    }
  }

  const handleSuspend = async () => {
    if (!selectedAffiliate) return
    
    setProcessing(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/admin/affiliates/${selectedAffiliate.id}/suspend`, {
        method: "PATCH",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ reason: suspendReason }),
      })

      if (!response.ok) throw new Error("Failed to suspend affiliate")
      
      toast.success("Affiliate suspended successfully")
      setActionDialog(null)
      setSelectedAffiliate(null)
      setSuspendReason("")
      fetchAffiliates()
    } catch (error) {
      console.error("Failed to suspend affiliate:", error)
      toast.error("Failed to suspend affiliate")
    } finally {
      setProcessing(false)
    }
  }

  const handleUpdateRate = async () => {
    if (!selectedAffiliate || !newRate) return
    
    const rate = parseFloat(newRate)
    if (isNaN(rate) || rate < 0 || rate > 50) {
      toast.error("Commission rate must be between 0% and 50%")
      return
    }
    
    setProcessing(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/admin/affiliates/${selectedAffiliate.id}/commission-rate`, {
        method: "PATCH",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ commissionRate: rate / 100 }),
      })

      if (!response.ok) throw new Error("Failed to update commission rate")
      
      toast.success("Commission rate updated successfully")
      setActionDialog(null)
      setSelectedAffiliate(null)
      setNewRate("")
      fetchAffiliates()
    } catch (error) {
      console.error("Failed to update commission rate:", error)
      toast.error("Failed to update commission rate")
    } finally {
      setProcessing(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Affiliates</h1>
          <p className="text-muted-foreground">
            Manage your affiliate partners and their commissions
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by code, name, or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button type="submit">Search</Button>
            </form>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Affiliates Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground mt-2">Loading affiliates...</p>
            </div>
          ) : affiliates.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No affiliates found</h3>
              <p className="text-muted-foreground">
                {search || statusFilter 
                  ? "Try adjusting your search or filters"
                  : "Affiliates will appear here once they register"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Affiliate</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Clicks</TableHead>
                  <TableHead>Conversions</TableHead>
                  <TableHead>Earnings</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {affiliates.map((affiliate) => (
                  <TableRow key={affiliate.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{affiliate.user.name || affiliate.companyName || "Unnamed"}</p>
                        <p className="text-sm text-muted-foreground">{affiliate.user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {affiliate.affiliateCode}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[affiliate.status]}>
                        {affiliate.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{(affiliate.commissionRate * 100).toFixed(0)}%</TableCell>
                    <TableCell>{affiliate.totalClicks.toLocaleString()}</TableCell>
                    <TableCell>{affiliate.totalConversions.toLocaleString()}</TableCell>
                    <TableCell className="font-medium">
                      ${affiliate.totalEarnings.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(affiliate.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/affiliates/${affiliate.id}`}>
                              <ExternalLink className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          {affiliate.status === "PENDING" && (
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedAffiliate(affiliate)
                                setActionDialog("approve")
                              }}
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Approve
                            </DropdownMenuItem>
                          )}
                          {affiliate.status !== "SUSPENDED" && affiliate.status !== "PENDING" && (
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => {
                                setSelectedAffiliate(affiliate)
                                setActionDialog("suspend")
                              }}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Suspend
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedAffiliate(affiliate)
                              setNewRate((affiliate.commissionRate * 100).toString())
                              setActionDialog("rate")
                            }}
                          >
                            <TrendingUp className="mr-2 h-4 w-4" />
                            Adjust Rate
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={actionDialog === "approve"} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Affiliate</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve <strong>{selectedAffiliate?.user.name || selectedAffiliate?.user.email}</strong>?
              They will be able to start earning commissions immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={processing}>
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Dialog */}
      <Dialog open={actionDialog === "suspend"} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend Affiliate</DialogTitle>
            <DialogDescription>
              Are you sure you want to suspend <strong>{selectedAffiliate?.user.name || selectedAffiliate?.user.email}</strong>?
              They will not be able to earn commissions until reactivated.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Reason (optional)</label>
            <Input
              placeholder="Enter reason for suspension..."
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleSuspend} disabled={processing}>
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Suspend
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rate Dialog */}
      <Dialog open={actionDialog === "rate"} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Commission Rate</DialogTitle>
            <DialogDescription>
              Set a new commission rate for <strong>{selectedAffiliate?.user.name || selectedAffiliate?.user.email}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Commission Rate (%)</label>
              <Input
                type="number"
                min="0"
                max="50"
                step="0.5"
                value={newRate}
                onChange={(e) => setNewRate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Current rate: {((selectedAffiliate?.commissionRate || 0) * 100).toFixed(0)}%
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRate} disabled={processing}>
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Rate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
