"use client"

import { useState, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Signal, Wifi, Globe } from "lucide-react"
import Link from "next/link"

interface CoverageCountry {
  code: string
  name: string
  slug: string
  networkType?: string
  planCount: number
}

interface CoverageMapProps {
  countries: CoverageCountry[]
}

const NETWORK_COLORS = {
  "5G": { bg: "bg-emerald-500", text: "text-emerald-400", fill: "#10b981" },
  "4G/LTE": { bg: "bg-blue-500", text: "text-blue-400", fill: "#3b82f6" },
  "4G": { bg: "bg-blue-500", text: "text-blue-400", fill: "#3b82f6" },
  "3G": { bg: "bg-amber-500", text: "text-amber-400", fill: "#f59e0b" },
} as const

type NetworkKey = keyof typeof NETWORK_COLORS

function getNetworkColor(type?: string): (typeof NETWORK_COLORS)[NetworkKey] {
  if (!type) return NETWORK_COLORS["4G/LTE"]
  const key = Object.keys(NETWORK_COLORS).find((k) =>
    type.toUpperCase().includes(k.toUpperCase())
  ) as NetworkKey | undefined
  return key ? NETWORK_COLORS[key] : NETWORK_COLORS["4G/LTE"]
}

// Simplified SVG path coordinates for major regions
const REGION_PATHS: Record<string, { label: string; countries: string[] }> = {
  europe: {
    label: "Europe",
    countries: [
      "GB", "FR", "DE", "IT", "ES", "PT", "NL", "BE", "CH", "AT", "SE", "NO",
      "DK", "FI", "PL", "CZ", "RO", "HU", "HR", "SI", "IE", "LU", "GR",
    ],
  },
  asia: {
    label: "Asia",
    countries: [
      "JP", "KR", "CN", "TH", "VN", "SG", "MY", "ID", "PH", "IN", "HK",
      "TW", "KH", "LK",
    ],
  },
  americas: {
    label: "Americas",
    countries: ["US", "CA", "MX", "BR", "AR", "CL", "CO", "PE"],
  },
  middleEast: {
    label: "Middle East",
    countries: ["AE", "SA", "IL", "QA", "BH", "KW", "OM", "TR"],
  },
  africa: {
    label: "Africa",
    countries: ["ZA", "EG", "NG", "KE", "MA"],
  },
  oceania: {
    label: "Oceania",
    countries: ["AU", "NZ"],
  },
}

export function CoverageMap({ countries }: CoverageMapProps) {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const [hoveredCountry, setHoveredCountry] = useState<CoverageCountry | null>(null)

  const countryMap = useMemo(() => {
    const map = new Map<string, CoverageCountry>()
    countries.forEach((c) => map.set(c.code, c))
    return map
  }, [countries])

  const regionStats = useMemo(() => {
    return Object.entries(REGION_PATHS).map(([key, region]) => {
      const covered = region.countries.filter((code) => countryMap.has(code))
      return {
        key,
        label: region.label,
        total: region.countries.length,
        covered: covered.length,
        countries: covered.map((code) => countryMap.get(code)!).filter(Boolean),
      }
    })
  }, [countryMap])

  const filteredCountries = selectedRegion
    ? regionStats.find((r) => r.key === selectedRegion)?.countries || []
    : countries

  return (
    <div className="space-y-6">
      {/* Region selector */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedRegion(null)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            !selectedRegion
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          <Globe className="h-3 w-3 inline mr-1" />
          All ({countries.length})
        </button>
        {regionStats.map((region) => (
          <button
            key={region.key}
            onClick={() =>
              setSelectedRegion(region.key === selectedRegion ? null : region.key)
            }
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              selectedRegion === region.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {region.label} ({region.covered})
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        {Object.entries(NETWORK_COLORS).map(([type, colors]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className={`h-3 w-3 rounded-sm ${colors.bg}`} />
            <span className="text-muted-foreground font-medium">{type}</span>
          </div>
        ))}
      </div>

      {/* Country grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {filteredCountries.map((country) => {
          const color = getNetworkColor(country.networkType)
          return (
            <Link
              key={country.code}
              href={`/esim/${country.slug}`}
              onMouseEnter={() => setHoveredCountry(country)}
              onMouseLeave={() => setHoveredCountry(null)}
            >
              <div
                className={`p-3 rounded-xl border transition-all hover:border-primary/30 hover:bg-muted/50 ${
                  hoveredCountry?.code === country.code
                    ? "border-primary/30 bg-muted/50"
                    : "border-border/50"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">{country.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {country.planCount} plan{country.planCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <Badge
                    className={`${color.bg}/20 ${color.text} border-0 text-[10px] font-bold shrink-0`}
                  >
                    {country.networkType || "4G"}
                  </Badge>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Hover tooltip */}
      {hoveredCountry && (
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Signal className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-bold text-sm">{hoveredCountry.name}</p>
              <p className="text-xs text-muted-foreground">
                {hoveredCountry.networkType || "4G/LTE"} coverage &middot;{" "}
                {hoveredCountry.planCount} plans available
              </p>
            </div>
            <div className="ml-auto">
              <Wifi className={`h-5 w-5 ${getNetworkColor(hoveredCountry.networkType).text}`} />
            </div>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Coverage data based on available eSIM plans. Actual network speeds may vary by
        location and carrier.
      </p>
    </div>
  )
}
