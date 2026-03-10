"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { 
  Search, 
  Globe, 
  MapPin, 
  TrendingUp, 
  Navigation,
  ArrowRight,
  ChevronRight
} from "lucide-react"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const POPULAR = [
  { name: "United States", code: "US", flag: "🇺🇸", type: "country" },
  { name: "Europe", code: "EU", flag: "🇪🇺", type: "region" },
  { name: "Turkey", code: "TR", flag: "🇹🇷", type: "country" },
  { name: "Japan", code: "JP", flag: "🇯🇵", type: "country" },
  { name: "Thailand", code: "TH", flag: "🇹🇭", type: "country" },
]

export function DestinationSearch() {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const router = useRouter()

  const handleSelect = (item: typeof POPULAR[0]) => {
    const param = item.type === "region" ? `region=${item.code}` : `country=${item.code}`
    router.push(`/products?${param}`)
    setOpen(false)
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="search-rail group transition-all duration-500 focus-within:ring-primary/20">
        <div className="flex items-center px-6 py-2">
          <Search className="h-6 w-6 text-muted-foreground/60 mr-4 group-focus-within:text-primary transition-colors" />
          <div className="flex-1">
            <input
              placeholder="Where are you landing?"
              className="w-full h-14 bg-transparent border-0 focus:ring-0 text-xl font-medium placeholder:text-muted-foreground/40 outline-none"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setOpen(true)}
            />
          </div>
          <Button className="rounded-2xl h-12 px-6 font-bold bg-primary hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20">
            Find Plans
          </Button>
        </div>

        {open && (
          <div className="absolute top-full left-0 right-0 mt-4 overflow-hidden rounded-[2rem] border border-white/10 bg-black/60 backdrop-blur-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 z-50">
            <div className="p-4 max-h-[400px] overflow-y-auto custom-scrollbar">
              <div className="grid gap-2">
                <p className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Popular Destinations</p>
                {POPULAR.map((item) => (
                  <button
                    key={item.code}
                    className="flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-white/5 transition-colors text-left group/item"
                    onClick={() => handleSelect(item)}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">{item.flag}</span>
                      <div>
                        <p className="font-bold text-lg">{item.name}</p>
                        <p className="text-xs text-muted-foreground/60">Starting from $3.49</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground/20 group-hover/item:text-primary group-hover/item:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </div>
            
            <div className="p-4 bg-white/5 border-t border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                <TrendingUp className="h-3 w-3 text-primary" />
                Trending: Switzerland, Macau, Hong Kong
              </div>
              <Button variant="ghost" size="sm" className="text-xs font-bold h-8 rounded-full" onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Search Overlay Closer */}
      {open && <div className="fixed inset-0 -z-10" onClick={() => setOpen(false)} />}
    </div>
  )
}
