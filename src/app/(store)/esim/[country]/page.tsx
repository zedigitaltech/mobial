import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Globe, QrCode, Wifi, Zap, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getCountryBySlug } from "@/lib/countries"
import { CountryProductGrid } from "./product-grid"
import { BreadcrumbJsonLd } from "@/components/common/json-ld"
import { db } from "@/lib/db"

interface PageProps {
  params: Promise<{ country: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { country: slug } = await params
  const country = getCountryBySlug(slug)

  if (!country) {
    return { title: "Country Not Found" }
  }

  return {
    title: `eSIM for ${country.name}`,
    description: `Buy prepaid eSIM data plans for ${country.name}. Instant activation, no roaming fees. Get connected in ${country.name} with MobiaL.`,
    openGraph: {
      title: `eSIM Plans for ${country.name} | MobiaL`,
      description: `High-speed eSIM data plans for ${country.name}. Instant delivery, no physical SIM needed.`,
      images: [
        {
          url: `/api/og?title=${encodeURIComponent(`eSIM for ${country.name}`)}&subtitle=${encodeURIComponent(`Stay connected in ${country.name}`)}&flag=${encodeURIComponent(country.flag)}`,
          width: 1200,
          height: 630,
          alt: `eSIM for ${country.name}`,
        },
      ],
    },
  }
}

export const revalidate = 300

const STEPS = [
  {
    icon: Globe,
    title: "Choose Your Plan",
    description: "Pick the data plan that fits your trip duration and usage needs.",
  },
  {
    icon: QrCode,
    title: "Receive QR Code",
    description: "Get your eSIM activation QR code instantly via email after purchase.",
  },
  {
    icon: Wifi,
    title: "Connect & Go",
    description: "Scan the QR code on your device and enjoy high-speed data on arrival.",
  },
]

async function getCountryProducts(countryCode: string) {
  try {
    const products = await db.product.findMany({
      where: {
        isActive: true,
        externallyShown: true,
        category: 'esim_realtime',
        countries: { contains: countryCode },
      },
      orderBy: { price: 'asc' },
      take: 20,
      select: {
        id: true,
        name: true,
        slug: true,
        provider: true,
        price: true,
        originalPrice: true,
        dataAmount: true,
        dataUnit: true,
        isUnlimited: true,
        validityDays: true,
        countries: true,
        regions: true,
        networks: true,
        providerLogo: true,
        speedInfo: true,
        networkType: true,
        activationPolicy: true,
        isActive: true,
        topUpAvailable: true,
        penalizedRank: true,
        category: true,
      },
    })

    return products.map(p => ({
      ...p,
      countries: p.countries ? JSON.parse(p.countries) : [],
      regions: p.regions ? JSON.parse(p.regions) : [],
      networks: p.networks ?? undefined,
      providerLogo: p.providerLogo ?? undefined,
      speedInfo: p.speedInfo ?? undefined,
      networkType: p.networkType ?? undefined,
      activationPolicy: p.activationPolicy ?? undefined,
    }))
  } catch (error) {
    console.error('[getCountryProducts] DB query failed:', error)
    return []
  }
}

export default async function CountryPage({ params }: PageProps) {
  const { country: slug } = await params
  const country = getCountryBySlug(slug)

  if (!country) {
    notFound()
  }

  const products = await getCountryProducts(country.code)

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://mobialo.eu"

  return (
    <>
      <BreadcrumbJsonLd
        baseUrl={baseUrl}
        items={[
          { name: "Home", url: "/" },
          { name: "Destinations", url: "/esim" },
          { name: `eSIM for ${country.name}` },
        ]}
      />

      {/* Hero */}
        <section className="relative pt-20 pb-16 overflow-hidden">
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--primary)_0%,_transparent_70%)] opacity-[0.03]" />
            <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
          </div>

          <div className="container mx-auto px-4 text-center space-y-6">
            <div className="text-7xl md:text-8xl">{country.flag}</div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1]">
              eSIM Plans for{" "}
              <span className="text-primary italic">{country.name}</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
              Stay connected in {country.name} with instant eSIM activation.
              No roaming fees, no physical SIM cards. Just scan and go.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Badge className="bg-primary/10 text-primary border-0 px-4 py-1.5 text-xs font-black uppercase tracking-wider">
                <Zap className="h-3 w-3 mr-1" /> Instant Delivery
              </Badge>
              <Badge className="bg-primary/10 text-primary border-0 px-4 py-1.5 text-xs font-black uppercase tracking-wider">
                <Wifi className="h-3 w-3 mr-1" /> High-Speed Data
              </Badge>
            </div>
          </div>
        </section>

        {/* Product Grid */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            {products.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-3xl font-black tracking-tight">Available Plans</h2>
                    <p className="text-muted-foreground font-medium">
                      {products.length} plan{products.length !== 1 ? "s" : ""} available for {country.name}
                    </p>
                  </div>
                  <Badge variant="outline" className="h-8 rounded-full border-primary/20 text-primary font-bold">
                    From ${Math.min(...products.map((p: any) => p.price)).toFixed(2)}
                  </Badge>
                </div>
                <CountryProductGrid products={products} />
              </>
            ) : (
              <div className="text-center py-32 bg-card rounded-[3rem] border border-dashed border-border/50">
                <div className="w-20 h-20 bg-muted rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                  <Globe className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-black mb-2">No plans available yet</h3>
                <p className="text-muted-foreground mb-8">
                  We don't have plans for {country.name} right now, but we're always adding new destinations.
                </p>
                <Button asChild className="rounded-2xl px-8 h-12 font-black uppercase tracking-widest text-xs">
                  <Link href="/esim">Browse All Destinations</Link>
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* How It Works */}
        <section className="py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center space-y-4 mb-16">
              <Badge className="bg-primary/10 text-primary border-0 px-4 py-1.5 text-xs font-black uppercase">
                How it works
              </Badge>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight">
                Get connected in{" "}
                <span className="text-primary italic">3 simple steps</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {STEPS.map((step, i) => (
                <div
                  key={i}
                  className="relative p-8 rounded-3xl bg-card border border-border/50 text-center group hover:shadow-xl transition-all"
                >
                  <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-6 font-black text-xl group-hover:scale-110 transition-transform">
                    {i + 1}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Button
                variant="outline"
                className="rounded-2xl px-8 h-12 font-bold"
                asChild
              >
                <Link href="/products">
                  View Installation Guide <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Browse More */}
        <section className="py-20">
          <div className="container mx-auto px-4 text-center space-y-8">
            <h2 className="text-3xl font-black tracking-tight">
              Traveling to more countries?
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              We offer eSIM plans for 150+ destinations worldwide. Find the perfect plan for your trip.
            </p>
            <Button
              size="lg"
              className="rounded-2xl px-10 h-14 text-lg font-black"
              asChild
            >
              <Link href="/esim">
                Browse All Destinations <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>
    </>
  )
}
