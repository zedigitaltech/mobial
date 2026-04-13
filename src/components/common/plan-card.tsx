"use client"

import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { useCurrency } from "@/contexts/currency-context"
import { getCountryByCode } from "@/lib/countries"
import { useTranslations } from "next-intl"

interface PlanCardProduct {
  id: string
  name: string
  slug?: string
  provider: string
  price: number
  dataAmount?: number | null
  dataUnit?: string | null
  validityDays?: number | null
  countries?: string[] | string | null
  isUnlimited?: boolean
  providerLogo?: string | null
  networkType?: string | null
  topUpAvailable?: boolean
}

interface PlanCardProps {
  product: PlanCardProduct
  variant?: "full" | "compact"
  className?: string
}

function parseCountries(countries: string[] | string | null | undefined): string[] {
  if (!countries) return []
  if (Array.isArray(countries)) return countries
  try {
    return JSON.parse(countries)
  } catch {
    return []
  }
}

function SmartBadge({ product, t }: { product: PlanCardProduct; t: (key: string) => string }) {
  const pricePerDay = product.price / (product.validityDays || 1)
  const countryCount = parseCountries(product.countries).length

  let label: string | null = null
  if (pricePerDay < 0.8) label = t("bestValue")
  else if (countryCount >= 20) label = t("bestCoverage")
  else if (product.topUpAvailable) label = t("refillable")

  if (!label) return null

  return (
    <span className="px-2 py-0.5 rounded-full bg-muted text-[10px] font-extrabold text-muted-foreground">
      {label}
    </span>
  )
}

function CountryFlags({ codes, maxFlags = 4 }: { codes: string[]; maxFlags?: number }) {
  const flags = codes.slice(0, maxFlags).map((code) => {
    const data = getCountryByCode(code)
    return data ? { code, name: data.name, flag: data.flag } : null
  }).filter(Boolean) as { code: string; name: string; flag: string }[]

  return (
    <div className="flex items-center gap-1">
      {flags.map((f) => (
        <span key={f.code} className="text-sm leading-none" title={f.name}>
          {f.flag}
        </span>
      ))}
    </div>
  )
}

function ProviderHeader({ product }: { product: PlanCardProduct }) {
  return (
    <div className="flex items-center gap-3">
      {product.providerLogo ? (
        <Image
          src={product.providerLogo}
          alt={product.provider}
          width={40}
          height={40}
          className="rounded-full object-contain"
          unoptimized
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          <span className="text-base font-extrabold text-muted-foreground">
            {product.provider[0]}
          </span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
          {product.provider}
        </p>
        <p className="text-base font-bold leading-tight truncate">
          {product.name}
        </p>
      </div>
    </div>
  )
}

function ThreeColumnStats({ product, formatPrice, t }: { product: PlanCardProduct; formatPrice: (n: number) => string; t: (key: string) => string }) {
  const dataDisplay = product.isUnlimited
    ? { value: "\u221E", label: t("unlimited") }
    : { value: String(product.dataAmount ?? 0), label: product.dataUnit || "GB" }

  return (
    <div className="flex items-center border-y border-border/50 py-3 mx-4">
      <div className="flex-1 text-center">
        <p className="text-xl font-black tracking-tight">{product.validityDays ?? 0}</p>
        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">{t("days")}</p>
      </div>
      <div className="w-px h-7 bg-border/50" />
      <div className="flex-1 text-center">
        <p className="text-xl font-black tracking-tight">{dataDisplay.value}</p>
        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">{dataDisplay.label}</p>
      </div>
      <div className="w-px h-7 bg-border/50" />
      <div className="flex-1 text-center">
        <p className="text-xl font-black tracking-tight text-emerald-500" suppressHydrationWarning>
          {formatPrice(product.price)}
        </p>
        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">{t("price")}</p>
      </div>
    </div>
  )
}

function FullCard({ product, className }: { product: PlanCardProduct; className?: string }) {
  const { formatPrice } = useCurrency()
  const t = useTranslations("planCard")
  const countryCodes = parseCountries(product.countries)
  const countryCount = countryCodes.length
  const productLink = `/products/${product.slug || product.id}`

  return (
    <Link href={productLink} className="block">
      <div
        className={cn(
          "relative rounded-xl bg-card overflow-hidden",
          "border border-border/30 hover:border-primary/30",
          "shadow-sm hover:shadow-lg",
          "transition-all duration-300 hover:-translate-y-0.5",
          className,
        )}
      >
        {/* Smart badge */}
        <div className="absolute top-2.5 right-2.5 z-10">
          <SmartBadge product={product} t={t} />
        </div>

        {/* Provider + Plan name */}
        <div className="px-4 pt-4 pb-3">
          <ProviderHeader product={product} />
        </div>

        {/* Three-column stats */}
        <ThreeColumnStats product={product} formatPrice={formatPrice} t={t} />

        {/* Country flags + View offer */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            {countryCount > 0 && <CountryFlags codes={countryCodes} maxFlags={4} />}
            {countryCount > 4 && (
              <span className="text-[11px] font-semibold text-muted-foreground">
                + {countryCount - 4} {countryCount - 4 === 1 ? t("country") : t("countries")}
              </span>
            )}
          </div>
          <span className="text-[13px] font-bold text-primary ml-2 shrink-0">
            {t("viewOffer")} &gt;
          </span>
        </div>
      </div>
    </Link>
  )
}

function CompactCard({ product, className }: { product: PlanCardProduct; className?: string }) {
  const { formatPrice } = useCurrency()
  const t = useTranslations("planCard")
  const pricePerDay = product.price / (product.validityDays || 1)
  const productLink = `/products/${product.slug || product.id}`

  return (
    <Link href={productLink} className="block">
      <div
        className={cn(
          "flex items-center gap-3 rounded-xl bg-card px-3 py-2.5",
          "border border-border/30 hover:border-primary/30",
          "shadow-sm hover:shadow-md transition-all",
          className,
        )}
      >
        {product.providerLogo ? (
          <Image
            src={product.providerLogo}
            alt={product.provider}
            width={32}
            height={32}
            className="rounded-full object-contain shrink-0"
            unoptimized
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
            <span className="text-xs font-extrabold text-muted-foreground">
              {product.provider[0]}
            </span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold truncate">{product.name}</p>
          <p className="text-[11px] text-muted-foreground truncate">
            {product.provider} · {product.isUnlimited ? t("unlimited") : `${product.dataAmount}${product.dataUnit || "GB"}`} · {product.validityDays}d
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[15px] font-black text-emerald-500" suppressHydrationWarning>
            {formatPrice(product.price)}
          </p>
          <p className="text-[10px] font-semibold text-muted-foreground" suppressHydrationWarning>
            {formatPrice(pricePerDay)}/d
          </p>
        </div>
      </div>
    </Link>
  )
}

export function PlanCard({ product, variant = "full", className }: PlanCardProps) {
  if (variant === "compact") {
    return <CompactCard product={product} className={className} />
  }
  return <FullCard product={product} className={className} />
}
