"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { motion } from "framer-motion"
import {
  CheckCircle,
  Loader2,
  AlertCircle,
  Wifi,
  QrCode,
  Clock,
  ArrowRight,
  Mail,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useCart } from "@/contexts/cart-context"
import { useCurrency } from "@/contexts/currency-context"
import Link from "next/link"
import { usePostHog } from "posthog-js/react"

interface OrderData {
  id: string
  orderNumber: string
  status: string
  paymentStatus: string
  total: number
  currency: string
  email: string
  createdAt: string
  items: Array<{
    productName: string
    quantity: number
    unitPrice: number
    totalPrice: number
    product?: {
      name: string
      provider: string
      dataAmount: number
      dataUnit: string
    } | null
  }>
  esim?: {
    qrCode: string
    activationCode: string
    smdpAddress: string
    status: string
  } | null
}

const PROCESSING_TIMEOUT_MS = 30_000

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")
  const t = useTranslations("checkoutSuccess")
  const tCommon = useTranslations("common")
  const { clearCart } = useCart()
  const { formatPrice } = useCurrency()
  const posthog = usePostHog()

  const [order, setOrder] = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timedOut, setTimedOut] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    clearCart()
  }, [clearCart])

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const pendingRaw = sessionStorage.getItem("mobial_pending_order")
        if (!pendingRaw && !sessionId) {
          throw new Error("No order reference found")
        }

        let orderIdentifier: string | null = null
        let orderEmail: string | null = null

        if (pendingRaw) {
          const pending = JSON.parse(pendingRaw) as { orderId: string; orderNumber: string; email?: string }
          orderIdentifier = pending.orderNumber
          orderEmail = pending.email || null
          sessionStorage.removeItem("mobial_pending_order")
        }

        if (!orderIdentifier) {
          throw new Error("Unable to locate your order. Please check your email for confirmation details.")
        }

        const emailParam = orderEmail ? `?email=${encodeURIComponent(orderEmail)}` : ""
        const orderRes = await fetch(`/api/orders/${orderIdentifier}${emailParam}`)
        const orderData = await orderRes.json()

        if (!orderRes.ok || !orderData.success) {
          throw new Error(orderData.message || "Failed to load order details")
        }

        const fetchedOrder = orderData.data.order
        setOrder(fetchedOrder)
        if (fetchedOrder.status === "COMPLETED") {
          posthog?.capture("order_completed", {
            order_number: fetchedOrder.orderNumber,
            total: fetchedOrder.total,
            currency: fetchedOrder.currency,
            items_count: fetchedOrder.items.length,
          })
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong")
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [sessionId])

  // Timeout for processing state — show fallback message after 30s
  useEffect(() => {
    const isProcessing = order && (order.status === "PROCESSING" || order.status === "PENDING")
    if (isProcessing && !timedOut) {
      timeoutRef.current = setTimeout(() => setTimedOut(true), PROCESSING_TIMEOUT_MS)
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [order, timedOut])

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">
          {t("confirmingPayment")}
        </p>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          <Card>
            <CardContent className="pt-8 text-center space-y-4">
              <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
              <h2 className="text-xl font-bold">{t("unableToLoad")}</h2>
              <p className="text-muted-foreground">
                {error || t("orderNotFoundError")}
              </p>
              <div className="flex gap-4 justify-center pt-4">
                <Link href="/products">
                  <Button variant="outline">{t("continueShopping")}</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  const isProcessing = order.status === "PROCESSING" || order.status === "PENDING"
  const isCompleted = order.status === "COMPLETED"

  return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-10"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="mx-auto mb-6 h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20"
              >
                <CheckCircle className="h-10 w-10 text-emerald-500" />
              </motion.div>
              <h1 className="text-3xl font-bold mb-2">{t("paymentSuccessful")}</h1>
              <p className="text-muted-foreground">
                {t("orderConfirmed", { orderNumber: order.orderNumber })}
              </p>
            </motion.div>

            <div className="grid lg:grid-cols-5 gap-8">
              {/* Left Column - Status */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="lg:col-span-3 space-y-6"
              >
                {/* eSIM Status Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Wifi className="h-5 w-5" />
                      {t("esimStatus")}
                      <Badge
                        variant={isCompleted ? "default" : "secondary"}
                        className="ml-auto"
                      >
                        {order.status}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isProcessing && !timedOut && (
                      <div className="text-center py-8 space-y-4">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                          <Clock className="h-12 w-12 mx-auto text-primary" />
                        </motion.div>
                        <div>
                          <p className="font-medium mb-1">{t("esimPreparing")}</p>
                          <p className="text-sm text-muted-foreground">
                            {t("esimPreparingDesc", { email: order.email })}
                          </p>
                        </div>
                      </div>
                    )}

                    {isProcessing && timedOut && (
                      <div className="text-center py-8 space-y-4">
                        <Mail className="h-12 w-12 mx-auto text-primary" />
                        <div>
                          <p className="font-medium mb-1">{t("esimPreparing")}</p>
                          <p className="text-sm text-muted-foreground">
                            {t("esimTimeout", { email: order.email })}
                          </p>
                        </div>
                        <a href="mailto:support@mobialo.eu">
                          <Button variant="outline" size="sm">
                            <Mail className="h-4 w-4 mr-2" />
                            {t("contactSupport")}
                          </Button>
                        </a>
                      </div>
                    )}

                    {isCompleted && order.esim && (
                      <div className="space-y-6">
                        <div className="flex flex-col items-center">
                          <div className="bg-white p-6 rounded-2xl shadow-lg mb-4">
                            {order.esim.qrCode ? (
                              <img
                                src={`/api/orders/${order.id}/qr?size=300`}
                                alt="eSIM QR Code"
                                className="w-48 h-48"
                              />
                            ) : (
                              <div className="w-48 h-48 flex items-center justify-center bg-muted rounded-lg">
                                <QrCode className="h-12 w-12 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <p className="font-medium text-sm">{t("scanQrCode")}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {t("scanInstructions")}
                          </p>
                        </div>

                        {order.esim.activationCode && (
                          <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              {t("activationCodeLabel")}
                            </p>
                            <code className="text-sm break-all">{order.esim.activationCode}</code>
                          </div>
                        )}
                      </div>
                    )}

                    {isCompleted && !order.esim && (
                      <div className="text-center py-8 space-y-2">
                        <CheckCircle className="h-12 w-12 mx-auto text-emerald-500" />
                        <p className="font-medium">{t("orderComplete")}</p>
                        <p className="text-sm text-muted-foreground">
                          {t("checkEmail")}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href={`/order/${order.orderNumber}`} className="flex-1">
                    <Button className="w-full gradient-accent text-accent-foreground" size="lg">
                      {t("viewOrderDetails")}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                  <Link href="/products" className="flex-1">
                    <Button variant="outline" className="w-full" size="lg">
                      {t("continueShopping")}
                    </Button>
                  </Link>
                </div>
              </motion.div>

              {/* Right Column - Order Summary */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="lg:col-span-2"
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t("orderSummary")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Wifi className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.productName}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.product?.provider && `${item.product.provider} - `}
                              {item.product?.dataAmount && item.product?.dataUnit
                                ? `${item.product.dataAmount} ${item.product.dataUnit}`
                                : t("dataPlan")}
                              {item.quantity > 1 && ` x${item.quantity}`}
                            </p>
                          </div>
                          <p className="text-sm font-medium">{formatPrice(item.totalPrice)}</p>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-3">
                      <div className="flex justify-between font-semibold">
                        <span>{t("totalPaid")}</span>
                        <span>{formatPrice(order.total)}</span>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground space-y-1 pt-2">
                      <p>{t("orderLabel")}: {order.orderNumber}</p>
                      <p>{t("emailLabel")}: {order.email}</p>
                      <p>{t("dateLabel")}: {new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
  )
}
