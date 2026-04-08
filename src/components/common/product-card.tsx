"use client"

import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { useCurrency } from "@/contexts/currency-context"
import { getCountryByCode } from "@/lib/countries"
import { ProviderHeader } from "./provider-header"
import { ThreeColumnStats } from "./three-column-stats"

interface ProductCardProps {
  product: {
    id: string
    name: string
    slug?: string
    provider: string
    dataAmount?: number | null
    dataUnit?: string | null
    validityDays?: number | null
    countries?: string[] | string | null
    price: number
    originalPrice?: number | null
    isUnlimited?: boolean
    bestFitReason?: string | null
    providerLogo?: string | null
  }
  /** @deprecated No longer used — kept for caller compatibility */
  onBuy?: (productId: string) => void
  showLink?: boolean
  className?: string
}

const MAX_VISIBLE_FLAGS = 3
const FLAG_WIDTH = 20
const FLAG_HEIGHT = 15

function parseCountryCodes(
  countries: string[] | string | null | undefined,
): string[] {
  if (!countries) return []
  if (Array.isArray(countries)) return countries
  try {
    return JSON.parse(countries)
  } catch {
    return []
  }
}

function resolveCountryFlags(
  codes: string[],
): { code: string; name: string }[] {
  return codes.reduce<{ code: string; name: string }[]>((acc, code) => {
    const data = getCountryByCode(code)
    if (data) {
      return [...acc, { code: data.code, name: data.name }]
    }
    return acc
  }, [])
}

function formatDataLabel(
  dataAmount: number | null | undefined,
  dataUnit: string | null | undefined,
  isUnlimited: boolean | undefined,
): string {
  if (isUnlimited) return "Unlimited"
  if (dataAmount == null) return "N/A"
  return `${dataAmount} ${dataUnit || "GB"}`
}

export function ProductCard({
  product,
  showLink = true,
  className,
}: ProductCardProps) {
  const { formatPrice } = useCurrency()

  const countryCodes = parseCountryCodes(product.countries)
  const countryFlags = resolveCountryFlags(countryCodes)
  const visibleFlags = countryFlags.slice(0, MAX_VISIBLE_FLAGS)
  const remainingCount = countryCodes.length - visibleFlags.length

  const productLink = product.slug
    ? `/products/${product.slug}`
    : `/products/${product.id}`

  const dataLabel = formatDataLabel(
    product.dataAmount,
    product.dataUnit,
    product.isUnlimited,
  )

  const daysLabel = product.validityDays != null
    ? String(product.validityDays)
    : "N/A"

  const cardContent = (
    <div
      className={cn(
        "bg-card rounded-xl shadow-sm border border-border hover:shadow-md transition-shadow p-5 flex flex-col gap-4 h-full",
        className,
      )}
    >
      {/* Smart badge */}
      {product.bestFitReason && (
        <div className="flex justify-end">
          <span className="bg-muted text-muted-foreground text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">
            {product.bestFitReason}
          </span>
        </div>
      )}

      {/* Provider header */}
      <ProviderHeader
        logo={product.providerLogo ?? null}
        providerName={product.provider}
        planName={product.name}
      />

      {/* Stats row */}
      <ThreeColumnStats
        days={daysLabel}
        data={dataLabel}
        price={formatPrice(product.price)}
      />

      {/* Country flags + view offer */}
      <div className="flex items-center justify-between mt-auto">
        {countryFlags.length > 0 ? (
          <div className="flex items-center gap-1.5">
            {visibleFlags.map((c) => (
              <Image
                key={c.code}
                src={`https://flagcdn.com/w40/${c.code.toLowerCase()}.png`}
                alt={c.name}
                width={FLAG_WIDTH}
                height={FLAG_HEIGHT}
                className="rounded-[2px] object-cover"
              />
            ))}
            {remainingCount > 0 && (
              <span className="text-[11px] text-muted-foreground">
                + {remainingCount} other {remainingCount === 1 ? "country" : "countries"}
              </span>
            )}
          </div>
        ) : (
          <div />
        )}

        <span className="text-primary font-semibold text-sm whitespace-nowrap">
          View offer &gt;
        </span>
      </div>
    </div>
  )

  if (!showLink) return cardContent

  return (
    <Link href={productLink} className="block h-full">
      {cardContent}
    </Link>
  )
}
