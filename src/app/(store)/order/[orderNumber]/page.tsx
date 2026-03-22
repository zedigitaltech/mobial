"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { motion, AnimatePresence } from "framer-motion"
import {
  Wifi,
  Check,
  Copy,
  QrCode,
  Info,
  Smartphone,
  ShieldCheck,
  Zap,
  Loader2,
  Clock,
  ArrowLeft
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UsageTracker } from "@/components/store/usage-tracker"
import { toast } from "sonner"
import Link from "next/link"
import { useParams } from "next/navigation"

interface OrderData {
  id: string
  orderNumber: string
  status: string
  total: number
  createdAt: string
  esimQrCode?: string
  esimActivationCode?: string
  esimSmdpAddress?: string
  esimIccid?: string
  items: Array<{ productName: string }>
}

const ORDER_STEP_KEYS = ["PENDING", "PROCESSING", "COMPLETED"] as const

function OrderProgress({ status }: { status: string }) {
  const t = useTranslations("orderDetail")
  const stepLabels = [t("stepOrdered"), t("stepProcessing"), t("stepActive")]
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

export default function OrderSuccessPage() {
  const { orderNumber } = useParams()
  const t = useTranslations("orderDetail")
  const [order, setOrder] = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${orderNumber}`)
        if (res.ok) {
          const data = await res.json()
          const raw = data.data?.order || data.data
          setOrder({
            id: raw.id,
            orderNumber: raw.orderNumber,
            status: raw.status,
            total: raw.total,
            createdAt: raw.createdAt,
            esimQrCode: raw.esim?.qrCode || raw.esimQrCode,
            esimActivationCode: raw.esim?.activationCode || raw.esimActivationCode,
            esimSmdpAddress: raw.esim?.smdpAddress || raw.esimSmdpAddress,
            esimIccid: raw.items?.[0]?.esimIccid || raw.esimIccid,
            items: raw.items || [],
          })
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchOrder()
  }, [orderNumber])

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    toast.success(t("copiedToClipboard"))
    setTimeout(() => setCopied(null), 2000)
  }

  if (loading) return (
    <div className="flex-1 flex flex-col items-center justify-center space-y-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">{t("fetchingData")}</p>
    </div>
  )

  if (!order) return <div className="p-20 text-center">{t("orderNotFound")}</div>

  return (
      <div className="pb-20">
        <div className="container mx-auto px-4 max-w-4xl pt-12">
          <Link href="/orders" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" />
            {t("backToDashboard")}
          </Link>

          <div className="grid lg:grid-cols-5 gap-12">
            {/* Left: Status & Activation */}
            <div className="lg:col-span-3 space-y-8">
              <header className="space-y-4">
                <OrderProgress status={order.status} />

                <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-[1.1]">
                  {t("connectivityReady")} <br />{t("isReady")}
                </h1>
                <p className="text-muted-foreground font-medium max-w-md">
                  {t("followSteps", { productName: order.items[0]?.productName || "eSIM" })}
                </p>
              </header>

              {/* QR Hub */}
              <div className="glass-panel p-8 rounded-[3rem] relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                  <QrCode className="h-32 w-32" />
                </div>

                <Tabs defaultValue="scan" className="relative z-10">
                  <TabsList className="grid w-full grid-cols-2 bg-white/5 p-1 rounded-2xl mb-8">
                    <TabsTrigger value="scan" className="rounded-xl font-bold uppercase text-[10px] tracking-widest">{t("scanQr")}</TabsTrigger>
                    <TabsTrigger value="manual" className="rounded-xl font-bold uppercase text-[10px] tracking-widest">{t("manualEntry")}</TabsTrigger>
                  </TabsList>

                  <TabsContent value="scan" className="space-y-6">
                    <div className="flex flex-col items-center">
                      <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl shadow-black/50 mb-6">
                        {order.esimQrCode ? (
                          order.esimQrCode.startsWith('data:') ? (
                            <img
                              src={order.esimQrCode}
                              alt="eSIM QR"
                              className="w-48 h-48"
                            />
                          ) : (
                            <img
                              src={`/api/orders/${order.id}/qr?size=300`}
                              alt="eSIM QR"
                              className="w-48 h-48"
                            />
                          )
                        ) : (
                          <div className="w-48 h-48 flex items-center justify-center bg-muted animate-pulse rounded-2xl">
                            <Loader2 className="h-8 w-8 animate-spin" />
                          </div>
                        )}
                      </div>
                      <p className="text-center text-sm font-black uppercase tracking-widest mb-2">{t("scanThisCode")}</p>
                      <p className="text-center text-xs text-muted-foreground max-w-[240px]">
                        {t("scanInstructions")}
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="manual" className="space-y-4">
                    <div className="space-y-3">
                      <div className="p-5 rounded-[1.5rem] bg-white/5 border border-white/10 space-y-1">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t("smdpAddress")}</p>
                        <div className="flex items-center justify-between gap-4">
                          <code className="mono-data text-sm truncate">{order.esimSmdpAddress || t("provisioning")}</code>
                          <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => copy(order.esimSmdpAddress || '', 'smdp')}>
                            {copied === 'smdp' ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      <div className="p-5 rounded-[1.5rem] bg-white/5 border border-white/10 space-y-1">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t("activationCode")}</p>
                        <div className="flex items-center justify-between gap-4">
                          <code className="mono-data text-sm truncate">{order.esimActivationCode || t("provisioning")}</code>
                          <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => copy(order.esimActivationCode || '', 'auth')}>
                            {copied === 'auth' ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 flex gap-3">
                      <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <p className="text-xs font-medium leading-relaxed">
                        {t("manualEntryHint")}
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>

            {/* Right: Checklist & Info */}
            <div className="lg:col-span-2 space-y-8">
              {order.status === "COMPLETED" && order.id && (
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
                      <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-8 rounded-[2.5rem] bg-primary/5 border border-primary/10 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground">
                    <Zap className="h-5 w-5 fill-current" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">{t("liveSupport")}</p>
                    <p className="font-bold text-sm">{t("needAssistance")}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t("supportAvailable")}
                </p>
                <Button className="w-full rounded-xl font-black uppercase tracking-widest text-[10px] h-11">
                  {t("contactSupport")}
                </Button>
              </div>

              <div className="text-center pt-4">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">{t("assurance")}</p>
                <div className="flex justify-center gap-6">
                  <ShieldCheck className="h-6 w-6 text-muted-foreground/40" />
                  <Wifi className="h-6 w-6 text-muted-foreground/40" />
                  <Smartphone className="h-6 w-6 text-muted-foreground/40" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  )
}
