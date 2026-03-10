"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  Wifi,
  Package,
  ShieldCheck,
  ArrowRight,
  Loader2,
  Clock,
  Settings,
  ShoppingBag,
  Zap,
  User as UserIcon,
} from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/components/providers/auth-provider"
import Link from "next/link"
import { cn } from "@/lib/utils"

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
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  PROCESSING: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  COMPLETED: "bg-green-500/10 text-green-500 border-green-500/20",
  CANCELLED: "bg-red-500/10 text-red-500 border-red-500/20",
  FAILED: "bg-red-500/10 text-red-500 border-red-500/20",
}

export default function DashboardPage() {
  const { user, isLoading: authLoading, openAuthModal } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [totalOrders, setTotalOrders] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      setLoading(false)
      return
    }
    if (!authLoading && user) {
      fetchOrders()
    }
  }, [user, authLoading])

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const res = await fetch("/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setOrders(data.data.orders || [])
          setTotalOrders(data.data.total || data.data.orders?.length || 0)
        }
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error)
    } finally {
      setLoading(false)
    }
  }

  const activeEsims = orders.filter((o) => o.status === "COMPLETED").length

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6 max-w-md mx-auto px-4"
          >
            <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto">
              <UserIcon className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-3xl font-black tracking-tight">Sign in to continue</h1>
            <p className="text-muted-foreground font-medium">
              Log in to access your dashboard, manage your eSIMs, and view your orders.
            </p>
            <Button
              size="lg"
              className="rounded-2xl px-10 h-14 font-black"
              onClick={() => openAuthModal("login")}
            >
              Sign In
            </Button>
          </motion.div>
        </main>
        <Footer />
      </div>
    )
  }

  const recentOrders = orders.slice(0, 3)
  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : user.email[0].toUpperCase()

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 pb-20">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Welcome Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="pt-16 pb-10"
          >
            <div className="flex items-center gap-5">
              <Avatar className="h-16 w-16 border-2 border-primary/20">
                <AvatarImage src={user.avatar || undefined} alt={user.name || "User"} />
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-black">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                  Welcome back, {user.name || "Traveler"}
                </h1>
                <p className="text-muted-foreground font-medium mt-1">{user.email}</p>
              </div>
            </div>
          </motion.section>

          {/* Quick Stats */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
          >
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Wifi className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">
                      Active eSIMs
                    </p>
                    <p className="text-3xl font-black">{loading ? "..." : activeEsims}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                    <Package className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">
                      Total Orders
                    </p>
                    <p className="text-3xl font-black">{loading ? "..." : totalOrders}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
                    <ShieldCheck className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">
                      Account Status
                    </p>
                    <Badge className="mt-1 rounded-full font-bold bg-green-500/10 text-green-500 border-green-500/20">
                      Verified
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Recent Orders */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-12"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black tracking-tight">Recent Orders</h2>
              {orders.length > 0 && (
                <Button variant="ghost" className="text-primary font-bold rounded-xl" asChild>
                  <Link href="/orders">
                    View All <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : recentOrders.length === 0 ? (
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-12 text-center space-y-4">
                  <div className="w-16 h-16 bg-muted rounded-[1.5rem] flex items-center justify-center mx-auto">
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-black">No orders yet</h3>
                  <p className="text-muted-foreground">
                    Browse our eSIM plans and get connected anywhere in the world.
                  </p>
                  <Button className="rounded-2xl font-bold" asChild>
                    <Link href="/products">Browse eSIMs</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order, i) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                  >
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/20 transition-all">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                              <Wifi className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-black">{order.orderNumber}</p>
                                <Badge
                                  className={cn(
                                    "rounded-full font-bold uppercase text-[10px]",
                                    statusColors[order.status] || "bg-muted text-muted-foreground"
                                  )}
                                >
                                  {order.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground font-medium">
                                {order.items.map((item) => item.productName).join(", ")}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground font-bold">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {new Date(order.createdAt).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Zap className="h-3.5 w-3.5 text-amber-500" />
                              ${order.total.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.section>

          {/* Quick Actions */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h2 className="text-2xl font-black tracking-tight mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-16 rounded-2xl font-bold border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all justify-start px-6 gap-3"
                asChild
              >
                <Link href="/products">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  Browse eSIMs
                </Link>
              </Button>
              <Button
                variant="outline"
                className="h-16 rounded-2xl font-bold border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all justify-start px-6 gap-3"
                asChild
              >
                <Link href="/orders">
                  <Package className="h-5 w-5 text-blue-500" />
                  View All Orders
                </Link>
              </Button>
              <Button
                variant="outline"
                className="h-16 rounded-2xl font-bold border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all justify-start px-6 gap-3"
                asChild
              >
                <Link href="/settings">
                  <Settings className="h-5 w-5 text-muted-foreground" />
                  Account Settings
                </Link>
              </Button>
            </div>
          </motion.section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
