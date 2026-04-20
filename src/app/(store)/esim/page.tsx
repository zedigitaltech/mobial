import { Metadata } from "next"
import Link from "next/link"
import { ChevronLeft, ChevronRight, PackageSearch } from "lucide-react"
import { getProducts, type ProductFilters } from "@/services/product-service"
import { regions } from "@/lib/regions"
import { getCountries } from "@/lib/countries"
import { FilterSidebar } from "./filter-sidebar"
import { ProductCard } from "@/components/store/product-card"

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
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "MobiaL eSIM Plans — 190+ Countries",
      },
    ],
  },
}

const PAGE_SIZE = 24

type SortParam = "rank" | "price_asc" | "price_desc" | "data"

function mapSortParam(sort: string | undefined): ProductFilters["sortBy"] {
  switch (sort as SortParam) {
    case "price_asc":
      return "price_asc"
    case "price_desc":
      return "price_desc"
    case "data":
      return "data"
    case "rank":
      return "rank"
    default:
      return "rank"
  }
}

interface PageProps {
  searchParams: Promise<{
    region?: string
    country?: string
    maxPrice?: string
    sort?: string
    page?: string
  }>
}

function buildPaginationUrl(
  base: Record<string, string>,
  page: number,
): string {
  const params = new URLSearchParams({ ...base, page: String(page) })
  return `/esim?${params.toString()}`
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <PackageSearch className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-black mb-2">No plans found</h2>
      <p className="text-muted-foreground text-sm max-w-xs">
        Try adjusting your filters or{" "}
        <Link href="/esim" className="text-primary font-bold hover:underline">
          clear all filters
        </Link>{" "}
        to see all available plans.
      </p>
    </div>
  )
}

export default async function EsimPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = Math.max(1, Number(params.page ?? 1))
  const offset = (page - 1) * PAGE_SIZE

  const filters: ProductFilters = {
    isActive: true,
    limit: PAGE_SIZE,
    offset,
    sortBy: mapSortParam(params.sort),
    ...(params.region ? { region: params.region } : {}),
    ...(params.country ? { country: params.country } : {}),
    ...(params.maxPrice ? { maxPrice: Number(params.maxPrice) } : {}),
  }

  const [paginatedResult, allCountries] = await Promise.all([
    getProducts(filters),
    Promise.resolve(getCountries()),
  ])

  const { products, total } = paginatedResult
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const baseParams: Record<string, string> = {}
  if (params.region) baseParams.region = params.region
  if (params.country) baseParams.country = params.country
  if (params.maxPrice) baseParams.maxPrice = params.maxPrice
  if (params.sort) baseParams.sort = params.sort

  const regionList = regions.map((r) => ({ slug: r.slug, name: r.name }))

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-2">
        Browse eSIM Plans
      </h1>
      {total > 0 && (
        <p className="text-sm text-muted-foreground font-medium mb-6">
          {total} plan{total !== 1 ? "s" : ""} available
          {params.country
            ? ` for ${allCountries.find((c) => c.code === params.country)?.name ?? params.country}`
            : ""}
          {params.region
            ? ` in ${regionList.find((r) => r.slug === params.region)?.name ?? params.region}`
            : ""}
        </p>
      )}

      <div className="flex flex-col md:grid md:grid-cols-[240px_1fr] md:gap-8 mt-6 md:items-start">
        <FilterSidebar regions={regionList} countries={allCountries} />

        <main>
          {products.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {totalPages > 1 && (
                <nav
                  className="flex items-center justify-center gap-3"
                  aria-label="Pagination"
                >
                  {page > 1 ? (
                    <Link
                      href={buildPaginationUrl(baseParams, page - 1)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border/40 bg-card text-sm font-bold hover:border-primary/30 hover:text-primary transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border/20 bg-card text-sm font-bold text-muted-foreground opacity-40 cursor-not-allowed">
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </span>
                  )}

                  <span className="text-sm font-bold text-muted-foreground px-2">
                    Page {page} of {totalPages}
                  </span>

                  {page < totalPages ? (
                    <Link
                      href={buildPaginationUrl(baseParams, page + 1)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border/40 bg-card text-sm font-bold hover:border-primary/30 hover:text-primary transition-colors"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border/20 bg-card text-sm font-bold text-muted-foreground opacity-40 cursor-not-allowed">
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  )}
                </nav>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
