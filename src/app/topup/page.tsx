"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  Zap,
  Search,
  Loader2,
  AlertCircle,
  TrendingUp,
  Clock,
  Wifi,
  WifiOff,
  Hash,
  CreditCard,
  ArrowRight,
  CheckCircle,
  Package,
} from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface UsageData {
  orderId: string
  orderNumber: string | null
  iccid: string
  dataUsed: number
  dataTotal: number
  dataUnit: string
  percentage: number
  remainingDays: number
  isActive: boolean
  status: "active" | "expired" | "not_activated"
}

interface TopupProduct {
  id: string
  name: string
  provider: string
  dataAmount: number | null
  dataUnit: string | null
  validityDays: number | null
  price: number
  currency: string
}

type LookupType = "iccid" | "order_number"
type Step = "lookup" | "select" | "checkout"

function formatData(amount: number, unit: string): string {
  if (unit === "MB" && amount >= 1000) {
    return `${(amount / 1000).toFixed(2)} GB`
  }
  if (unit === "MB") {
    return `${Math.round(amount)} MB`
  }
  return `${amount.toFixed(2)} ${unit}`
}

export default function TopupPage() {
  const [step, setStep] = useState<Step>("lookup")
  const [lookupType, setLookupType] = useState<LookupType>("order_number")
  const [inputValue, setInputValue] = useState("")
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [products, setProducts] = useState<TopupProduct[]>([])
  const [selectedProduct, setSelectedProduct] = useState<TopupProduct | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState("")

  async function handleLookup() {
    if (!inputValue.trim()) return

    setIsLoading(true)
    setError(null)
    setUsage(null)
    setProducts([])

    try {
      // Step 1: Get usage data
      const usageRes = await fetch("/api/usage/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: lookupType, value: inputValue.trim() }),
      })

      const usageData = await usageRes.json()

      if (!usageRes.ok || !usageData.success) {
        setError(usageData.error || "Failed to find eSIM")
        return
      }

      setUsage(usageData.data)

      // Step 2: Fetch compatible top-up products
      // Use the order to find the original product's country and provider
      if (usageData.data.orderNumber) {
        const productsRes = await fetch(
          `/api/products?topup=true&limit=10&sortBy=price_asc`
        )
        const productsData = await productsRes.json()
        if (productsData.success && productsData.data?.products) {
          setProducts(productsData.data.products)
        }
      }

      setStep("select")
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCheckout() {
    if (!selectedProduct || !usage || !email.trim()) return

    setIsCheckingOut(true)
    setError(null)

    try {
      // Create a top-up order
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ productId: selectedProduct.id, quantity: 1 }],
          email: email.trim(),
          isTopUp: true,
          parentMobimatterOrderId: usage.orderId,
        }),
      })

      const orderData = await orderRes.json()

      if (!orderRes.ok || !orderData.success) {
        setError(orderData.error || "Failed to create order")
        return
      }

      // Create Stripe checkout session
      const checkoutRes = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderData.data.order.id,
          isTopUp: true,
          parentMobimatterOrderId: usage.orderId,
        }),
      })

      const checkoutData = await checkoutRes.json()

      if (!checkoutRes.ok || !checkoutData.success) {
        setError(checkoutData.error || "Failed to create checkout session")
        return
      }

      // Redirect to Stripe
      if (checkoutData.data?.url) {
        window.location.href = checkoutData.data.url
      }
    } catch {
      setError("Failed to process checkout. Please try again.")
    } finally {
      setIsCheckingOut(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative pt-20 pb-12 overflow-hidden">
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--primary)_0%,_transparent_70%)] opacity-[0.03]" />
            <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
          </div>

          <div className="container mx-auto px-4 text-center space-y-6">
            <Badge className="bg-primary/10 text-primary border-0 px-4 py-1.5 text-xs font-black uppercase tracking-wider">
              <Zap className="h-3 w-3 mr-1" /> Top Up
            </Badge>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1]">
              Top Up Your{" "}
              <span className="text-primary italic">eSIM</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
              Running low on data? Extend your eSIM plan with a quick top-up. No new QR code needed.
            </p>

            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-2 pt-4">
              {["Find eSIM", "Select Plan", "Checkout"].map((label, i) => {
                const stepIndex = i === 0 ? "lookup" : i === 1 ? "select" : "checkout"
                const isActive = step === stepIndex
                const isPast =
                  (step === "select" && i === 0) ||
                  (step === "checkout" && i <= 1)
                return (
                  <div key={label} className="flex items-center gap-2">
                    {i > 0 && (
                      <div className={cn("w-8 h-0.5", isPast ? "bg-primary" : "bg-border")} />
                    )}
                    <div className="flex items-center gap-1.5">
                      <div
                        className={cn(
                          "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : isPast
                              ? "bg-primary/20 text-primary"
                              : "bg-muted text-muted-foreground"
                        )}
                      >
                        {isPast ? <CheckCircle className="h-3.5 w-3.5" /> : i + 1}
                      </div>
                      <span
                        className={cn(
                          "text-xs font-bold hidden sm:inline",
                          isActive ? "text-primary" : "text-muted-foreground"
                        )}
                      >
                        {label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Step 1: Lookup */}
        <AnimatePresence mode="wait">
          {step === "lookup" && (
            <motion.section
              key="lookup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="py-8"
            >
              <div className="container mx-auto px-4 max-w-xl">
                <Card className="border-white/5 bg-white/[0.03] backdrop-blur-2xl">
                  <CardContent className="p-6 space-y-6">
                    <div className="flex gap-2">
                      <Button
                        variant={lookupType === "order_number" ? "default" : "outline"}
                        size="sm"
                        onClick={() => { setLookupType("order_number"); setInputValue("") }}
                        className="flex-1 rounded-xl font-bold text-xs"
                      >
                        <CreditCard className="h-3.5 w-3.5 mr-2" />
                        Order Number
                      </Button>
                      <Button
                        variant={lookupType === "iccid" ? "default" : "outline"}
                        size="sm"
                        onClick={() => { setLookupType("iccid"); setInputValue("") }}
                        className="flex-1 rounded-xl font-bold text-xs"
                      >
                        <Hash className="h-3.5 w-3.5 mr-2" />
                        ICCID
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        {lookupType === "order_number" ? "Order Number" : "ICCID Number"}
                      </label>
                      <div className="flex gap-2">
                        <Input
                          placeholder={
                            lookupType === "order_number"
                              ? "MBL-XXXXXXXX"
                              : "Enter your ICCID number"
                          }
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                          className="rounded-xl h-12 font-mono text-sm"
                        />
                        <Button
                          onClick={handleLookup}
                          disabled={isLoading || !inputValue.trim()}
                          className="rounded-xl h-12 px-6 font-black uppercase tracking-widest text-[10px]"
                        >
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Search className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20"
                        >
                          <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
                          <p className="text-sm text-red-400">{error}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </div>
            </motion.section>
          )}

          {/* Step 2: Select Plan */}
          {step === "select" && usage && (
            <motion.section
              key="select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="py-8"
            >
              <div className="container mx-auto px-4 max-w-2xl space-y-6">
                {/* Current Usage Summary */}
                <Card className="border-white/5 bg-white/[0.03] backdrop-blur-2xl">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                          <TrendingUp className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-bold text-sm">Current Usage</p>
                          <p className="text-xs text-muted-foreground">
                            {formatData(usage.dataUsed, usage.dataUnit)} of{" "}
                            {formatData(usage.dataTotal, usage.dataUnit)} used
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          className={cn(
                            "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border",
                            usage.status === "active"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-red-500/10 text-red-400 border-red-500/20"
                          )}
                        >
                          {usage.status === "active" ? (
                            <Wifi className="h-3 w-3 mr-1" />
                          ) : (
                            <WifiOff className="h-3 w-3 mr-1" />
                          )}
                          {usage.remainingDays}d left
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Top-Up Plans */}
                <div>
                  <h2 className="text-xl font-black mb-4">Select a Top-Up Plan</h2>
                  {products.length > 0 ? (
                    <div className="grid gap-3">
                      {products.map((product) => (
                        <Card
                          key={product.id}
                          className={cn(
                            "border cursor-pointer transition-all hover:shadow-lg",
                            selectedProduct?.id === product.id
                              ? "border-primary bg-primary/5"
                              : "border-white/5 bg-white/[0.03] hover:border-white/10"
                          )}
                          onClick={() => setSelectedProduct(product)}
                        >
                          <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div
                                className={cn(
                                  "h-5 w-5 rounded-full border-2 flex items-center justify-center",
                                  selectedProduct?.id === product.id
                                    ? "border-primary"
                                    : "border-muted-foreground/30"
                                )}
                              >
                                {selectedProduct?.id === product.id && (
                                  <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-sm">{product.name}</p>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                  {product.dataAmount && (
                                    <span className="flex items-center gap-1">
                                      <Package className="h-3 w-3" />
                                      {product.dataAmount >= 1
                                        ? `${product.dataAmount} GB`
                                        : `${product.dataAmount * 1000} MB`}
                                    </span>
                                  )}
                                  {product.validityDays && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {product.validityDays}d
                                    </span>
                                  )}
                                  <span>{product.provider}</span>
                                </div>
                              </div>
                            </div>
                            <p className="text-lg font-black">
                              ${product.price.toFixed(2)}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="border-white/5 bg-white/[0.03]">
                      <CardContent className="p-8 text-center">
                        <p className="text-muted-foreground">
                          No compatible top-up plans found for this eSIM.
                        </p>
                        <Button variant="outline" className="mt-4 rounded-xl" asChild>
                          <Link href="/products">Browse All Plans</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Email + Checkout */}
                {selectedProduct && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="border-primary/20 bg-primary/5">
                      <CardContent className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold">{selectedProduct.name}</p>
                            <p className="text-sm text-muted-foreground">{selectedProduct.provider}</p>
                          </div>
                          <p className="text-2xl font-black">${selectedProduct.price.toFixed(2)}</p>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            Email Address
                          </label>
                          <Input
                            type="email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="rounded-xl h-12"
                          />
                        </div>

                        <Button
                          onClick={handleCheckout}
                          disabled={isCheckingOut || !email.trim()}
                          className="w-full rounded-xl h-12 font-black uppercase tracking-widest text-xs"
                        >
                          {isCheckingOut ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Zap className="h-4 w-4 mr-2 fill-current" />
                          )}
                          Proceed to Payment
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Back Button */}
                <div className="text-center">
                  <Button
                    variant="ghost"
                    onClick={() => { setStep("lookup"); setUsage(null); setProducts([]); setSelectedProduct(null); setError(null) }}
                    className="text-sm"
                  >
                    <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
                    Search again
                  </Button>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  )
}
