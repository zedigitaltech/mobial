"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  TrendingUp,
  ChevronRight,
  Clock,
  X,
  Globe,
  MapPin,
  Loader2,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { countries, TOP_DESTINATIONS, getCountryByCode } from "@/lib/countries"
import { regions } from "@/lib/regions"
import { useCurrency } from "@/contexts/currency-context"

const RECENT_SEARCHES_KEY = "mobial_recent_searches"
const MAX_RECENT = 5

interface SearchResult {
  id: string
  name: string
  slug?: string
  price: number
  provider: string
  dataAmount?: number | null
  validityDays?: number | null
  countries?: string[]
}

interface CountryMatch {
  slug: string
  code: string
  name: string
  flag: string
}

interface RegionMatch {
  slug: string
  name: string
  countryCount: number
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = React.useState(value)
  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

function getRecentSearches(): string[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || "[]")
  } catch {
    return []
  }
}

function saveRecentSearch(query: string) {
  const recent = getRecentSearches().filter((s) => s !== query)
  recent.unshift(query)
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)))
}

function clearRecentSearches() {
  localStorage.removeItem(RECENT_SEARCHES_KEY)
}

export function DestinationSearch() {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = React.useState(false)
  const [recentSearches, setRecentSearches] = React.useState<string[]>([])
  const router = useRouter()
  const { formatPrice } = useCurrency()
  const inputRef = React.useRef<HTMLInputElement>(null)
  const debouncedQuery = useDebounce(query, 300)

  React.useEffect(() => {
    setRecentSearches(getRecentSearches())
  }, [open])

  // Search products when debounced query changes
  React.useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults([])
      return
    }

    let cancelled = false
    async function search() {
      setIsSearching(true)
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(debouncedQuery)}&limit=6&sortBy=price_asc`)
        if (res.ok && !cancelled) {
          const data = await res.json()
          setResults(data.data?.products || [])
        }
      } catch {
        // Silently fail
      } finally {
        if (!cancelled) setIsSearching(false)
      }
    }

    search()
    return () => { cancelled = true }
  }, [debouncedQuery])

  // Match countries from query
  const countryMatches = React.useMemo((): CountryMatch[] => {
    if (!query || query.length < 2) return []
    const q = query.toLowerCase()
    return Object.entries(countries)
      .filter(([slug, data]) => data.name.toLowerCase().includes(q) || data.code.toLowerCase() === q)
      .map(([slug, data]) => ({ slug, ...data }))
      .slice(0, 5)
  }, [query])

  // Match regions from query
  const regionMatches = React.useMemo((): RegionMatch[] => {
    if (!query || query.length < 2) return []
    const q = query.toLowerCase()
    return regions
      .filter((r) => r.name.toLowerCase().includes(q))
      .map((r) => ({ slug: r.slug, name: r.name, countryCount: r.countries.length }))
  }, [query])

  // Top destinations for default view
  const topDestinations = React.useMemo(
    () =>
      TOP_DESTINATIONS.slice(0, 6).map((slug) => {
        const c = countries[slug]
        return c ? { slug, ...c } : null
      }).filter(Boolean) as CountryMatch[],
    []
  )

  const handleCountrySelect = (slug: string) => {
    saveRecentSearch(countries[slug]?.name || slug)
    router.push(`/esim/${slug}`)
    setOpen(false)
    setQuery("")
  }

  const handleRegionSelect = (slug: string) => {
    const region = regions.find((r) => r.slug === slug)
    if (region) saveRecentSearch(region.name)
    router.push(`/esim/region/${slug}`)
    setOpen(false)
    setQuery("")
  }

  const handleProductSelect = (product: SearchResult) => {
    saveRecentSearch(product.name)
    router.push(`/products/${product.slug || product.id}`)
    setOpen(false)
    setQuery("")
  }

  const handleRecentSelect = (term: string) => {
    setQuery(term)
    inputRef.current?.focus()
  }

  const handleSearchSubmit = () => {
    if (query) {
      saveRecentSearch(query)
      router.push(`/products?search=${encodeURIComponent(query)}`)
      setOpen(false)
      setQuery("")
    }
  }

  const hasResults = countryMatches.length > 0 || regionMatches.length > 0 || results.length > 0
  const showDefault = open && !query

  return (
    <div className="w-full max-w-3xl mx-auto relative">
      <div className="search-rail group transition-all duration-500 focus-within:ring-primary/20">
        <div className="flex items-center px-6 py-2">
          <Search className="h-6 w-6 text-muted-foreground/60 mr-4 group-focus-within:text-primary transition-colors" />
          <div className="flex-1">
            <input
              ref={inputRef}
              placeholder="Search country, region, or plan..."
              className="w-full h-14 bg-transparent border-0 focus:ring-0 text-xl font-medium placeholder:text-muted-foreground/40 outline-none"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setOpen(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearchSubmit()
                if (e.key === "Escape") setOpen(false)
              }}
              role="combobox"
              aria-expanded={open}
              aria-haspopup="listbox"
              aria-controls="destination-listbox"
              aria-autocomplete="list"
            />
          </div>
          {isSearching && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-3" />}
          <Button
            className="rounded-2xl h-12 px-6 font-bold bg-primary hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20"
            onClick={handleSearchSubmit}
          >
            Find Plans
          </Button>
        </div>

        <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-full left-0 right-0 mt-4 overflow-hidden rounded-[2rem] border border-white/10 bg-black/80 backdrop-blur-3xl shadow-2xl z-50">
            <div id="destination-listbox" role="listbox" className="p-4 max-h-[480px] overflow-y-auto custom-scrollbar">
              {/* Default view: Recent + Top Destinations */}
              {showDefault && (
                <>
                  {recentSearches.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between px-4 py-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-1.5">
                          <Clock className="h-3 w-3" /> Recent Searches
                        </p>
                        <button
                          className="text-[10px] font-bold text-muted-foreground/40 hover:text-primary transition-colors"
                          onClick={() => {
                            clearRecentSearches()
                            setRecentSearches([])
                          }}
                        >
                          Clear
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2 px-4">
                        {recentSearches.map((term) => (
                          <button
                            key={term}
                            className="px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs font-medium hover:border-primary/30 hover:bg-primary/10 transition-all"
                            onClick={() => handleRecentSelect(term)}
                          >
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-1.5">
                      <TrendingUp className="h-3 w-3 text-primary" /> Top Destinations
                    </p>
                    <div className="grid gap-1">
                      {topDestinations.map((dest) => (
                        <button
                          key={dest.slug}
                          role="option"
                          aria-selected={false}
                          className="flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-white/5 transition-colors text-left group/item"
                          onClick={() => handleCountrySelect(dest.slug)}
                        >
                          <div className="flex items-center gap-4">
                            <span className="text-2xl">{dest.flag}</span>
                            <span className="font-bold text-lg">{dest.name}</span>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground/20 group-hover/item:text-primary group-hover/item:translate-x-1 transition-all" />
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Search results */}
              {query.length >= 2 && (
                <>
                  {/* Country matches */}
                  {countryMatches.length > 0 && (
                    <div className="mb-3">
                      <p className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-1.5">
                        <MapPin className="h-3 w-3" /> Countries
                      </p>
                      <div className="grid gap-1">
                        {countryMatches.map((c) => (
                          <button
                            key={c.slug}
                            role="option"
                            aria-selected={false}
                            className="flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-white/5 transition-colors text-left group/item"
                            onClick={() => handleCountrySelect(c.slug)}
                          >
                            <div className="flex items-center gap-4">
                              <span className="text-2xl">{c.flag}</span>
                              <div>
                                <p className="font-bold text-lg">{c.name}</p>
                                <p className="text-xs text-muted-foreground/60">{c.code}</p>
                              </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground/20 group-hover/item:text-primary group-hover/item:translate-x-1 transition-all" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Region matches */}
                  {regionMatches.length > 0 && (
                    <div className="mb-3">
                      <p className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-1.5">
                        <Globe className="h-3 w-3" /> Regions
                      </p>
                      <div className="grid gap-1">
                        {regionMatches.map((r) => (
                          <button
                            key={r.slug}
                            role="option"
                            aria-selected={false}
                            className="flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-white/5 transition-colors text-left group/item"
                            onClick={() => handleRegionSelect(r.slug)}
                          >
                            <div className="flex items-center gap-4">
                              <Globe className="h-6 w-6 text-primary" />
                              <div>
                                <p className="font-bold text-lg">{r.name}</p>
                                <p className="text-xs text-muted-foreground/60">{r.countryCount}+ countries</p>
                              </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground/20 group-hover/item:text-primary group-hover/item:translate-x-1 transition-all" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Product results */}
                  {results.length > 0 && (
                    <div>
                      <p className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-1.5">
                        <Search className="h-3 w-3" /> Plans
                      </p>
                      <div className="grid gap-1">
                        {results.map((product) => (
                          <button
                            key={product.id}
                            role="option"
                            aria-selected={false}
                            className="flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-white/5 transition-colors text-left group/item"
                            onClick={() => handleProductSelect(product)}
                          >
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Globe className="h-5 w-5 text-primary" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-sm truncate">{product.name}</p>
                                <p className="text-xs text-muted-foreground/60">
                                  {product.provider}
                                  {product.dataAmount && ` · ${product.dataAmount} GB`}
                                  {product.validityDays && ` · ${product.validityDays}d`}
                                </p>
                              </div>
                            </div>
                            <Badge className="bg-primary/10 text-primary border-0 text-xs font-black ml-3 flex-shrink-0">
                              {formatPrice(product.price)}
                            </Badge>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No results */}
                  {!isSearching && !hasResults && query.length >= 2 && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground font-medium">No results for &ldquo;{query}&rdquo;</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">Try a different country or region name</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-white/5 border-t border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                <TrendingUp className="h-3 w-3 text-primary" />
                150+ destinations available
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs font-bold h-8 rounded-full"
                onClick={() => setOpen(false)}
              >
                Close
              </Button>
            </div>
          </motion.div>
        )}
        </AnimatePresence>
      </div>

      {/* Overlay closer */}
      {open && <div className="fixed inset-0 -z-10" onClick={() => setOpen(false)} />}
    </div>
  )
}
