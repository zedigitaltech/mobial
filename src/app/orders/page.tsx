"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  Package,
  ChevronRight,
  Wifi,
  Clock,
  Loader2,
  Search,
  AlertCircle,
} from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

// Types
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
  email: string
  total: number
  createdAt: string
  items: OrderItem[]
}

interface OrdersResponse {
  orders: Order[]
  pagination: {
    total: number
    hasMore: boolean
  }
}

// Status colors
const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
  PROCESSING: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  COMPLETED: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  CANCELLED: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  FAILED: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  REFUNDED: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
}

// Fetch orders (guest lookup by email or authenticated)
async function fetchOrders(email?: string, limit = 20, offset = 0): Promise<OrdersResponse> {
  const params = new URLSearchParams()
  params.set("limit", limit.toString())
  params.set("offset", offset.toString())

  // If email provided, try guest lookup
  if (email) {
    // This would need a guest order lookup endpoint
    // For now, we'll just show a message
    return {
      orders: [],
      pagination: { total: 0, hasMore: false }
    }
  }

  const response = await fetch(`/api/orders?${params.toString()}`)
  if (!response.ok) {
    if (response.status === 401) {
      return {
        orders: [],
        pagination: { total: 0, hasMore: false }
      }
    }
    throw new Error("Failed to fetch orders")
  }
  return response.json()
}

// Format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

// Format status
const formatStatus = (status: string) => {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
}

function OrderCard({ order }: { order: Order }) {
  const router = useRouter()

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      className="cursor-pointer"
      onClick={() => router.push(`/order/${order.orderNumber}`)}
    >
      <Card className="hover:border-primary/30 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            {/* Order Info */}
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Wifi className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold font-mono">{order.orderNumber}</p>
                  <Badge variant="outline" className={statusColors[order.status] || ""}>
                    {formatStatus(order.status)}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {order.items.length} {order.items.length === 1 ? "item" : "items"}
                  {" • "}
                  {formatDate(order.createdAt)}
                </p>
                <p className="text-sm font-medium mt-1">
                  ${order.total.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Items Preview */}
            <div className="hidden sm:block text-right">
              <p className="text-sm text-muted-foreground mb-1">
                {order.items.slice(0, 2).map(i => i.productName).join(", ")}
                {order.items.length > 2 && ` +${order.items.length - 2} more`}
              </p>
              <ChevronRight className="h-5 w-5 text-muted-foreground inline-block" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function GuestOrderLookup() {
  const [orderNumber, setOrderNumber] = useState("")
  const [searching, setSearching] = useState(false)
  const router = useRouter()

  const handleSearch = async () => {
    if (!orderNumber.trim()) {
      toast.error("Please enter an order number")
      return
    }

    setSearching(true)
    // Try to fetch the order
    try {
      const response = await fetch(`/api/orders/${orderNumber.trim()}`)
      if (response.ok) {
        router.push(`/order/${orderNumber.trim()}`)
      } else {
        toast.error("Order not found. Please check the order number.")
      }
    } catch {
      toast.error("Failed to search for order")
    } finally {
      setSearching(false)
    }
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Search className="h-5 w-5" />
          Find Your Order
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Enter your order number to view your order details and eSIM information.
        </p>
        <div className="flex gap-2">
          <Input
            placeholder="MBL-XXXXXXXX"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={searching}>
            {searching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyOrdersState() {
  return (
    <div className="text-center py-12">
      <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
        <Package className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
      <p className="text-muted-foreground mb-4">
        When you place an order, it will appear here
      </p>
      <Button asChild>
        <a href="/products">Browse eSIM Plans</a>
      </Button>
    </div>
  )
}

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const response = await fetchOrders()
      setOrders(response.orders)
      setTotal(response.pagination.total)
      setHasMore(response.pagination.hasMore)
      setIsAuthenticated(true)
    } catch (error) {
      // If 401, user is not authenticated
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }

  const loadMore = async () => {
    if (!hasMore || loading) return

    try {
      setLoading(true)
      const response = await fetchOrders(undefined, 20, orders.length)
      setOrders(prev => [...prev, ...response.orders])
      setHasMore(response.pagination.hasMore)
    } catch {
      toast.error("Failed to load more orders")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="border-b bg-muted/20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-3xl font-bold mb-2">My Orders</h1>
              <p className="text-muted-foreground">
                View your order history and eSIM details
              </p>
            </motion.div>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading && orders.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : isAuthenticated === false ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Tabs defaultValue="lookup" className="max-w-2xl mx-auto">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="lookup">Find Order</TabsTrigger>
                  <TabsTrigger value="login">Sign In</TabsTrigger>
                </TabsList>
                <TabsContent value="lookup" className="mt-6">
                  <GuestOrderLookup />
                </TabsContent>
                <TabsContent value="login" className="mt-6">
                  <Card className="max-w-md mx-auto">
                    <CardContent className="p-6 text-center">
                      <p className="text-muted-foreground mb-4">
                        Sign in to see all your orders in one place
                      </p>
                      <Button onClick={() => router.push("/#auth")}>
                        Sign In / Sign Up
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          ) : orders.length === 0 ? (
            <EmptyOrdersState />
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-3xl mx-auto space-y-4"
            >
              <p className="text-sm text-muted-foreground mb-4">
                {total} {total === 1 ? "order" : "orders"} found
              </p>

              {orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}

              {hasMore && (
                <div className="flex justify-center mt-8">
                  <Button variant="outline" onClick={loadMore} disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <Clock className="h-4 w-4 mr-2" />
                        Load More
                      </>
                    )}
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
