"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  PauseCircle,
  Clock,
  Mail,
  Globe,
  Calendar,
  DollarSign,
  MousePointer,
  TrendingUp,
  Link2,
  Copy,
  CheckSquare,
  Ban,
  RefreshCw,
  Edit,
  ExternalLink,
  Save,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useAdminAuth } from "@/hooks/use-admin-auth"
import { useToast } from "@/hooks/use-toast"

interface AffiliateDetail {
  id: string
  userId: string
  affiliateCode: string
  companyName: string | null
  website: string | null
  taxId: string | null
  paymentMethod: string | null
  paymentDetails: string | null
  status: string
  commissionRate: number
  totalClicks: number
  totalConversions: number
  totalEarnings: number
  totalPaidOut: number
  createdAt: Date
  approvedAt: Date | null
  updatedAt: Date
  user: {
    id: string
    email: string
    name: string | null
    phone: string | null
    createdAt: Date
  }
  links: Array<{
    id: string
    code: string
    name: string | null
    targetUrl: string
    clicks: number
    conversions: number
    createdAt: Date
  }>
  recentCommissions: Array<{
    id: string
    amount: number
    status: string
    type: string
    createdAt: Date
    order?: {
      orderNumber: string
      total: number
    } | null
  }>
  recentClicks: Array<{
    id: string
    country: string | null
    converted: boolean
    conversionValue: number | null
    createdAt: Date
  }>
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof CheckCircle }> = {
  PENDING: { label: "Pending", variant: "secondary", icon: Clock },
  ACTIVE: { label: "Active", variant: "default", icon: CheckCircle },
  SUSPENDED: { label: "Suspended", variant: "destructive", icon: PauseCircle },
  REJECTED: { label: "Rejected", variant: "outline", icon: XCircle },
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

export default function AffiliateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { toast } = useToast()
  
  const [data, setData] = useState<AffiliateDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [actionDialog, setActionDialog] = useState<{
    open: boolean
    type: "approve" | "suspend" | null
  }>({ open: false, type: null })
  const [commissionDialog, setCommissionDialog] = useState(false)
  const [newCommissionRate, setNewCommissionRate] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [copied, setCopied] = useState(false)

  const fetchAffiliate = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      // First get the affiliate from the list
      const listRes = await fetch(`/api/admin/affiliates?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!listRes.ok) throw new Error("Failed to fetch affiliate")

      const listResult = await listRes.json()
      if (listResult.success) {
        const affiliate = listResult.data.affiliates.find((a: AffiliateDetail) => a.id === id)
        if (affiliate) {
          // Fetch additional details
          const [linksRes, commissionsRes, clicksRes] = await Promise.all([
            // Get links from the affiliate service
            fetch(`/api/affiliate/links`, {
              headers: { Authorization: `Bearer ${token}` },
            }).catch(() => null),
            fetch(`/api/affiliate/commissions?limit=10`, {
              headers: { Authorization: `Bearer ${token}` },
            }).catch(() => null),
            fetch(`/api/affiliate/dashboard`, {
              headers: { Authorization: `Bearer ${token}` },
            }).catch(() => null),
          ])

          // Build the full affiliate detail object
          const affiliateDetail: AffiliateDetail = {
            ...affiliate,
            links: [],
            recentCommissions: [],
            recentClicks: [],
          }

          setData(affiliateDetail)
          setNewCommissionRate((affiliate.commissionRate * 100).toFixed(0))
        } else {
          throw new Error("Affiliate not found")
        }
      }
    } catch (error) {
      console.error("Fetch affiliate error:", error)
      toast({
        title: "Error",
        description: "Failed to load affiliate details",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAffiliate()
  }, [id, fetchAffiliate])

  const handleAction = async () => {
    if (!data || !actionDialog.type) return

    setIsProcessing(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const endpoint = actionDialog.type === "approve" ? "approve" : "suspend"
      const res = await fetch(`/api/admin/affiliates/${data.id}/${endpoint}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || `Failed to ${actionDialog.type} affiliate`)
      }

      toast({
        title: "Success",
        description: `Affiliate ${actionDialog.type}d successfully`,
      })

      fetchAffiliate()
    } catch (error) {
      console.error("Action error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to perform action",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
      setActionDialog({ open: false, type: null })
    }
  }

  const handleUpdateCommission = async () => {
    if (!data) return

    const rate = parseFloat(newCommissionRate)
    if (isNaN(rate) || rate < 0 || rate > 50) {
      toast({
        title: "Error",
        description: "Commission rate must be between 0% and 50%",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const res = await fetch(`/api/admin/affiliates/${data.id}/commission-rate`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ commissionRate: rate / 100 }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to update commission rate")
      }

      toast({
        title: "Success",
        description: "Commission rate updated successfully",
      })

      setCommissionDialog(false)
      fetchAffiliate()
    } catch (error) {
      console.error("Update commission error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update commission rate",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({
      title: "Copied!",
      description: "Affiliate code copied to clipboard",
    })
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatCurrency = (value: number) => {
    return `$${value.toFixed(2)}`
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-[400px] lg:col-span-1" />
          <Skeleton className="h-[400px] lg:col-span-2" />
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground mb-4">Affiliate not found</p>
        <Button asChild>
          <Link href="/admin/affiliates">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Affiliates
          </Link>
        </Button>
      </div>
    )
  }

  const statusInfo = statusConfig[data.status] || statusConfig.PENDING
  const StatusIcon = statusInfo.icon
  const conversionRate = data.totalClicks > 0 
    ? ((data.totalConversions / data.totalClicks) * 100).toFixed(1) 
    : "0"

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={item} className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/affiliates">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                {data.companyName || data.user.name || "Affiliate"}
              </h1>
              <Badge variant={statusInfo.variant} className="gap-1">
                <StatusIcon className="h-3 w-3" />
                {statusInfo.label}
              </Badge>
            </div>
            <p className="text-muted-foreground">{data.user.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fetchAffiliate()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          {data.status === "PENDING" && (
            <Button 
              className="gradient-primary"
              onClick={() => setActionDialog({ open: true, type: "approve" })}
            >
              <CheckSquare className="mr-2 h-4 w-4" />
              Approve
            </Button>
          )}
          {data.status === "ACTIVE" && (
            <Button 
              variant="destructive"
              onClick={() => setActionDialog({ open: true, type: "suspend" })}
            >
              <Ban className="mr-2 h-4 w-4" />
              Suspend
            </Button>
          )}
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <motion.div variants={item} className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-xl bg-primary/10 text-primary">
                    {(data.companyName || data.user.name || "A").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>{data.companyName || data.user.name || "Unknown"}</CardTitle>
                  <CardDescription>{data.user.email}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Affiliate Code */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Affiliate Code</p>
                  <code className="text-lg font-mono font-semibold">{data.affiliateCode}</code>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(data.affiliateCode)}
                >
                  {copied ? <CheckCircle className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>

              {/* Commission Rate */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Commission Rate</p>
                  <p className="text-lg font-semibold">{(data.commissionRate * 100).toFixed(0)}%</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCommissionDialog(true)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>

              <Separator />

              {/* Contact Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{data.user.email}</span>
                </div>
                {data.user.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{data.user.phone}</span>
                  </div>
                )}
                {data.website && (
                  <div className="flex items-center gap-3 text-sm">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={data.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      {data.website}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Joined {formatDate(data.createdAt)}</span>
                </div>
                {data.approvedAt && (
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    <span>Approved {formatDate(data.approvedAt)}</span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Payment Info */}
              {data.paymentMethod && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Payment Method</p>
                  <Badge variant="outline" className="capitalize">
                    {data.paymentMethod}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats and Tables */}
        <motion.div variants={item} className="lg:col-span-2 space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <MousePointer className="h-4 w-4" />
                  Total Clicks
                </CardDescription>
                <CardTitle className="text-2xl">{data.totalClicks.toLocaleString()}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Conversions
                </CardDescription>
                <CardTitle className="text-2xl">{data.totalConversions}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Total Earnings
                </CardDescription>
                <CardTitle className="text-2xl">{formatCurrency(data.totalEarnings)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Conv. Rate
                </CardDescription>
                <CardTitle className="text-2xl">{conversionRate}%</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Links */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="h-5 w-5" />
                  Affiliate Links
                </CardTitle>
                <CardDescription>Tracking links created by this affiliate</CardDescription>
              </div>
              <Badge variant="secondary">{data.links?.length || 0} links</Badge>
            </CardHeader>
            <CardContent>
              {!data.links || data.links.length === 0 ? (
                <div className="text-center py-8">
                  <Link2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No links created yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Clicks</TableHead>
                        <TableHead>Conversions</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.links.map((link) => (
                        <TableRow key={link.id}>
                          <TableCell>{link.name || "Unnamed"}</TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {link.code}
                            </code>
                          </TableCell>
                          <TableCell>{link.clicks}</TableCell>
                          <TableCell>{link.conversions}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(link.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Commissions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Recent Commissions
              </CardTitle>
              <CardDescription>Commission history for this affiliate</CardDescription>
            </CardHeader>
            <CardContent>
              {!data.recentCommissions || data.recentCommissions.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No commissions yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.recentCommissions.map((commission) => (
                        <TableRow key={commission.id}>
                          <TableCell>
                            {commission.order?.orderNumber || "N/A"}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(commission.amount)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              commission.status === "PAID" ? "default" :
                              commission.status === "PENDING" ? "secondary" :
                              "outline"
                            }>
                              {commission.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(commission.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Action Dialog */}
      <AlertDialog open={actionDialog.open} onOpenChange={(open) => 
        setActionDialog(prev => ({ ...prev, open }))
      }>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionDialog.type === "approve" ? "Approve Affiliate" : "Suspend Affiliate"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionDialog.type === "approve" 
                ? `Are you sure you want to approve ${data.companyName || data.user.email}? They will be able to start earning commissions.`
                : `Are you sure you want to suspend ${data.companyName || data.user.email}? They will not be able to earn commissions until reactivated.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              disabled={isProcessing}
              className={actionDialog.type === "suspend" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              {isProcessing ? "Processing..." : actionDialog.type === "approve" ? "Approve" : "Suspend"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Commission Rate Dialog */}
      <Dialog open={commissionDialog} onOpenChange={setCommissionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Commission Rate</DialogTitle>
            <DialogDescription>
              Set a new commission rate for this affiliate. Rate must be between 0% and 50%.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="commission">Commission Rate (%)</Label>
            <div className="flex items-center gap-2 mt-2">
              <Input
                id="commission"
                type="number"
                min="0"
                max="50"
                value={newCommissionRate}
                onChange={(e) => setNewCommissionRate(e.target.value)}
                className="w-24"
              />
              <span className="text-muted-foreground">%</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCommissionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateCommission} disabled={isProcessing}>
              {isProcessing ? "Saving..." : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
