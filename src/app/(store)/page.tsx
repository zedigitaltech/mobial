import { Suspense } from "react"
import {
  Globe,
  Zap,
  ShieldCheck,
  Star,
  ArrowRight,
  Smartphone,
  Wifi,
  BarChart3,
  RefreshCw,
  Gift,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TrustBadges } from "@/components/store/trust-badges"
import { DestinationSearch } from "@/components/common/destination-search"
import { OrganizationJsonLd, WebSiteJsonLd, BreadcrumbJsonLd } from "@/components/common/json-ld"
import { regions } from "@/lib/regions"
import { getProducts } from "@/services/product-service"
import { getTranslations } from "next-intl/server"
import Link from "next/link"
import { ProductsSection, CTASection, LazyReviewsSection } from "./home-client"

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
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="h-8 w-48 rounded bg-muted animate-pulse mb-8" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border/50 p-5 space-y-4">
              <div className="flex justify-between">
                <div className="h-5 w-16 rounded bg-muted animate-pulse" />
                <div className="h-5 w-12 rounded bg-muted animate-pulse" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-full rounded bg-muted animate-pulse" />
                <div className="h-3 w-2/3 rounded bg-muted animate-pulse" />
              </div>
              <div className="h-7 w-16 rounded bg-muted animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default async function HomePage() {
  const t = await getTranslations('home')

  const STEPS = [
    {
      title: t('step1Title'),
      description: t('step1Desc'),
      icon: Globe,
    },
    {
      title: t('step2Title'),
      description: t('step2Desc'),
      icon: Zap,
    },
    {
      title: t('step3Title'),
      description: t('step3Desc'),
      icon: Wifi,
    },
  ]

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
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                <Star className="h-3 w-3 fill-current" />
                {t('trustedBadge')}
              </div>

              <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1]">
                {t('heroTitleLine1')} <br />
                <span className="text-primary italic">{t('heroTitleLine2')}</span> {t('heroTitleSuffix')}
              </h1>

              <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
                {t('heroDescription')}
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
                      <span className="text-lg mr-2">{REGION_EMOJI[region.slug] || "\u{1F30D}"}</span>
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
                <h3 className="font-bold text-sm">{t('quickCheckUsage')}</h3>
                <p className="text-[10px] text-muted-foreground mt-1">{t('quickCheckUsageDesc')}</p>
              </Link>
              <Link
                href="/topup"
                className="p-5 rounded-2xl bg-card border border-border/50 hover:shadow-lg hover:border-primary/20 transition-all group text-center"
              >
                <RefreshCw className="h-7 w-7 text-emerald-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <h3 className="font-bold text-sm">{t('quickTopUp')}</h3>
                <p className="text-[10px] text-muted-foreground mt-1">{t('quickTopUpDesc')}</p>
              </Link>
              <Link
                href="/esim"
                className="p-5 rounded-2xl bg-card border border-border/50 hover:shadow-lg hover:border-primary/20 transition-all group text-center"
              >
                <Globe className="h-7 w-7 text-blue-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <h3 className="font-bold text-sm">{t('quickDestinations')}</h3>
                <p className="text-[10px] text-muted-foreground mt-1">{t('quickDestinationsDesc')}</p>
              </Link>
              <Link
                href="/compatible-devices"
                className="p-5 rounded-2xl bg-card border border-border/50 hover:shadow-lg hover:border-primary/20 transition-all group text-center"
              >
                <Smartphone className="h-7 w-7 text-amber-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <h3 className="font-bold text-sm">{t('quickCompatibility')}</h3>
                <p className="text-[10px] text-muted-foreground mt-1">{t('quickCompatibilityDesc')}</p>
              </Link>
            </div>
          </div>
        </section>

        {/* Product Offers — streamed in via Suspense */}
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
                  title: t('featureInstantTitle'),
                  description: t('featureInstantDesc'),
                  color: "text-amber-500",
                },
                {
                  icon: Globe,
                  title: t('featureGlobalTitle'),
                  description: t('featureGlobalDesc'),
                  color: "text-blue-500",
                },
                {
                  icon: ShieldCheck,
                  title: t('featureSecureTitle'),
                  description: t('featureSecureDesc'),
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
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Browse by Region */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center space-y-4 mb-12">
              <Badge className="bg-primary/10 text-primary border-0 px-4 py-1.5 text-xs font-black uppercase tracking-wider">
                <Globe className="h-3 w-3 mr-1" /> {t('destinationsBadge')}
              </Badge>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight">
                {t('browseByRegion')}
              </h2>
            </div>
            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-hide md:grid md:grid-cols-3 lg:grid-cols-6 md:overflow-visible md:snap-none md:pb-0 max-w-5xl mx-auto">
              {regions.map((region) => (
                <Link
                  key={region.slug}
                  href={`/esim/region/${region.slug}`}
                  className="min-w-[140px] snap-start p-6 rounded-2xl bg-card border border-border/50 hover:shadow-xl hover:border-primary/20 transition-all group text-center shrink-0 md:shrink md:min-w-0"
                >
                  <div className="text-3xl mx-auto mb-3 group-hover:scale-110 transition-transform">
                    {REGION_EMOJI[region.slug] || "\u{1F30D}"}
                  </div>
                  <h3 className="font-bold text-sm group-hover:text-primary transition-colors">
                    {region.name}
                  </h3>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {t('countriesCount', { count: region.countries.length })}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section id="how-it-works" className="py-32 overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <div className="flex-1 space-y-8">
                <div className="space-y-4">
                  <Badge className="bg-primary/10 text-primary border-0 px-4 py-1.5 text-xs font-black uppercase">
                    {t('howItWorksBadge')}
                  </Badge>
                  <h2 className="text-4xl md:text-5xl font-black tracking-tight">
                    {t('howItWorksTitle')} <br />
                    <span className="text-primary italic">{t('howItWorksHighlight')}</span>
                  </h2>
                </div>

                <div className="space-y-12 pt-8">
                  {STEPS.map((step, i) => (
                    <div key={i} className="flex gap-6 group">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-black text-xl z-10 relative">
                          {i + 1}
                        </div>
                        {i < STEPS.length - 1 && (
                          <div className="absolute top-12 left-1/2 -translate-x-1/2 w-0.5 h-16 bg-gradient-to-b from-primary to-transparent" />
                        )}
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-xl font-bold group-hover:text-primary transition-colors">
                          {step.title}
                        </h4>
                        <p className="text-muted-foreground max-w-sm">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Button size="lg" className="rounded-2xl px-10 h-14 text-lg font-black mt-8" asChild>
                  <Link href="/products">
                    Start Browsing <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>

              <div className="flex-1 relative">
                <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full" />
                <div className="relative bg-card border-[12px] border-muted rounded-[3rem] p-1 shadow-2xl max-w-[320px] mx-auto overflow-hidden">
                  <div className="bg-muted h-6 w-32 mx-auto rounded-full mt-2 mb-2" />
                  <Image
                    src="/app-screenshot.png"
                    alt="Mobial eSIM App - Browse eSIM plans for 150+ countries"
                    width={296}
                    height={580}
                    className="rounded-[1.5rem] w-full"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <LazyReviewsSection />

        {/* Referral Banner */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="rounded-[2rem] bg-gradient-to-r from-primary/10 via-primary/5 to-blue-500/10 border border-primary/20 p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
              <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Gift className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-black tracking-tight mb-2">
                  {t('referralTitle')}
                </h3>
                <p className="text-muted-foreground max-w-lg">
                  {t('referralDesc')}
                </p>
              </div>
              <Button
                size="lg"
                className="rounded-2xl px-8 h-12 font-black text-sm flex-shrink-0"
                asChild
              >
                <Link href="/referrals">
                  {t('referralButton')} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* CTA Section (Client Component - needs auth) */}
        <CTASection />

    </div>
  )
}
