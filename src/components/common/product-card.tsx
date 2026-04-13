"use client";

import {
  Globe,
  Signal,
  RefreshCw,
  Power,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/contexts/currency-context";
import { useCompare } from "@/contexts/compare-context";
import { getCountryByCode } from "@/lib/countries";

interface Network {
  networkName: string;
  generation: string;
}

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug?: string;
    provider: string;
    dataAmount?: number | null;
    dataUnit?: string | null;
    validityDays?: number | null;
    countries?: string[] | string | null;
    price: number;
    originalPrice?: number | null;
    isUnlimited?: boolean;
    networks?: string | null;
    bestFitReason?: string | null;
    activationPolicy?: string | null;
    topUpAvailable?: boolean;
    requiresKyc?: boolean;
    is5G?: boolean;
    tags?: Array<{ item: string; color?: string }> | string | null;
    providerLogo?: string | null;
    speedInfo?: string | null;
    supportsHotspot?: boolean;
    supportsCalls?: boolean;
    supportsSms?: boolean;
    networkType?: string | null;
  };
  onBuy?: (productId: string) => void;
  showLink?: boolean;
  className?: string;
}

function getTagColorClasses(color?: string): string {
  switch (color) {
    case "green":
    case "emerald":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "blue":
      return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    case "amber":
    case "yellow":
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "red":
      return "bg-red-500/10 text-red-400 border-red-500/20";
    default:
      return "bg-primary/10 text-primary border-primary/20";
  }
}

export function ProductCard({
  product,
  onBuy: _onBuy,
  showLink = true,
  className,
}: ProductCardProps) {
  const { formatPrice } = useCurrency();
  const { toggleItem, isInCompare, isFull } = useCompare();
  const networks: Network[] = (() => {
    if (!product.networks) return [];
    try {
      return JSON.parse(product.networks);
    } catch {
      return [];
    }
  })();
  const inCompare = isInCompare(product.id);
  const has5G =
    product.is5G || networks.some((n) => n.generation?.includes("5G"));

  const HIDDEN_TAGS = ["special offer", "best deal", "best price", "cheapest", "discount", "sale", "promo"];
  const parsedTags: Array<{ item: string; color?: string }> = (() => {
    if (!product.tags) return [];
    const raw = Array.isArray(product.tags) ? product.tags : (() => { try { return JSON.parse(product.tags as string); } catch { return []; } })();
    return raw.filter((t: { item: string }) => !HIDDEN_TAGS.includes(t.item.toLowerCase()));
  })();

  const countryCodes: string[] = (() => {
    if (!product.countries) return [];
    if (Array.isArray(product.countries)) return product.countries;
    try {
      return JSON.parse(product.countries);
    } catch {
      return [];
    }
  })();

  const countryFlags = countryCodes
    .map((code) => {
      const data = getCountryByCode(code);
      return data ? { code, name: data.name, flag: data.flag } : null;
    })
    .filter(Boolean) as { code: string; name: string; flag: string }[];

  const productLink = product.slug
    ? `/products/${product.slug}`
    : `/products/${product.id}`;

  return (
    <Card
      className={cn(
        "group relative flex flex-col h-full overflow-hidden transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.4)] hover:-translate-y-1 border-white/5 bg-white/[0.03] backdrop-blur-2xl",
        product.bestFitReason && "ring-1 ring-primary/40",
        className,
      )}
    >
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
        {parsedTags.slice(0, 2).map((tag, i) => (
          <Badge
            key={i}
            className={cn(
              "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full backdrop-blur-md border",
              getTagColorClasses(tag.color),
            )}
          >
            {tag.item}
          </Badge>
        ))}
      </div>

      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2 items-end">
        {has5G && (
          <Badge
            variant="outline"
            className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-black rounded-full"
          >
            5G READY
          </Badge>
        )}
        {product.requiresKyc && (
          <Badge
            variant="outline"
            className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[9px] font-black rounded-full"
          >
            KYC REQ
          </Badge>
        )}
      </div>

      <CardHeader className="p-6 pb-2 mt-8">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-1.5">
            {product.providerLogo && (
              <Image
                src={product.providerLogo}
                alt={product.provider}
                width={16}
                height={16}
                className="rounded-sm object-contain"
              />
            )}
            {product.provider}
          </p>
          <h3 className="font-bold text-xl leading-tight group-hover:text-primary transition-colors line-clamp-2 min-h-[3.5rem]">
            <Link href={showLink ? productLink : "#"}>{product.name}</Link>
          </h3>
        </div>
      </CardHeader>

      <CardContent className="p-6 pt-0 flex-1 space-y-6">
        <div className="flex items-end gap-1">
          <span className="text-4xl font-black tracking-tighter">
            {product.isUnlimited ? "∞" : product.dataAmount}
          </span>
          <span className="text-sm font-bold text-muted-foreground mb-1.5 uppercase tracking-widest">
            {product.isUnlimited ? "Unlimited" : product.dataUnit || "GB"}
          </span>
          <div className="ml-auto text-right">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Validity
            </p>
            <p className="font-bold text-sm">{product.validityDays} Days</p>
          </div>
        </div>

        <div className="space-y-4">
          {countryFlags.length > 0 && (
            <TooltipProvider>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Globe className="h-3 w-3 text-muted-foreground/60 shrink-0" />
                {countryFlags.length === 1 ? (
                  <span className="text-xs font-medium text-foreground/80">
                    {countryFlags[0].flag} {countryFlags[0].name}
                  </span>
                ) : (
                  <>
                    {countryFlags.slice(0, 8).map((c) => (
                      <Tooltip key={c.code}>
                        <TooltipTrigger asChild>
                          <span className="text-base leading-none cursor-default">
                            {c.flag}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          className="text-xs font-medium"
                        >
                          {c.name}
                        </TooltipContent>
                      </Tooltip>
                    ))}
                    {countryCodes.length > 8 && (
                      <span className="text-[10px] font-bold text-muted-foreground">
                        +{countryCodes.length - 8} more
                      </span>
                    )}
                  </>
                )}
              </div>
            </TooltipProvider>
          )}

          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 border-y border-white/5 py-2">
            <span className="flex items-center gap-1.5">
              <Power className="h-3 w-3" />{" "}
              {product.activationPolicy || "At Connection"}
            </span>
            <span className="flex items-center gap-1.5">
              <Signal className="h-3 w-3" />{" "}
              {product.speedInfo || `${networks.length} Networks`}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {networks.slice(0, 3).map((net, i) => (
              <div
                key={i}
                className="px-2.5 py-1 rounded-full border border-white/5 bg-white/[0.02] text-[10px] font-bold text-foreground/80"
              >
                {net.networkName}
              </div>
            ))}
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-6 pt-0 flex flex-col gap-3 mt-auto bg-white/[0.02]">
        <div className="flex items-center justify-between w-full">
          <div className="flex flex-col">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Total Price
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-foreground">
                {formatPrice(product.price)}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">
                / {formatPrice(product.price / (product.validityDays || 1))}d
              </span>
            </div>
          </div>

          <Button
            className="rounded-xl px-6 font-black uppercase tracking-widest text-[11px] shadow-xl shadow-primary/20 hover:shadow-primary/40 active:scale-95 transition-all h-11 bg-primary text-primary-foreground"
            asChild
          >
            <Link href={productLink}>Get eSIM</Link>
          </Button>
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            const countries = (() => {
              if (!product.countries) return [];
              if (Array.isArray(product.countries)) return product.countries;
              try {
                return JSON.parse(product.countries);
              } catch {
                return [];
              }
            })();
            toggleItem({
              id: product.id,
              name: product.name,
              provider: product.provider,
              price: product.price,
              originalPrice: product.originalPrice,
              dataAmount: product.dataAmount,
              dataUnit: product.dataUnit,
              validityDays: product.validityDays,
              isUnlimited: product.isUnlimited,
              supportsHotspot: product.supportsHotspot,
              supportsCalls: product.supportsCalls,
              supportsSms: product.supportsSms,
              countries,
              networkType: product.networkType,
              slug: product.slug || product.id,
            });
          }}
          disabled={!inCompare && isFull}
          className={cn(
            "w-full text-[10px] font-bold uppercase tracking-widest py-1.5 rounded-lg border transition-all",
            inCompare
              ? "border-primary/30 bg-primary/10 text-primary"
              : "border-white/5 text-muted-foreground hover:border-white/10 hover:text-foreground disabled:opacity-30",
          )}
        >
          {inCompare ? "✓ In Comparison" : "Compare"}
        </button>
      </CardFooter>
    </Card>
  );
}
