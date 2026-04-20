"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, Check } from "lucide-react"
import { useState } from "react"

interface ActivationGuideProps {
  activationCode?: string | null
  smdpAddress?: string | null
}

export function ActivationGuide({ activationCode, smdpAddress }: ActivationGuideProps) {
  const [copied, setCopied] = useState<string | null>(null)

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="space-y-4">
      {activationCode && (
        <div className="p-4 rounded-xl border border-border bg-card">
          <p className="text-xs text-muted-foreground mb-2">Activation code</p>
          <div className="flex items-center justify-between gap-2">
            <code className="font-mono text-sm text-foreground break-all">{activationCode}</code>
            <button
              onClick={() => copy(activationCode, "code")}
              className="shrink-0 p-2 rounded-lg hover:bg-accent transition-colors"
            >
              {copied === "code" ? (
                <Check className="size-4 text-emerald-400" />
              ) : (
                <Copy className="size-4 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>
      )}

      {smdpAddress && (
        <div className="p-4 rounded-xl border border-border bg-card">
          <p className="text-xs text-muted-foreground mb-2">SM-DP+ address</p>
          <div className="flex items-center justify-between gap-2">
            <code className="font-mono text-sm text-foreground break-all">{smdpAddress}</code>
            <button
              onClick={() => copy(smdpAddress, "smdp")}
              className="shrink-0 p-2 rounded-lg hover:bg-accent transition-colors"
            >
              {copied === "smdp" ? (
                <Check className="size-4 text-emerald-400" />
              ) : (
                <Copy className="size-4 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>
      )}

      <Tabs defaultValue="ios">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ios">iPhone (iOS)</TabsTrigger>
          <TabsTrigger value="android">Android</TabsTrigger>
        </TabsList>
        <TabsContent value="ios" className="space-y-3 pt-4">
          {[
            "Open Settings → Cellular → Add eSIM",
            'Tap "Use QR Code" and scan the code above',
            "Follow the prompts to activate",
            "Turn off your physical SIM if needed for this line",
          ].map((step, i) => (
            <div key={i} className="flex gap-3 text-sm">
              <span
                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs text-white font-medium"
                style={{ background: "var(--brand-gradient)" }}
              >
                {i + 1}
              </span>
              <span className="text-muted-foreground pt-0.5">{step}</span>
            </div>
          ))}
        </TabsContent>
        <TabsContent value="android" className="space-y-3 pt-4">
          {[
            "Open Settings → Network & Internet → SIMs",
            'Tap "Add eSIM" → "Scan QR code"',
            "Scan the QR code above",
            "Follow the on-screen instructions to activate",
          ].map((step, i) => (
            <div key={i} className="flex gap-3 text-sm">
              <span
                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs text-white font-medium"
                style={{ background: "var(--brand-gradient)" }}
              >
                {i + 1}
              </span>
              <span className="text-muted-foreground pt-0.5">{step}</span>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
