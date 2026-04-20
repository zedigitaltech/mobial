"use client"

import { getAccessToken } from "@/lib/auth-token"
import { useTranslations } from "next-intl"
import { motion } from "framer-motion"
import { useQuery } from "@tanstack/react-query"
import {
  Wifi,
  Package,
  ArrowRight,
  Loader2,
  Clock,
  Settings,
  ShoppingBag,
  Zap,
  User as UserIcon,
  Wallet,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/components/providers/auth-provider"
import { useCurrency } from "@/contexts/currency-context"
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

interface OrdersResponse {
  success: boolean
  data: {
    orders: Order[]
    total: number
  }
}

interface WalletResponse {
  success: boolean
  data: {
    balance: number
    currency: string
  }
}

interface RewardsSummary {
  totalEarned: number
  totalSpent: number
  netBalance: number
  cashbackTotal: number
  referralTotal: number
}

interface RewardsResponse {
  success: boolean
  data: {
    rewards: Array<{
      id: string
      type: string
      amount: number
      orderId: string | null
      description: string | null
      createdAt: string
    }>
    summary: RewardsSummary
  }
}

async function fetchOrders(): Promise<OrdersResponse> {
  const token = getAccessToken()
  if (!token) throw new Error("No auth token")

  const res = await fetch("/api/orders", {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error("Failed to fetch orders")
  return res.json()
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  PROCESSING: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  COMPLETED: "bg-green-500/10 text-green-500 border-green-500/20",
  CANCELLED: "bg-red-500/10 text-red-500 border-red-500/20",
  FAILED: "bg-red-500/10 text-red-500 border-red-500/20",
}

export default function DashboardPage() {
  const t = useTranslations("dashboard")
  const { user, isLoading: authLoading, openAuthModal } = useAuth()
  const { formatPrice } = useCurrency()

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ["dashboard-orders"],
    queryFn: fetchOrders,
    enabled: !authLoading && !!user,
  })

  const { data: walletData, isLoading: walletLoading } = useQuery<WalletResponse>({
    queryKey: ["wallet"],
    queryFn: async () => {
      const token = getAccessToken()
      if (!token) throw new Error("No auth token")
      const res = await fetch("/api/wallet", { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error("Failed to fetch wallet")
      return res.json()
    },
    enabled: !authLoading && !!user,
  })

  const { data: rewardsData, isLoading: rewardsLoading } = useQuery<RewardsResponse>({
    queryKey: ["rewards"],
    queryFn: async () => {
      const token = getAccessToken()
      if (!token) throw new Error("No auth token")
      const res = await fetch("/api/rewards", { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error("Failed to fetch rewards")
      return res.json()
    },
    enabled: !authLoading && !!user,
  })

  const orders = ordersData?.data?.orders || []
  const totalOrders = ordersData?.data?.total || orders.length
  const loading = authLoading || (!!user && (ordersLoading || walletLoading || rewardsLoading))

  const now = Date.now()
  const MS_90_DAYS = 90 * 24 * 60 * 60 * 1000
  const activeEsims = orders.filter((o) => {
    if (o.status !== "COMPLETED") return false
    return (now - new Date(o.createdAt).getTime()) < MS_90_DAYS
  }).length

  const walletBalance = walletData?.data?.balance ?? 0
  const referralEarnings = rewardsData?.data?.summary?.referralTotal ?? 0

  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6 max-w-md mx-auto px-4"
        >
          <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto">
            <UserIcon className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-black tracking-tight">{t("signInToContinue")}</h1>
          <p className="text-muted-foreground font-medium">
            {t("signInDesc")}
          </p>
          <Button
            size="lg"
            className="rounded-2xl px-10 h-14 font-black"
            onClick={() => openAuthModal("login")}
          >
            {t("signIn")}
          </Button>
        </motion.div>
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
      <div className="pb-20">
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
                  {t("welcomeBack", { name: user.name || "Traveler" })}
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
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12"
          >
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#6C4FFF1A" }}>
                    <Package className="h-6 w-6" style={{ color: "#6C4FFF" }} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">
                      {t("totalOrders")}
                    </p>
                    <p className="text-3xl font-black">{loading ? "..." : totalOrders}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#00D9B81A" }}>
                    <Wifi className="h-6 w-6" style={{ color: "#00D9B8" }} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">
                      {t("activeEsims")}
                    </p>
                    <p className="text-3xl font-black">{loading ? "..." : activeEsims}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#6C4FFF1A" }}>
                    <Wallet className="h-6 w-6" style={{ color: "#6C4FFF" }} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">
                      {t("walletBalance")}
                    </p>
                    <p className="text-3xl font-black">{loading ? "..." : formatPrice(walletBalance)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#00D9B81A" }}>
                    <Users className="h-6 w-6" style={{ color: "#00D9B8" }} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">
                      {t("referralEarnings")}
                    </p>
                    <p className="text-3xl font-black">{loading ? "..." : formatPrice(referralEarnings)}</p>
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
              <h2 className="text-2xl font-black tracking-tight">{t("recentOrders")}</h2>
              {orders.length > 0 && (
                <Button variant="ghost" className="text-primary font-bold rounded-xl" asChild>
                  <Link href="/orders">
                    {t("viewAll")} <ArrowRight className="ml-2 h-4 w-4" />
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
                  <h3 className="text-xl font-black">{t("noOrdersYet")}</h3>
                  <p className="text-muted-foreground">
                    {t("noOrdersDesc")}
                  </p>
                  <Button className="rounded-2xl font-bold" asChild>
                    <Link href="/products">{t("browseEsims")}</Link>
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
                              {formatPrice(order.total)}
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
            <h2 className="text-2xl font-black tracking-tight mb-6">{t("quickActions")}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-16 rounded-2xl font-bold border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all justify-start px-6 gap-3"
                asChild
              >
                <Link href="/products">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  {t("browseEsims")}
                </Link>
              </Button>
              <Button
                variant="outline"
                className="h-16 rounded-2xl font-bold border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all justify-start px-6 gap-3"
                asChild
              >
                <Link href="/orders">
                  <Package className="h-5 w-5 text-blue-500" />
                  {t("viewAllOrders")}
                </Link>
              </Button>
              <Button
                variant="outline"
                className="h-16 rounded-2xl font-bold border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all justify-start px-6 gap-3"
                asChild
              >
                <Link href="/settings">
                  <Settings className="h-5 w-5 text-muted-foreground" />
                  {t("accountSettings")}
                </Link>
              </Button>
            </div>
          </motion.section>
        </div>
      </div>
  )
}
