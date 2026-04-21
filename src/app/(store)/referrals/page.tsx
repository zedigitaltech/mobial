"use client"

import { getAccessToken } from "@/lib/auth-token"
import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { motion } from "framer-motion"
import {
  Copy,
  Check,
  Gift,
  Users,
  DollarSign,
  Share2,
  Mail,
  MessageCircle,
  Loader2,
  ArrowRight,
  Clock,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/components/providers/auth-provider"
import { toast } from "sonner"
import { usePostHog } from "posthog-js/react"

interface ReferralStats {
  code: string | null
  totalReferrals: number
  totalEarnings: number
  pendingEarnings: number
}

export default function ReferralsPage() {
  const t = useTranslations("referrals")
  const { isLoading: authLoading, isAuthenticated, openAuthModal } = useAuth()
  const posthog = usePostHog()
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
  const referralLink = stats?.code ? `${baseUrl}/products?ref=${stats.code}` : ""

  useEffect(() => {
    if (isAuthenticated) {
      fetchStats()
    } else if (!authLoading) {
      setLoading(false)
    }
  }, [isAuthenticated, authLoading])

  const fetchStats = async () => {
    try {
      const token = getAccessToken()
      const res = await fetch("/api/referrals", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setStats(data.data)
        }
      }
    } catch {
      // Non-critical — stats will just remain null
    } finally {
      setLoading(false)
    }
  }

  const generateCode = async () => {
    setGenerating(true)
    try {
      const token = getAccessToken()
      const res = await fetch("/api/referrals", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) {
        toast.success(t("codeGenerated"))
        await fetchStats()
      } else {
        toast.error(data.error || t("generateFailed"))
      }
    } catch {
      toast.error(t("somethingWrong"))
    } finally {
      setGenerating(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success(t("copiedToClipboard"))
      posthog?.capture("referral_link_copied", {
        content_type: text === stats?.code ? "code" : "link",
        referral_code: stats?.code,
      })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error(t("copyFailed"))
    }
  }

  const shareViaWhatsApp = () => {
    const text = `${t("whatsappShare")} ${referralLink}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank")
  }

  const shareViaTwitter = () => {
    const text = t("twitterShare")
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralLink)}`,
      "_blank"
    )
  }

  const shareViaEmail = () => {
    const subject = t("emailSubject")
    const body = t("emailBody", { link: referralLink })
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`)
  }

  if (authLoading || loading) {
    return (
      <div className="pt-24 pb-16 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="pt-24 pb-16">
        <div className="container max-w-2xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6"
          >
            <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Gift className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">{t("referFriends")}</h1>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              {t("referDesc")}
            </p>
            <Button size="lg" onClick={() => openAuthModal("login")}>
              {t("signInToGet")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
      <div className="pt-24 pb-16">
        <div className="container max-w-4xl mx-auto px-4 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-bold">{t("referralProgram")}</h1>
            <p className="text-muted-foreground mt-1">
              {t("shareAndEarn")}
            </p>
          </motion.div>

          {!stats?.code ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardContent className="p-8 text-center space-y-6">
                  <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                    <Gift className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">{t("getCode")}</h2>
                    <p className="text-muted-foreground mt-2">
                      {t("generateDesc")}
                    </p>
                  </div>
                  <Button size="lg" onClick={generateCode} disabled={generating}>
                    {generating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("generating")}
                      </>
                    ) : (
                      <>
                        {t("generateMyCode")}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Share2 className="h-4 w-4" />
                      {t("yourCode")}
                    </div>
                    <div className="flex items-center gap-3">
                      <Input
                        readOnly
                        value={stats.code}
                        className="text-2xl font-mono font-bold tracking-wider text-center bg-background/50"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="shrink-0 h-12 w-12"
                        aria-label="Copy referral code"
                        onClick={() => copyToClipboard(stats.code!)}
                      >
                        {copied ? (
                          <Check className="h-5 w-5 text-green-500" />
                        ) : (
                          <Copy className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        readOnly
                        value={referralLink}
                        className="text-sm text-muted-foreground bg-background/50"
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => copyToClipboard(referralLink)}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        {t("copyLink")}
                      </Button>
                    </div>
                    <Separator />
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={shareViaWhatsApp}>
                        <MessageCircle className="h-4 w-4 mr-2" />
                        WhatsApp
                      </Button>
                      <Button variant="outline" size="sm" onClick={shareViaTwitter}>
                        <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                        X / Twitter
                      </Button>
                      <Button variant="outline" size="sm" onClick={shareViaEmail}>
                        <Mail className="h-4 w-4 mr-2" />
                        Email
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <div className="grid gap-4 md:grid-cols-3">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">{t("totalReferrals")}</p>
                          <p className="text-3xl font-bold mt-1">{stats.totalReferrals}</p>
                          <p className="text-xs text-muted-foreground mt-1">{t("friendsSignedUp")}</p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-500" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">{t("totalEarnings")}</p>
                          <p className="text-3xl font-bold mt-1">
                            ${stats.totalEarnings.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">{t("allTimeRewards")}</p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                          <DollarSign className="h-5 w-5 text-green-500" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">{t("pendingEarnings")}</p>
                          <p className="text-3xl font-bold mt-1">
                            ${stats.pendingEarnings.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">{t("awaitingConfirmation")}</p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                          <Clock className="h-5 w-5 text-amber-500" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("howItWorks")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Share2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{t("step1Title")}</p>
                      <p className="text-sm text-muted-foreground">
                        {t("step1Desc")}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{t("step2Title")}</p>
                      <p className="text-sm text-muted-foreground">
                        {t("step2Desc")}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Gift className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{t("step3Title")}</p>
                      <p className="text-sm text-muted-foreground">
                        {t("step3Desc")}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="bg-muted/50">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-3">{t("terms")}</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>- {t("term1")}</li>
                  <li>- {t("term2")}</li>
                  <li>- {t("term3")}</li>
                  <li>- {t("term4")}</li>
                  <li>- {t("term5")}</li>
                  <li>- {t("term6")}</li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
  )
}
