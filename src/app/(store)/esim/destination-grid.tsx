"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, MapPin, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface CountryWithPricing {
  slug: string
  code: string
  name: string
  flag: string
  minPrice: number | null
  productCount: number
}

export function DestinationGrid({ countries }: { countries: CountryWithPricing[] }) {
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    if (!search.trim()) return countries
    const q = search.toLowerCase()
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q)
    )
  }, [countries, search])

  const withProducts = filtered.filter((c) => c.productCount > 0)
  const withoutProducts = filtered.filter((c) => c.productCount === 0)

  return (
    <div className="space-y-8">
      {/* Search */}
      <div className="max-w-lg mx-auto relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <input
          placeholder="Search by country name..."
          className="w-full h-14 bg-card border border-border/50 rounded-2xl pl-12 pr-12 text-base font-medium outline-none focus:ring-2 ring-primary/20 transition-all"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground font-medium">
          {filtered.length} destination{filtered.length !== 1 ? "s" : ""}
          {search ? ` matching "${search}"` : ""}
        </p>
      </div>

      {/* Countries with products */}
      {withProducts.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <AnimatePresence mode="popLayout">
            {withProducts.map((country, index) => (
              <motion.div
                key={country.slug}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.02 }}
                layout
              >
                <Link href={`/esim/${country.slug}`}>
                  <Card className="group h-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-white/5 bg-white/[0.03] backdrop-blur-2xl overflow-hidden cursor-pointer">
                    <CardContent className="p-5 text-center space-y-3">
                      <div className="text-4xl group-hover:scale-110 transition-transform">
                        {country.flag}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm group-hover:text-primary transition-colors leading-tight">
                          {country.name}
                        </h3>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">
                          {country.productCount} plan{country.productCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                      {country.minPrice !== null && (
                        <Badge
                          variant="outline"
                          className="rounded-full border-primary/20 text-primary text-[10px] font-bold px-2 py-0"
                        >
                          from ${country.minPrice.toFixed(2)}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Countries without products */}
      {withoutProducts.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
            Coming Soon
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {withoutProducts.map((country) => (
              <div
                key={country.slug}
                className="p-5 rounded-xl border border-dashed border-border/30 text-center space-y-2 opacity-50"
              >
                <div className="text-3xl">{country.flag}</div>
                <p className="font-medium text-sm text-muted-foreground">
                  {country.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No results */}
      {filtered.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MapPin className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-black mb-2">No destinations found</h3>
          <p className="text-muted-foreground">
            Try a different search term or browse all destinations.
          </p>
        </div>
      )}
    </div>
  )
}
