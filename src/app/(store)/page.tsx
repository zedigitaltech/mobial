import { Suspense } from "react"
import { OrganizationJsonLd, WebSiteJsonLd, BreadcrumbJsonLd } from "@/components/common/json-ld"
import { CircularFlagBadge } from "@/components/common/circular-flag-badge"
import { DestinationSearch } from "@/components/common/destination-search"
import { countries, TOP_DESTINATIONS } from "@/lib/countries"
import { getProducts } from "@/services/product-service"
import { getTranslations } from "next-intl/server"
import { HomeClient } from "./home-client"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://mobialo.eu"
const POPULAR_DESTINATIONS = TOP_DESTINATIONS.slice(0, 10)

function mapProduct(p: Awaited<ReturnType<typeof getProducts>>["products"][number]) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    provider: p.provider,
    price: p.price,
    dataAmount: p.dataAmount,
    dataUnit: p.dataUnit,
    validityDays: p.validityDays,
    countries: p.countries,
    isUnlimited: p.isUnlimited,
    originalPrice: p.originalPrice,
    providerLogo: p.providerLogo,
  }
}

async function HomepageProducts() {
  const [popularResult, latestResult] = await Promise.all([
    getProducts({ sortBy: "rank", category: "esim_realtime", limit: 6 }),
    getProducts({ sortBy: "price_asc", category: "esim_realtime", limit: 6 }),
  ])

  return (
    <HomeClient
      popularProducts={popularResult.products.map(mapProduct)}
      latestProducts={latestResult.products.map(mapProduct)}
    />
  )
}

function ProductsSkeleton() {
  return (
    <div className="px-4 md:px-6 pt-8">
      <div className="flex gap-6 mb-6">
        <div className="h-6 w-28 rounded bg-muted animate-pulse" />
        <div className="h-6 w-28 rounded bg-muted animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border/50 p-5 space-y-4">
            <div className="h-4 w-24 rounded bg-muted animate-pulse" />
            <div className="h-4 w-full rounded bg-muted animate-pulse" />
            <div className="h-6 w-16 rounded bg-muted animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default async function HomePage() {
  const t = await getTranslations("home")

  return (
    <div className="max-w-5xl mx-auto pb-16">
      <OrganizationJsonLd baseUrl={BASE_URL} />
      <WebSiteJsonLd baseUrl={BASE_URL} />
      <BreadcrumbJsonLd baseUrl={BASE_URL} items={[{ name: "Home" }]} />

      {/* Heading */}
      <div className="px-4 md:px-6 pt-10 pb-2">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight">
          {t("shopHeading")}
        </h1>
      </div>

      {/* Search */}
      <div className="px-4 md:px-6 pt-4">
        <DestinationSearch />
      </div>

      {/* Popular eSIM destinations */}
      <div className="pt-8">
        <h2 className="text-lg font-extrabold px-4 md:px-6 mb-4">
          {t("popularDestinations")}
        </h2>
        <div className="flex gap-5 overflow-x-auto px-4 md:px-6 pb-2 scrollbar-hide">
          {POPULAR_DESTINATIONS.map((slug) => {
            const country = countries[slug]
            if (!country) return null
            return (
              <CircularFlagBadge
                key={slug}
                code={country.code}
                name={country.name}
                href={`/esim/${slug}`}
              />
            )
          })}
        </div>
      </div>

      {/* Products section (tabs + currency + grid) */}
      <Suspense fallback={<ProductsSkeleton />}>
        <HomepageProducts />
      </Suspense>
    </div>
  )
}
