"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
  User,
  Building2,
  Globe,
  Wallet,
  FileText,
  Save,
  Loader2,
  Copy,
  Check,
  Shield,
  Bell,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useAffiliateAuth } from "@/hooks/use-affiliate-auth"
import { useToast } from "@/hooks/use-toast"

interface ProfileData {
  companyName?: string | null
  website?: string | null
  paymentMethod: string
  paymentDetails: string
  taxId?: string | null
}

interface FullProfile {
  id: string
  affiliateCode: string
  companyName?: string | null
  website?: string | null
  paymentMethod: string
  paymentDetails: string
  taxId?: string | null
  status: string
  commissionRate: number
  totalEarnings: number
  totalPaidOut: number
  createdAt: string
}

const paymentMethods = [
  { value: "bank", label: "Bank Transfer" },
  { value: "paypal", label: "PayPal" },
  { value: "wise", label: "Wise" },
  { value: "crypto", label: "Cryptocurrency (USDT)" },
]

const statusConfig: Record<string, { label: string; className: string }> = {
  PENDING: {
    label: "Pending Approval",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  },
  ACTIVE: {
    label: "Active",
    className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  SUSPENDED: {
    label: "Suspended",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export default function AffiliateSettingsPage() {
  const [profile, setProfile] = useState<FullProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [formData, setFormData] = useState<ProfileData>({
    companyName: "",
    website: "",
    paymentMethod: "",
    paymentDetails: "",
    taxId: "",
  })
  const { affiliate, user } = useAffiliateAuth()
  const { toast } = useToast()

  useEffect(() => {
    fetchProfile()
  }, [])

  async function fetchProfile() {
    setIsLoading(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const res = await fetch("/api/affiliate/profile", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const result = await res.json()
        if (result.success && result.data) {
          setProfile(result.data)
          setFormData({
            companyName: result.data.companyName || "",
            website: result.data.website || "",
            paymentMethod: result.data.paymentMethod || "",
            paymentDetails: result.data.paymentDetails || "",
            taxId: result.data.taxId || "",
          })
        }
      }
    } catch (error) {
      console.error("Fetch error:", error)
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSave() {
    setIsSaving(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const res = await fetch("/api/affiliate/profile", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to save")
      }

      const result = await res.json()
      if (result.success) {
        setProfile((prev) =>
          prev ? { ...prev, ...formData } : null
        )
        toast({
          title: "Saved",
          description: "Your profile has been updated",
        })
      }
    } catch (error) {
      console.error("Save error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save profile",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  async function copyAffiliateCode() {
    try {
      await navigator.clipboard.writeText(affiliate?.affiliateCode || "")
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast({
        title: "Failed to copy",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Profile not found</p>
      </div>
    )
  }

  const status = statusConfig[profile.status] || statusConfig.PENDING

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6 max-w-3xl"
    >
      {/* Header */}
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your affiliate account settings
        </p>
      </motion.div>

      {/* Account Status */}
      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Account Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Status</p>
                <p className="text-sm text-muted-foreground">
                  Your affiliate account status
                </p>
              </div>
              <Badge className={cn("font-medium", status.className)}>
                {status.label}
              </Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Your Affiliate Code</p>
                <p className="text-sm text-muted-foreground">
                  Share this code to earn commissions
                </p>
              </div>
              <div className="flex items-center gap-2">
                <code className="text-lg font-mono font-bold px-3 py-1 bg-muted rounded">
                  {profile.affiliateCode}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={copyAffiliateCode}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Commission Rate</p>
                <p className="text-sm text-muted-foreground">
                  Your current commission percentage
                </p>
              </div>
              <span className="text-2xl font-bold text-primary">
                {(profile.commissionRate * 100).toFixed(0)}%
              </span>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <p className="text-lg font-semibold">
                  ${profile.totalEarnings.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Paid Out</p>
                <p className="text-lg font-semibold">
                  ${profile.totalPaidOut.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Profile Information */}
      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Update your company and contact information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="companyName">
                  <Building2 className="h-4 w-4 inline mr-2" />
                  Company Name
                </Label>
                <Input
                  id="companyName"
                  placeholder="Your company name"
                  value={formData.companyName || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      companyName: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">
                  <Globe className="h-4 w-4 inline mr-2" />
                  Website
                </Label>
                <Input
                  id="website"
                  placeholder="https://yourwebsite.com"
                  value={formData.website || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      website: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxId">
                <FileText className="h-4 w-4 inline mr-2" />
                Tax ID / VAT Number
              </Label>
              <Input
                id="taxId"
                placeholder="For tax reporting purposes"
                value={formData.taxId || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    taxId: e.target.value,
                  }))
                }
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Payment Settings */}
      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Payment Settings
            </CardTitle>
            <CardDescription>
              Configure how you receive your commissions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    paymentMethod: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a payment method" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentDetails">Payment Details</Label>
              <Textarea
                id="paymentDetails"
                placeholder={
                  formData.paymentMethod === "paypal"
                    ? "Your PayPal email address"
                    : formData.paymentMethod === "bank"
                    ? "Bank name, Account number, Routing number, Account holder name"
                    : formData.paymentMethod === "crypto"
                    ? "Your USDT wallet address (TRC20 or ERC20)"
                    : "Enter your payment details"
                }
                value={formData.paymentDetails || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    paymentDetails: e.target.value,
                  }))
                }
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Notification Settings */}
      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Choose how you want to be notified
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Receive email when you get a new commission
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Payout Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Receive email when a payout is processed
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Weekly Summary</p>
                <p className="text-sm text-muted-foreground">
                  Get a weekly summary of your performance
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Save Button */}
      <motion.div variants={item} className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} className="gradient-accent">
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </motion.div>
    </motion.div>
  )
}
