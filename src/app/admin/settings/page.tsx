"use client"

import { getAccessToken } from "@/lib/auth-token"
import { useEffect, useState, useCallback } from "react"
import {
  Globe,
  Save,
  Loader2,
  RefreshCw,
  DollarSign,
  Wifi,
  CreditCard,
  Mail,
  Send,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

function maskValue(value: string | undefined, visibleChars = 4): string {
  if (!value) return "Not set"
  if (value.length <= visibleChars) return value
  return "*".repeat(value.length - visibleChars) + value.slice(-visibleChars)
}

function StatusDot({ status }: { status: "healthy" | "down" | "loading" | "not_configured" }) {
  if (status === "loading") {
    return <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
  }
  const colors = {
    healthy: "bg-green-500",
    down: "bg-red-500",
    not_configured: "bg-yellow-500",
  }
  return (
    <span className={`inline-block h-2.5 w-2.5 rounded-full ${colors[status]}`} />
  )
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    healthy: { label: "Connected", className: "bg-green-500/10 text-green-600 border-green-500/20" },
    down: { label: "Disconnected", className: "bg-red-500/10 text-red-600 border-red-500/20" },
    not_configured: { label: "Not Configured", className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
    loading: { label: "Checking...", className: "bg-muted text-muted-foreground" },
  }
  const c = config[status] || config.loading
  return <Badge variant="outline" className={c.className}>{c.label}</Badge>
}

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [sendingTestEmail, setSendingTestEmail] = useState(false)

  const [generalSettings, setGeneralSettings] = useState({
    storeName: "MobiaL",
    supportEmail: "support@mobialo.eu",
  })

  const [pricingSettings, setPricingSettings] = useState({
    markupRate: "15",
    currency: "USD",
    taxRate: "0",
  })

  const [mobimatterStatus, setMobimatterStatus] = useState<"healthy" | "down" | "loading">("loading")
  const [walletBalance, setWalletBalance] = useState<{ balance: number; currency: string } | null>(null)
  const [walletLoading, setWalletLoading] = useState(false)
  const [lastSync, setLastSync] = useState<string | null>(null)

  const [stripeStatus, setStripeStatus] = useState<"healthy" | "not_configured" | "loading">("loading")
  const [resendStatus, setResendStatus] = useState<"healthy" | "not_configured" | "loading">("loading")


  const getToken = () => getAccessToken()

  const fetchSettings = useCallback(async () => {
    try {
      const token = getToken()
      const res = await fetch("/api/admin/settings", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return

      const data = await res.json()
      const settings = data.data || {}

      setGeneralSettings({
        storeName: settings["setting:store_name"] || "MobiaL",
        supportEmail: settings["setting:support_email"] || "support@mobialo.eu",
      })
      setPricingSettings({
        markupRate: settings["setting:markup_rate"] || "15",
        currency: settings["setting:currency"] || "USD",
        taxRate: settings["setting:tax_rate"] || "0",
      })
      if (settings["last_product_sync"]) {
        setLastSync(settings["last_product_sync"])
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error)
    }
  }, [])

  const fetchHealthData = useCallback(async () => {
    try {
      const token = getToken()
      const res = await fetch("/api/admin/health", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return

      const data = await res.json()
      const health = data.data || {}

      const checks = health.checks || {}
      setMobimatterStatus(checks.mobimatter?.status === "healthy" ? "healthy" : "down")
      setStripeStatus(checks.stripe?.status === "healthy" ? "healthy" : "not_configured")
      setResendStatus(checks.resend?.status === "healthy" ? "healthy" : "not_configured")

      if (health.lastProductSync) {
        setLastSync(health.lastProductSync)
      }
    } catch (error) {
      console.error("Failed to fetch health data:", error)
      setMobimatterStatus("down")
      setStripeStatus("not_configured")
      setResendStatus("not_configured")
    }
  }, [])

  const fetchWalletBalance = useCallback(async () => {
    setWalletLoading(true)
    try {
      const token = getToken()
      const res = await fetch("/api/admin/wallet", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setWalletBalance(data.data)
    } catch {
      setWalletBalance(null)
    } finally {
      setWalletLoading(false)
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await Promise.all([fetchSettings(), fetchHealthData(), fetchWalletBalance()])
      setLoading(false)
    }
    init()
  }, [fetchSettings, fetchHealthData, fetchWalletBalance])

  const saveGeneralSettings = async () => {
    setSaving("general")
    try {
      const token = getToken()
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          "setting:store_name": generalSettings.storeName,
          "setting:support_email": generalSettings.supportEmail,
        }),
      })
      if (!res.ok) throw new Error("Failed to save")
      toast.success("General settings saved")
    } catch {
      toast.error("Failed to save general settings")
    } finally {
      setSaving(null)
    }
  }

  const savePricingSettings = async () => {
    setSaving("pricing")
    try {
      const token = getToken()
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          "setting:markup_rate": pricingSettings.markupRate,
          "setting:currency": pricingSettings.currency,
          "setting:tax_rate": pricingSettings.taxRate,
        }),
      })
      if (!res.ok) throw new Error("Failed to save")
      toast.success("Pricing settings saved")
    } catch {
      toast.error("Failed to save pricing settings")
    } finally {
      setSaving(null)
    }
  }

  const handleSyncProducts = async () => {
    setSyncing(true)
    try {
      const token = getToken()
      const res = await fetch("/api/products/sync", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to sync products")
      }
      const data = await res.json()
      const stats = data.data?.stats || data.data || {}
      toast.success(`Synced ${stats.created || 0} new, updated ${stats.updated || 0} products`)
      setLastSync(new Date().toISOString())
      await fetchWalletBalance()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to sync products")
    } finally {
      setSyncing(false)
    }
  }

  const handleSendTestEmail = async () => {
    setSendingTestEmail(true)
    try {
      toast.success("Test email functionality is available when Resend is configured")
    } finally {
      setSendingTestEmail(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    )
  }

  const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
  const merchantId = process.env.NEXT_PUBLIC_MOBIMATTER_MERCHANT_ID || ""
  const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure your eSIM platform settings and integrations
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              General Settings
            </CardTitle>
            <CardDescription>Basic store configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="storeName">Store Name</Label>
              <Input
                id="storeName"
                value={generalSettings.storeName}
                onChange={(e) => setGeneralSettings({ ...generalSettings, storeName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supportEmail">Support Email</Label>
              <Input
                id="supportEmail"
                type="email"
                value={generalSettings.supportEmail}
                onChange={(e) => setGeneralSettings({ ...generalSettings, supportEmail: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Base URL</Label>
              <Input value={baseUrl} disabled className="text-muted-foreground" />
            </div>
            <Button onClick={saveGeneralSettings} disabled={saving === "general"} className="w-full">
              {saving === "general" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save General Settings
            </Button>
          </CardContent>
        </Card>

        {/* Pricing Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Pricing Settings
            </CardTitle>
            <CardDescription>Configure pricing and markup</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="markupRate">Price Markup (%)</Label>
              <Input
                id="markupRate"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={pricingSettings.markupRate}
                onChange={(e) => setPricingSettings({ ...pricingSettings, markupRate: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Percentage added on top of MobiMatter wholesale price
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Default Currency</Label>
              <Input
                id="currency"
                value={pricingSettings.currency}
                onChange={(e) => setPricingSettings({ ...pricingSettings, currency: e.target.value.toUpperCase() })}
                maxLength={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxRate">Tax Rate (%)</Label>
              <Input
                id="taxRate"
                type="number"
                min="0"
                max="50"
                step="0.01"
                value={pricingSettings.taxRate}
                onChange={(e) => setPricingSettings({ ...pricingSettings, taxRate: e.target.value })}
              />
            </div>
            <Button onClick={savePricingSettings} disabled={saving === "pricing"} className="w-full">
              {saving === "pricing" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Pricing Settings
            </Button>
          </CardContent>
        </Card>

        {/* MobiMatter Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5" />
              MobiMatter Integration
            </CardTitle>
            <CardDescription>eSIM provider API configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StatusDot status={mobimatterStatus} />
                <span className="text-sm font-medium">Connection Status</span>
              </div>
              <StatusBadge status={mobimatterStatus} />
            </div>

            <Separator />

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Merchant ID</span>
                <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                  {maskValue(merchantId)}
                </code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">API Key</span>
                <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                  {maskValue("configured", 4)}
                </code>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Wallet Balance</span>
              {walletLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : walletBalance ? (
                <span className="text-lg font-bold text-green-600">
                  ${walletBalance.balance.toFixed(2)} {walletBalance.currency}
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">Unable to fetch</span>
              )}
            </div>

            <Separator />

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Last Sync</span>
              <span>
                {lastSync
                  ? new Date(lastSync).toLocaleString()
                  : "Never"}
              </span>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleSyncProducts}
              disabled={syncing}
            >
              {syncing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Sync Products
            </Button>
          </CardContent>
        </Card>

        {/* Stripe Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Stripe Integration
            </CardTitle>
            <CardDescription>Payment processing configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StatusDot status={stripeStatus} />
                <span className="text-sm font-medium">Connection Status</span>
              </div>
              <StatusBadge status={stripeStatus} />
            </div>

            <Separator />

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Publishable Key</span>
                <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                  {maskValue(stripePublishableKey)}
                </code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Webhook Secret</span>
                <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                  {stripeStatus === "healthy" ? maskValue("configured", 4) : "Not set"}
                </code>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Mode</span>
              <Badge variant="outline" className={
                stripePublishableKey.startsWith("pk_test_")
                  ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                  : "bg-green-500/10 text-green-600 border-green-500/20"
              }>
                {stripePublishableKey.startsWith("pk_test_") ? "Test Mode" : stripePublishableKey ? "Live Mode" : "Not Configured"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Email Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Settings
            </CardTitle>
            <CardDescription>Email provider configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StatusDot status={resendStatus} />
                <span className="text-sm font-medium">Resend Status</span>
              </div>
              <StatusBadge status={resendStatus} />
            </div>

            <Separator />

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Provider</span>
                <span className="font-medium">Resend</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">API Key</span>
                <Badge variant="outline" className={
                  resendStatus === "healthy"
                    ? "bg-green-500/10 text-green-600 border-green-500/20"
                    : "bg-red-500/10 text-red-600 border-red-500/20"
                }>
                  {resendStatus === "healthy" ? "Set" : "Not Set"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">From Address</span>
                <span className="font-mono text-xs">noreply@mobialo.eu</span>
              </div>
            </div>

            <Separator />

            <Button
              variant="outline"
              className="w-full"
              onClick={handleSendTestEmail}
              disabled={sendingTestEmail || resendStatus !== "healthy"}
            >
              {sendingTestEmail ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Send Test Email
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
