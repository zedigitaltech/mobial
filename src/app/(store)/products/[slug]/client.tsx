"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
import { useIsMobile } from "@/hooks/use-is-mobile";
import {
  ArrowLeft,
  Check,
  Clock,
  Globe,
  MapPin,
  Wifi,
  Phone,
  MessageSquare,
  Share2,
  Heart,
  Zap,
  Shield,
  CreditCard,
  Loader2,
  RefreshCw,
} from "lucide-react";
import type DOMPurifyType from "dompurify";
import { ProductCard } from "@/components/common/product-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/cart-context";
import { useCurrency } from "@/contexts/currency-context";
import { ProductWithDetails } from "@/services/product-service";
import { usePostHog } from "posthog-js/react";

interface ProductDetailClientProps {
  product: ProductWithDetails;
  relatedProducts: ProductWithDetails[];
  countryRelatedProducts?: ProductWithDetails[];
}

export function ProductDetailClient({
  product,
  relatedProducts,
  countryRelatedProducts = [],
}: ProductDetailClientProps) {
  const router = useRouter();
  const { addItem, isInCart } = useCart();
  const { formatPrice } = useCurrency();
  const posthog = usePostHog();
  const [addingToCart, setAddingToCart] = useState(false);
  const [sanitizedDetails, setSanitizedDetails] = useState("");

  useEffect(() => {
    if (product.additionalDetails) {
      import("dompurify").then((mod) => {
        const DOMPurify: typeof DOMPurifyType = mod.default;
        setSanitizedDetails(DOMPurify.sanitize(product.additionalDetails));
      });
    }
  }, [product.additionalDetails]);

  const discount = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100,
      )
    : 0;

  const inCart = isInCart(product.id);
  const ctaRef = useRef<HTMLButtonElement>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);

  useEffect(() => {
    posthog?.capture("product_viewed", {
      product_id: product.id,
      product_name: product.name,
      provider: product.provider,
      price: product.price,
      countries_count: product.countries.length,
      data_amount: product.dataAmount,
      data_unit: product.dataUnit,
      validity_days: product.validityDays,
      is_unlimited: product.isUnlimited,
    });
  }, []);

  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleBuyNow = async () => {
    posthog?.capture("buy_now_clicked", {
      product_id: product.id,
      product_name: product.name,
      provider: product.provider,
      price: product.price,
      already_in_cart: inCart,
    });

    if (inCart) {
      router.push("/checkout");
      return;
    }

    setAddingToCart(true);

    addItem({
      productId: product.id,
      name: product.name,
      provider: product.provider,
      price: product.price,
      originalPrice: product.originalPrice,
      dataAmount: product.dataAmount,
      dataUnit: product.dataUnit,
      validityDays: product.validityDays,
    });

    router.push("/checkout");
  };

  const formatData = () => {
    if (product.isUnlimited) return "Unlimited";
    if (product.dataAmount && product.dataUnit) {
      return `${product.dataAmount} ${product.dataUnit}`;
    }
    return "Data Plan";
  };

  const features = [
    {
      icon: Zap,
      title: "Instant Activation",
      description:
        "Get your eSIM delivered instantly via email after purchase.",
    },
    {
      icon: Shield,
      title: "Secure Connection",
      description: "Enterprise-grade encryption for all your data traffic.",
    },
    {
      icon: Globe,
      title: "Wide Coverage",
      description: `Coverage in ${product.countries.length} countries and regions.`,
    },
    {
      icon: CreditCard,
      title: "No Hidden Fees",
      description: "What you see is what you pay. No surprises.",
    },
  ];

  const parsedTags: { item: string; color?: string }[] = (() => {
    if (!product.tags) return [];
    try {
      return JSON.parse(product.tags);
    } catch {
      return [];
    }
  })();

  const getTagClasses = (color?: string) => {
    switch (color) {
      case "green":
      case "emerald":
        return "bg-emerald-500/10 text-emerald-400";
      case "blue":
        return "bg-blue-500/10 text-blue-400";
      case "amber":
      case "yellow":
        return "bg-amber-500/10 text-amber-400";
      case "red":
        return "bg-red-500/10 text-red-400";
      default:
        return "bg-primary/10 text-primary";
    }
  };

  return (
    <>
      {/* Breadcrumb */}
      <div className="border-b bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/products">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Products
              </Link>
            </Button>
            {/* Cart drawer removed — direct checkout flow */}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Column - Product Image/Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Provider Card */}
            <Card className="overflow-hidden">
              <div className="p-8 bg-gradient-to-br from-primary/5 to-primary/10">
                <div className="flex items-center gap-4 mb-6">
                  {product.providerLogo ? (
                    <img
                      src={product.providerLogo}
                      alt={product.provider}
                      className="h-16 w-16 rounded-xl object-contain bg-white p-2"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Wifi className="h-8 w-8 text-primary" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {product.provider}
                    </p>
                    {parsedTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-1">
                        {parsedTags.map((tag, i) => (
                          <span
                            key={i}
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getTagClasses(tag.color)}`}
                          >
                            {tag.item}
                          </span>
                        ))}
                      </div>
                    )}
                    <h1 className="text-2xl font-bold">{product.name}</h1>
                  </div>
                  <div className="ml-auto flex flex-col gap-1">
                    {product.isFeatured && (
                      <Badge variant="default">Popular</Badge>
                    )}
                    {product.networkType && (
                      <Badge className="bg-primary/10 text-primary border-0 text-[10px] font-black">
                        {product.networkType}
                      </Badge>
                    )}
                    {product.is5G && (
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-black">
                        5G
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Data Amount Display */}
                <div className="text-center py-8">
                  <div className="text-5xl font-bold text-primary mb-2">
                    {formatData()}
                  </div>
                  <p className="text-muted-foreground">High-Speed Data</p>
                </div>

                {/* Quick Info */}
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="p-4 rounded-lg bg-background/50">
                    <Clock className="h-5 w-5 text-primary mb-2" />
                    <p className="text-sm text-muted-foreground">Validity</p>
                    <p className="font-semibold">
                      {product.validityDays
                        ? `${product.validityDays} days`
                        : "Flexible"}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-background/50">
                    <MapPin className="h-5 w-5 text-primary mb-2" />
                    <p className="text-sm text-muted-foreground">Coverage</p>
                    <p className="font-semibold">
                      {product.countries.length} countries
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Features Badges */}
            <div className="flex flex-wrap gap-2">
              {product.supportsHotspot && (
                <Badge variant="secondary" className="gap-1">
                  <Check className="h-3 w-3" /> Hotspot/Tethering
                </Badge>
              )}
              {product.supportsCalls && (
                <Badge variant="secondary" className="gap-1">
                  <Phone className="h-3 w-3" /> Voice Calls
                </Badge>
              )}
              {product.supportsSms && (
                <Badge variant="secondary" className="gap-1">
                  <MessageSquare className="h-3 w-3" /> SMS
                </Badge>
              )}
              {product.isUnlimited && (
                <Badge variant="secondary" className="gap-1">
                  <Zap className="h-3 w-3" /> Unlimited Data
                </Badge>
              )}
              {product.topUpAvailable && (
                <Badge variant="secondary" className="gap-1">
                  <Zap className="h-3 w-3" /> Top-Up Available
                </Badge>
              )}
              {product.phoneNumberPrefix && (
                <Badge variant="secondary" className="gap-1">
                  <Phone className="h-3 w-3" /> {product.phoneNumberPrefix}{" "}
                  number included
                </Badge>
              )}
            </div>

            {/* Detailed Specs */}
            {(product.activationPolicy ||
              product.networkType ||
              product.speedInfo ||
              product.ipRouting ||
              product.speedLong ||
              product.usageTracking ||
              product.supportsHotspot) && (
              <Card>
                <CardContent className="p-5 space-y-3">
                  <h3 className="font-semibold text-sm">Plan Details</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {product.networkType && (
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                          Network
                        </p>
                        <p className="font-semibold">{product.networkType}</p>
                      </div>
                    )}
                    {product.activationPolicy && (
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                          Activation
                        </p>
                        <p className="font-semibold">
                          {product.activationPolicy}
                        </p>
                      </div>
                    )}
                    {product.speedInfo && (
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                          Speed
                        </p>
                        <p className="font-semibold">{product.speedInfo}</p>
                      </div>
                    )}
                    {product.ipRouting && (
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                          IP Routing
                        </p>
                        <p className="font-semibold">{product.ipRouting}</p>
                      </div>
                    )}
                    {product.speedLong && (
                      <div className="p-3 rounded-lg bg-muted/50 col-span-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                          Speed Details
                        </p>
                        <p className="font-semibold">{product.speedLong}</p>
                      </div>
                    )}
                    {product.usageTracking && (
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                          Usage Tracking
                        </p>
                        <p className="font-semibold">Real-time Tracking</p>
                      </div>
                    )}
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                        Hotspot
                      </p>
                      <p className="font-semibold">
                        {product.supportsHotspot ? "Yes" : "No"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Additional Details */}
            {sanitizedDetails && (
              <Card>
                <CardContent className="p-5 space-y-3">
                  <h3 className="font-semibold text-sm">
                    Additional Information
                  </h3>
                  <div
                    className="prose prose-sm prose-invert max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: sanitizedDetails,
                    }}
                  />
                </CardContent>
              </Card>
            )}
          </motion.div>

          {/* Right Column - Pricing & Purchase */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Price Card */}
            <Card>
              <CardContent className="p-6 space-y-6">
                {/* Price */}
                <div className="text-center">
                  {discount > 0 && (
                    <Badge variant="destructive" className="mb-2">
                      Save {discount}%
                    </Badge>
                  )}
                  <div className="flex items-end justify-center gap-2">
                    <span className="text-4xl font-bold">
                      {formatPrice(product.price)}
                    </span>
                    {product.originalPrice && (
                      <span className="text-lg text-muted-foreground line-through">
                        {formatPrice(product.originalPrice)}
                      </span>
                    )}
                  </div>
                  {product.validityDays && product.validityDays > 0 && (
                    <p className="text-primary font-semibold mt-1">
                      {formatPrice(product.price / product.validityDays)}/day
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground mt-1">
                    One-time payment, no hidden fees
                  </p>
                </div>

                <Separator />

                {/* Buy Now */}
                <Button
                  ref={ctaRef}
                  size="lg"
                  className="w-full gradient-accent text-accent-foreground"
                  onClick={handleBuyNow}
                  disabled={addingToCart}
                >
                  {addingToCart ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Buy Now
                    </>
                  )}
                </Button>

                {/* Top-Up Link */}
                {product.topUpAvailable && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full"
                    asChild
                  >
                    <Link href="/topup">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Top Up This Plan
                    </Link>
                  </Button>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" size="sm">
                    <Heart className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button variant="outline" className="flex-1" size="sm">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>

                {/* Trust Signals */}
                <div className="p-4 rounded-xl bg-muted/50 space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Zap className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span className="font-medium">Ready in ~2 minutes</span>
                    <span className="text-muted-foreground">
                      — delivered to your email
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="h-4 w-4 text-blue-500 shrink-0" />
                    <span className="font-medium">Secure payment</span>
                    <span className="text-muted-foreground">
                      — powered by Stripe
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    <span className="font-medium">Easy QR code activation</span>
                    <span className="text-muted-foreground">
                      — no physical SIM needed
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <RefreshCw className="h-4 w-4 text-amber-500 shrink-0" />
                    <span className="font-medium">Money-back guarantee</span>
                    <span className="text-muted-foreground">
                      — if not activated
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Coverage Countries */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold flex items-center gap-2 mb-4">
                  <Globe className="h-5 w-5 text-primary" />
                  Coverage ({product.countries.length} countries)
                </h3>
                <div className="flex flex-wrap gap-2">
                  {product.countries.slice(0, 10).map((country) => (
                    <Badge key={country} variant="outline">
                      {country}
                    </Badge>
                  ))}
                  {product.countries.length > 10 && (
                    <Badge variant="outline">
                      +{product.countries.length - 10} more
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Network Info */}
            {product.networks &&
              (() => {
                try {
                  const networkList: string[] = JSON.parse(product.networks);
                  if (networkList.length === 0) return null;
                  return (
                    <Card>
                      <CardContent className="p-6">
                        <h3 className="font-semibold flex items-center gap-2 mb-4">
                          <Wifi className="h-5 w-5 text-primary" />
                          Local Networks
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {networkList.slice(0, 8).map((network) => (
                            <Badge
                              key={network}
                              variant="secondary"
                              className="text-xs"
                            >
                              {network}
                            </Badge>
                          ))}
                          {networkList.length > 8 && (
                            <Badge variant="secondary" className="text-xs">
                              +{networkList.length - 8} more
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                } catch {
                  return null;
                }
              })()}
          </motion.div>
        </div>

        {/* Product Details Tabs */}
        <ProductDetailTabs features={features} product={product} />

        {/* Related Products — Same Provider */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-6">
              More Plans from {product.provider}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard
                  key={relatedProduct.id}
                  product={{
                    id: relatedProduct.id,
                    name: relatedProduct.name,
                    provider: relatedProduct.provider,
                    dataAmount: relatedProduct.dataAmount,
                    dataUnit: relatedProduct.dataUnit,
                    validityDays: relatedProduct.validityDays,
                    countries: JSON.stringify(relatedProduct.countries),
                    price: relatedProduct.price,
                    originalPrice: relatedProduct.originalPrice,
                    isUnlimited: relatedProduct.isUnlimited,
                  }}
                  onBuy={() => {
                    addItem({
                      productId: relatedProduct.id,
                      name: relatedProduct.name,
                      provider: relatedProduct.provider,
                      price: relatedProduct.price,
                      originalPrice: relatedProduct.originalPrice,
                      dataAmount: relatedProduct.dataAmount,
                      dataUnit: relatedProduct.dataUnit,
                      validityDays: relatedProduct.validityDays,
                    });
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Related Products — Same Destination, Different Providers */}
        {countryRelatedProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">
              Other Plans for {product.countries[0] || "This Destination"}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {countryRelatedProducts.map((relatedProduct) => (
                <ProductCard
                  key={relatedProduct.id}
                  product={{
                    id: relatedProduct.id,
                    name: relatedProduct.name,
                    provider: relatedProduct.provider,
                    dataAmount: relatedProduct.dataAmount,
                    dataUnit: relatedProduct.dataUnit,
                    validityDays: relatedProduct.validityDays,
                    countries: JSON.stringify(relatedProduct.countries),
                    price: relatedProduct.price,
                    originalPrice: relatedProduct.originalPrice,
                    isUnlimited: relatedProduct.isUnlimited,
                  }}
                  onBuy={() => {
                    addItem({
                      productId: relatedProduct.id,
                      name: relatedProduct.name,
                      provider: relatedProduct.provider,
                      price: relatedProduct.price,
                      originalPrice: relatedProduct.originalPrice,
                      dataAmount: relatedProduct.dataAmount,
                      dataUnit: relatedProduct.dataUnit,
                      validityDays: relatedProduct.validityDays,
                    });
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky Add to Cart — mobile only, appears when main CTA scrolls out */}
      <div
        className={`fixed bottom-16 left-0 right-0 z-40 md:hidden transition-all duration-300 pb-[env(safe-area-inset-bottom)] ${
          showStickyBar
            ? "translate-y-0 opacity-100"
            : "translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold truncate">{product.name}</p>
              <p
                className="text-lg font-black text-primary"
                suppressHydrationWarning
              >
                {formatPrice(product.price)}
              </p>
            </div>
            <Button
              size="lg"
              className="gradient-accent text-accent-foreground shrink-0 h-12 px-6"
              onClick={handleBuyNow}
              disabled={addingToCart}
            >
              {addingToCart ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Buy Now
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

const TAB_LABELS = ["Features", "Activation", "FAQ"] as const;

function ProductDetailTabs({
  features,
  product,
}: {
  features: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
  }[];
  product: ProductWithDetails;
}) {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({ watchDrag: isMobile });

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setActiveTab(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollTo = useCallback(
    (index: number) => {
      setActiveTab(index);
      emblaApi?.scrollTo(index);
    },
    [emblaApi],
  );

  const featuresPanel = (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {features.map((feature) => (
        <Card key={feature.title}>
          <CardContent className="p-6 text-center">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <feature.icon className="h-6 w-6 text-primary" />
            </div>
            <h4 className="font-semibold mb-2">{feature.title}</h4>
            <p className="text-sm text-muted-foreground">
              {feature.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const activationPanel = (
    <Card>
      <CardContent className="p-6">
        <h3 className="font-semibold text-lg mb-4">
          How to Activate Your eSIM
        </h3>
        <ol className="space-y-4 text-muted-foreground">
          {[
            "After purchase, you will receive an email with your eSIM QR code",
            "Go to Settings \u2192 Cellular \u2192 Add eSIM on your device",
            "Scan the QR code or enter the activation code manually",
            "Your eSIM is now active and ready to use!",
          ].map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium shrink-0">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );

  const faqPanel = (
    <Card>
      <CardContent className="p-6 space-y-6">
        {[
          {
            q: "When does my eSIM activate?",
            a: "Your eSIM activates when you first connect to a supported network in the coverage area. The validity period starts from the first connection.",
          },
          {
            q: "Can I use this eSIM for tethering?",
            a: product.supportsHotspot
              ? "Yes, this eSIM supports tethering/hotspot, so you can share your connection with other devices."
              : "No, this eSIM does not support tethering. Please check our other plans for hotspot-compatible options.",
          },
          {
            q: "What happens if I run out of data?",
            a: "You can purchase additional data packages or get a new eSIM. We'll notify you when you're approaching your data limit.",
          },
          {
            q: "Is my device compatible?",
            a: "Most modern smartphones support eSIM, including iPhone XR and later, Google Pixel 3 and later, and Samsung Galaxy S20 and later. Check your device settings to confirm eSIM support.",
          },
        ].map((item, i, arr) => (
          <div key={i}>
            <h4 className="font-semibold mb-2">{item.q}</h4>
            <p className="text-muted-foreground">{item.a}</p>
            {i < arr.length - 1 && <Separator className="mt-6" />}
          </div>
        ))}
      </CardContent>
    </Card>
  );

  const panels = [featuresPanel, activationPanel, faqPanel];

  return (
    <div className="mt-12">
      {/* Tab indicators */}
      <div className="grid w-full grid-cols-3 max-w-md mx-auto bg-muted/50 rounded-lg p-1 mb-8">
        {TAB_LABELS.map((label, i) => (
          <button
            key={label}
            onClick={() => scrollTo(i)}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-all ${
              activeTab === i
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Swipeable content on mobile, static on desktop */}
      {isMobile ? (
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex">
            {panels.map((panel, i) => (
              <div key={i} className="min-w-0 shrink-0 grow-0 basis-full px-1">
                {panel}
              </div>
            ))}
          </div>
        </div>
      ) : (
        panels[activeTab]
      )}
    </div>
  );
}
