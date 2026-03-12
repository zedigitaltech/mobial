"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Package,
  ChevronRight,
  Wifi,
  Clock,
  Loader2,
  Search,
  AlertCircle,
  QrCode,
  Copy,
  Check,
  Zap,
  Download,
  Info
} from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { useAuth } from "@/components/providers/auth-provider"

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
  paymentStatus: string
  email: string
  total: number
  createdAt: string
  items: OrderItem[]
  esimQrCode?: string
  esimActivationCode?: string
  esimSmdpAddress?: string
  esimIccid?: string
}

interface UsageData {
  dataUsed: number
  dataTotal: number
  remainingDays: number | null
  status: string
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
  PROCESSING: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  COMPLETED: "bg-green-500/10 text-green-700 border-green-500/20",
  CANCELLED: "bg-red-500/10 text-red-700 border-red-500/20",
  FAILED: "bg-red-500/10 text-red-700 border-red-500/20",
}

function UsageIndicator({ orderId }: { orderId: string }) {
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}/usage`)
        if (res.ok) {
          const data = await res.json()
          setUsage(data.data)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchUsage()
  }, [orderId])

  if (loading) return <div className="h-4 w-24 bg-muted animate-pulse rounded" />
  if (!usage) return null

  const percentUsed = (usage.dataUsed / usage.dataTotal) * 100
  const dataRemaining = (usage.dataTotal - usage.dataUsed).toFixed(2)

  return (
    <div className="space-y-2 mt-4 pt-4 border-t border-border/50">
      <div className="flex justify-between text-xs font-bold">
        <span className="text-muted-foreground uppercase tracking-wider">Data Remaining</span>
        <span className="text-primary">{dataRemaining} GB left</span>
      </div>
      <Progress value={100 - percentUsed} className="h-2 bg-muted" />
      <p className="text-[10px] text-muted-foreground">
        {usage.remainingDays != null ? `${usage.remainingDays} days of validity remaining` : 'Validity info unavailable'}
      </p>
    </div>
  )
}

function OrderDetails({ order }: { order: Order }) {
  const [copied, setCopied] = useState<string | null>(null)

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    toast.success("Copied to clipboard")
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="space-y-6 mt-6 pt-6 border-t border-border/50">
      <div className="grid md:grid-cols-2 gap-8">
        {/* QR Code Section */}
        <div className="flex flex-col items-center justify-center p-6 bg-muted/30 rounded-[2rem] border border-border/50">
          {order.esimQrCode ? (
            <>
              <div className="bg-white p-4 rounded-3xl shadow-xl mb-4">
                <img
                  src={`/api/orders/${order.id}/qr?size=200`}
                  alt="eSIM QR Code"
                  className="w-40 h-40"
                />
              </div>
              <p className="text-sm font-bold text-center">Scan to Install eSIM</p>
              <p className="text-xs text-muted-foreground text-center mt-2 max-w-[200px]">
                Open your device settings and scan this code to activate your plan.
              </p>
            </>
          ) : (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
              <p className="text-sm font-medium">Provisioning your eSIM...</p>
            </div>
          )}
        </div>

        {/* Manual Settings */}
        <div className="space-y-4">
          <h4 className="font-black text-lg flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            Manual Installation
          </h4>
          
          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-card border border-border/50 space-y-1">
              <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">SM-DP+ Address</p>
              <div className="flex items-center justify-between gap-2">
                <code className="text-sm font-mono truncate">{order.esimSmdpAddress || 'Pending...'}</code>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8" 
                  onClick={() => order.esimSmdpAddress && copyToClipboard(order.esimSmdpAddress, 'smdp')}
                >
                  {copied === 'smdp' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border/50 space-y-1">
              <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Activation Code</p>
              <div className="flex items-center justify-between gap-2">
                <code className="text-sm font-mono truncate">{order.esimActivationCode || 'Pending...'}</code>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8"
                  onClick={() => order.esimActivationCode && copyToClipboard(order.esimActivationCode, 'auth')}
                >
                  {copied === 'auth' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20">
            <p className="text-xs leading-relaxed">
              <span className="font-bold text-primary">Need help?</span> Go to Settings {'>'} Cellular {'>'} Add eSIM and choose "Enter Details Manually" to use these codes.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function OrderCard({ order }: { order: Order }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden"
    >
      <Card className={cn(
        "transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm",
        isExpanded && "ring-2 ring-primary/20 border-primary/30"
      )}>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <Wifi className="h-8 w-8 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-black text-lg">{order.orderNumber}</p>
                  <Badge className={cn("rounded-full font-bold uppercase text-[10px]", statusColors[order.status])}>
                    {order.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground font-medium">
                  {order.items.map(i => i.productName).join(", ")}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground font-bold">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="h-3 w-3 text-amber-500" />
                    ${order.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {order.status === 'COMPLETED' && (
                <Button 
                  onClick={() => setIsExpanded(!isExpanded)}
                  variant={isExpanded ? "secondary" : "default"}
                  className="rounded-full font-bold px-6 h-12"
                >
                  {isExpanded ? "Close Details" : "View eSIM Details"}
                  <ChevronRight className={cn("ml-2 h-4 w-4 transition-transform", isExpanded && "rotate-90")} />
                </Button>
              )}
            </div>
          </div>

          {order.status === 'COMPLETED' && !isExpanded && (
            <UsageIndicator orderId={order.id} />
          )}

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <OrderDetails order={order} />
              </motion.div>
            )}
          </AnimatePresence>
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
    try {
      const response = await fetch(`/api/orders/${orderNumber.trim()}`)
      if (response.ok) {
        router.push(`/order/${orderNumber.trim()}`)
      } else {
        toast.error("Order not found")
      }
    } catch {
      toast.error("Search failed")
    } finally {
      setSearching(false)
    }
  }

  return (
    <Card className="max-w-xl mx-auto rounded-[2.5rem] border-border/50 shadow-2xl overflow-hidden bg-card/80 backdrop-blur-xl">
      <CardHeader className="text-center p-10 pb-2">
        <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
          <Search className="h-10 w-10 text-primary" />
        </div>
        <CardTitle className="text-3xl font-black tracking-tight">Track Your eSIM</CardTitle>
        <p className="text-muted-foreground font-medium mt-2">
          Enter your order number from your confirmation email.
        </p>
      </CardHeader>
      <CardContent className="p-10 pt-6 space-y-6">
        <div className="flex gap-2 p-2 bg-muted rounded-[2rem] border focus-within:ring-2 ring-primary/20 transition-all">
          <Input
            placeholder="MBL-XXXXXXXX"
            className="border-0 focus-visible:ring-0 text-lg h-14 bg-transparent pl-4"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={searching} className="rounded-2xl h-14 px-8 font-bold text-lg">
            {searching ? <Loader2 className="h-6 w-6 animate-spin" /> : "Find Order"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ")
}

export default function OrdersPage() {
  const { user, isLoading: authLoading, openAuthModal } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)

  useEffect(() => {
    if (!authLoading && user) {
      loadOrders()
    } else if (!authLoading && !user) {
      setLoading(false)
    }
  }, [user, authLoading])

  const loadOrders = async (offset = 0) => {
    try {
      setLoading(true)
      const res = await fetch(`/api/orders?limit=20&offset=${offset}`)
      if (res.ok) {
        const data = await res.json()
        if (offset === 0) {
          setOrders(data.data.orders)
        } else {
          setOrders(prev => [...prev, ...data.data.orders])
        }
        setHasMore(data.data.pagination.hasMore)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Header />

      <main className="flex-1 pb-20">
        <section className="pt-16 pb-12">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">My Dashboard</h1>
            <p className="text-muted-foreground font-medium max-w-xl mx-auto">
              Manage your eSIMs, track data usage, and view your complete purchase history.
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4 max-w-5xl">
          {authLoading || (loading && orders.length === 0) ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : !user ? (
            <div className="space-y-12">
              <GuestOrderLookup />
              <div className="text-center space-y-4">
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Or sign in to your account</p>
                <Button variant="outline" size="lg" className="rounded-2xl px-12 h-14 font-black border-2" onClick={() => openAuthModal("login")}>
                  Login to Access All Orders
                </Button>
              </div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-20 bg-card border rounded-[3rem] shadow-xl space-y-6">
              <div className="w-24 h-24 bg-muted rounded-[2rem] flex items-center justify-center mx-auto">
                <Package className="h-12 w-12 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black">No active orders</h3>
                <p className="text-muted-foreground">You haven't purchased any eSIMs yet.</p>
              </div>
              <Button size="lg" className="rounded-2xl px-10 h-14 font-black" asChild>
                <a href="/products">Shop eSIM Plans</a>
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
              
              {hasMore && (
                <div className="flex justify-center pt-8">
                  <Button variant="ghost" className="font-black text-primary hover:bg-primary/5 rounded-2xl h-14 px-12" onClick={() => loadOrders(orders.length)} disabled={loading}>
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Load More Orders"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
