"use client"

import { motion } from "framer-motion"
import { 
  Wifi, 
  Globe, 
  Clock, 
  Zap, 
  Info, 
  Smartphone,
  ChevronRight,
  ShieldCheck,
  Check,
  ShoppingCart,
  Signal,
  RefreshCw,
  Power
} from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface Network {
  networkName: string
  generation: string
}

interface ProductCardProps {
  product: {
    id: string
    name: string
    slug?: string
    provider: string
    dataAmount?: number | null
    dataUnit?: string | null
    validityDays?: number | null
    countries?: string[] | string | null
    price: number
    originalPrice?: number | null
    isUnlimited?: boolean
    networks?: string | null
    bestFitReason?: string | null
    activationPolicy?: string | null
    topUpAvailable?: boolean
    requiresKyc?: boolean
  }
  onBuy?: (productId: string) => void
  showLink?: boolean
  className?: string
}

export function ProductCard({ product, onBuy, showLink = true, className }: ProductCardProps) {
  const networks: Network[] = product.networks ? JSON.parse(product.networks) : []
  const has5G = networks.some(n => n.generation?.includes('5G'))
  
  const productLink = product.slug ? `/products/${product.slug}` : `/products/${product.id}`

  return (
    <Card className={cn(
      "group relative flex flex-col h-full overflow-hidden transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.4)] hover:-translate-y-1 border-white/5 bg-white/[0.03] backdrop-blur-2xl",
      product.bestFitReason && "ring-1 ring-primary/40",
      className
    )}>
      {/* Dynamic Trust Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
        {product.bestFitReason && (
          <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full backdrop-blur-md">
            {product.bestFitReason}
          </Badge>
        )}
        {product.topUpAvailable && (
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full backdrop-blur-md flex items-center gap-1">
            <RefreshCw className="h-2.5 w-2.5" />
            Refillable
          </Badge>
        )}
      </div>

      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2 items-end">
        {has5G && (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-black rounded-full">
            5G READY
          </Badge>
        )}
        {product.requiresKyc && (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[9px] font-black rounded-full">
            KYC REQ
          </Badge>
        )}
      </div>

      <CardHeader className="p-6 pb-2 mt-8">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{product.provider}</p>
          <h3 className="font-bold text-xl leading-tight group-hover:text-primary transition-colors line-clamp-2 min-h-[3.5rem]">
            <Link href={showLink ? productLink : "#"}>
              {product.name}
            </Link>
          </h3>
        </div>
      </CardHeader>

      <CardContent className="p-6 pt-0 flex-1 space-y-6">
        <div className="flex items-end gap-1">
          <span className="text-4xl font-black tracking-tighter">
            {product.isUnlimited ? "∞" : product.dataAmount}
          </span>
          <span className="text-sm font-bold text-muted-foreground mb-1.5 uppercase tracking-widest">
            {product.isUnlimited ? "Unlimited" : (product.dataUnit || "GB")}
          </span>
          <div className="ml-auto text-right">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Validity</p>
            <p className="font-bold text-sm">{product.validityDays} Days</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 border-y border-white/5 py-2">
            <span className="flex items-center gap-1.5"><Power className="h-3 w-3" /> {product.activationPolicy || "At Connection"}</span>
            <span className="flex items-center gap-1.5"><Signal className="h-3 w-3" /> {networks.length} Networks</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {networks.slice(0, 3).map((net, i) => (
              <div key={i} className="px-2.5 py-1 rounded-full border border-white/5 bg-white/[0.02] text-[10px] font-bold text-foreground/80">
                {net.networkName}
              </div>
            ))}
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-6 pt-0 flex items-center justify-between mt-auto bg-white/[0.02]">
        <div className="flex flex-col">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Price</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-white">
              ${product.price.toFixed(2)}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">
              / ${(product.price / (product.validityDays || 1)).toFixed(2)}d
            </span>
          </div>
        </div>
        
        <Button 
          onClick={(e) => { e.preventDefault(); onBuy?.(product.id); }}
          className="rounded-xl px-6 font-black uppercase tracking-widest text-[11px] shadow-xl shadow-primary/20 hover:shadow-primary/40 active:scale-95 transition-all h-11 bg-primary text-primary-foreground"
        >
          Select Plan
        </Button>
      </CardFooter>
    </Card>
  )
}