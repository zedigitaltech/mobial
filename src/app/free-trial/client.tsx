"use client"

import { useState } from "react"
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

const DESTINATIONS = [
  { country: "TR", name: "Turkey", flag: "\u{1F1F9}\u{1F1F7}", label: "Popular" },
  { country: "TH", name: "Thailand", flag: "\u{1F1F9}\u{1F1ED}", label: "Popular" },
  { country: "ES", name: "Spain", flag: "\u{1F1EA}\u{1F1F8}", label: "Europe" },
  { country: "JP", name: "Japan", flag: "\u{1F1EF}\u{1F1F5}", label: "Asia" },
  { country: "US", name: "United States", flag: "\u{1F1FA}\u{1F1F8}", label: "Americas" },
  { country: "IT", name: "Italy", flag: "\u{1F1EE}\u{1F1F9}", label: "Europe" },
  { country: "GB", name: "United Kingdom", flag: "\u{1F1EC}\u{1F1E7}", label: "Europe" },
  { country: "DE", name: "Germany", flag: "\u{1F1E9}\u{1F1EA}", label: "Europe" },
]

export function FreeTrialForm() {
  const [step, setStep] = useState<"destination" | "email" | "success">("destination")
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleClaim = async () => {
    if (!selectedDestination || !email) return

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address")
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
        toast.success("Free trial claimed!")
      } else {
        toast.error(data.error || "Failed to claim trial")
      }
    } catch {
      toast.error("Something went wrong. Please try again.")
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
                Step 1 of 2 — Choose Your Destination
              </div>

              <div className="grid grid-cols-2 gap-3">
                {DESTINATIONS.map((dest) => (
                  <button
                    key={dest.country}
                    onClick={() => setSelectedDestination(dest.country)}
                    className={`p-4 rounded-xl border text-left transition-all ${
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

              <Button
                className="w-full font-bold"
                size="lg"
                disabled={!selectedDestination}
                onClick={() => setStep("email")}
              >
                Continue
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
                Step 2 of 2 — Enter Your Email
              </div>

              <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {DESTINATIONS.find((d) => d.country === selectedDestination)?.flag}
                  </span>
                  <div>
                    <p className="font-bold text-sm">
                      {DESTINATIONS.find((d) => d.country === selectedDestination)?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">Free trial eSIM</p>
                  </div>
                  <button
                    onClick={() => setStep("destination")}
                    className="ml-auto text-xs text-primary font-bold hover:underline"
                  >
                    Change
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 text-base"
                  onKeyDown={(e) => e.key === "Enter" && handleClaim()}
                />
                <p className="text-xs text-muted-foreground">
                  We&apos;ll send your eSIM QR code and activation instructions here.
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
                    Claiming...
                  </>
                ) : (
                  <>
                    Claim Free Trial
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
                <h2 className="text-2xl font-black">Trial Claimed!</h2>
                <p className="text-muted-foreground">
                  We&apos;re preparing your free eSIM for{" "}
                  <span className="font-bold text-foreground">
                    {DESTINATIONS.find((d) => d.country === selectedDestination)?.name}
                  </span>
                  . Check your email at{" "}
                  <span className="font-bold text-foreground">{email}</span>{" "}
                  for activation instructions.
                </p>
              </div>

              <Badge className="bg-primary/10 text-primary border-0 px-4 py-1.5 text-xs font-bold">
                You have 7 days to activate your trial
              </Badge>

              <div className="pt-4 space-y-3">
                <Link href="/esim" className="block">
                  <Button variant="outline" className="w-full font-bold">
                    Browse Full eSIM Plans
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/guides/installation" className="block">
                  <Button variant="ghost" className="w-full text-sm">
                    How to Install an eSIM
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
