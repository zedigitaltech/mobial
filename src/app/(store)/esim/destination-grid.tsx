"use client"

import { useState, useMemo } from "react"
import { Search, MapPin, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"
import { useCurrency } from "@/contexts/currency-context"

interface CountryWithPricing {
  slug: string
  code: string
  name: string
  flag: string
  minPrice: number | null
  productCount: number
}

function flagUrl(code: string): string {
  return `https://flagcdn.com/w160/${code.toLowerCase()}.png`
}

export function DestinationGrid({ countries }: { countries: CountryWithPricing[] }) {
  const [search, setSearch] = useState("")
  const t = useTranslations("destinationGrid")
  const { formatPrice } = useCurrency()

  const filtered = useMemo(() => {
    if (!search.trim()) return countries
    const q = search.toLowerCase()
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q),
    )
  }, [countries, search])

  const withProducts = filtered.filter((c) => c.productCount > 0)
  const withoutProducts = filtered.filter((c) => c.productCount === 0)

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="max-w-lg mx-auto relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground group-focus-within:text-primary transition-colors" />
        <input
          placeholder={t("searchPlaceholder")}
          aria-label="Search destinations"
          className="w-full h-12 bg-muted/60 border-0 rounded-2xl pl-11 pr-11 text-[15px] font-medium outline-none focus:ring-2 ring-primary/20 transition-all"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Section label + count */}
      <div className="flex items-center justify-between px-1">
        <div>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[3px]">
            {t("discover")}
          </p>
          <p className="text-xl font-black tracking-tight mt-0.5">
            {t("chooseDestination")}
          </p>
        </div>
        <p className="text-sm text-muted-foreground font-medium">
          {filtered.length === 1
            ? t("destinationCount", { count: filtered.length })
            : t("destinationCountPlural", { count: filtered.length })}
          {search ? ` ${t("matching", { query: search })}` : ""}
        </p>
      </div>

      {/* Countries with products */}
      {withProducts.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
          {withProducts.map((country) => (
            <Link key={country.slug} href={`/esim/${country.slug}`}>
              <div
                className={cn(
                  "flex flex-col items-center gap-1.5 p-3 rounded-xl",
                  "border border-border/30 bg-card",
                  "hover:border-primary/30 hover:shadow-md",
                  "transition-all duration-200 group cursor-pointer",
                )}
              >
                <div className="w-10 h-7 rounded overflow-hidden border border-border/20">
                  <Image
                    src={flagUrl(country.code)}
                    alt={country.name}
                    width={40}
                    height={28}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                </div>
                <p className="text-[11px] font-bold text-center leading-tight group-hover:text-primary transition-colors truncate max-w-full">
                  {country.name}
                </p>
                {country.minPrice != null && (
                  <p className="text-[10px] font-black text-primary">
                    {t("fromPrice", { price: formatPrice(country.minPrice) })}
                  </p>
                )}
                <p className="text-[9px] font-semibold text-muted-foreground">
                  {country.productCount === 1
                    ? t("planCount", { count: country.productCount })
                    : t("planCountPlural", { count: country.productCount })}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Countries without products */}
      {withoutProducts.length > 0 && (
        <div className="space-y-3 pt-4">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
            {t("comingSoon")}
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
            {withoutProducts.map((country) => (
              <div
                key={country.slug}
                className="flex flex-col items-center gap-1 p-3 rounded-xl border border-dashed border-border/20 opacity-50"
              >
                <span className="text-2xl">{country.flag}</span>
                <p className="text-[11px] font-medium text-muted-foreground text-center truncate max-w-full">
                  {country.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No results */}
      {filtered.length === 0 && (
        <div className="text-center py-16">
          <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MapPin className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-black mb-1">{t("noDestinations")}</h3>
          <p className="text-muted-foreground text-sm">
            {t("noDestinationsHint")}
          </p>
        </div>
      )}
    </div>
  )
}
