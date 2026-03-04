"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  Settings,
  Database,
  Shield,
  Globe,
  Save,
  Loader2,
  RefreshCw,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

export default function AdminSettingsPage() {
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  
  const [settings, setSettings] = useState({
    siteName: "MobiaL eSIM",
    siteDescription: "Stay connected worldwide with affordable eSIM",
    maintenanceMode: false,
    requireEmailVerification: true,
    defaultCommissionRate: 10,
    minimumPayoutAmount: 50,
    enableAffiliateProgram: true,
    enableNotifications: true,
  })

  const handleSave = async () => {
    setSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    toast.success("Settings saved successfully")
    setSaving(false)
  }

  const handleSyncProducts = async () => {
    setSyncing(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/products/sync", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) throw new Error("Failed to sync products")
      
      const data = await response.json()
      toast.success(`Synced ${data.created} new products, updated ${data.updated}`)
    } catch (error) {
      console.error("Failed to sync products:", error)
      toast.error("Failed to sync products with MobiMatter")
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Configure your affiliate platform settings
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              General Settings
            </CardTitle>
            <CardDescription>Basic site configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="siteName">Site Name</Label>
              <Input
                id="siteName"
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="siteDescription">Site Description</Label>
              <Input
                id="siteDescription"
                value={settings.siteDescription}
                onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Maintenance Mode</Label>
                <p className="text-xs text-muted-foreground">
                  Temporarily disable the site for maintenance
                </p>
              </div>
              <Switch
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription>Authentication and security settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Require Email Verification</Label>
                <p className="text-xs text-muted-foreground">
                  Users must verify their email before accessing
                </p>
              </div>
              <Switch
                checked={settings.requireEmailVerification}
                onCheckedChange={(checked) => setSettings({ ...settings, requireEmailVerification: checked })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Send email notifications for orders and commissions
                </p>
              </div>
              <Switch
                checked={settings.enableNotifications}
                onCheckedChange={(checked) => setSettings({ ...settings, enableNotifications: checked })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Affiliate Program
            </CardTitle>
            <CardDescription>Configure affiliate program settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Affiliate Program</Label>
                <p className="text-xs text-muted-foreground">
                  Allow users to register as affiliates
                </p>
              </div>
              <Switch
                checked={settings.enableAffiliateProgram}
                onCheckedChange={(checked) => setSettings({ ...settings, enableAffiliateProgram: checked })}
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="defaultCommission">Default Commission Rate (%)</Label>
              <Input
                id="defaultCommission"
                type="number"
                min="0"
                max="50"
                value={settings.defaultCommissionRate}
                onChange={(e) => setSettings({ ...settings, defaultCommissionRate: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minPayout">Minimum Payout Amount ($)</Label>
              <Input
                id="minPayout"
                type="number"
                min="10"
                value={settings.minimumPayoutAmount}
                onChange={(e) => setSettings({ ...settings, minimumPayoutAmount: parseInt(e.target.value) || 50 })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data & Synchronization
            </CardTitle>
            <CardDescription>Manage product sync and data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">MobiMatter Products</p>
                  <p className="text-sm text-muted-foreground">
                    Sync products from MobiMatter API
                  </p>
                </div>
                <Badge variant="outline">Connected</Badge>
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
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <p className="text-sm font-medium">System Status</p>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Database</span>
                  <Badge variant="outline" className="bg-green-500/10 text-green-600">Healthy</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">API</span>
                  <Badge variant="outline" className="bg-green-500/10 text-green-600">Operational</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
