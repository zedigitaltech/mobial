"use client"

import Link from "next/link"
import Image from "next/image"
import { Globe, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface ProductCardProduct {
  id: string
  name: string
  slug: string
  price: number
  currency: string
  dataAmount: number | null
  dataUnit: string | null
  validityDays: number | null
  countries: string[]
  provider: string
  providerLogo: string | null
  penalizedRank: number | null
  isUnlimited: boolean
}

interface ProductCardProps {
  product: ProductCardProduct
}

function formatCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    AUD: "A$",
    CAD: "C$",
  }
  return symbols[currency.toUpperCase()] ?? currency
}

export function ProductCard({ product }: ProductCardProps) {
  const {
    name,
    slug,
    price,
    currency,
    dataAmount,
    dataUnit,
    validityDays,
    countries,
    provider,
    providerLogo,
    isUnlimited,
  } = product

  const countryCount = countries.length
  const currencySymbol = formatCurrencySymbol(currency)
  const isUnlimitedData = isUnlimited || dataAmount === null

  return (
    <article
      className={cn(
        "group relative flex flex-col rounded-2xl overflow-hidden",
        "bg-card border border-border/40",
        "hover:shadow-lg hover:shadow-black/10 hover:scale-[1.02] hover:border-primary/30",
        "transition-all duration-200 ease-out",
      )}
    >
      {/* Card header */}
      <div className="flex items-start justify-between p-4 pb-3">
        <div className="flex-1 min-w-0 pr-2">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            {provider}
          </p>
          <h3 className="font-bold text-sm leading-snug line-clamp-2 text-card-foreground">
            {name}
          </h3>
        </div>

        {/* Provider logo */}
        <div className="flex-shrink-0 w-10 h-10 rounded-xl overflow-hidden bg-muted/50 border border-border/20 flex items-center justify-center">
          {providerLogo ? (
            <Image
              src={providerLogo}
              alt={provider}
              width={40}
              height={40}
              className="w-full h-full object-contain p-1"
              unoptimized
            />
          ) : (
            <span className="text-[10px] font-black text-muted-foreground text-center leading-tight px-1">
              {provider.slice(0, 3).toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Data amount — prominent */}
      <div className="px-4 pb-3">
        <div className="flex items-baseline gap-1.5">
          <span
            className={cn(
              "font-black text-3xl tracking-tight",
              isUnlimitedData ? "text-primary" : "text-card-foreground",
            )}
          >
            {isUnlimited ? "∞" : (dataAmount ?? "—")}
          </span>
          <span className="text-sm font-semibold text-muted-foreground">
            {isUnlimited ? "Unlimited" : (dataUnit?.toUpperCase() === "MB" ? "MB" : "GB")}
          </span>
        </div>
      </div>

      {/* Meta row */}
      <div className="px-4 pb-4 flex items-center gap-3 text-xs text-muted-foreground">
        {validityDays !== null && (
          <span className="flex items-center gap-1 font-medium">
            <Clock className="h-3 w-3" />
            {validityDays} days
          </span>
        )}
        <span className="flex items-center gap-1 font-medium">
          <Globe className="h-3 w-3" />
          {countryCount === 1
            ? "1 country"
            : countryCount > 1
              ? `${countryCount} countries`
              : "Global"}
        </span>
      </div>

      {/* Footer */}
      <div className="mt-auto px-4 pb-4 flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] text-muted-foreground font-medium">From</span>
          <p className="font-black text-xl text-card-foreground leading-none">
            {currencySymbol}{price.toFixed(2)}
          </p>
        </div>
        <Button
          asChild
          size="sm"
          className="rounded-xl font-bold text-xs px-4 shrink-0"
        >
          <Link href={`/products/${slug}`}>Buy Now</Link>
        </Button>
      </div>
    </article>
  )
}
