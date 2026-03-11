"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useQuery } from "@tanstack/react-query"
import {
  ShoppingCart,
  ArrowLeft,
  Wifi,
  Loader2,
  CreditCard,
  Shield,
  Check,
  AlertCircle,
  Tag,
  X,
} from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useCart, CartItem } from "@/contexts/cart-context"

// Types
interface AffiliateValidation {
  valid: boolean
  affiliateCode?: string
  affiliateName?: string
  discount?: number
}

// Validate affiliate code
async function validateAffiliateCode(code: string): Promise<AffiliateValidation> {
  try {
    const response = await fetch(`/api/affiliate/validate?code=${encodeURIComponent(code)}`)
    if (!response.ok) return { valid: false }
    return response.json()
  } catch {
    return { valid: false }
  }
}

function CartSummaryItem({ item }: { item: CartItem }) {
  const formatData = () => {
    if (item.dataAmount && item.dataUnit) {
      return `${item.dataAmount} ${item.dataUnit}`
    }
    return "Data Plan"
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex gap-3 py-3"
    >
      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Wifi className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.name}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{item.provider}</span>
          <span>•</span>
          <span>{formatData()}</span>
          <span>•</span>
          <span>Qty: {item.quantity}</span>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium">${(item.price * item.quantity).toFixed(2)}</p>
      </div>
    </motion.div>
  )
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, total, clearCart } = useCart()

  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [affiliateCode, setAffiliateCode] = useState("")
  const [affiliateValidation, setAffiliateValidation] = useState<AffiliateValidation | null>(null)
  const [validatingCode, setValidatingCode] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      router.push("/products")
    }
  }, [items.length, router])

  // Validate affiliate code
  const handleValidateCode = async () => {
    if (!affiliateCode.trim()) return

    setValidatingCode(true)
    const result = await validateAffiliateCode(affiliateCode.trim())
    setAffiliateValidation(result)
    setValidatingCode(false)
  }

  // Calculate discount
  const discountAmount = affiliateValidation?.valid && affiliateValidation.discount
    ? total * (affiliateValidation.discount / 100)
    : 0

  const finalTotal = total - discountAmount

  // Handle checkout - Create order and redirect to Stripe
  const handleCheckout = async () => {
    if (!email.trim()) {
      setError("Please enter your email address")
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address")
      return
    }

    setProcessing(true)
    setError(null)

    try {
      // 1. Create order via API
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          email: email.trim(),
          phone: phone.trim() || undefined,
          affiliateCode: affiliateValidation?.valid ? affiliateValidation.affiliateCode : undefined,
        }),
      })

      const orderData = await orderRes.json()

      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.message || "Failed to create order")
      }

      const orderId = orderData.data.order.id
      const orderNumber = orderData.data.order.orderNumber

      // Store order reference for success page
      sessionStorage.setItem("mobial_pending_order", JSON.stringify({ orderId, orderNumber, email: email.trim() }))

      // 2. Create Stripe checkout session
      const sessionRes = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      })

      const sessionData = await sessionRes.json()

      if (!sessionRes.ok || !sessionData.success) {
        throw new Error(sessionData.message || "Failed to create checkout session")
      }

      // 3. Redirect to Stripe checkout
      const stripeUrl = sessionData.data.url
      if (!stripeUrl) {
        throw new Error("No checkout URL received")
      }

      window.location.href = stripeUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
      setProcessing(false)
    }
  }

  if (items.length === 0) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="border-b bg-muted/20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Continue Shopping
            </Button>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h1 className="text-3xl font-bold mb-2">Checkout</h1>
              <p className="text-muted-foreground">
                Complete your purchase and get your eSIM delivered instantly
              </p>
            </motion.div>

            <div className="grid lg:grid-cols-5 gap-8">
              {/* Left Column - Form */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="lg:col-span-3 space-y-6"
              >
                {/* Customer Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Your eSIM QR code will be sent to this email
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number (optional)</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+1 234 567 8900"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Affiliate Code (Optional) */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Tag className="h-5 w-5" />
                      Promo Code <span className="text-sm font-normal text-muted-foreground">(Optional)</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter promo code (optional)"
                        value={affiliateCode}
                        onChange={(e) => {
                          setAffiliateCode(e.target.value)
                          setAffiliateValidation(null)
                        }}
                        disabled={affiliateValidation?.valid}
                      />
                      {affiliateValidation?.valid ? (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setAffiliateCode("")
                            setAffiliateValidation(null)
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={handleValidateCode}
                          disabled={validatingCode || !affiliateCode.trim()}
                        >
                          {validatingCode ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Apply"
                          )}
                        </Button>
                      )}
                    </div>
                    {affiliateValidation?.valid && (
                      <div className="mt-3 flex items-center gap-2 text-sm text-primary">
                        <Check className="h-4 w-4" />
                        <span>
                          Code applied! {affiliateValidation.discount}% discount
                        </span>
                      </div>
                    )}
                    {affiliateValidation && !affiliateValidation.valid && (
                      <p className="mt-3 text-sm text-muted-foreground">
                        Invalid promo code. Please check and try again.
                      </p>
                    )}
                    <p className="mt-2 text-xs text-muted-foreground">
                      Don't have a code? Continue without one.
                    </p>
                  </CardContent>
                </Card>

                {/* Payment Placeholder */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Payment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-8 border-2 border-dashed rounded-lg text-center text-muted-foreground">
                      <Shield className="h-12 w-12 mx-auto mb-3 text-primary" />
                      <p className="font-medium mb-1">Secure Checkout</p>
                      <p className="text-sm">
                        You'll be redirected to Stripe's secure checkout to complete your payment.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Error Alert */}
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Submit Button */}
                <Button
                  size="lg"
                  className="w-full gradient-accent text-accent-foreground"
                  onClick={handleCheckout}
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Complete Order - ${finalTotal.toFixed(2)}
                    </>
                  )}
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-2">
                  You will be securely redirected to Stripe to complete your payment.
                </p>

                {/* Trust Signals */}
                <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Shield className="h-4 w-4 text-primary" />
                    <span>Secure checkout</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Instant delivery</span>
                  </div>
                </div>
              </motion.div>

              {/* Right Column - Order Summary */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="lg:col-span-2"
              >
                <Card className="sticky top-24">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Order Summary
                      <Badge variant="secondary" className="ml-auto">
                        {items.length} {items.length === 1 ? "item" : "items"}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="divide-y">
                      <AnimatePresence mode="popLayout">
                        {items.map((item) => (
                          <CartSummaryItem key={item.productId} item={item} />
                        ))}
                      </AnimatePresence>
                    </div>

                    <Separator className="my-4" />

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>${total.toFixed(2)}</span>
                      </div>
                      {discountAmount > 0 && (
                        <div className="flex justify-between text-primary">
                          <span>Discount</span>
                          <span>-${discountAmount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tax</span>
                        <span>$0.00</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-semibold text-base">
                        <span>Total</span>
                        <span>${finalTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
