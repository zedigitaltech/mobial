import { Metadata } from "next"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Globe, ArrowRight } from "lucide-react"
import { countries, getAllCountrySlugs } from "@/lib/countries"
import { regions } from "@/lib/regions"
import { getTranslations } from "next-intl/server"

const REGION_EMOJI: Record<string, string> = {
  europe: "\u{1F1EA}\u{1F1FA}",    // EU flag
  asia: "\u{1F30F}",                // Globe Asia-Australia
  americas: "\u{1F30E}",            // Globe Americas
  "middle-east": "\u{1F54C}",       // Mosque (Middle East symbol)
  oceania: "\u{1F3DD}\uFE0F",       // Desert island
  africa: "\u{1F30D}",              // Globe Europe-Africa
}
import { DestinationGrid } from "./destination-grid"
import { db } from "@/lib/db"

export const revalidate = 3600

export const metadata: Metadata = {
  title: "eSIM Plans by Country",
  description:
    "Browse eSIM data plans for 150+ countries. Find affordable prepaid travel data for your next destination with instant activation.",
  openGraph: {
    title: "eSIM Plans by Country | MobiaL",
    description:
      "Browse eSIM data plans for 150+ countries. Instant activation, no roaming fees.",
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
      category: 'esim_realtime',
    },
    select: { countries: true, price: true },
    orderBy: { price: 'asc' },
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
    .map(slug => {
      const country = countries[slug]
      const data = countryMap.get(country.code)
      return {
        slug,
        ...country,
        minPrice: data?.minPrice ?? null,
        productCount: data?.count ?? 0,
      }
    })
    .filter(c => c.productCount > 0)
    .sort((a, b) => b.productCount - a.productCount)
}

export default async function EsimDestinationsPage() {
  const countriesWithPricing = await getCountriesWithPricing()
  const t = await getTranslations("esim")

  return (
    <>
      {/* Hero */}
        <section className="relative pt-20 pb-12 overflow-hidden">
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--primary)_0%,_transparent_70%)] opacity-[0.03]" />
            <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
            <div className="absolute -bottom-[10%] -left-[10%] w-[30%] h-[30%] bg-blue-500/10 blur-[120px] rounded-full" />
          </div>

          <div className="container mx-auto px-4 text-center space-y-6">
            <Badge className="bg-primary/10 text-primary border-0 px-4 py-1.5 text-xs font-black uppercase tracking-wider">
              <Globe className="h-3 w-3 mr-1" /> {t("destinationsBadge")}
            </Badge>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1]">
              {t("title")}{" "}
              <span className="text-primary italic">{t("titleHighlight")}</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
              {t("heroDesc")}
            </p>
          </div>
        </section>

        {/* Regions */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-black tracking-tight mb-6">{t("browseByRegion")}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {regions.map((region) => (
                <Link
                  key={region.slug}
                  href={`/esim/region/${region.slug}`}
                  className="p-4 rounded-2xl bg-card border border-border/50 hover:shadow-lg hover:border-primary/20 transition-all group text-center"
                >
                  <div className="text-3xl mx-auto mb-2 group-hover:scale-110 transition-transform">
                    {REGION_EMOJI[region.slug] || "\u{1F30D}"}
                  </div>
                  <h3 className="font-bold text-sm group-hover:text-primary transition-colors">
                    {region.name}
                  </h3>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {t("countriesCount", { count: region.countries.length })}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Destination Grid with Search */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <DestinationGrid countries={countriesWithPricing} />
          </div>
        </section>
    </>
  )
}
