"use client"

import dynamic from "next/dynamic"
import { ArrowRight, Gift, Globe, Zap, Wifi } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/components/providers/auth-provider"
import { CurrencySelector } from "@/components/common/currency-selector"
import { CircularFlag } from "@/components/common/circular-flag"
import { PlanCard } from "@/components/common/plan-card"
import { useTranslations } from "next-intl"
import Link from "next/link"
import Image from "next/image"

interface HomeProduct {
  id: string
  name: string
  slug: string
  provider: string
  price: number
  dataAmount: number | null
  dataUnit?: string | null
  validityDays: number | null
  countries: string[]
  networkType: string | null
  topUpAvailable: boolean
  providerLogo: string | null
  isUnlimited?: boolean
}

interface DestinationItem {
  slug: string
  code: string
  name: string
}

/* ─── Popular Destinations ─── */

export function PopularDestinations({
  destinations,
}: {
  destinations: DestinationItem[]
}) {
  return (
    <div className="flex gap-6 overflow-x-auto scrollbar-hide px-6 pb-2">
      {destinations.map((dest) => (
        <CircularFlag
          key={dest.slug}
          code={dest.code}
          name={dest.name}
          href={`/esim/${dest.slug}`}
        />
      ))}
    </div>
  )
}

/* ─── Products Section ─── */

export function ProductsSection({
  popularProducts,
  latestProducts,
}: {
  popularProducts: HomeProduct[]
  latestProducts: HomeProduct[]
}) {
  const t = useTranslations("home")
  const tc = useTranslations("common")

  return (
    <section className="py-8">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black tracking-tight">
            {t("esimDataPlans")}
          </h2>
          <div className="flex items-center gap-3">
            <CurrencySelector />
            <Button
              variant="outline"
              className="rounded-xl font-bold text-xs"
              asChild
            >
              <Link href="/products">
                {tc("viewAll")} <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="popular" className="w-full">
          <TabsList className="bg-muted/50 rounded-xl mb-4">
            <TabsTrigger
              value="popular"
              className="rounded-lg font-bold text-xs"
            >
              {t("mostPopular")}
            </TabsTrigger>
            <TabsTrigger
              value="latest"
              className="rounded-lg font-bold text-xs"
            >
              {t("latestAdded")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="popular">
            <ProductGrid products={popularProducts} />
          </TabsContent>

          <TabsContent value="latest">
            <ProductGrid products={latestProducts} />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  )
}

function ProductGrid({ products }: { products: HomeProduct[] }) {
  const t = useTranslations("home")

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t("noProductsAvailable")}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {products.slice(0, 6).map((product) => (
        <PlanCard key={product.id} product={product} />
      ))}
    </div>
  )
}

/* ─── How It Works ─── */

export function HowItWorks() {
  const t = useTranslations("home")

  const STEPS = [
    { title: t("step1Title"), description: t("step1Desc"), icon: Globe },
    { title: t("step2Title"), description: t("step2Desc"), icon: Zap },
    { title: t("step3Title"), description: t("step3Desc"), icon: Wifi },
  ]

  return (
    <section id="how-it-works" className="py-20 overflow-hidden">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 space-y-8">
            <div className="space-y-3">
              <Badge className="bg-primary/10 text-primary border-0 px-4 py-1.5 text-xs font-black uppercase">
                {t("howItWorksBadge")}
              </Badge>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight">
                {t("howItWorksTitle")} <br />
                <span className="text-primary italic">
                  {t("howItWorksHighlight")}
                </span>
              </h2>
            </div>

            <div className="space-y-10 pt-6">
              {STEPS.map((step, i) => (
                <div key={i} className="flex gap-5 group">
                  <div className="relative">
                    <div className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-black text-lg z-10 relative">
                      {i + 1}
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className="absolute top-11 left-1/2 -translate-x-1/2 w-0.5 h-12 bg-gradient-to-b from-primary to-transparent" />
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="text-lg font-bold group-hover:text-primary transition-colors">
                      {step.title}
                    </h4>
                    <p className="text-muted-foreground text-sm max-w-sm">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Button
              size="lg"
              className="rounded-2xl px-8 h-12 text-base font-black mt-6"
              asChild
            >
              <Link href="/products">
                {t("startBrowsing")} <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>

          <div className="flex-1 relative">
            <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full" />
            <div className="relative bg-card border-[12px] border-muted rounded-[3rem] p-1 shadow-2xl max-w-[320px] mx-auto overflow-hidden">
              <div className="bg-muted h-6 w-32 mx-auto rounded-full mt-2 mb-2" />
              <Image
                src="/app-screenshot.png"
                alt={t("appScreenshot")}
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
  )
}

/* ─── Referral Banner ─── */

export function ReferralBanner() {
  const t = useTranslations("home")

  return (
    <section className="py-10">
      <div className="max-w-5xl mx-auto px-6">
        <div className="rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-blue-500/10 border border-primary/20 p-6 md:p-10 flex flex-col md:flex-row items-center gap-6">
          <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
            <Gift className="h-7 w-7 text-primary" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-xl font-black tracking-tight mb-1">
              {t("referralTitle")}
            </h3>
            <p className="text-muted-foreground text-sm max-w-lg">
              {t("referralDesc")}
            </p>
          </div>
          <Button
            size="lg"
            className="rounded-2xl px-6 h-11 font-black text-sm shrink-0"
            asChild
          >
            <Link href="/referrals">
              {t("referralButton")}{" "}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

/* ─── CTA Section ─── */

export function CTASection() {
  const { openAuthModal } = useAuth()
  const t = useTranslations("home")

  return (
    <section id="about" className="py-16">
      <div className="max-w-5xl mx-auto px-6">
        <div className="relative rounded-[2rem] bg-foreground text-background overflow-hidden p-10 md:p-20 text-center space-y-6">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-72 h-72 bg-primary blur-[100px] opacity-20" />
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-72 h-72 bg-blue-500 blur-[100px] opacity-20" />

          <h2 className="text-3xl md:text-5xl font-black tracking-tight relative z-10">
            {t("ctaAdventureTitle")} <br />
            <span className="text-primary italic">
              {t("ctaAdventureHighlight")}
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto relative z-10">
            {t("ctaAdventureDesc")}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
            <Button
              size="lg"
              className="rounded-2xl px-10 h-14 text-lg font-black"
              asChild
            >
              <Link href="/products">{t("ctaGetEsim")}</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-2xl px-10 h-14 text-lg font-black border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all"
              onClick={() => openAuthModal("register")}
            >
              {t("ctaStartNow")}
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Lazy Reviews ─── */

const DynamicReviews = dynamic(
  () =>
    import("@/components/store/reviews-section").then(
      (mod) => mod.ReviewsSection,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="h-64 rounded-2xl bg-muted animate-pulse" />
        </div>
      </div>
    ),
  },
)

export function LazyReviewsSection() {
  return <DynamicReviews />
}
