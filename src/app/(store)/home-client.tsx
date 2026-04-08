"use client"

import { useState } from "react"
import { ProductCard } from "@/components/common/product-card"
import { CurrencySelector } from "@/components/common/currency-selector"
import { useCurrency } from "@/contexts/currency-context"
import { useTranslations } from "next-intl"
import Link from "next/link"

type SortTab = "popular" | "latest"

interface HomeProduct {
  id: string
  name: string
  slug: string
  provider: string
  price: number
  dataAmount: number | null
  dataUnit: string | null
  validityDays: number | null
  countries: string[]
  isUnlimited: boolean
  originalPrice: number | null
  providerLogo: string | null
}

interface HomeClientProps {
  popularProducts: HomeProduct[]
  latestProducts: HomeProduct[]
}

export function HomeClient({ popularProducts, latestProducts }: HomeClientProps) {
  const [activeTab, setActiveTab] = useState<SortTab>("popular")
  const { currency } = useCurrency()
  const t = useTranslations("home")

  const products = activeTab === "popular" ? popularProducts : latestProducts

  return (
    <div className="pt-8">
      {/* Tab switch */}
      <div className="flex gap-6 px-4 md:px-6">
        <button
          onClick={() => setActiveTab("popular")}
          className={`pb-2 text-base font-semibold border-b-2 transition-colors ${
            activeTab === "popular"
              ? "border-primary text-foreground font-extrabold"
              : "border-transparent text-muted-foreground"
          }`}
        >
          {t("popularOffers")}
        </button>
        <button
          onClick={() => setActiveTab("latest")}
          className={`pb-2 text-base font-semibold border-b-2 transition-colors ${
            activeTab === "latest"
              ? "border-primary text-foreground font-extrabold"
              : "border-transparent text-muted-foreground"
          }`}
        >
          {t("latestOffers")}
        </button>
      </div>

      {/* Currency row */}
      <div className="flex items-center justify-between px-4 md:px-6 pt-4">
        <span className="text-sm font-semibold text-muted-foreground">
          {t("currency")}: {currency}
        </span>
        <CurrencySelector />
      </div>

      {/* Product grid */}
      <div className="px-4 md:px-6 pt-4">
        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{t("noProductsAvailable")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      {/* View all link */}
      <div className="px-4 md:px-6 pt-6 text-center">
        <Link
          href="/products"
          className="text-primary font-bold text-sm hover:underline"
        >
          {t("viewAllProducts")} &gt;
        </Link>
      </div>
    </div>
  )
}
