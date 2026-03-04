"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
  Wallet,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import { useAffiliateAuth } from "@/hooks/use-affiliate-auth"
import { useToast } from "@/hooks/use-toast"
import { PayoutStatus } from "@prisma/client"

interface Payout {
  id: string
  amount: number
  status: PayoutStatus
  paymentMethod: string
  createdAt: string
  processedAt?: string | null
  transactionId?: string | null
  notes?: string | null
}

interface PayoutStats {
  availableBalance: number
  pendingPayouts: number
  totalPaidOut: number
}

const MIN_PAYOUT_AMOUNT = 50

const statusConfig: Record<PayoutStatus, { label: string; className: string; icon: typeof DollarSign }> = {
  PENDING: {
    label: "Pending",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    icon: Clock,
  },
  PROCESSING: {
    label: "Processing",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    icon: Loader2,
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    icon: CheckCircle,
  },
  FAILED: {
    label: "Failed",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    icon: XCircle,
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
    icon: XCircle,
  },
}

const paymentMethods = [
  { value: "bank", label: "Bank Transfer" },
  { value: "paypal", label: "PayPal" },
  { value: "wise", label: "Wise" },
  { value: "crypto", label: "Cryptocurrency (USDT)" },
]

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

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [stats, setStats] = useState<PayoutStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRequesting, setIsRequesting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [payoutAmount, setPayoutAmount] = useState("")
  const { affiliate } = useAffiliateAuth()
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setIsLoading(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const [payoutsRes, profileRes] = await Promise.all([
        fetch("/api/affiliate/payouts?limit=50", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/affiliate/profile", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      if (payoutsRes.ok) {
        const result = await payoutsRes.json()
        if (result.success) {
          setPayouts(result.data)
        }
      }

      if (profileRes.ok) {
        const result = await profileRes.json()
        if (result.success && result.data) {
          // Calculate available balance
          const availableBalance = 
            (result.data.totalEarnings || 0) - 
            (result.data.totalPaidOut || 0) -
            payouts.filter(p => p.status === "PENDING").reduce((sum, p) => sum + p.amount, 0)
          
          setStats({
            availableBalance,
            pendingPayouts: payouts.filter(p => p.status === "PENDING").reduce((sum, p) => sum + p.amount, 0),
            totalPaidOut: result.data.totalPaidOut || 0,
          })
        }
      }
    } catch (error) {
      console.error("Fetch error:", error)
      toast({
        title: "Error",
        description: "Failed to load payout data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleRequestPayout() {
    const amount = parseFloat(payoutAmount)
    
    if (isNaN(amount) || amount < MIN_PAYOUT_AMOUNT) {
      toast({
        title: "Invalid amount",
        description: `Minimum payout amount is $${MIN_PAYOUT_AMOUNT}`,
        variant: "destructive",
      })
      return
    }

    if (stats && amount > stats.availableBalance) {
      toast({
        title: "Insufficient balance",
        description: "You don't have enough available balance",
        variant: "destructive",
      })
      return
    }

    setIsRequesting(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const res = await fetch("/api/affiliate/payouts/request", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to request payout")
      }

      const result = await res.json()
      if (result.success) {
        setPayouts((prev) => [result.data, ...prev])
        setIsDialogOpen(false)
        setPayoutAmount("")
        fetchData() // Refresh stats
        toast({
          title: "Payout requested",
          description: `Your payout of $${amount.toFixed(2)} has been submitted`,
        })
      }
    } catch (error) {
      console.error("Request payout error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to request payout",
        variant: "destructive",
      })
    } finally {
      setIsRequesting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  const hasPendingPayout = payouts.some((p) => p.status === "PENDING")

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
          <h1 className="text-2xl font-bold tracking-tight">Payouts</h1>
          <p className="text-muted-foreground">
            Manage your earnings and withdrawal requests
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="gradient-accent"
              disabled={!stats || stats.availableBalance < MIN_PAYOUT_AMOUNT || hasPendingPayout}
            >
              <Wallet className="mr-2 h-4 w-4" />
              Request Payout
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Payout</DialogTitle>
              <DialogDescription>
                Withdraw your earnings to your preferred payment method
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Available Balance</AlertTitle>
                <AlertDescription>
                  ${stats?.availableBalance.toFixed(2) || "0.00"}
                </AlertDescription>
              </Alert>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    className="pl-7"
                    min={MIN_PAYOUT_AMOUNT}
                    max={stats?.availableBalance}
                    step="0.01"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Minimum: ${MIN_PAYOUT_AMOUNT}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select defaultValue={affiliate?.paymentMethod || "paypal"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Update payment method in{" "}
                  <a href="/affiliate/settings" className="text-primary underline">
                    settings
                  </a>
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isRequesting}
              >
                Cancel
              </Button>
              <Button onClick={handleRequestPayout} disabled={isRequesting}>
                {isRequesting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Wallet className="mr-2 h-4 w-4" />
                    Request Payout
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Stats Cards */}
      {stats && (
        <motion.div variants={item} className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Available Balance
              </CardTitle>
              <DollarSign className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">${stats.availableBalance.toFixed(2)}</p>
              {stats.availableBalance < MIN_PAYOUT_AMOUNT && (
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum withdrawal: ${MIN_PAYOUT_AMOUNT}
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Payouts
              </CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">${stats.pendingPayouts.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Paid Out
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">${stats.totalPaidOut.toFixed(2)}</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Warning */}
      {hasPendingPayout && (
        <motion.div variants={item}>
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertTitle>Payout in progress</AlertTitle>
            <AlertDescription>
              You have a pending payout request. Please wait for it to be processed
              before requesting another one.
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Payout History */}
      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Payout History</CardTitle>
          </CardHeader>
          <CardContent>
            {payouts.length === 0 ? (
              <div className="text-center py-12">
                <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No payouts yet</h3>
                <p className="text-muted-foreground">
                  Your payout history will appear here once you request a withdrawal
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Processed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payouts.map((payout) => {
                      const config = statusConfig[payout.status]
                      const StatusIcon = config.icon
                      return (
                        <TableRow key={payout.id}>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(payout.createdAt), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="font-semibold">
                            ${payout.amount.toFixed(2)}
                          </TableCell>
                          <TableCell className="capitalize">
                            {paymentMethods.find((m) => m.value === payout.paymentMethod)?.label ||
                              payout.paymentMethod}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn("font-medium", config.className)}
                            >
                              <StatusIcon
                                className={cn(
                                  "h-3 w-3 mr-1",
                                  payout.status === "PROCESSING" && "animate-spin"
                                )}
                              />
                              {config.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {payout.processedAt
                              ? format(new Date(payout.processedAt), "MMM d, yyyy")
                              : "-"}
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
