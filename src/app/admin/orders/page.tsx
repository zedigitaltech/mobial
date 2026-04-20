"use client"

import { getAccessToken } from "@/lib/auth-token"
import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Search,
  Package,
  XCircle,
  MoreHorizontal,
  Loader2,
  ExternalLink,
  Wifi,
  Play,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
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
import { toast } from "sonner"
import { OrderActions } from "./order-actions"

interface OrderItem {
  id: string
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

interface Order {
  id: string
  orderNumber: string
  status: string
  paymentStatus: string
  email: string
  phone: string | null
  subtotal: number
  total: number
  createdAt: string
  items: OrderItem[]
  user: {
    id: string
    name: string | null
    email: string
  } | null
}

interface OrdersResponse {
  orders: Order[]
  pagination: {
    total: number
    hasMore: boolean
  }
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
  PROCESSING: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  COMPLETED: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  CANCELLED: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  FAILED: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
}

const paymentStatusColors: Record<string, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  PROCESSING: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  PAID: "bg-green-500/10 text-green-700 dark:text-green-400",
  FAILED: "bg-red-500/10 text-red-700 dark:text-red-400",
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [actionDialog, setActionDialog] = useState<"process" | "cancel" | null>(null)
  const [processing, setProcessing] = useState(false)
  const [cancelReason, setCancelReason] = useState("")

  useEffect(() => {
    fetchOrders()
  }, [statusFilter])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const token = getAccessToken()
      
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (statusFilter) params.set("status", statusFilter)
      params.set("limit", "20")
      
      const response = await fetch(`/api/orders?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) throw new Error("Failed to fetch orders")
      
      const data: OrdersResponse = await response.json()
      setOrders(data.orders)
    } catch (error) {
      console.error("Failed to fetch orders:", error)
      toast.error("Failed to load orders")
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchOrders()
  }

  const handleProcess = async () => {
    if (!selectedOrder) return
    
    setProcessing(true)
    try {
      const token = getAccessToken()
      const response = await fetch(`/api/orders/${selectedOrder.id}/process`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to process order")
      }
      
      toast.success("Order processed successfully")
      setActionDialog(null)
      setSelectedOrder(null)
      fetchOrders()
    } catch (error) {
      console.error("Failed to process order:", error)
      toast.error(error instanceof Error ? error.message : "Failed to process order")
    } finally {
      setProcessing(false)
    }
  }

  const handleCancel = async () => {
    if (!selectedOrder) return
    
    setProcessing(true)
    try {
      const token = getAccessToken()
      const response = await fetch(`/api/orders/${selectedOrder.id}/cancel`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ reason: cancelReason || "Cancelled by admin" }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to cancel order")
      }
      
      toast.success("Order cancelled successfully")
      setActionDialog(null)
      setSelectedOrder(null)
      setCancelReason("")
      fetchOrders()
    } catch (error) {
      console.error("Failed to cancel order:", error)
      toast.error(error instanceof Error ? error.message : "Failed to cancel order")
    } finally {
      setProcessing(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">
            Manage customer orders and eSIM deliveries
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
                  placeholder="Search by order number or email..."
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
                <SelectItem value="PROCESSING">Processing</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground mt-2">Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No orders found</h3>
              <p className="text-muted-foreground">
                {search || statusFilter 
                  ? "Try adjusting your search or filters"
                  : "Orders will appear here once customers start purchasing"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <code className="text-sm font-mono">{order.orderNumber}</code>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.user?.name || "Guest"}</p>
                        <p className="text-sm text-muted-foreground">{order.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Wifi className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{order.items[0]?.productName || "eSIM"}</p>
                          {order.items.length > 1 && (
                            <p className="text-xs text-muted-foreground">+{order.items.length - 1} more</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[order.status]}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={paymentStatusColors[order.paymentStatus]}>
                        {order.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      ${order.total.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(order.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <OrderActions
                          orderId={order.id}
                          orderNumber={order.orderNumber}
                          status={order.status}
                          paymentStatus={order.paymentStatus}
                          onActionComplete={fetchOrders}
                        />
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
                            <Link href={`/order/${order.orderNumber}`}>
                              <ExternalLink className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          {order.status === "PENDING" && (
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedOrder(order)
                                setActionDialog("process")
                              }}
                            >
                              <Play className="mr-2 h-4 w-4" />
                              Process Order
                            </DropdownMenuItem>
                          )}
                          {(order.status === "PENDING" || order.status === "PROCESSING") && (
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => {
                                setSelectedOrder(order)
                                setActionDialog("cancel")
                              }}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Cancel Order
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Process Dialog */}
      <Dialog open={actionDialog === "process"} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Order</DialogTitle>
            <DialogDescription>
              Process order <strong>{selectedOrder?.orderNumber}</strong>? This will:
              <ul className="mt-2 space-y-1 text-sm">
                <li>• Create the eSIM order with MobiMatter</li>
                <li>• Generate eSIM QR codes for the customer</li>
                <li>• Calculate and create affiliate commissions</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleProcess} disabled={processing}>
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Process Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={actionDialog === "cancel"} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel order <strong>{selectedOrder?.orderNumber}</strong>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Reason (optional)</label>
            <Input
              placeholder="Enter reason for cancellation..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>
              Keep Order
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={processing}>
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cancel Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
