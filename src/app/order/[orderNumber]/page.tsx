"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useQuery } from "@tanstack/react-query"
import {
  CheckCircle2,
  Copy,
  Download,
  Mail,
  Clock,
  Wifi,
  MapPin,
  Loader2,
  AlertCircle,
  Check,
  ExternalLink,
} from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "sonner"

// Types
interface OrderItem {
  id: string
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
  esimQrCode?: string | null
  esimIccid?: string | null
  product?: {
    id: string
    name: string
    provider: string
    dataAmount: number | null
    dataUnit: string | null
    validityDays: number | null
    countries: string | null
  }
}

interface Order {
  id: string
  orderNumber: string
  status: string
  email: string
  phone?: string | null
  subtotal: number
  discount: number
  tax: number
  total: number
  createdAt: string
  completedAt?: string | null
  esimQrCode?: string | null
  esimActivationCode?: string | null
  items: OrderItem[]
}

// Fetch order by order number
async function fetchOrder(orderNumber: string): Promise<Order> {
  const response = await fetch(`/api/orders/${orderNumber}`)
  if (!response.ok) throw new Error("Order not found")
  return response.json()
}

// Status colors
const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  PROCESSING: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  COMPLETED: "bg-green-500/10 text-green-700 dark:text-green-400",
  CANCELLED: "bg-red-500/10 text-red-700 dark:text-red-400",
  FAILED: "bg-red-500/10 text-red-700 dark:text-red-400",
}

// Timeline steps
const timelineSteps = [
  { status: "PENDING", label: "Order Placed", description: "Your order has been received" },
  { status: "PROCESSING", label: "Processing", description: "Preparing your eSIM" },
  { status: "COMPLETED", label: "Completed", description: "Your eSIM is ready" },
]

export default function OrderConfirmationPage() {
  const params = useParams()
  const router = useRouter()
  const orderNumber = params.orderNumber as string

  const [copied, setCopied] = useState<string | null>(null)

  // Fetch order
  const { data: order, isLoading, error } = useQuery({
    queryKey: ["order", orderNumber],
    queryFn: () => fetchOrder(orderNumber),
  })

  // Copy to clipboard
  const handleCopy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(label)
    toast.success(`${label} copied to clipboard`)
    setTimeout(() => setCopied(null), 2000)
  }

  // Generate QR code image URL
  const getQRCodeUrl = (qrString: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrString)}`
  }

  // Get current timeline step
  const getCurrentStepIndex = () => {
    const statuses = ["PENDING", "PROCESSING", "COMPLETED"]
    const index = statuses.indexOf(order?.status || "PENDING")
    return index >= 0 ? index : 0
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Order Not Found</h1>
            <p className="text-muted-foreground mb-4">
              We couldn&apos;t find the order you&apos;re looking for.
            </p>
            <Button onClick={() => router.push("/products")}>
              Browse Products
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const currentStepIndex = getCurrentStepIndex()

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-3xl mx-auto">
            {/* Success Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-8"
            >
              <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold mb-2">
                {order.status === "COMPLETED" ? "Order Confirmed!" : "Order Received"}
              </h1>
              <p className="text-muted-foreground">
                Thank you for your purchase. Your order number is:
              </p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="text-2xl font-mono font-bold">{order.orderNumber}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleCopy(order.orderNumber, "Order number")}
                >
                  {copied === "Order number" ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </motion.div>

            {/* Email Alert */}
            <Alert className="mb-8">
              <Mail className="h-4 w-4" />
              <AlertTitle>Confirmation Email Sent</AlertTitle>
              <AlertDescription>
                We&apos;ve sent a confirmation email to <strong>{order.email}</strong> with your eSIM details.
              </AlertDescription>
            </Alert>

            {/* Order Status Timeline */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-lg">Order Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <Badge className={statusColors[order.status] || ""}>
                    {order.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(order.createdAt)}
                  </span>
                </div>

                {/* Timeline */}
                <div className="relative mt-6">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-muted" />
                  <div className="space-y-6">
                    {timelineSteps.map((step, index) => {
                      const isCompleted = index <= currentStepIndex
                      const isCurrent = index === currentStepIndex

                      return (
                        <div key={step.status} className="relative flex gap-4">
                          <div
                            className={`h-8 w-8 rounded-full flex items-center justify-center z-10 ${
                              isCompleted
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {isCompleted ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <div className="h-2 w-2 rounded-full bg-current" />
                            )}
                          </div>
                          <div className="flex-1 pt-1">
                            <p className={`font-medium ${isCurrent ? "text-primary" : ""}`}>
                              {step.label}
                            </p>
                            <p className="text-sm text-muted-foreground">{step.description}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* eSIM Details */}
            {order.status === "COMPLETED" && (order.esimQrCode || order.items.some(i => i.esimQrCode)) && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Wifi className="h-5 w-5 text-primary" />
                    Your eSIM
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {order.items.map((item, index) => (
                    <div key={item.id} className="space-y-4">
                      {index > 0 && <Separator />}
                      <div>
                        <h4 className="font-medium mb-2">{item.productName}</h4>

                        {/* QR Code */}
                        {(item.esimQrCode || order.esimQrCode) && (
                          <div className="flex flex-col items-center p-4 bg-muted/20 rounded-lg">
                            <img
                              src={getQRCodeUrl(item.esimQrCode || order.esimQrCode || "")}
                              alt="eSIM QR Code"
                              className="w-48 h-48 mb-4"
                            />
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const link = document.createElement("a")
                                  link.href = getQRCodeUrl(item.esimQrCode || order.esimQrCode || "")
                                  link.download = `esim-qr-${order.orderNumber}.png`
                                  link.click()
                                }}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download QR
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCopy(item.esimQrCode || order.esimQrCode || "", "Activation code")}
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Copy Code
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* ICCID */}
                        {item.esimIccid && (
                          <div className="mt-4 p-3 bg-muted/20 rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">ICCID</p>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm">{item.esimIccid}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleCopy(item.esimIccid!, "ICCID")}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Activation Instructions */}
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Activation Instructions</h4>
                    <ol className="text-sm text-muted-foreground space-y-2">
                      <li>1. Go to Settings → Cellular → Add eSIM</li>
                      <li>2. Scan the QR code above or enter the activation code manually</li>
                      <li>3. Your eSIM will be activated automatically</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Order Details */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-lg">Order Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Wifi className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.product?.provider} • Qty: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${item.totalPrice.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${order.subtotal.toFixed(2)}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-primary">
                      <span>Discount</span>
                      <span>-${order.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span>${order.tax.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>${order.total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => router.push("/products")}
              >
                Continue Shopping
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => router.push("/orders")}
              >
                View All Orders
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
