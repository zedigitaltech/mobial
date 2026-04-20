"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  ArrowLeft,
  Wifi,
  Loader2,
  CreditCard,
  Shield,
  Check,
  AlertCircle,
  Tag,
  X,
  Zap,
} from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCart, CartItem } from "@/contexts/cart-context";
import { useCurrency } from "@/contexts/currency-context";

// Initialise Stripe outside of component render to avoid re-creating on every render
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

// ─── Types ─────────────────────────────────────────────────────────────────

interface AffiliateValidation {
  valid: boolean;
  affiliateCode?: string;
  affiliateName?: string;
  discount?: number;
}

interface IntentData {
  clientSecret: string;
  orderId: string;
  orderNumber: string;
  total: number;
  currency: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

async function validateAffiliateCode(
  code: string,
): Promise<AffiliateValidation> {
  try {
    const response = await fetch(
      `/api/affiliate/validate?code=${encodeURIComponent(code)}`,
    );
    if (!response.ok) return { valid: false };
    return response.json();
  } catch {
    return { valid: false };
  }
}

// ─── Cart summary item ─────────────────────────────────────────────────────

function CartSummaryItem({ item }: { item: CartItem }) {
  const t = useTranslations("checkout");
  const { formatPrice } = useCurrency();

  const formatData = () => {
    if (item.dataAmount && item.dataUnit) {
      return `${item.dataAmount} ${item.dataUnit}`;
    }
    return t("dataPlan");
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex gap-3 py-3"
    >
      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Wifi className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.name}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{item.provider}</span>
          <span>•</span>
          <span>{formatData()}</span>
          <span>•</span>
          <span>
            {t("qty")} {item.quantity}
          </span>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium">
          {formatPrice(item.price * item.quantity)}
        </p>
      </div>
    </motion.div>
  );
}

// ─── Inner Stripe payment form (must be inside <Elements>) ─────────────────

interface CheckoutFormProps {
  total: number;
  currency: string;
}

function CheckoutForm({ total, currency }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsLoading(true);
    setErrorMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success`,
      },
    });

    if (error) {
      setErrorMessage(error.message ?? "Payment failed. Please try again.");
      setIsLoading(false);
    }
    // On success Stripe redirects to return_url — no action needed here
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {errorMessage && (
        <p className="text-sm text-destructive">{errorMessage}</p>
      )}
      <Button
        className="w-full gradient-accent text-accent-foreground"
        size="lg"
        type="submit"
        disabled={!stripe || !elements || isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="h-4 w-4 mr-2" />
            Pay {currency} {total.toFixed(2)}
          </>
        )}
      </Button>
    </form>
  );
}

// ─── Main checkout page ────────────────────────────────────────────────────

export default function CheckoutPage() {
  const t = useTranslations("checkout");
  const router = useRouter();
  const { items, total, isHydrated } = useCart();
  const { formatPrice } = useCurrency();

  // Contact info
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Affiliate / promo
  const [affiliateCode, setAffiliateCode] = useState("");
  const [affiliateValidation, setAffiliateValidation] =
    useState<AffiliateValidation | null>(null);
  const [validatingCode, setValidatingCode] = useState(false);

  // PaymentIntent creation
  const [intentData, setIntentData] = useState<IntentData | null>(null);
  const [isCreatingIntent, setIsCreatingIntent] = useState(false);
  const [intentError, setIntentError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Redirect if cart is empty (only after localStorage has been read)
  useEffect(() => {
    if (!isHydrated) return;
    if (items.length === 0) {
      router.push("/products");
    } else {
      posthog?.capture("checkout_started", {
        item_count: items.length,
        total,
      });
    }
  }, [isHydrated, items.length, router, total]);

  // Save abandoned cart when email is provided
  useEffect(() => {
    if (
      !email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      items.length === 0
    )
      return;

    const timeout = setTimeout(() => {
      fetch("/api/cart-recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          cartItems: items.map((i) => ({
            productId: i.productId,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
          })),
          totalAmount: total,
        }),
      }).catch(() => {});
    }, 2000);

    return () => clearTimeout(timeout);
  }, [email, items, total]);

  // Calculate discount
  const discountAmount =
    affiliateValidation?.valid && affiliateValidation.discount
      ? total * (affiliateValidation.discount / 100)
      : 0;

  const finalTotal = total - discountAmount;

  const handleValidateCode = async () => {
    if (!affiliateCode.trim()) return;
    setValidatingCode(true);
    const result = await validateAffiliateCode(affiliateCode.trim());
    setAffiliateValidation(result);
    setValidatingCode(false);
  };

  // Step 1: validate contact info and create PaymentIntent
  const handleContinueToPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setEmailError(t("validEmail"));
      return;
    }
    setEmailError(null);
    setIsCreatingIntent(true);
    setIntentError(null);

    try {
      const res = await fetch("/api/checkout/intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
          email: email.trim(),
          currency: "usd",
        }),
      });

      if (!res.ok) {
        let errorMsg = "Failed to create order. Please try again.";
        try {
          const errData = await res.json();
          if (errData?.error) errorMsg = errData.error;
        } catch { /* ignore parse errors on non-JSON error responses */ }
        setIntentError(errorMsg);
        return;
      }
      const data = await res.json();
      if (!data.success) {
        setIntentError(data.error || "Failed to create order. Please try again.");
        return;
      }

      // Store order reference for success page
      sessionStorage.setItem(
        "mobial_pending_order",
        JSON.stringify({
          orderId: data.data.orderId,
          orderNumber: data.data.orderNumber,
          email: email.trim(),
        }),
      );

      setIntentData(data.data as IntentData);
    } catch {
      setIntentError(
        "Network error. Please check your connection and try again.",
      );
    } finally {
      setIsCreatingIntent(false);
    }
  };

  if (!isHydrated || items.length === 0) {
    return null; // Will redirect once hydrated
  }

  return (
    <>
      <div className="border-b bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("continueShopping")}
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
            <p className="text-muted-foreground">{t("subtitle")}</p>
          </motion.div>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Left Column — Contact + Payment */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-3 space-y-6"
            >
              {/* ── Step 1: contact info ── */}
              {!intentData && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {t("contactInfo")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form
                        id="contact-form"
                        onSubmit={handleContinueToPayment}
                        className="space-y-4"
                      >
                        <div className="space-y-2">
                          <Label htmlFor="email">{t("emailRequired")}</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder={t("emailPlaceholder")}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                          {emailError && (
                            <p className="text-xs text-destructive">
                              {emailError}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {t("emailHelp")}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">{t("phone")}</Label>
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="+1 234 567 8900"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                          />
                        </div>
                      </form>
                    </CardContent>
                  </Card>

                  {/* Affiliate / promo code */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Tag className="h-5 w-5" />
                        {t("promoCode")}{" "}
                        <span className="text-sm font-normal text-muted-foreground">
                          {t("promoOptional")}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Input
                          placeholder={t("promoPlaceholder")}
                          value={affiliateCode}
                          onChange={(e) => {
                            setAffiliateCode(e.target.value);
                            setAffiliateValidation(null);
                          }}
                          disabled={affiliateValidation?.valid}
                        />
                        {affiliateValidation?.valid ? (
                          <Button
                            variant="outline"
                            onClick={() => {
                              setAffiliateCode("");
                              setAffiliateValidation(null);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            onClick={handleValidateCode}
                            disabled={
                              validatingCode || !affiliateCode.trim()
                            }
                          >
                            {validatingCode ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              t("apply")
                            )}
                          </Button>
                        )}
                      </div>
                      {affiliateValidation?.valid && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-primary">
                          <Check className="h-4 w-4" />
                          <span>
                            {t("codeApplied", {
                              discount: affiliateValidation.discount ?? 0,
                            })}
                          </span>
                        </div>
                      )}
                      {affiliateValidation && !affiliateValidation.valid && (
                        <p className="mt-3 text-sm text-muted-foreground">
                          {t("invalidCode")}
                        </p>
                      )}
                      <p className="mt-2 text-xs text-muted-foreground">
                        {t("noCode")}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Intent creation error */}
                  {intentError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{intentError}</AlertDescription>
                    </Alert>
                  )}

                  {/* Continue to payment button */}
                  <Button
                    size="lg"
                    className="w-full gradient-accent text-accent-foreground"
                    form="contact-form"
                    type="submit"
                    disabled={isCreatingIntent}
                  >
                    {isCreatingIntent ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t("processing")}
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        {t("completeOrder")} — {formatPrice(finalTotal)}
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    {t("receiveQr")}
                  </p>
                </>
              )}

              {/* ── Step 2: Stripe Elements payment form ── */}
              {intentData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      {t("payment")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Elements
                      stripe={stripePromise}
                      options={{
                        clientSecret: intentData.clientSecret,
                        appearance: {
                          theme: "night",
                          variables: { colorPrimary: "#6C4FFF" },
                        },
                      }}
                    >
                      <CheckoutForm
                        total={intentData.total}
                        currency={intentData.currency}
                      />
                    </Elements>
                  </CardContent>
                </Card>
              )}

              {/* Trust signals */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <Shield className="h-4 w-4 text-blue-500 shrink-0" />
                  <span className="font-medium">{t("secureStripe")}</span>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span className="font-medium">{t("esimMinutes")}</span>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <Zap className="h-4 w-4 text-amber-500 shrink-0" />
                  <span className="font-medium">{t("noAccountRequired")}</span>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <CreditCard className="h-4 w-4 text-primary shrink-0" />
                  <span className="font-medium">{t("moneyBack")}</span>
                </div>
              </div>
            </motion.div>

            {/* Right Column — Order Summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-2"
            >
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    {t("orderSummary")}
                    <Badge variant="secondary" className="ml-auto">
                      {items.length}{" "}
                      {items.length === 1 ? t("item") : t("items")}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="divide-y">
                    <AnimatePresence mode="popLayout">
                      {items.map((item) => (
                        <CartSummaryItem key={item.productId} item={item} />
                      ))}
                    </AnimatePresence>
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {t("subtotal")}
                      </span>
                      <span>{formatPrice(total)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-primary">
                        <span>{t("discount")}</span>
                        <span>-{formatPrice(discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("tax")}</span>
                      <span>{formatPrice(0)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold text-base">
                      <span>{t("total")}</span>
                      <span>{formatPrice(finalTotal)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}
