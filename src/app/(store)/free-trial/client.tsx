"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { motion, AnimatePresence } from "framer-motion"
import {
  Globe,
  Mail,
  Check,
  Loader2,
  ArrowRight,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import Link from "next/link"
import { usePostHog } from "posthog-js/react"

interface Destination {
  country: string
  name: string
  label: string
  flag: string
}

export function FreeTrialForm() {
  const t = useTranslations("freeTrial")
  const [step, setStep] = useState<"destination" | "email" | "success">("destination")
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [destinations, setDestinations] = useState<Destination[]>([])
  const posthog = usePostHog()

  useEffect(() => {
    fetch("/api/free-trial/destinations")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setDestinations(data.data)
      })
      .catch(() => {}) // fail silently, destinations already validated server-side
  }, [])

  const handleClaim = async () => {
    if (!selectedDestination || !email) return

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error(t("invalidEmail"))
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/free-trial/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, destination: selectedDestination }),
      })
      const data = await res.json()

      if (data.success) {
        setStep("success")
        toast.success(t("claimed"))
        posthog?.capture("free_trial_claimed", {
          destination: selectedDestination,
        })
      } else {
        toast.error(data.error || t("claimFailed"))
      }
    } catch {
      toast.error(t("claimError"))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="border-border/50">
      <CardContent className="p-6 sm:p-8">
        <AnimatePresence mode="wait">
          {step === "destination" && (
            <motion.div
              key="destination"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                <Globe className="h-4 w-4" />
                {t("step1")}
              </div>

              {destinations.length === 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="animate-pulse bg-muted rounded-xl h-[72px]" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {destinations.map((dest) => (
                    <button
                      key={dest.country}
                      onClick={() => setSelectedDestination(dest.country)}
                      className={`relative p-4 rounded-xl border text-left transition-all ${
                        selectedDestination === dest.country
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border/50 hover:border-primary/30 hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{dest.flag}</span>
                        <div>
                          <p className="font-bold text-sm">{dest.name}</p>
                          <p className="text-xs text-muted-foreground">{dest.label}</p>
                        </div>
                      </div>
                      {selectedDestination === dest.country && (
                        <Check className="h-4 w-4 text-primary absolute top-2 right-2" />
                      )}
                    </button>
                  ))}
                </div>
              )}

              <Button
                className="w-full font-bold"
                size="lg"
                disabled={!selectedDestination}
                onClick={() => setStep("email")}
              >
                {t("continue")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          )}

          {step === "email" && (
            <motion.div
              key="email"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                <Mail className="h-4 w-4" />
                {t("step2")}
              </div>

              <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {destinations.find((d) => d.country === selectedDestination)?.flag}
                  </span>
                  <div>
                    <p className="font-bold text-sm">
                      {destinations.find((d) => d.country === selectedDestination)?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{t("freeTrialEsim")}</p>
                  </div>
                  <button
                    onClick={() => setStep("destination")}
                    className="ml-auto text-xs text-primary font-bold hover:underline"
                  >
                    {t("change")}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Input
                  type="email"
                  aria-label="Email address"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 text-base"
                  onKeyDown={(e) => e.key === "Enter" && handleClaim()}
                />
                <p className="text-xs text-muted-foreground">
                  {t("emailInstructions")}
                </p>
              </div>

              <Button
                className="w-full font-bold"
                size="lg"
                disabled={!email || submitting}
                onClick={handleClaim}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("claiming")}
                  </>
                ) : (
                  <>
                    {t("claimFreeTrial")}
                    <Sparkles className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </motion.div>
          )}

          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6 py-4"
            >
              <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
                <Check className="h-8 w-8 text-emerald-400" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-black">{t("trialClaimed")}</h2>
                <p className="text-muted-foreground">
                  {t("preparingEsim", {
                    destination: destinations.find((d) => d.country === selectedDestination)?.name ?? "",
                    email,
                  })}
                </p>
              </div>

              <Badge className="bg-primary/10 text-primary border-0 px-4 py-1.5 text-xs font-bold">
                {t("activationDays")}
              </Badge>

              <div className="pt-4 space-y-3">
                <Link href="/esim" className="block">
                  <Button variant="outline" className="w-full font-bold">
                    {t("browseFullPlans")}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/guides/installation" className="block">
                  <Button variant="ghost" className="w-full text-sm">
                    {t("howToInstall")}
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
