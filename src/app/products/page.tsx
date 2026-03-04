"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import {
  Search,
  SlidersHorizontal,
  X,
  MapPin,
  Wifi,
  Loader2
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
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useCart } from "@/contexts/cart-context"

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
  isFeatured: boolean
  supportsHotspot: boolean
  supportsCalls: boolean
  supportsSms: boolean
}

interface ProductsResponse {
  products: Product[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

interface Country {
  code: string
  name: string
  productCount: number
}

interface Provider {
  name: string
  productCount: number
}

// Fetch products
async function fetchProducts(params: {
  country?: string
  provider?: string
  minPrice?: number
  maxPrice?: number
  sortBy?: string
  search?: string
  limit?: number
  offset?: number
}): Promise<ProductsResponse> {
  const searchParams = new URLSearchParams()
  
  if (params.country) searchParams.set("country", params.country)
  if (params.provider) searchParams.set("provider", params.provider)
  if (params.minPrice !== undefined) searchParams.set("minPrice", params.minPrice.toString())
  if (params.maxPrice !== undefined) searchParams.set("maxPrice", params.maxPrice.toString())
  if (params.sortBy) searchParams.set("sortBy", params.sortBy)
  if (params.search) searchParams.set("search", params.search)
  if (params.limit) searchParams.set("limit", params.limit.toString())
  if (params.offset) searchParams.set("offset", params.offset.toString())

  const response = await fetch(`/api/products?${searchParams.toString()}`)
  if (!response.ok) throw new Error("Failed to fetch products")
  return response.json()
}

// Fetch countries
async function fetchCountries(): Promise<Country[]> {
  const response = await fetch("/api/products/countries")
  if (!response.ok) throw new Error("Failed to fetch countries")
  return response.json()
}

// Fetch providers
async function fetchProviders(): Promise<Provider[]> {
  const response = await fetch("/api/products/providers")
  if (!response.ok) throw new Error("Failed to fetch providers")
  return response.json()
}

// Sort options
const sortOptions = [
  { value: "createdAt", label: "Newest First" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "name", label: "Name: A to Z" },
  { value: "validity", label: "Longest Validity" },
  { value: "data", label: "Most Data" },
]

// Filter Content Component
interface FilterContentProps {
  countries: Country[]
  providers: Provider[]
  selectedCountry: string
  setSelectedCountry: (v: string) => void
  selectedProviders: string[]
  toggleProvider: (name: string) => void
  priceRange: [number, number]
  setPriceRange: (v: [number, number]) => void
  hasActiveFilters: boolean
  clearFilters: () => void
  setPageZero: () => void
}

function FilterContent({
  countries,
  providers,
  selectedCountry,
  setSelectedCountry,
  selectedProviders,
  toggleProvider,
  priceRange,
  setPriceRange,
  hasActiveFilters,
  clearFilters,
  setPageZero,
}: FilterContentProps) {
  return (
    <div className="space-y-6">
      {/* Country Filter */}
      <div className="space-y-3">
        <Label className="text-sm font-medium flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Coverage Country
        </Label>
        <Select value={selectedCountry} onValueChange={(v) => { setSelectedCountry(v); setPageZero() }}>
          <SelectTrigger>
            <SelectValue placeholder="All countries" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All countries</SelectItem>
            {countries.map((country) => (
              <SelectItem key={country.code} value={country.code}>
                {country.name} ({country.productCount})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Provider Filter */}
      <div className="space-y-3">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Wifi className="h-4 w-4" />
          Providers
        </Label>
        <ScrollArea className="h-40">
          <div className="space-y-2">
            {providers.map((provider) => (
              <div key={provider.name} className="flex items-center space-x-2">
                <Checkbox
                  id={`provider-${provider.name}`}
                  checked={selectedProviders.includes(provider.name)}
                  onCheckedChange={() => toggleProvider(provider.name)}
                />
                <label
                  htmlFor={`provider-${provider.name}`}
                  className="text-sm cursor-pointer flex-1 flex justify-between"
                >
                  <span>{provider.name}</span>
                  <span className="text-muted-foreground">({provider.productCount})</span>
                </label>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Price Range */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">
          Price Range: ${priceRange[0]} - ${priceRange[1]}
        </Label>
        <Slider
          value={priceRange}
          onValueChange={(v) => { setPriceRange(v as [number, number]); setPageZero() }}
          max={200}
          step={5}
          className="py-4"
        />
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button variant="outline" className="w-full" onClick={clearFilters}>
          <X className="h-4 w-4 mr-2" />
          Clear All Filters
        </Button>
      )}
    </div>
  )
}

export default function ProductsPage() {
  const { addItem, isInCart } = useCart()

  // Filter state
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [selectedCountry, setSelectedCountry] = useState<string>("")
  const [selectedProviders, setSelectedProviders] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200])
  const [sortBy, setSortBy] = useState("createdAt")
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [page, setPage] = useState(0)
  const limit = 12

  // Debounce search
  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(0)
    // Debounce
    setTimeout(() => {
      setDebouncedSearch(value)
    }, 300)
  }

  // Queries
  const { data: productsData, isLoading: productsLoading, error: productsError } = useQuery({
    queryKey: ["products", debouncedSearch, selectedCountry, selectedProviders, priceRange, sortBy, page],
    queryFn: () => fetchProducts({
      search: debouncedSearch || undefined,
      country: selectedCountry || undefined,
      provider: selectedProviders.length === 1 ? selectedProviders[0] : undefined,
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
      sortBy,
      limit,
      offset: page * limit,
    }),
  })

  const { data: countries = [] } = useQuery({
    queryKey: ["countries"],
    queryFn: fetchCountries,
  })

  const { data: providers = [] } = useQuery({
    queryKey: ["providers"],
    queryFn: fetchProviders,
  })

  // Handle provider toggle
  const toggleProvider = (providerName: string) => {
    setSelectedProviders(prev =>
      prev.includes(providerName)
        ? prev.filter(p => p !== providerName)
        : [...prev, providerName]
    )
    setPage(0)
  }

  // Clear all filters
  const clearFilters = () => {
    setSearch("")
    setDebouncedSearch("")
    setSelectedCountry("")
    setSelectedProviders([])
    setPriceRange([0, 200])
    setSortBy("createdAt")
    setPage(0)
  }

  const hasActiveFilters = search || selectedCountry || selectedProviders.length > 0 || priceRange[0] > 0 || priceRange[1] < 200

  // Handle buy
  const handleBuy = (product: Product) => {
    if (!isInCart(product.id)) {
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

  const activeFilterCount = [
    selectedCountry,
    ...selectedProviders,
    ...(priceRange[0] > 0 || priceRange[1] < 200 ? ["price"] : []),
  ].filter(Boolean).length

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-8 border-b bg-muted/20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl"
            >
              <h1 className="text-3xl font-bold mb-2">Browse eSIM Plans</h1>
              <p className="text-muted-foreground">
                Find the perfect eSIM for your travel needs. Filter by country, provider, and price.
              </p>
            </motion.div>
          </div>
        </section>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Search and Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setPage(0) }}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Mobile Filters */}
            <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="outline" className="relative">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filters
                  {activeFilterCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px]">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <FilterContent
                    countries={countries}
                    providers={providers}
                    selectedCountry={selectedCountry}
                    setSelectedCountry={setSelectedCountry}
                    selectedProviders={selectedProviders}
                    toggleProvider={toggleProvider}
                    priceRange={priceRange}
                    setPriceRange={setPriceRange}
                    hasActiveFilters={hasActiveFilters}
                    clearFilters={clearFilters}
                    setPageZero={() => setPage(0)}
                  />
                </div>
              </SheetContent>
            </Sheet>

            {/* Cart */}
            <CartDrawer />
          </div>

          <div className="flex gap-8">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-24 space-y-6 p-4 rounded-lg border bg-card">
                <h3 className="font-semibold flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                </h3>
                <Separator />
                <FilterContent
                  countries={countries}
                  providers={providers}
                  selectedCountry={selectedCountry}
                  setSelectedCountry={setSelectedCountry}
                  selectedProviders={selectedProviders}
                  toggleProvider={toggleProvider}
                  priceRange={priceRange}
                  setPriceRange={setPriceRange}
                  hasActiveFilters={hasActiveFilters}
                  clearFilters={clearFilters}
                  setPageZero={() => setPage(0)}
                />
              </div>
            </aside>

            {/* Products Grid */}
            <div className="flex-1">
              {/* Active Filters Tags */}
              {hasActiveFilters && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedCountry && (
                    <Badge variant="secondary" className="gap-1">
                      Country: {countries.find(c => c.code === selectedCountry)?.name}
                      <button onClick={() => { setSelectedCountry(""); setPage(0) }}>
                        <X className="h-3 w-3 ml-1" />
                      </button>
                    </Badge>
                  )}
                  {selectedProviders.map((provider) => (
                    <Badge key={provider} variant="secondary" className="gap-1">
                      {provider}
                      <button onClick={() => toggleProvider(provider)}>
                        <X className="h-3 w-3 ml-1" />
                      </button>
                    </Badge>
                  ))}
                  {(priceRange[0] > 0 || priceRange[1] < 200) && (
                    <Badge variant="secondary" className="gap-1">
                      ${priceRange[0]} - ${priceRange[1]}
                      <button onClick={() => { setPriceRange([0, 200]); setPage(0) }}>
                        <X className="h-3 w-3 ml-1" />
                      </button>
                    </Badge>
                  )}
                </div>
              )}

              {/* Loading State */}
              {productsLoading && (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}

              {/* Error State */}
              {productsError && (
                <div className="text-center py-20">
                  <p className="text-destructive">Failed to load products. Please try again.</p>
                  <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                    Retry
                  </Button>
                </div>
              )}

              {/* Products */}
              {productsData && (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    Showing {productsData.products.length} of {productsData.pagination.total} products
                  </p>

                  {productsData.products.length === 0 ? (
                    <div className="text-center py-20">
                      <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                        <Search className="h-10 w-10 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">No products found</h3>
                      <p className="text-muted-foreground mb-4">
                        Try adjusting your filters or search terms
                      </p>
                      <Button variant="outline" onClick={clearFilters}>
                        Clear Filters
                      </Button>
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                      {productsData.products.map((product, index) => (
                        <motion.div
                          key={product.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <ProductCard
                            product={{
                              id: product.id,
                              name: product.name,
                              slug: product.slug,
                              provider: product.provider,
                              dataAmount: product.dataAmount,
                              dataUnit: product.dataUnit,
                              validityDays: product.validityDays,
                              countries: JSON.stringify(product.countries),
                              price: product.price,
                              originalPrice: product.originalPrice,
                              isUnlimited: product.isUnlimited,
                              isFeatured: product.isFeatured,
                              supportsHotspot: product.supportsHotspot,
                              supportsCalls: product.supportsCalls,
                              supportsSms: product.supportsSms,
                            }}
                            onBuy={() => handleBuy(product)}
                          />
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Pagination */}
                  {productsData.pagination.hasMore && (
                    <div className="flex justify-center mt-8">
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => setPage(p => p + 1)}
                      >
                        Load More Products
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
