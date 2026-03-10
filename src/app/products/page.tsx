"use client"

import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  SlidersHorizontal,
  X,
  MapPin,
  Wifi,
  Loader2,
  Calendar,
  Zap,
  ShieldCheck,
  TrendingUp
} from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { CartDrawer } from "@/components/store/cart-drawer"
import { ProductCard } from "@/components/common/product-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { useSearchParams } from "next/navigation"
import { useCart } from "@/contexts/cart-context"
import { ErrorBoundary } from "@/components/common/error-boundary"
import { cn } from "@/lib/utils"

// Types
interface Product {
  id: string
  name: string
  slug: string
  provider: string
  dataAmount: number | null
  dataUnit: string | null
  validityDays: number | null
  countries: string[]
  price: number
  originalPrice: number | null
  isUnlimited: boolean
  networks?: string
  bestFitReason?: string
}

interface ProductsResponse {
  success: boolean
  data: {
    products: Product[]
    pagination: {
      total: number
      limit: number
      offset: number
      hasMore: boolean
    }
  }
}

// Fetch products
async function fetchProducts(params: {
  country?: string
  region?: string
  search?: string
  sortBy?: string
  limit?: number
  offset?: number
}): Promise<ProductsResponse> {
  const searchParams = new URLSearchParams()
  if (params.country) searchParams.set("country", params.country)
  if (params.region) searchParams.set("region", params.region)
  if (params.search) searchParams.set("search", params.search)
  if (params.sortBy) searchParams.set("sortBy", params.sortBy)
  searchParams.set("limit", (params.limit || 50).toString())
  searchParams.set("offset", (params.offset || 0).toString())

  const response = await fetch(`/api/products?${searchParams.toString()}`)
  if (!response.ok) throw new Error("Failed to fetch products")
  return response.json()
}

export default function ProductsPage() {
  const { addItem, isInCart } = useCart()
  const searchParams = useSearchParams()
  
  // Trip Planner State
  const [duration, setDuration] = useState(7)
  const [usageType, setUsageType] = useState<"light" | "balanced" | "heavy">("balanced")
  const [search, setSearch] = useState(searchParams.get('search') || "")
  const [debouncedSearch, setDebouncedSearch] = useState(search)

  const country = searchParams.get('country')
  const region = searchParams.get('region')

  // Queries
  const { data: productsData, isLoading } = useQuery({
    queryKey: ["products", debouncedSearch, country, region],
    queryFn: () => fetchProducts({
      search: debouncedSearch || undefined,
      country: country || undefined,
      region: region || undefined,
    }),
  })

  const products = productsData?.data?.products || []

  // THE TRIP FIT ENGINE LOGIC
  const rankedProducts = useMemo(() => {
    if (!products.length) return []

    return products.map(p => {
      let score = 0
      let reason = p.bestFitReason || ""

      // Rule 1: Validity check
      if ((p.validityDays || 0) < duration) score -= 50
      
      // Rule 2: Usage Match
      const gb = p.dataAmount || 0
      if (usageType === "light" && gb <= 5 && gb > 0) {
        score += 30
        if (!reason) reason = "Perfect for casual use"
      }
      if (usageType === "heavy" && (gb >= 20 || p.isUnlimited)) {
        score += 40
        if (!reason) reason = "Best for Hotspot/Video"
      }

      // Rule 3: Price Efficiency
      const pricePerDay = p.price / duration
      if (pricePerDay < 1) score += 20

      return { ...p, score, displayReason: reason }
    }).sort((a, b) => b.score - a.score)
  }, [products, duration, usageType])

  const handleBuy = (productId: string) => {
    const product = products.find(p => p.id === productId)
    if (product && !isInCart(product.id)) {
      addItem({
        productId: product.id,
        name: product.name,
        provider: product.provider,
        price: product.price,
        originalPrice: product.originalPrice,
        dataAmount: product.dataAmount,
        dataUnit: product.dataUnit,
        validityDays: product.validityDays,
      })
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Sticky Trip Planner Rail */}
        <div className="sticky top-16 z-40 w-full border-b bg-background/80 backdrop-blur-2xl px-4 py-4">
          <div className="container mx-auto flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 w-full lg:w-auto">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 lg:w-64">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Trip Duration: {duration} Days</p>
                <Slider 
                  value={[duration]} 
                  onValueChange={(v) => setDuration(v[0])} 
                  max={30} 
                  min={1} 
                  step={1} 
                />
              </div>
            </div>

            <div className="flex bg-muted/50 p-1 rounded-xl w-full lg:w-auto">
              {(["light", "balanced", "heavy"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setUsageType(type)}
                  className={cn(
                    "flex-1 px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
                    usageType === type ? "bg-card text-primary shadow-lg" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="relative w-full lg:w-72 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                placeholder="Filter by country..."
                className="w-full h-11 bg-muted/50 border-0 rounded-xl pl-10 text-sm font-medium outline-none focus:ring-2 ring-primary/20 transition-all"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setTimeout(() => setDebouncedSearch(e.target.value), 300)
                }}
              />
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground">Analyzing Best Fits...</p>
            </div>
          ) : (
            <div className="space-y-12">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-black tracking-tight">Recommended Plans</h2>
                  <p className="text-muted-foreground font-medium">Ranked by your trip duration and usage style.</p>
                </div>
                <Badge variant="outline" className="h-8 rounded-full border-primary/20 text-primary font-bold">
                  {rankedProducts.length} Plans Available
                </Badge>
              </div>

              {rankedProducts.length === 0 ? (
                <div className="text-center py-32 bg-card rounded-[3rem] border border-dashed border-border/50">
                  <div className="w-20 h-20 bg-muted rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                    <X className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-2xl font-black">No matching plans</h3>
                  <p className="text-muted-foreground">Try adjusting your filters or search terms.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {rankedProducts.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <ProductCard
                        product={{
                          ...product,
                          bestFitReason: product.displayReason
                        }}
                        onBuy={handleBuy}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
      <CartDrawer />
    </div>
  )
}
