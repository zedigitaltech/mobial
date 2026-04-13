"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
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
  ArrowLeft,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { countries, TOP_DESTINATIONS } from "@/lib/countries"
import { regions } from "@/lib/regions"
import { useCurrency } from "@/contexts/currency-context"
import { useIsMobile } from "@/hooks/use-is-mobile"

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

function useSearchLogic() {
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = React.useState(false)
  const [recentSearches, setRecentSearches] = React.useState<string[]>([])
  const router = useRouter()
  const { formatPrice } = useCurrency()
  const debouncedQuery = useDebounce(query, 300)

  const refreshRecents = React.useCallback(() => setRecentSearches(getRecentSearches()), [])

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

  const countryMatches = React.useMemo((): CountryMatch[] => {
    if (!query || query.length < 2) return []
    const q = query.toLowerCase()
    return Object.entries(countries)
      .filter(([, data]) => data.name.toLowerCase().includes(q) || data.code.toLowerCase() === q)
      .map(([slug, data]) => ({ slug, ...data }))
      .slice(0, 5)
  }, [query])

  const regionMatches = React.useMemo((): RegionMatch[] => {
    if (!query || query.length < 2) return []
    const q = query.toLowerCase()
    return regions
      .filter((r) => r.name.toLowerCase().includes(q))
      .map((r) => ({ slug: r.slug, name: r.name, countryCount: r.countries.length }))
  }, [query])

  const topDestinations = React.useMemo(
    () =>
      TOP_DESTINATIONS.slice(0, 6).map((slug) => {
        const c = countries[slug]
        return c ? { slug, ...c } : null
      }).filter(Boolean) as CountryMatch[],
    []
  )

  const hasResults = countryMatches.length > 0 || regionMatches.length > 0 || results.length > 0

  const handleCountrySelect = React.useCallback((slug: string, onClose?: () => void) => {
    saveRecentSearch(countries[slug]?.name || slug)
    router.push(`/esim/${slug}`)
    onClose?.()
    setQuery("")
  }, [router])

  const handleRegionSelect = React.useCallback((slug: string, onClose?: () => void) => {
    const region = regions.find((r) => r.slug === slug)
    if (region) saveRecentSearch(region.name)
    router.push(`/esim/region/${slug}`)
    onClose?.()
    setQuery("")
  }, [router])

  const handleProductSelect = React.useCallback((product: SearchResult, onClose?: () => void) => {
    saveRecentSearch(product.name)
    router.push(`/products/${product.slug || product.id}`)
    onClose?.()
    setQuery("")
  }, [router])

  const handleSearchSubmit = React.useCallback((onClose?: () => void) => {
    if (query) {
      saveRecentSearch(query)
      router.push(`/products?search=${encodeURIComponent(query)}`)
      onClose?.()
      setQuery("")
    }
  }, [query, router])

  return {
    query, setQuery,
    results, isSearching,
    recentSearches, refreshRecents,
    countryMatches, regionMatches, topDestinations,
    hasResults, formatPrice,
    handleCountrySelect, handleRegionSelect, handleProductSelect, handleSearchSubmit,
  }
}

function SearchResults({
  search,
  onClose,
}: {
  search: ReturnType<typeof useSearchLogic>
  onClose: () => void
}) {
  const t = useTranslations("search")
  const {
    query, recentSearches, refreshRecents,
    countryMatches, regionMatches, results, topDestinations,
    isSearching, hasResults, formatPrice,
    handleCountrySelect, handleRegionSelect, handleProductSelect,
  } = search

  const showDefault = !query

  return (
    <div className="p-4 max-h-[60vh] md:max-h-[480px] overflow-y-auto">
      {showDefault && (
        <>
          {recentSearches.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between px-4 py-2">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-1.5">
                  <Clock className="h-3 w-3" /> {t("recentSearches")}
                </p>
                <button
                  className="text-[10px] font-bold text-muted-foreground/40 hover:text-primary transition-colors"
                  onClick={() => {
                    clearRecentSearches()
                    refreshRecents()
                  }}
                >
                  {t("clear")}
                </button>
              </div>
              <div className="flex flex-wrap gap-2 px-4">
                {recentSearches.map((term) => (
                  <button
                    key={term}
                    className="px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs font-medium hover:border-primary/30 hover:bg-primary/10 transition-all"
                    onClick={() => search.setQuery(term)}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-1.5">
              <TrendingUp className="h-3 w-3 text-primary" /> {t("topDestinations")}
            </p>
            <div className="grid gap-1">
              {topDestinations.map((dest) => (
                <button
                  key={dest.slug}
                  role="option"
                  aria-selected={false}
                  className="flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-white/5 transition-colors text-left group/item"
                  onClick={() => handleCountrySelect(dest.slug, onClose)}
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

      {query.length >= 2 && (
        <>
          {countryMatches.length > 0 && (
            <div className="mb-3">
              <p className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-1.5">
                <MapPin className="h-3 w-3" /> {t("countries")}
              </p>
              <div className="grid gap-1">
                {countryMatches.map((c) => (
                  <button
                    key={c.slug}
                    role="option"
                    aria-selected={false}
                    className="flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-white/5 transition-colors text-left group/item"
                    onClick={() => handleCountrySelect(c.slug, onClose)}
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

          {regionMatches.length > 0 && (
            <div className="mb-3">
              <p className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-1.5">
                <Globe className="h-3 w-3" /> {t("regions")}
              </p>
              <div className="grid gap-1">
                {regionMatches.map((r) => (
                  <button
                    key={r.slug}
                    role="option"
                    aria-selected={false}
                    className="flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-white/5 transition-colors text-left group/item"
                    onClick={() => handleRegionSelect(r.slug, onClose)}
                  >
                    <div className="flex items-center gap-4">
                      <Globe className="h-6 w-6 text-primary" />
                      <div>
                        <p className="font-bold text-lg">{r.name}</p>
                        <p className="text-xs text-muted-foreground/60">{t("countriesCount", { count: r.countryCount })}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground/20 group-hover/item:text-primary group-hover/item:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {results.length > 0 && (
            <div>
              <p className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-1.5">
                <Search className="h-3 w-3" /> {t("plans")}
              </p>
              <div className="grid gap-1">
                {results.map((product) => (
                  <button
                    key={product.id}
                    role="option"
                    aria-selected={false}
                    className="flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-white/5 transition-colors text-left group/item"
                    onClick={() => handleProductSelect(product, onClose)}
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

          {!isSearching && !hasResults && query.length >= 2 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground font-medium">{t("noResults", { query })}</p>
              <p className="text-xs text-muted-foreground/60 mt-1">{t("noResultsHint")}</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function MobileSearch() {
  const t = useTranslations("search")
  const [open, setOpen] = React.useState(false)
  const search = useSearchLogic()
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (open) {
      search.refreshRecents()
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  const handleClose = () => {
    setOpen(false)
    search.setQuery("")
  }

  return (
    <>
      {/* Compact search trigger on mobile */}
      <div className="w-full max-w-3xl mx-auto">
        <button
          onClick={() => setOpen(true)}
          className="w-full flex items-center gap-3 px-6 py-4 rounded-[28px] border border-white/10 bg-black/40 backdrop-blur-3xl ring-1 ring-inset ring-white/5 shadow-2xl text-left"
        >
          <Search className="h-5 w-5 text-muted-foreground/60" />
          <span className="text-lg font-medium text-muted-foreground/40">{t("searchPlaceholder")}</span>
        </button>
      </div>

      {/* Full-screen overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[60] bg-background flex flex-col"
          >
            {/* Search header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b safe-area-top">
              <Button variant="ghost" size="icon" onClick={handleClose} className="shrink-0">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  placeholder={t("searchPlaceholder")}
                  className="w-full h-12 bg-muted/50 rounded-xl px-4 pr-10 border-0 text-base font-medium placeholder:text-muted-foreground/40 outline-none focus:ring-2 focus:ring-primary/30"
                  value={search.query}
                  onChange={(e) => search.setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") search.handleSearchSubmit(handleClose)
                    if (e.key === "Escape") handleClose()
                  }}
                />
                {search.isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />
                )}
                {search.query && !search.isSearching && (
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    onClick={() => search.setQuery("")}
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>

            {/* Results — full height scrollable */}
            <div className="flex-1 overflow-y-auto pb-[env(safe-area-inset-bottom)]">
              <SearchResults search={search} onClose={handleClose} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function DesktopSearch() {
  const t = useTranslations("search")
  const [open, setOpen] = React.useState(false)
  const search = useSearchLogic()
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (open) search.refreshRecents()
  }, [open])

  const handleClose = () => {
    setOpen(false)
    search.setQuery("")
  }

  return (
    <div className="w-full max-w-3xl mx-auto relative">
      <div className="search-rail group transition-all duration-500 focus-within:ring-primary/20">
        <div className="flex items-center px-6 py-2">
          <Search className="h-6 w-6 text-muted-foreground/60 mr-4 group-focus-within:text-primary transition-colors" />
          <div className="flex-1">
            <input
              ref={inputRef}
              placeholder={t("searchPlaceholder")}
              className="w-full h-14 bg-transparent border-0 focus:ring-0 text-xl font-medium placeholder:text-muted-foreground/40 outline-none"
              value={search.query}
              onChange={(e) => search.setQuery(e.target.value)}
              onFocus={() => setOpen(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter") search.handleSearchSubmit(handleClose)
                if (e.key === "Escape") setOpen(false)
              }}
              role="combobox"
              aria-expanded={open}
              aria-haspopup="listbox"
              aria-controls="destination-listbox"
              aria-autocomplete="list"
            />
          </div>
          {search.isSearching && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-3" />}
          <Button
            className="rounded-2xl h-12 px-6 font-bold bg-primary hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20"
            onClick={() => search.handleSearchSubmit(handleClose)}
          >
            {t("findPlans")}
          </Button>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute top-full left-0 right-0 mt-4 overflow-hidden rounded-[2rem] border border-white/10 bg-black/80 backdrop-blur-3xl shadow-2xl z-50"
            >
              <div id="destination-listbox" role="listbox">
                <SearchResults search={search} onClose={handleClose} />
              </div>

              <div className="p-4 bg-white/5 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  <TrendingUp className="h-3 w-3 text-primary" />
                  {t("destinationsAvailable")}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs font-bold h-8 rounded-full"
                  onClick={() => setOpen(false)}
                >
                  {t("close")}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {open && <div className="fixed inset-0 -z-10" onClick={() => setOpen(false)} />}
    </div>
  )
}

export function DestinationSearch() {
  const isMobile = useIsMobile()
  return isMobile ? <MobileSearch /> : <DesktopSearch />
}
