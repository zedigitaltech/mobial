"use client";

import { Suspense, useState, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Search, X, Loader2, Calendar } from "lucide-react";
import { PlanCard } from "@/components/common/plan-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

import { DisplayProduct } from "@/types/product";

type Product = DisplayProduct & { slug: string };

interface ProductsResponse {
  success: boolean;
  data: {
    products: Product[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  };
}

async function fetchProducts(params: {
  country?: string;
  region?: string;
  search?: string;
  sortBy?: string;
  limit?: number;
  offset?: number;
  is5G?: boolean;
  supportsCalls?: boolean;
  isUnlimited?: boolean;
  minData?: number;
  maxData?: number;
}): Promise<ProductsResponse> {
  const searchParams = new URLSearchParams();
  if (params.country) searchParams.set("country", params.country);
  if (params.region) searchParams.set("region", params.region);
  if (params.search) searchParams.set("search", params.search);
  if (params.is5G) searchParams.set("is5G", "true");
  if (params.supportsCalls) searchParams.set("supportsCalls", "true");
  if (params.isUnlimited) searchParams.set("isUnlimited", "true");
  if (params.minData) searchParams.set("minData", params.minData.toString());
  if (params.maxData) searchParams.set("maxData", params.maxData.toString());
  searchParams.set("sortBy", params.sortBy || "rank");
  searchParams.set("limit", (params.limit || 50).toString());
  searchParams.set("offset", (params.offset || 0).toString());

  const response = await fetch(`/api/products?${searchParams.toString()}`);
  if (!response.ok) throw new Error("Failed to fetch products");
  return response.json();
}

function ProductsContent() {
  const t = useTranslations("products");
  const searchParams = useSearchParams();

  const [duration, setDuration] = useState(7);
  const [usageType, setUsageType] = useState<"light" | "balanced" | "heavy">(
    "balanced",
  );
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const [show5GOnly, setShow5GOnly] = useState(false);
  const [showUnlimitedOnly, setShowUnlimitedOnly] = useState(false);
  const [showCallsOnly, setShowCallsOnly] = useState(false);

  const country = searchParams.get("country");
  const region = searchParams.get("region");

  const dataRange = useMemo(() => {
    if (usageType === "light") return { maxData: 5 };
    if (usageType === "balanced") return { minData: 5, maxData: 20 };
    if (usageType === "heavy") return { minData: 20 };
    return {};
  }, [usageType]);

  const {
    data: productsData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [
      "products",
      debouncedSearch,
      country,
      region,
      show5GOnly,
      showUnlimitedOnly,
      showCallsOnly,
      usageType,
    ],
    queryFn: () =>
      fetchProducts({
        search: debouncedSearch || undefined,
        country: country || undefined,
        region: region || undefined,
        is5G: show5GOnly || undefined,
        supportsCalls: showCallsOnly || undefined,
        isUnlimited: showUnlimitedOnly || undefined,
        ...dataRange,
      }),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const products = productsData?.data?.products || [];

  const rankedProducts = useMemo(() => {
    if (!products.length) return [];

    return products
      .map((p) => {
        let score = 0;

        if ((p.validityDays || 0) < duration) score -= 50;

        const gb = p.dataAmount || 0;
        if (usageType === "light" && gb <= 5 && gb > 0) score += 30;
        if (usageType === "balanced" && gb > 5 && gb <= 20) score += 35;
        if (usageType === "heavy" && (gb >= 20 || p.isUnlimited)) score += 40;

        const pricePerDay = p.price / duration;
        if (pricePerDay < 1) score += 20;

        return { ...p, score };
      })
      .filter((p) => {
        if (show5GOnly && !p.is5G) return false;
        if (showUnlimitedOnly && !p.isUnlimited) return false;
        if (showCallsOnly && !p.supportsCalls) return false;
        return true;
      })
      .sort((a, b) => b.score - a.score);
  }, [
    products,
    duration,
    usageType,
    show5GOnly,
    showUnlimitedOnly,
    showCallsOnly,
  ]);

  return (
    <>
      {/* Sticky Filter Rail */}
      <div className="sticky top-16 z-40 w-full border-b bg-background/80 backdrop-blur-2xl px-4 py-3">
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full lg:w-auto">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 lg:w-56">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                {t("tripDuration", { days: duration })}
              </p>
              <Slider
                value={[duration]}
                onValueChange={(v) => setDuration(v[0])}
                max={30}
                min={1}
                step={1}
              />
            </div>
          </div>

          <div className="flex bg-muted/50 p-1 rounded-xl w-full lg:w-auto">
            {(["light", "balanced", "heavy"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setUsageType(type)}
                className={cn(
                  "flex-1 px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
                  usageType === type
                    ? "bg-card text-primary shadow-lg"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t(type)}
              </button>
            ))}
          </div>

          <div className="relative w-full lg:w-64 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              placeholder={t("filterCountry")}
              className="w-full h-10 bg-muted/50 border-0 rounded-xl pl-9 text-sm font-medium outline-none focus:ring-2 ring-primary/20 transition-all"
              value={search}
              onChange={(e) => {
                const val = e.target.value;
                setSearch(val);
                if (debounceRef.current)
                  clearTimeout(debounceRef.current);
                debounceRef.current = setTimeout(
                  () => setDebouncedSearch(val),
                  300,
                );
              }}
            />
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto">
            {[
              {
                key: "fiveGOnly" as const,
                active: show5GOnly,
                toggle: () => setShow5GOnly((v) => !v),
              },
              {
                key: "unlimited" as const,
                active: showUnlimitedOnly,
                toggle: () => setShowUnlimitedOnly((v) => !v),
              },
              {
                key: "calls" as const,
                active: showCallsOnly,
                toggle: () => setShowCallsOnly((v) => !v),
              },
            ].map(({ key, active, toggle }) => (
              <button
                key={key}
                onClick={toggle}
                aria-pressed={active}
                className={cn(
                  "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all",
                  active
                    ? "bg-primary/20 text-primary border-primary/30"
                    : "bg-muted/30 text-muted-foreground border-transparent hover:bg-muted/50",
                )}
              >
                {t(key)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground">
              {t("analyzingFits")}
            </p>
          </div>
        ) : isError ? (
          <div className="text-center py-24 bg-card rounded-2xl border border-dashed border-destructive/30">
            <div className="w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <X className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="text-xl font-black">
              {t("noMatchingPlans")}
            </h3>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto text-sm">
              {t("errorLoadingPlans")}
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              {t("retry")}
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black tracking-tight">
                  {t("recommendedPlans")}
                </h2>
                <p className="text-muted-foreground text-sm font-medium">
                  {t("rankedBy")}
                </p>
              </div>
              <Badge
                variant="outline"
                className="h-7 rounded-full border-primary/20 text-primary font-bold text-xs"
              >
                {t("plansAvailable", {
                  count: rankedProducts.length,
                })}
              </Badge>
            </div>

            {rankedProducts.length === 0 ? (
              <div className="text-center py-24 bg-card rounded-2xl border border-dashed border-border/30">
                <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <X className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-black">
                  {t("noMatchingPlans")}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {t("adjustFilters")}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {rankedProducts.map((product) => (
                  <PlanCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <ProductsContent />
    </Suspense>
  );
}
