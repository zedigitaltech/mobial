"use client"

import dynamic from "next/dynamic"
import {
  ArrowRight,
  Wifi,
  TrendingUp,
  ChevronRight,
  Gift,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselDots,
} from "@/components/ui/carousel"
import { useAuth } from "@/components/providers/auth-provider"
import { CurrencySelector } from "@/components/common/currency-selector"
import { useCurrency } from "@/contexts/currency-context"
import { useIsMobile } from "@/hooks/use-is-mobile"
import { useTranslations } from "next-intl"
import { HomeProduct } from "@/types/product"
import Link from "next/link"

type Product = HomeProduct

export function ProductsSection({
  popularProducts,
  latestProducts,
}: {
  popularProducts: Product[]
  latestProducts: Product[]
}) {
  const { formatPrice } = useCurrency()
  const t = useTranslations('home')
  const tc = useTranslations('common')

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Badge className="bg-primary/10 text-primary border-0 px-4 py-1.5 text-xs font-black uppercase tracking-wider mb-3">
              <TrendingUp className="h-3 w-3 mr-1" /> {t('liveOffers')}
            </Badge>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">
              {t('esimDataPlans')}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <CurrencySelector />
            <Button variant="outline" className="rounded-xl font-bold text-xs" asChild>
              <Link href="/products">
                {tc('viewAll')} <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="popular" className="w-full">
          <TabsList className="bg-muted/50 rounded-xl mb-6">
            <TabsTrigger value="popular" className="rounded-lg font-bold text-xs">
              {t('mostPopular')}
            </TabsTrigger>
            <TabsTrigger value="latest" className="rounded-lg font-bold text-xs">
              {t('latestAdded')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="popular">
            <ProductGrid products={popularProducts} formatPrice={formatPrice} />
          </TabsContent>

          <TabsContent value="latest">
            <ProductGrid products={latestProducts} formatPrice={formatPrice} />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  )
}

export function CTASection() {
  const { openAuthModal } = useAuth()
  const t = useTranslations('home')

  return (
    <section id="about" className="py-20">
      <div className="container mx-auto px-4">
        <div className="relative rounded-[3rem] bg-foreground text-background overflow-hidden p-12 md:p-24 text-center space-y-8">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-primary blur-[100px] opacity-20" />
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-blue-500 blur-[100px] opacity-20" />

          <h2 className="text-4xl md:text-6xl font-black tracking-tight relative z-10">
            {t('ctaAdventureTitle')} <br />
            <span className="text-primary italic">{t('ctaAdventureHighlight')}</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto relative z-10">
            {t('ctaAdventureDesc')}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
            <Button size="lg" className="rounded-2xl px-12 h-16 text-xl font-black" asChild>
              <Link href="/products">{t('ctaGetEsim')}</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-2xl px-12 h-16 text-xl font-black border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all"
              onClick={() => openAuthModal("register")}
            >
              {t('ctaStartNow')}
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

function ProductCard({
  product,
  formatPrice,
  viewLabel,
}: {
  product: Product
  formatPrice: (amount: number) => string
  viewLabel: string
}) {
  return (
    <Link href={`/products/${product.slug || product.id}`}>
      <Card className="group hover:shadow-xl transition-all border-border/50 h-full">
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
            <h3 className="font-bold text-sm line-clamp-2 group-hover:text-primary transition-colors">
              {product.name}
            </h3>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
              {product.dataAmount && (
                <span>
                  {product.dataAmount >= 1
                    ? `${product.dataAmount} GB`
                    : `${product.dataAmount * 1000} MB`}
                </span>
              )}
              {product.validityDays && <span>{product.validityDays}d</span>}
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <span className="text-xl font-black" suppressHydrationWarning>{formatPrice(product.price)}</span>
            <span className="text-xs font-bold text-primary group-hover:translate-x-1 transition-transform flex items-center">
              {viewLabel} <ChevronRight className="h-3 w-3 ml-0.5" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function ProductGrid({
  products,
  formatPrice,
}: {
  products: Product[]
  formatPrice: (amount: number) => string
}) {
  const t = useTranslations('home')
  const tc = useTranslations('common')
  const isMobile = useIsMobile()

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t('noProductsAvailable')}</p>
      </div>
    )
  }

  const items = products.slice(0, 8)

  if (isMobile) {
    return (
      <Carousel opts={{ align: "start", loop: false, dragFree: true }}>
        <CarouselContent className="-ml-3">
          {items.map((product) => (
            <CarouselItem key={product.id} className="pl-3 basis-[75%]">
              <ProductCard product={product} formatPrice={formatPrice} viewLabel={tc('view')} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselDots />
      </Carousel>
    )
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((product) => (
        <ProductCard key={product.id} product={product} formatPrice={formatPrice} viewLabel={tc('view')} />
      ))}
    </div>
  )
}

const DynamicReviews = dynamic(
  () => import("@/components/store/reviews-section").then((mod) => mod.ReviewsSection),
  {
    ssr: false,
    loading: () => (
      <div className="py-16">
        <div className="container mx-auto px-4">
          <div className="h-64 rounded-2xl bg-muted animate-pulse" />
        </div>
      </div>
    ),
  }
)

export function LazyReviewsSection() {
  return <DynamicReviews />
}
