import { Suspense } from "react"
import {
  Globe,
  Zap,
  ShieldCheck,
  Star,
  BarChart3,
  RefreshCw,
  Smartphone,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { TrustBadges } from "@/components/store/trust-badges"
import { DestinationSearch } from "@/components/common/destination-search"
import {
  OrganizationJsonLd,
  WebSiteJsonLd,
  BreadcrumbJsonLd,
} from "@/components/common/json-ld"
import { regions } from "@/lib/regions"
import { getProducts } from "@/services/product-service"
import { getTranslations } from "next-intl/server"
import Link from "next/link"
import {
  ProductsSection,
  CTASection,
  LazyReviewsSection,
  HowItWorks,
  ReferralBanner,
} from "./home-client"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://mobialo.eu"

const REGION_EMOJI: Record<string, string> = {
  europe: "\u{1F1EA}\u{1F1FA}",
  asia: "\u{1F30F}",
  americas: "\u{1F30E}",
  "middle-east": "\u{1F54C}",
  oceania: "\u{1F3DD}\uFE0F",
  africa: "\u{1F30D}",
}

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

export default async function HomePage() {
  const t = await getTranslations("home")

  return (
    <div className="selection:bg-primary/20">
      <OrganizationJsonLd baseUrl={BASE_URL} />
      <WebSiteJsonLd baseUrl={BASE_URL} />
      <BreadcrumbJsonLd baseUrl={BASE_URL} items={[{ name: "Home" }]} />

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--primary)_0%,_transparent_70%)] opacity-[0.03]" />
          <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute -bottom-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse" />
        </div>

        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Trusted badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
              <Star className="h-3 w-3 fill-current" />
              {t("trustedBadge")}
            </div>

            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1]">
              {t("heroTitleLine1")} <br />
              <span className="text-primary italic">{t("heroTitleLine2")}</span>{" "}
              {t("heroTitleSuffix")}
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
              {t("heroDescription")}
            </p>

            <DestinationSearch />

            {/* Region Quick Links */}
            <div className="flex flex-wrap justify-center gap-3 pt-4">
              {regions.slice(0, 4).map((region) => (
                <Button
                  key={region.slug}
                  variant="outline"
                  className="rounded-full bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all hover:scale-105 h-12 px-6"
                  asChild
                >
                  <Link href={`/esim/region/${region.slug}`}>
                    <span className="text-lg mr-2">
                      {REGION_EMOJI[region.slug] || "\u{1F30D}"}
                    </span>
                    <span className="font-semibold">{region.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {region.countries.length}+
                    </span>
                  </Link>
                </Button>
              ))}
            </div>

            <TrustBadges />
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-8 -mt-16 relative z-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <Link
              href="/check-usage"
              className="p-5 rounded-2xl bg-card border border-border/50 hover:shadow-lg hover:border-primary/20 transition-all group text-center"
            >
              <BarChart3 className="h-7 w-7 text-primary mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-sm">{t("quickCheckUsage")}</h3>
              <p className="text-[10px] text-muted-foreground mt-1">
                {t("quickCheckUsageDesc")}
              </p>
            </Link>
            <Link
              href="/topup"
              className="p-5 rounded-2xl bg-card border border-border/50 hover:shadow-lg hover:border-primary/20 transition-all group text-center"
            >
              <RefreshCw className="h-7 w-7 text-emerald-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-sm">{t("quickTopUp")}</h3>
              <p className="text-[10px] text-muted-foreground mt-1">
                {t("quickTopUpDesc")}
              </p>
            </Link>
            <Link
              href="/esim"
              className="p-5 rounded-2xl bg-card border border-border/50 hover:shadow-lg hover:border-primary/20 transition-all group text-center"
            >
              <Globe className="h-7 w-7 text-blue-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-sm">{t("quickDestinations")}</h3>
              <p className="text-[10px] text-muted-foreground mt-1">
                {t("quickDestinationsDesc")}
              </p>
            </Link>
            <Link
              href="/compatible-devices"
              className="p-5 rounded-2xl bg-card border border-border/50 hover:shadow-lg hover:border-primary/20 transition-all group text-center"
            >
              <Smartphone className="h-7 w-7 text-amber-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-sm">{t("quickCompatibility")}</h3>
              <p className="text-[10px] text-muted-foreground mt-1">
                {t("quickCompatibilityDesc")}
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* Products */}
      <Suspense fallback={<ProductsSkeleton />}>
        <HomepageProducts />
      </Suspense>

      {/* Features Grid */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
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
                className="p-8 rounded-3xl bg-card border border-border/50 shadow-sm hover:shadow-xl transition-all group"
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-muted group-hover:scale-110 transition-transform">
                  <feature.icon className={`h-8 w-8 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
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
