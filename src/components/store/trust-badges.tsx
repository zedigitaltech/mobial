import { Globe, Star, Zap, ShieldCheck, Headphones, Lock } from "lucide-react"
import { getTranslations } from "next-intl/server"

const PAYMENT_METHODS = ["Visa", "Mastercard", "Stripe", "Apple Pay", "Google Pay"]

export async function TrustBadges() {
  const t = await getTranslations('trust')

  const BADGES = [
    { icon: Globe, label: t('countries'), color: "text-blue-400" },
    { icon: Star, label: t('rating'), color: "text-amber-400" },
    { icon: Zap, label: t('instant'), color: "text-emerald-400" },
    { icon: ShieldCheck, label: t('secure'), color: "text-primary" },
    { icon: Headphones, label: t('support'), color: "text-purple-400" },
  ]

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300">
      {/* Trust stat badges */}
      <div className="flex flex-wrap justify-center gap-4 md:gap-8">
        {BADGES.map((badge, i) => (
          <div
            key={i}
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <badge.icon className={`h-4 w-4 ${badge.color}`} />
            <span className="font-semibold text-xs md:text-sm whitespace-nowrap">
              {badge.label}
            </span>
          </div>
        ))}
      </div>

      {/* Payment methods */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Lock className="h-3 w-3 text-muted-foreground/50" />
        {PAYMENT_METHODS.map((method) => (
          <span
            key={method}
            className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wide px-2 py-0.5 rounded bg-muted/40 border border-border/15"
          >
            {method}
          </span>
        ))}
      </div>
    </div>
  )
}
