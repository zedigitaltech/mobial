import { Metadata } from "next"
import { Signal } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { BreadcrumbJsonLd } from "@/components/common/json-ld"
import { CoverageMap } from "@/components/store/coverage-map"
import { db } from "@/lib/db"
import { countries, getCountrySlug } from "@/lib/countries"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://mobialo.eu"

export const metadata: Metadata = {
  title: "eSIM Coverage Map - 150+ Countries",
  description:
    "See where MobiaL eSIM plans work. Coverage in 150+ countries with 4G/5G networks. Check availability for your destination.",
  openGraph: {
    title: "eSIM Coverage Map | MobiaL",
    description:
      "Explore our global eSIM coverage. 4G/5G plans available in 150+ countries worldwide.",
  },
}

export const dynamic = "force-dynamic"

export default async function CoveragePage() {
  // Get unique countries from active products with plan counts
  const countryData = await db.product.groupBy({
    by: ["countries"],
    where: { isActive: true },
    _count: { id: true },
  })

  // Parse the JSON country arrays and aggregate
  const countryPlanCounts = new Map<string, number>()
  const countryNetworkTypes = new Map<string, string>()

  for (const row of countryData) {
    if (!row.countries) continue
    try {
      const codes: string[] = JSON.parse(row.countries)
      for (const code of codes) {
        countryPlanCounts.set(
          code,
          (countryPlanCounts.get(code) || 0) + row._count.id
        )
      }
    } catch {
      // Skip invalid JSON
    }
  }

  // Get network types from a sample product per country
  const sampleProducts = await db.product.findMany({
    where: { isActive: true, networkType: { not: null } },
    select: { countries: true, networkType: true, is5G: true },
    take: 500,
  })

  for (const product of sampleProducts) {
    if (!product.countries) continue
    try {
      const codes: string[] = JSON.parse(product.countries)
      for (const code of codes) {
        // Prefer 5G if any product offers it
        const existing = countryNetworkTypes.get(code)
        if (product.is5G || product.networkType?.includes("5G")) {
          countryNetworkTypes.set(code, "5G")
        } else if (!existing) {
          countryNetworkTypes.set(code, product.networkType || "4G/LTE")
        }
      }
    } catch {
      // Skip invalid JSON
    }
  }

  const coverageCountries = Array.from(countryPlanCounts.entries())
    .map(([code, planCount]) => {
      const countryInfo = Object.values(countries).find((c) => c.code === code)
      return {
        code,
        name: countryInfo?.name || code,
        slug: getCountrySlug(code),
        networkType: countryNetworkTypes.get(code),
        planCount,
      }
    })
    .sort((a, b) => b.planCount - a.planCount)

  return (
    <>
      <BreadcrumbJsonLd
        baseUrl={BASE_URL}
        items={[
          { name: "Home", url: "/" },
          { name: "Coverage", url: "/coverage" },
        ]}
      />

      {/* Hero */}
        <section className="relative pt-20 pb-12 overflow-hidden">
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--primary)_0%,_transparent_70%)] opacity-[0.03]" />
          </div>

          <div className="container mx-auto px-4 text-center space-y-6">
            <Badge className="bg-primary/10 text-primary border-0 px-4 py-1.5 text-xs font-black uppercase tracking-wider">
              <Signal className="h-3 w-3 mr-1" /> Coverage Map
            </Badge>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1]">
              Global <span className="text-primary italic">Coverage.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
              eSIM plans available in {coverageCountries.length}+ countries.
              Filter by region and check network quality for your destination.
            </p>
          </div>
        </section>

        {/* Coverage Map */}
        <section className="pb-20">
          <div className="container mx-auto px-4 max-w-5xl">
            <CoverageMap countries={coverageCountries} />
          </div>
        </section>
    </>
  )
}
