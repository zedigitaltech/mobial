import { Suspense } from "react"
import { Globe, Zap, ShieldCheck } from "lucide-react"
import { TrustBadges } from "@/components/store/trust-badges"
import { DestinationSearch } from "@/components/common/destination-search"
import {
  OrganizationJsonLd,
  WebSiteJsonLd,
  BreadcrumbJsonLd,
} from "@/components/common/json-ld"
import { countries, TOP_DESTINATIONS } from "@/lib/countries"
import { getProducts } from "@/services/product-service"
import { getTranslations } from "next-intl/server"
import Image from "next/image"
import {
  ProductsSection,
  CTASection,
  LazyReviewsSection,
  PopularDestinations,
  HowItWorks,
  ReferralBanner,
} from "./home-client"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://mobialo.eu"

async function HomepageProducts() {
  const [popularResult, latestResult] = await Promise.all([
    getProducts({ sortBy: "rank", category: "esim_realtime", limit: 8 }),
    getProducts({ sortBy: "createdAt", category: "esim_realtime", limit: 8 }),
  ])

  const mapProduct = (p: (typeof popularResult.products)[number]) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    provider: p.provider,
    price: p.price,
    dataAmount: p.dataAmount,
    validityDays: p.validityDays,
    countries: p.countries,
    networkType: p.networkType,
    topUpAvailable: p.topUpAvailable,
    providerLogo: p.providerLogo,
    isUnlimited: p.isUnlimited,
    dataUnit: p.dataUnit,
  })

  return (
    <ProductsSection
      popularProducts={popularResult.products.map(mapProduct)}
      latestProducts={latestResult.products.map(mapProduct)}
    />
  )
}

function ProductsSkeleton() {
  return (
    <section className="py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="h-7 w-40 rounded bg-muted animate-pulse mb-6" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border/30 bg-card p-4 space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-20 rounded bg-muted animate-pulse" />
                  <div className="h-4 w-40 rounded bg-muted animate-pulse" />
                </div>
              </div>
              <div className="flex border-y border-border/30 py-3">
                <div className="flex-1 text-center space-y-1">
                  <div className="h-5 w-8 mx-auto rounded bg-muted animate-pulse" />
                  <div className="h-2 w-12 mx-auto rounded bg-muted animate-pulse" />
                </div>
                <div className="flex-1 text-center space-y-1">
                  <div className="h-5 w-8 mx-auto rounded bg-muted animate-pulse" />
                  <div className="h-2 w-12 mx-auto rounded bg-muted animate-pulse" />
                </div>
                <div className="flex-1 text-center space-y-1">
                  <div className="h-5 w-12 mx-auto rounded bg-muted animate-pulse" />
                  <div className="h-2 w-12 mx-auto rounded bg-muted animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function getPopularDestinations() {
  return TOP_DESTINATIONS.slice(0, 12)
    .map((slug) => {
      const country = countries[slug]
      return country
        ? { slug, code: country.code, name: country.name }
        : null
    })
    .filter(Boolean) as Array<{ slug: string; code: string; name: string }>
}

export default async function HomePage() {
  const t = await getTranslations("home")
  const destinations = getPopularDestinations()

  return (
    <div className="selection:bg-primary/20">
      <OrganizationJsonLd baseUrl={BASE_URL} />
      <WebSiteJsonLd baseUrl={BASE_URL} />
      <BreadcrumbJsonLd baseUrl={BASE_URL} items={[{ name: "Home" }]} />

      {/* Hero Section */}
      <section className="relative pt-16 pb-8 overflow-hidden">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--primary)_0%,_transparent_70%)] opacity-[0.03]" />
          <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
        </div>

        <div className="max-w-4xl mx-auto px-6 space-y-8">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="MobiaL"
              width={28}
              height={28}
              className="h-7 w-auto"
            />
            <span className="text-lg font-bold tracking-wide">mobialo</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1]">
            {t("heroTitleLine1")} <br />
            <span className="text-primary italic">
              {t("heroTitleLine2")}
            </span>{" "}
            {t("heroTitleSuffix")}
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl font-medium">
            {t("heroDescription")}
          </p>

          <p className="text-sm font-bold text-primary/80 -mt-4">
            {t("heroJustLanded")}
          </p>

          <DestinationSearch />

          <TrustBadges />
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-lg font-extrabold px-6 mb-4">
            {t("popularDestinations")}
          </h2>
          <PopularDestinations destinations={destinations} />
        </div>
      </section>

      {/* Products */}
      <Suspense fallback={<ProductsSkeleton />}>
        <HomepageProducts />
      </Suspense>

      {/* Features Grid */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                title: t("featureInstantTitle"),
                description: t("featureInstantDesc"),
                color: "text-amber-500",
              },
              {
                icon: Globe,
                title: t("featureGlobalTitle"),
                description: t("featureGlobalDesc"),
                color: "text-blue-500",
              },
              {
                icon: ShieldCheck,
                title: t("featureSecureTitle"),
                description: t("featureSecureDesc"),
                color: "text-primary",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-card border border-border/30 hover:shadow-lg transition-all group"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-muted group-hover:scale-110 transition-transform">
                  <feature.icon
                    className={`h-6 w-6 ${feature.color}`}
                  />
                </div>
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <HowItWorks />
      <LazyReviewsSection />
      <ReferralBanner />
      <CTASection />
    </div>
  )
}
