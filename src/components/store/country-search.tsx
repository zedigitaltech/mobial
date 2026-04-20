"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

interface Country {
  code: string
  name: string
  slug: string
  flag: string
}

interface CountrySearchProps {
  countries: Country[]
  placeholder?: string
  className?: string
}

export function CountrySearch({
  countries,
  placeholder = "Where are you going?",
  className,
}: CountrySearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [, startTransition] = useTransition()

  const filtered =
    query.length >= 1
      ? countries
          .filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 8)
      : []

  function handleSelect(slug: string) {
    setOpen(false)
    setQuery("")
    startTransition(() => router.push(`/esim?country=${slug}`))
  }

  return (
    <div className={cn("relative w-full max-w-2xl mx-auto", className)}>
      <div className="relative flex items-center">
        <Search className="absolute left-4 size-5 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          className={cn(
            "w-full h-14 pl-12 pr-4 rounded-2xl text-base",
            "bg-white/5 dark:bg-white/8 border border-white/10",
            "text-foreground placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-[#6C4FFF]/50 focus:border-[#6C4FFF]/40",
            "backdrop-blur-md transition-all duration-200",
          )}
        />
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute top-full mt-2 w-full z-50 rounded-xl border border-border bg-popover shadow-2xl overflow-hidden">
          {filtered.map((country) => (
            <button
              key={country.code}
              onMouseDown={() => handleSelect(country.slug)}
              className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-accent transition-colors"
            >
              <span className="text-2xl">{country.flag}</span>
              <span className="text-sm font-medium">{country.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
