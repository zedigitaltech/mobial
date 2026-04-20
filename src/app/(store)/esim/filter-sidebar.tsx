"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useState, useMemo } from "react"
import { SlidersHorizontal, X, Search } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

export interface FilterSidebarRegion {
  slug: string
  name: string
}

export interface FilterSidebarCountry {
  code: string
  name: string
  slug: string
  flag: string
}

export interface FilterSidebarProps {
  regions: FilterSidebarRegion[]
  countries: FilterSidebarCountry[]
}

const SORT_OPTIONS = [
  { value: "rank", label: "Popular" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "data", label: "Most Data" },
] as const

const MAX_PRICE_DEFAULT = 100

function useActiveFilterCount(params: URLSearchParams): number {
  let count = 0
  if (params.get("region")) count++
  if (params.get("country")) count++
  if (params.get("maxPrice")) count++
  if (params.get("sort")) count++
  return count
}

interface FiltersContentProps {
  regions: FilterSidebarRegion[]
  countries: FilterSidebarCountry[]
  params: URLSearchParams
  onFilterChange: (key: string, value: string | null) => void
  onClearAll: () => void
  activeCount: number
}

function FiltersContent({
  regions,
  countries,
  params,
  onFilterChange,
  onClearAll,
  activeCount,
}: FiltersContentProps) {
  const selectedRegion = params.get("region") ?? ""
  const selectedCountry = params.get("country") ?? ""
  const maxPrice = Number(params.get("maxPrice") ?? MAX_PRICE_DEFAULT)
  const selectedSort = params.get("sort") ?? ""

  const selectedCountryObj = useMemo(
    () => countries.find((c) => c.code === selectedCountry) ?? null,
    [countries, selectedCountry],
  )

  const [countryQuery, setCountryQuery] = useState(
    selectedCountryObj ? `${selectedCountryObj.flag} ${selectedCountryObj.name}` : "",
  )
  const [listOpen, setListOpen] = useState(false)

  const filteredCountries = useMemo(() => {
    if (!countryQuery.trim()) return countries.slice(0, 10)
    const q = countryQuery.toLowerCase()
    return countries
      .filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))
      .slice(0, 10)
  }, [countries, countryQuery])

  function handleCountrySelect(c: FilterSidebarCountry) {
    setCountryQuery(`${c.flag} ${c.name}`)
    setListOpen(false)
    onFilterChange("country", c.code)
  }

  function handleCountryClear() {
    setCountryQuery("")
    setListOpen(false)
    onFilterChange("country", null)
  }

  return (
    <div className="space-y-6">
      {/* Clear all */}
      {activeCount > 0 && (
        <button
          type="button"
          onClick={onClearAll}
          className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
          Clear all filters
        </button>
      )}

      {/* Region */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
          Region
        </label>
        <select
          value={selectedRegion}
          onChange={(e) => onFilterChange("region", e.target.value || null)}
          className={cn(
            "w-full h-9 rounded-lg border border-border/40 bg-background",
            "px-3 text-sm font-medium text-foreground",
            "focus:outline-none focus:ring-2 focus:ring-primary/30",
            "transition-colors",
          )}
        >
          <option value="">All Regions</option>
          {regions.map((r) => (
            <option key={r.slug} value={r.slug}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      {/* Country — search-then-select */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
          Country
        </label>
        <div className="relative">
          {/* Search input */}
          <div className="relative flex items-center">
            <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              value={countryQuery}
              onChange={(e) => {
                setCountryQuery(e.target.value)
                setListOpen(true)
                if (!e.target.value) onFilterChange("country", null)
              }}
              onFocus={() => setListOpen(true)}
              onBlur={() => setTimeout(() => setListOpen(false), 150)}
              placeholder="Search country…"
              className={cn(
                "w-full h-9 rounded-lg border border-border/40 bg-background",
                "pl-8 pr-8 text-sm font-medium text-foreground placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-primary/30",
                "transition-colors",
                selectedCountry && "border-primary/50",
              )}
            />
            {countryQuery && (
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); handleCountryClear() }}
                className="absolute right-2.5 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear country filter"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Dropdown list */}
          {listOpen && filteredCountries.length > 0 && (
            <ul
              className={cn(
                "absolute z-50 w-full mt-1 rounded-lg border border-border/40 bg-popover shadow-lg",
                "max-h-[200px] overflow-y-auto",
                "py-1",
              )}
            >
              {filteredCountries.map((c) => (
                <li key={c.code}>
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); handleCountrySelect(c) }}
                    className={cn(
                      "w-full text-left px-3 py-1.5 text-sm font-medium",
                      "hover:bg-accent hover:text-accent-foreground transition-colors",
                      c.code === selectedCountry && "bg-primary/10 text-primary",
                    )}
                  >
                    <span className="mr-2">{c.flag}</span>
                    {c.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Max Price */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Max Price
          </label>
          <span className="text-sm font-bold text-foreground">
            ${maxPrice === MAX_PRICE_DEFAULT ? "Any" : maxPrice}
          </span>
        </div>
        <Slider
          min={0}
          max={MAX_PRICE_DEFAULT}
          step={5}
          value={[maxPrice]}
          onValueChange={([val]) => {
            onFilterChange("maxPrice", val === MAX_PRICE_DEFAULT ? null : String(val))
          }}
          className="w-full"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1 font-medium">
          <span>$0</span>
          <span>$100+</span>
        </div>
      </div>

      {/* Sort */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
          Sort By
        </label>
        <select
          value={selectedSort}
          onChange={(e) => onFilterChange("sort", e.target.value || null)}
          className={cn(
            "w-full h-9 rounded-lg border border-border/40 bg-background",
            "px-3 text-sm font-medium text-foreground",
            "focus:outline-none focus:ring-2 focus:ring-primary/30",
            "transition-colors",
          )}
        >
          <option value="">Default</option>
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

export function FilterSidebar({ regions, countries }: FilterSidebarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeCount = useActiveFilterCount(searchParams)

  const updateFilter = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value === null || value === "") {
        params.delete(key)
      } else {
        params.set(key, value)
      }
      // Reset to page 1 on filter change
      params.delete("page")
      router.push(`?${params.toString()}`)
    },
    [router, searchParams],
  )

  const clearAll = useCallback(() => {
    router.push("/esim")
  }, [router])

  const sharedProps: FiltersContentProps = {
    regions,
    countries,
    params: searchParams,
    onFilterChange: updateFilter,
    onClearAll: clearAll,
    activeCount,
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:block sticky top-24 self-start">
        <div className="rounded-2xl border border-border/40 bg-card p-5">
          <h2 className="font-black text-sm uppercase tracking-wider mb-5 flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            Filters
          </h2>
          <FiltersContent {...sharedProps} />
        </div>
      </aside>

      {/* Mobile: sticky bottom button + Sheet */}
      <div className="md:hidden fixed bottom-20 right-4 z-40">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              size="sm"
              className="rounded-full shadow-lg font-bold gap-2 pl-4 pr-5 py-5"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeCount > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white text-primary text-[10px] font-black">
                  {activeCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl px-6 pb-8 max-h-[85dvh] overflow-y-auto">
            <SheetHeader className="mb-5">
              <SheetTitle className="flex items-center gap-2 text-base font-black">
                <SlidersHorizontal className="h-4 w-4 text-primary" />
                Filters
              </SheetTitle>
            </SheetHeader>
            <FiltersContent {...sharedProps} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
