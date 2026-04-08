"use client";

import { useState, useRef, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  X,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { ProductCard } from "@/components/common/product-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { ErrorBoundary } from "@/components/common/error-boundary";
import { cn } from "@/lib/utils";

import type { DisplayProduct } from "@/types/product";

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

type SortOption = "rank" | "price_asc" | "price_desc";

const SORT_LABELS: Record<SortOption, string> = {
  rank: "Best Match",
  price_asc: "Price: Low to High",
  price_desc: "Price: High to Low",
};

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
}): Promise<ProductsResponse> {
  const searchParams = new URLSearchParams();
  if (params.country) searchParams.set("country", params.country);
  if (params.region) searchParams.set("region", params.region);
  if (params.search) searchParams.set("search", params.search);
  if (params.is5G) searchParams.set("is5G", "true");
  if (params.supportsCalls) searchParams.set("supportsCalls", "true");
  if (params.isUnlimited) searchParams.set("isUnlimited", "true");
  searchParams.set("sortBy", params.sortBy || "rank");
  searchParams.set("limit", (params.limit || 50).toString());
  searchParams.set("offset", (params.offset || 0).toString());

  const response = await fetch(`/api/products?${searchParams.toString()}`);
  if (!response.ok) throw new Error("Failed to fetch products");
  return response.json();
}

export default function ProductsPage() {
  const t = useTranslations("products");
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const [sortBy, setSortBy] = useState<SortOption>("rank");
  const [show5GOnly, setShow5GOnly] = useState(false);
  const [showUnlimitedOnly, setShowUnlimitedOnly] = useState(false);
  const [showCallsOnly, setShowCallsOnly] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const country = searchParams.get("country");
  const region = searchParams.get("region");

  const activeFilterCount = [show5GOnly, showUnlimitedOnly, showCallsOnly].filter(Boolean).length;

  const { data: productsData, isLoading, isError } = useQuery({
    queryKey: [
      "products",
      debouncedSearch,
      country,
      region,
      sortBy,
      show5GOnly,
      showUnlimitedOnly,
      showCallsOnly,
    ],
    queryFn: () =>
      fetchProducts({
        search: debouncedSearch || undefined,
        country: country || undefined,
        region: region || undefined,
        sortBy,
        is5G: show5GOnly || undefined,
        supportsCalls: showCallsOnly || undefined,
        isUnlimited: showUnlimitedOnly || undefined,
      }),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const products = productsData?.data?.products || [];

  const sortedProducts = useMemo(() => {
    if (sortBy === "rank" || !products.length) return products;

    return [...products].sort((a, b) => {
      if (sortBy === "price_asc") return a.price - b.price;
      if (sortBy === "price_desc") return b.price - a.price;
      return 0;
    });
  }, [products, sortBy]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(val), 300);
  };

  const clearFilters = () => {
    setShow5GOnly(false);
    setShowUnlimitedOnly(false);
    setShowCallsOnly(false);
  };

  return (
    <>
      {/* Search + Filter bar */}
      <div className="sticky top-16 z-40 w-full border-b bg-background/95 backdrop-blur-sm px-4 py-3">
        <div className="container mx-auto flex items-center gap-3">
          {/* Search input */}
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              placeholder={t("filterCountry")}
              className="w-full h-10 bg-muted/50 border-0 rounded-xl pl-10 pr-4 text-sm font-medium outline-none focus:ring-2 ring-primary/20 transition-all"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            {search && (
              <button
                onClick={() => {
                  setSearch("");
                  setDebouncedSearch("");
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Sort dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSortDropdown((v) => !v)}
              className="flex items-center gap-1.5 h-10 px-3 rounded-xl bg-muted/50 text-sm font-medium text-foreground hover:bg-muted transition-colors whitespace-nowrap"
            >
              {SORT_LABELS[sortBy]}
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            {showSortDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowSortDropdown(false)}
                />
                <div className="absolute right-0 top-12 z-50 bg-card border border-border rounded-xl shadow-lg py-1 min-w-[180px]">
                  {(Object.keys(SORT_LABELS) as SortOption[]).map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSortBy(option);
                        setShowSortDropdown(false);
                      }}
                      className={cn(
                        "w-full text-left px-4 py-2 text-sm transition-colors",
                        sortBy === option
                          ? "text-primary font-semibold bg-primary/5"
                          : "text-foreground hover:bg-muted/50",
                      )}
                    >
                      {SORT_LABELS[option]}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Filters button */}
          <Sheet>
            <SheetTrigger asChild>
              <button className="relative flex items-center gap-1.5 h-10 px-3 rounded-xl bg-muted/50 text-sm font-medium text-foreground hover:bg-muted transition-colors whitespace-nowrap">
                <SlidersHorizontal className="h-4 w-4" />
                <span className="hidden sm:inline">Filters</span>
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="py-6 space-y-4">
                {[
                  { label: "5G Only", active: show5GOnly, toggle: () => setShow5GOnly((v) => !v) },
                  { label: "Unlimited Data", active: showUnlimitedOnly, toggle: () => setShowUnlimitedOnly((v) => !v) },
                  { label: "Voice Calls", active: showCallsOnly, toggle: () => setShowCallsOnly((v) => !v) },
                ].map(({ label, active, toggle }) => (
                  <button
                    key={label}
                    onClick={toggle}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all",
                      active
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "bg-muted/30 border-border text-foreground",
                    )}
                  >
                    <span className="text-sm font-semibold">{label}</span>
                    <div
                      className={cn(
                        "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all",
                        active
                          ? "border-primary bg-primary"
                          : "border-muted-foreground",
                      )}
                    >
                      {active && (
                        <div className="h-2 w-2 rounded-full bg-white" />
                      )}
                    </div>
                  </button>
                ))}

                {activeFilterCount > 0 && (
                  <SheetClose asChild>
                    <Button
                      variant="ghost"
                      className="w-full text-muted-foreground"
                      onClick={clearFilters}
                    >
                      Clear all filters
                    </Button>
                  </SheetClose>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Product grid */}
      <div className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm font-medium text-muted-foreground">
              Loading plans...
            </p>
          </div>
        ) : isError ? (
          <div className="text-center py-32">
            <h3 className="text-xl font-bold">{t("noMatchingPlans")}</h3>
            <p className="text-muted-foreground mt-2">
              Something went wrong loading plans. Please try again.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="text-center py-32">
            <h3 className="text-xl font-bold">{t("noMatchingPlans")}</h3>
            <p className="text-muted-foreground mt-2">{t("adjustFilters")}</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold tracking-tight">
                {t("title")}
              </h2>
              <Badge
                variant="outline"
                className="rounded-full text-muted-foreground"
              >
                {t("plansAvailable", { count: sortedProducts.length })}
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
