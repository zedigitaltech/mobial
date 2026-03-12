import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Globe, Wifi, Zap, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getRegionBySlug, regions } from "@/lib/regions"

interface PageProps {
  params: Promise<{ region: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { region: slug } = await params
  const region = getRegionBySlug(slug)

  if (!region) {
    return { title: "Region Not Found" }
  }

  return {
    title: `eSIM for ${region.name}`,
    description: `Buy prepaid eSIM data plans for ${region.name}. Coverage across ${region.countries.length}+ countries. Instant activation, no roaming fees.`,
    openGraph: {
      title: `eSIM Plans for ${region.name} | MobiaL`,
      description: `High-speed eSIM data plans for ${region.name}. Instant delivery, no physical SIM needed.`,
      images: [
        {
          url: `/api/og?title=${encodeURIComponent(`eSIM for ${region.name}`)}&subtitle=${encodeURIComponent(`Coverage across ${region.countries.length}+ countries`)}`,
          width: 1200,
          height: 630,
          alt: `eSIM for ${region.name}`,
        },
      ],
    },
  }
}

export const revalidate = 3600

async function getRegionProducts(countryCodes: string[]) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  try {
    // Fetch products for the first few countries in the region to get representative results
    const countriesToFetch = countryCodes.slice(0, 5)

    const responses = await Promise.all(
      countriesToFetch.map((country) =>
        fetch(
          `${baseUrl}/api/products?country=${country}&limit=5&sortBy=price_asc`,
          { next: { revalidate: 3600 } }
        ).then(async (res) => {
          if (res.ok) {
            const data = await res.json()
            return (data?.data?.products || []) as any[]
          }
          return [] as any[]
        }).catch(() => [] as any[])
      )
    )

    const allProducts = responses.flat()

    // Deduplicate by product ID and sort by price
    const seen = new Set<string>()
    return allProducts
      .filter((p) => {
        if (seen.has(p.id)) return false
        seen.add(p.id)
        return true
      })
      .sort((a, b) => a.price - b.price)
      .slice(0, 20)
  } catch {
    return []
  }
}

export default async function RegionPage({ params }: PageProps) {
  const { region: slug } = await params
  const region = getRegionBySlug(slug)

  if (!region) {
    notFound()
  }

  const products = await getRegionProducts(region.countries)

  return (
    <>
      {/* Hero */}
        <section className="relative pt-20 pb-16 overflow-hidden">
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--primary)_0%,_transparent_70%)] opacity-[0.03]" />
            <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
          </div>

          <div className="container mx-auto px-4 text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1]">
              eSIM for{" "}
              <span className="text-primary italic">{region.name}</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
              {region.description}
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Badge className="bg-primary/10 text-primary border-0 px-4 py-1.5 text-xs font-black uppercase tracking-wider">
                <Globe className="h-3 w-3 mr-1" /> {region.countries.length}+ Countries
              </Badge>
              <Badge className="bg-primary/10 text-primary border-0 px-4 py-1.5 text-xs font-black uppercase tracking-wider">
                <Zap className="h-3 w-3 mr-1" /> Instant Delivery
              </Badge>
              <Badge className="bg-primary/10 text-primary border-0 px-4 py-1.5 text-xs font-black uppercase tracking-wider">
                <Wifi className="h-3 w-3 mr-1" /> High-Speed Data
              </Badge>
            </div>
          </div>
        </section>

        {/* Products */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            {products.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-3xl font-black tracking-tight">Available Plans</h2>
                    <p className="text-muted-foreground font-medium">
                      {products.length} plan{products.length !== 1 ? "s" : ""} for {region.name}
                    </p>
                  </div>
                  {products.length > 0 && (
                    <Badge variant="outline" className="h-8 rounded-full border-primary/20 text-primary font-bold">
                      From ${Math.min(...products.map((p: any) => p.price)).toFixed(2)}
                    </Badge>
                  )}
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {products.map((product: any) => (
                    <Card key={product.id} className="group hover:shadow-xl transition-all border-border/50">
                      <CardContent className="p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-[10px] font-bold">
                            {product.provider}
                          </Badge>
                          {product.networkType && (
                            <Badge className="bg-primary/10 text-primary border-0 text-[10px] font-black">
                              {product.networkType}
                            </Badge>
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-sm line-clamp-2">{product.name}</h3>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                            {product.dataAmount && (
                              <span>{product.dataAmount >= 1 ? `${product.dataAmount} GB` : `${product.dataAmount * 1000} MB`}</span>
                            )}
                            {product.validityDays && <span>{product.validityDays}d</span>}
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-xl font-black">${product.price.toFixed(2)}</span>
                          <Button size="sm" className="rounded-xl font-bold text-xs" asChild>
                            <Link href={`/products/${product.slug}`}>View Plan</Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-32 bg-card rounded-[3rem] border border-dashed border-border/50">
                <div className="w-20 h-20 bg-muted rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                  <Globe className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-black mb-2">No plans available yet</h3>
                <p className="text-muted-foreground mb-8">
                  We're working on adding plans for {region.name}. Check back soon!
                </p>
                <Button asChild className="rounded-2xl px-8 h-12 font-black uppercase tracking-widest text-xs">
                  <Link href="/esim">Browse All Destinations</Link>
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Other Regions */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-black tracking-tight text-center mb-8">
              Explore Other Regions
            </h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
              {regions
                .filter((r) => r.slug !== slug)
                .map((r) => (
                  <Link
                    key={r.slug}
                    href={`/esim/region/${r.slug}`}
                    className="p-5 rounded-2xl bg-card border border-border/50 hover:shadow-lg hover:border-primary/20 transition-all group"
                  >
                    <h3 className="font-bold group-hover:text-primary transition-colors">
                      eSIM for {r.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {r.countries.length}+ countries
                    </p>
                  </Link>
                ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="container mx-auto px-4 text-center space-y-8">
            <h2 className="text-3xl font-black tracking-tight">
              Looking for a specific country?
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Browse our full list of 150+ destinations to find the perfect eSIM plan.
            </p>
            <Button size="lg" className="rounded-2xl px-10 h-14 text-lg font-black" asChild>
              <Link href="/esim">
                All Destinations <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>
    </>
  )
}
