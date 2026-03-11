import { Metadata } from "next"
import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Badge } from "@/components/ui/badge"
import { Globe, ArrowRight } from "lucide-react"
import { countries, getAllCountrySlugs } from "@/lib/countries"
import { regions } from "@/lib/regions"
import { DestinationGrid } from "./destination-grid"

export const dynamic = 'force-dynamic'

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
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  const slugs = getAllCountrySlugs()

  const results = await Promise.all(
    slugs.map(async (slug) => {
      const country = countries[slug]
      try {
        const res = await fetch(
          `${baseUrl}/api/products?country=${country.code}&limit=1&sortBy=price_asc`,
          { next: { revalidate: 3600 } }
        )
        if (!res.ok) {
          return {
            slug,
            ...country,
            minPrice: null,
            productCount: 0,
          }
        }
        const data = await res.json()
        const products = data?.data?.products || []
        const total = data?.data?.pagination?.total || 0
        return {
          slug,
          ...country,
          minPrice: products[0]?.price ?? null,
          productCount: total,
        }
      } catch {
        return {
          slug,
          ...country,
          minPrice: null,
          productCount: 0,
        }
      }
    })
  )

  return results.sort((a, b) => b.productCount - a.productCount)
}

export default async function EsimDestinationsPage() {
  const countriesWithPricing = await getCountriesWithPricing()

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative pt-20 pb-12 overflow-hidden">
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--primary)_0%,_transparent_70%)] opacity-[0.03]" />
            <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
            <div className="absolute -bottom-[10%] -left-[10%] w-[30%] h-[30%] bg-blue-500/10 blur-[120px] rounded-full" />
          </div>

          <div className="container mx-auto px-4 text-center space-y-6">
            <Badge className="bg-primary/10 text-primary border-0 px-4 py-1.5 text-xs font-black uppercase tracking-wider">
              <Globe className="h-3 w-3 mr-1" /> 150+ Destinations
            </Badge>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1]">
              eSIM Plans by{" "}
              <span className="text-primary italic">Country</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
              Find the perfect data plan for your destination. Instant activation, no roaming fees, no physical SIM needed.
            </p>
          </div>
        </section>

        {/* Regions */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-black tracking-tight mb-6">Browse by Region</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {regions.map((region) => (
                <Link
                  key={region.slug}
                  href={`/esim/region/${region.slug}`}
                  className="p-4 rounded-2xl bg-card border border-border/50 hover:shadow-lg hover:border-primary/20 transition-all group text-center"
                >
                  <Globe className="h-6 w-6 text-primary mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <h3 className="font-bold text-sm group-hover:text-primary transition-colors">
                    {region.name}
                  </h3>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {region.countries.length}+ countries
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
      </main>

      <Footer />
    </div>
  )
}
