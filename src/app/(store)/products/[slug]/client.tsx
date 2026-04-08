"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Wifi,
  Zap,
  Globe,
  Smartphone,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProviderHeader } from "@/components/common/provider-header";
import { ThreeColumnStats } from "@/components/common/three-column-stats";
import { DataCallsSmsRow } from "@/components/common/data-calls-sms-row";
import { DetailGrid } from "@/components/common/detail-grid";
import { StickyBuyButton } from "@/components/common/sticky-buy-button";
import { useCurrency } from "@/contexts/currency-context";
import { useAuth } from "@/components/providers/auth-provider";
import { usePostHog } from "posthog-js/react";
import { getCountryByCode } from "@/lib/countries";
import type { ProductWithDetails } from "@/services/product-service";

interface ProductDetailClientProps {
  product: ProductWithDetails;
}

function formatDataLabel(product: ProductWithDetails): string {
  if (product.isUnlimited) return "Unlimited";
  if (product.dataAmount != null && product.dataUnit) {
    return `${product.dataAmount} ${product.dataUnit}`;
  }
  return "Data Plan";
}

function flagUrl(code: string, width: number = 40): string {
  return `https://flagcdn.com/w${width}/${code.toLowerCase()}.png`;
}

function CountryItem({ code }: { code: string }) {
  const data = getCountryByCode(code);
  const name = data?.name ?? code;

  return (
    <div className="flex items-center gap-2 py-1">
      <Image
        src={flagUrl(code, 64)}
        alt={name}
        width={24}
        height={16}
        className="rounded-[2px] object-cover"
      />
      <span className="text-sm font-medium text-foreground">{name}</span>
    </div>
  );
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const router = useRouter();
  const { formatPrice } = useCurrency();
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const posthog = usePostHog();
  const [isBuying, setIsBuying] = useState(false);

  const dataLabel = formatDataLabel(product);
  const daysLabel = `${product.validityDays ?? "-"} Days`;

  const detailItems = [
    {
      icon: <Wifi className="h-4 w-4 text-muted-foreground" />,
      label: "Network",
      value: product.networkType || "4G/LTE",
    },
    {
      icon: <Zap className="h-4 w-4 text-muted-foreground" />,
      label: "Activation",
      value: product.activationPolicy || "At connection",
    },
    {
      icon: <Smartphone className="h-4 w-4 text-muted-foreground" />,
      label: "Hotspot",
      value: product.supportsHotspot ? "Available" : "Not available",
    },
    {
      icon: <Globe className="h-4 w-4 text-muted-foreground" />,
      label: "Speed",
      value: product.speedInfo || "Unrestricted",
    },
    {
      icon: <RefreshCw className="h-4 w-4 text-muted-foreground" />,
      label: "Top-up",
      value: product.topUpAvailable ? "Available" : "Not available",
    },
  ];

  const sortedCountries = [...product.countries].sort((a, b) => {
    const nameA = getCountryByCode(a)?.name ?? a;
    const nameB = getCountryByCode(b)?.name ?? b;
    return nameA.localeCompare(nameB);
  });

  const handleBuyNow = async () => {
    if (isBuying) return;

    posthog?.capture("buy_now_clicked", {
      product_id: product.id,
      product_name: product.name,
      provider: product.provider,
      price: product.price,
    });

    if (!isAuthenticated || !user) {
      openAuthModal("login");
      return;
    }

    setIsBuying(true);

    try {
      const token = localStorage.getItem("token");

      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          items: [{ productId: product.id, quantity: 1 }],
          email: user.email,
        }),
      });

      if (!orderRes.ok) {
        const err = await orderRes.json();
        throw new Error(err.error || "Failed to create order");
      }

      const orderData = await orderRes.json();
      const orderId = orderData.data?.orderId;

      if (!orderId) {
        throw new Error("No order ID returned");
      }

      const sessionRes = await fetch("/api/checkout/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ orderId }),
      });

      if (!sessionRes.ok) {
        const err = await sessionRes.json();
        throw new Error(err.error || "Failed to create checkout session");
      }

      const sessionData = await sessionRes.json();
      const checkoutUrl = sessionData.data?.url;

      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      setIsBuying(false);
      // TODO: show toast notification
    }
  };

  return (
    <>
      {/* Back navigation */}
      <div className="border-b bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/products">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Link>
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-2xl pb-32">
        {/* Provider Header */}
        <section>
          <ProviderHeader
            logo={product.providerLogo}
            providerName={product.provider}
            planName={product.name}
            logoSize={48}
          />
        </section>

        {/* Three Column Stats */}
        <section className="mt-6">
          <ThreeColumnStats
            days={daysLabel}
            data={dataLabel}
            price={formatPrice(product.price)}
          />
        </section>

        {/* Details heading */}
        <section className="mt-8">
          <h2 className="text-lg font-extrabold text-foreground">Details</h2>
        </section>

        {/* Data / Calls / SMS row */}
        <section className="mt-4">
          <DataCallsSmsRow
            hasData={true}
            hasCalls={product.supportsCalls}
            hasSms={product.supportsSms}
          />
        </section>

        {/* Detail Grid */}
        <section className="mt-4">
          <DetailGrid items={detailItems} />
        </section>

        {/* Countries */}
        <section className="mt-8">
          <h2 className="text-lg font-extrabold text-foreground mb-4">
            Countries ({product.countries.length})
          </h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {sortedCountries.map((code) => (
              <CountryItem key={code} code={code} />
            ))}
          </div>
        </section>
      </div>

      {/* Sticky Buy Button */}
      <StickyBuyButton
        label={isBuying ? "Processing..." : "Buy Now"}
        onClick={handleBuyNow}
        disabled={isBuying}
        price={formatPrice(product.price)}
      />
    </>
  );
}
