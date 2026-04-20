"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Check, ArrowLeft, Info, ShieldCheck, Wifi, Smartphone, Zap, Loader2, AlertCircle } from "lucide-react"
import { useTranslations } from "next-intl"
import { EsimCard } from "@/components/store/esim-card"
import { UsageTracker } from "@/components/store/usage-tracker"
import { Badge, orderStatusVariant } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getAccessToken, authHeaders } from "@/lib/auth-token"

interface OrderItem {
  productName: string
  unitPrice: number
  totalPrice: number
}

interface OrderData {
  id: string
  orderNumber: string
  status: string
  total: number
  currency: string
  createdAt: string
  items: OrderItem[]
  esim?: {
    qrCode: string
    activationCode?: string
    smdpAddress?: string
    status: string
  } | null
}

const ORDER_STEP_KEYS = ["PENDING", "PROCESSING", "COMPLETED"] as const

function OrderProgress({
  status,
  stepLabels,
}: {
  status: string
  stepLabels: string[]
}) {
  const currentIndex = ORDER_STEP_KEYS.findIndex((s) => s === status)
  const activeIndex = currentIndex >= 0 ? currentIndex : 0
  const isFailed = status === "FAILED" || status === "CANCELLED"

  return (
    <div className="flex items-center gap-2 mb-2">
      {ORDER_STEP_KEYS.map((step, i) => {
        const isActive = i <= activeIndex && !isFailed
        const isCurrent = i === activeIndex && !isFailed
        return (
          <div key={step} className="flex items-center gap-2 flex-1">
            <div className="flex items-center gap-2 flex-1">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  isCurrent
                    ? "bg-primary text-primary-foreground"
                    : isActive
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {isActive && i < activeIndex ? (
                  <Check className="h-4 w-4" />
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`text-xs font-bold ${
                  isCurrent ? "text-primary" : isActive ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {stepLabels[i]}
              </span>
            </div>
            {i < ORDER_STEP_KEYS.length - 1 && (
              <div
                className={`h-0.5 flex-1 rounded-full ${
                  i < activeIndex && !isFailed ? "bg-emerald-500/40" : "bg-muted"
                }`}
              />
            )}
          </div>
        )
      })}
      {isFailed && (
        <Badge variant="destructive" className="ml-2">
          {status}
        </Badge>
      )}
    </div>
  )
}

export default function OrderDetailPage() {
  const params = useParams()
  const orderNumber = params.orderNumber as string
  const router = useRouter()
  const t = useTranslations("orderDetail")

  const [order, setOrder] = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchOrder() {
      try {
        const token = getAccessToken()

        if (!token) {
          // No access token — redirect to login with callback
          router.replace(`/login?callbackUrl=/order/${encodeURIComponent(orderNumber)}`)
          return
        }

        const res = await fetch(`/api/orders/${encodeURIComponent(orderNumber)}`, {
          headers: authHeaders(),
        })

        if (res.status === 401 || res.status === 403) {
          // Not authenticated or not the owner — redirect to login
          router.replace(`/login?callbackUrl=/order/${encodeURIComponent(orderNumber)}`)
          return
        }

        if (res.status === 404) {
          setError("Order not found")
          return
        }

        if (!res.ok) {
          setError("Failed to load order details")
          return
        }

        const data = await res.json()
        if (!data.success || !data.data?.order) {
          setError(data.error || "Failed to load order details")
          return
        }

        setOrder(data.data.order)
      } catch {
        setError("Something went wrong. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderNumber, router])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 max-w-4xl pt-12">
        <div className="flex flex-col items-center gap-4 py-16">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <p className="text-lg font-semibold">{error || "Order not found"}</p>
          <Button asChild variant="outline">
            <Link href="/orders">Back to orders</Link>
          </Button>
        </div>
      </div>
    )
  }

  const lpaString = order.esim?.qrCode ?? null
  const activationCode = order.esim?.activationCode ?? null
  const smdpAddress = order.esim?.smdpAddress ?? null

  const stepLabels = [t("stepOrdered"), t("stepProcessing"), t("stepActive")]

  return (
    <div className="pb-20">
      <div className="container mx-auto px-4 max-w-4xl pt-12">
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("backToDashboard")}
          </Link>
          <span className="font-mono text-sm text-muted-foreground">{order.orderNumber}</span>
          <Badge variant={orderStatusVariant(order.status)}>{order.status}</Badge>
        </div>

        <div className="grid lg:grid-cols-5 gap-12">
          {/* Left: Status & Activation */}
          <div className="lg:col-span-3 space-y-8">
            <header className="space-y-4">
              <OrderProgress status={order.status} stepLabels={stepLabels} />
              <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-[1.1]">
                {t("connectivityReady")} <br />
                {t("isReady")}
              </h1>
              <p className="text-muted-foreground font-medium max-w-md">
                {t("followSteps", { productName: order.items[0]?.productName ?? "eSIM" })}
              </p>
            </header>

            {/* eSIM Card with QR + activation guide */}
            <EsimCard
              orderNumber={order.orderNumber}
              status={order.status}
              lpaString={lpaString}
              activationCode={activationCode}
              smdpAddress={smdpAddress}
              productName={order.items[0]?.productName}
            />
          </div>

          {/* Right: Usage + Checklist + Info */}
          <div className="lg:col-span-2 space-y-8">
            {order.status === "COMPLETED" && (
              <UsageTracker
                orderId={order.id}
                orderNumber={order.orderNumber}
              />
            )}

            <div className="space-y-6">
              <h3 className="text-xl font-black tracking-tight">{t("installationChecklist")}</h3>
              <div className="space-y-4">
                {[
                  t("checkWifi"),
                  t("carrierUnlocked"),
                  t("dataRoaming"),
                  t("primaryLine"),
                ].map((text, i) => (
                  <div key={i} className="flex gap-4 group">
                    <div className="h-6 w-6 rounded-full border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                      <Check className="h-3.5 w-3.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                      {text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Order metadata */}
            <div className="p-5 rounded-2xl border border-border bg-card space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dateLabel") ?? "Date"}</span>
                <span>{new Date(order.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("totalPaid") ?? "Amount paid"}</span>
                <span className="font-medium">
                  ${order.total.toFixed(2)} {order.currency}
                </span>
              </div>
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-muted-foreground">{t("dataPlan") ?? "Plan"}</span>
                  <span className="text-right max-w-[60%] truncate">{item.productName}</span>
                </div>
              ))}
            </div>

            <div className="p-8 rounded-[2.5rem] bg-primary/5 border border-primary/10 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground">
                  <Zap className="h-5 w-5 fill-current" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">
                    {t("liveSupport")}
                  </p>
                  <p className="font-bold text-sm">{t("needAssistance")}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t("supportAvailable")}
              </p>
              <Button className="w-full rounded-xl font-black uppercase tracking-widest text-[10px] h-11" asChild>
                <Link href="/contact">{t("contactSupport")}</Link>
              </Button>
            </div>

            <div className="text-center pt-4">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">
                {t("assurance")}
              </p>
              <div className="flex justify-center gap-6">
                <ShieldCheck className="h-6 w-6 text-muted-foreground/40" />
                <Wifi className="h-6 w-6 text-muted-foreground/40" />
                <Smartphone className="h-6 w-6 text-muted-foreground/40" />
              </div>
            </div>
          </div>
        </div>

        {/* Manual entry hint for activated eSIM */}
        {order.status === "COMPLETED" && (activationCode || smdpAddress) && (
          <div className="mt-8 p-4 rounded-2xl bg-primary/10 border border-primary/20 flex gap-3 max-w-2xl">
            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <p className="text-xs font-medium leading-relaxed text-muted-foreground">
              {t("manualEntryHint")}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
