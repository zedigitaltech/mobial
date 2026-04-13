import { Metadata } from "next"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Globe } from "lucide-react"
import { countries, getAllCountrySlugs } from "@/lib/countries"
import { regions } from "@/lib/regions"
import { getTranslations } from "next-intl/server"
import { DestinationGrid } from "./destination-grid"
import { db } from "@/lib/db"

const REGION_EMOJI: Record<string, string> = {
  europe: "\u{1F1EA}\u{1F1FA}",
  asia: "\u{1F30F}",
  americas: "\u{1F30E}",
  "middle-east": "\u{1F54C}",
  oceania: "\u{1F3DD}\uFE0F",
  africa: "\u{1F30D}",
}

export const revalidate = 3600

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://mobialo.eu"

export const metadata: Metadata = {
  title: "eSIM Plans by Country",
  description:
    "Browse eSIM data plans for 190+ countries. Find affordable prepaid travel data for your next destination with instant activation.",
  alternates: {
    canonical: `${BASE_URL}/esim`,
  },
  openGraph: {
    title: "eSIM Plans by Country | MobiaL",
    description:
      "Browse eSIM data plans for 190+ countries. Instant activation, no roaming fees.",
    url: `${BASE_URL}/esim`,
    images: [
      {
        url: `${BASE_URL}/og-esim.png`,
        width: 1200,
        height: 630,
        alt: "MobiaL eSIM Plans — 190+ Countries",
      },
    ],
  },
}

async function getCountriesWithPricing(): Promise<
  Array<{
    slug: string
    code: string
    name: string
    flag: string
    minPrice: number | null
    productCount: number
  }>
> {
  const products = await db.product.findMany({
    where: {
      isActive: true,
      externallyShown: true,
      category: "esim_realtime",
    },
    select: { countries: true, price: true },
    orderBy: { price: "asc" },
  })

  const countryMap = new Map<string, { minPrice: number; count: number }>()
  for (const p of products) {
    if (!p.countries) continue
    try {
      const codes: string[] = JSON.parse(p.countries)
      for (const code of codes) {
        const existing = countryMap.get(code)
        if (!existing) {
          countryMap.set(code, { minPrice: p.price, count: 1 })
        } else {
          existing.count++
          if (p.price < existing.minPrice) existing.minPrice = p.price
        }
      }
    } catch {
      // Skip invalid JSON
    }
  }

  const slugs = getAllCountrySlugs()
  return slugs
    .map((slug) => {
      const country = countries[slug]
      const data = countryMap.get(country.code)
      return {
        slug,
        ...country,
        minPrice: data?.minPrice ?? null,
        productCount: data?.count ?? 0,
      }
    })
    .filter((c) => c.productCount > 0)
    .sort((a, b) => b.productCount - a.productCount)
}

export default async function EsimDestinationsPage() {
  const countriesWithPricing = await getCountriesWithPricing()
  const t = await getTranslations("esim")

  return (
    <>
      {/* Hero */}
      <section className="relative pt-16 pb-8 overflow-hidden">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--primary)_0%,_transparent_70%)] opacity-[0.03]" />
          <div className="absolute -top-[10%] -right-[10%] w-[30%] h-[30%] bg-primary/10 blur-[120px] rounded-full" />
        </div>

        <div className="max-w-5xl mx-auto px-6 text-center space-y-4">
          <Badge className="bg-primary/10 text-primary border-0 px-4 py-1.5 text-xs font-black uppercase tracking-wider">
            <Globe className="h-3 w-3 mr-1" /> {t("destinationsBadge")}
          </Badge>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-[1.1]">
            {t("title")}{" "}
            <span className="text-primary italic">
              {t("titleHighlight")}
            </span>
          </h1>
          <p className="text-base text-muted-foreground max-w-xl mx-auto font-medium">
            {t("heroDesc")}
          </p>
        </div>
      </section>

      {/* Regions */}
      <section className="py-6">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-lg font-extrabold tracking-tight mb-4">
            {t("browseByRegion")}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {regions.map((region) => (
              <Link
                key={region.slug}
                href={`/esim/region/${region.slug}`}
                className="p-3 rounded-xl bg-card border border-border/30 hover:shadow-md hover:border-primary/20 transition-all group text-center"
              >
                <div className="text-2xl mx-auto mb-1.5 group-hover:scale-110 transition-transform">
                  {REGION_EMOJI[region.slug] || "\u{1F30D}"}
                </div>
                <h3 className="font-bold text-xs group-hover:text-primary transition-colors">
                  {region.name}
                </h3>
                <p className="text-[9px] text-muted-foreground mt-0.5">
                  {t("countriesCount", {
                    count: region.countries.length,
                  })}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Destination Grid with Search */}
      <section className="py-8">
        <div className="max-w-5xl mx-auto px-6">
          <DestinationGrid countries={countriesWithPricing} />
        </div>
      </section>
    </>
  )
}
