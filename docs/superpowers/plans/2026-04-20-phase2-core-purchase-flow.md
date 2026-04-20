# Mobialo Overhaul — Phase 2: Core Purchase Flow

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the 5 pages that generate 95% of revenue — Homepage, eSIM Browse, Product Detail, Checkout (with Stripe Elements, no redirect), and Checkout Success/Order Detail — using the Phase 1 design system.

**Architecture:** All 5 pages are Server Components by default with client islands only where interactivity is needed. Checkout migrates from Stripe Hosted Checkout to Stripe Elements embedded in-page. The design system from Phase 1 (brand tokens, updated components) is the foundation for every pixel.

**Prerequisites:** Phase 1 complete. `STRIPE_WEBHOOK_SECRET`, Google OAuth, and Sentry env vars updated in Vercel.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind CSS 4, shadcn/ui, Stripe Elements (`@stripe/react-stripe-js`), next-intl, Zod

**Spec:** `docs/superpowers/specs/2026-04-20-mobialo-overhaul-design.md` — Section 3.1–3.5

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `src/app/(store)/page.tsx` | Rewrite | New homepage — hero + search + featured + social proof |
| `src/app/(store)/home-client.tsx` | Rewrite | Client interactions for homepage (country search autocomplete) |
| `src/app/(store)/esim/page.tsx` | Rewrite | eSIM Browse — filter sidebar + product grid |
| `src/app/(store)/esim/destination-grid.tsx` | Rewrite | Country cards component |
| `src/app/(store)/esim/filter-sidebar.tsx` | Create | Filter sidebar / mobile filter sheet |
| `src/app/(store)/esim/product-grid.tsx` | Create | Product grid with sorting |
| `src/app/(store)/products/page.tsx` | Rewrite | Product detail page |
| `src/components/store/product-card.tsx` | Create | Reusable product card component |
| `src/components/store/plan-selector.tsx` | Create | Data tier tab selector |
| `src/components/store/country-search.tsx` | Create | Country autocomplete search bar |
| `src/app/(store)/checkout/page.tsx` | Rewrite | Checkout with Stripe Elements |
| `src/app/api/checkout/intent/route.ts` | Create | PaymentIntent creation endpoint |
| `src/app/(store)/checkout/success/page.tsx` | Rewrite | Success + QR display + activation guide |
| `src/app/(store)/order/[orderNumber]/page.tsx` | Rewrite | Order detail — QR, usage, top-up CTA |
| `src/components/store/esim-card.tsx` | Create | Reusable eSIM QR + activation display |
| `src/components/store/activation-guide.tsx` | Create | iOS/Android step-by-step tabs |

---

## Task 1: Homepage — Hero + Country Search

**Files:**
- Rewrite: `src/app/(store)/page.tsx`
- Rewrite: `src/app/(store)/home-client.tsx`
- Create: `src/components/store/country-search.tsx`

- [ ] **Step 1: Create `CountrySearch` client component**

Create `src/components/store/country-search.tsx`:

```typescript
"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

interface CountrySearchProps {
  countries: { code: string; name: string; slug: string; flag: string }[]
  placeholder?: string
  className?: string
}

export function CountrySearch({ countries, placeholder = "Where are you going?", className }: CountrySearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [, startTransition] = useTransition()

  const filtered = query.length >= 1
    ? countries.filter(c => c.name.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : []

  function handleSelect(slug: string) {
    setOpen(false)
    setQuery("")
    startTransition(() => router.push(`/esim/${slug}`))
  }

  return (
    <div className={cn("relative w-full max-w-2xl mx-auto", className)}>
      <div className="relative flex items-center">
        <Search className="absolute left-4 size-5 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
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
          {filtered.map(country => (
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
```

- [ ] **Step 2: Rewrite `home-client.tsx`**

`home-client.tsx` should contain only the interactive parts (country search, newsletter signup if any). Pass server-fetched data as props:

```typescript
"use client"

import { CountrySearch } from "@/components/store/country-search"

interface HomeClientProps {
  countries: { code: string; name: string; slug: string; flag: string }[]
}

export function HomeClient({ countries }: HomeClientProps) {
  return (
    <CountrySearch
      countries={countries}
      placeholder="Where are you going?"
      className="mt-8"
    />
  )
}
```

- [ ] **Step 3: Rewrite `src/app/(store)/page.tsx` — full homepage**

```typescript
import { Suspense } from "react"
import Link from "next/link"
import Image from "next/image"
import { getTranslations } from "next-intl/server"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { HomeClient } from "./home-client"
import { getCountries } from "@/lib/countries"
import { getTopProducts } from "@/services/product-service"
import { Star, Zap, Globe, Shield, Clock } from "lucide-react"

export default async function HomePage() {
  const t = await getTranslations("home")
  const [countries, topProducts] = await Promise.all([
    getCountries(),
    getTopProducts({ limit: 6 }),
  ])

  return (
    <main>
      {/* Hero */}
      <section className="relative min-h-[92vh] flex flex-col items-center justify-center px-4 text-center overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full blur-[120px] opacity-20"
            style={{ background: "var(--brand-gradient)" }} />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto space-y-6">
          <Badge variant="brand" className="text-xs px-3 py-1">
            ✦ Instant eSIM Delivery
          </Badge>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.05]">
            Your eSIM.{" "}
            <span className="text-brand-gradient" style={{ background: "var(--brand-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Any Country.
            </span>{" "}
            Instant.
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Connect in 150+ countries. No roaming charges. No SIM swaps.
            Scan a QR code and you&apos;re online in minutes.
          </p>

          <HomeClient countries={countries} />

          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-2">
            <Button variant="brand" size="lg" asChild>
              <Link href="/esim">Browse all plans</Link>
            </Button>
          </div>
        </div>

        {/* Trust signals */}
        <div className="relative z-10 flex flex-wrap gap-6 justify-center mt-16 text-sm text-muted-foreground">
          {[
            { icon: Zap, text: "Instant delivery" },
            { icon: Globe, text: "150+ countries" },
            { icon: Shield, text: "Secure checkout" },
            { icon: Clock, text: "24/7 support" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2">
              <Icon className="size-4 text-[#6C4FFF]" />
              <span>{text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Featured destinations */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl font-bold">Popular destinations</h2>
            <Button variant="ghost" asChild>
              <Link href="/esim">View all →</Link>
            </Button>
          </div>
          <Suspense fallback={
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-36 rounded-2xl" />
              ))}
            </div>
          }>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {topProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/esim/${product.slug ?? product.id}`}
                  className="group relative flex flex-col items-center justify-end p-4 rounded-2xl border border-border bg-card hover:brand-glow overflow-hidden transition-all duration-200 h-36"
                >
                  <span className="text-4xl mb-2">{product.flag ?? "🌍"}</span>
                  <span className="text-sm font-semibold text-foreground text-center">{product.name}</span>
                  <span className="text-xs text-muted-foreground">from ${product.price}</span>
                </Link>
              ))}
            </div>
          </Suspense>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-4 bg-card/30">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">How it works</h2>
          <p className="text-muted-foreground mb-16">Three steps to stay connected anywhere.</p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Search your destination", desc: "Enter the country or region you're travelling to. We'll show you the best plans." },
              { step: "02", title: "Choose your plan", desc: "Pick the data amount and validity that suits your trip. Pay once with no hidden fees." },
              { step: "03", title: "Scan & connect", desc: "Install the eSIM by scanning a QR code. Done in under 2 minutes. Works on any modern phone." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex flex-col items-center text-center space-y-3">
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ background: "var(--brand-gradient)" }}>
                  {step}
                </div>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="text-muted-foreground text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-1 mb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="size-5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="font-semibold text-lg">4.9 / 5 from 500+ reviews</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Sarah M.", country: "🇬🇧 UK → Italy", text: "Set up in 2 minutes, worked perfectly in Rome. Way cheaper than my carrier's roaming add-on." },
              { name: "Tomás R.", country: "🇪🇸 Spain → Japan", text: "Instant delivery, QR code in my email before I even got to the airport. 10/10 experience." },
              { name: "Priya K.", country: "🇮🇳 India → Germany", text: "I use Mobialo every business trip. The data is fast and it always just works." },
            ].map(({ name, country, text }) => (
              <div key={name} className="p-6 rounded-2xl border border-border bg-card space-y-3">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">&ldquo;{text}&rdquo;</p>
                <div>
                  <p className="text-sm font-semibold">{name}</p>
                  <p className="text-xs text-muted-foreground">{country}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
```

- [ ] **Step 4: Verify `getCountries()` and `getTopProducts()` exist with correct return shapes**

```bash
grep -n "export.*getCountries\|export.*getTopProducts" src/lib/countries.ts src/services/product-service.ts
```

If `getTopProducts` doesn't exist, add it to `product-service.ts`:

```typescript
export async function getTopProducts({ limit = 6 }: { limit?: number } = {}) {
  const products = await db.product.findMany({
    where: { isActive: true },
    orderBy: { penalizedRank: "asc" },
    take: limit,
    select: { id: true, name: true, price: true, slug: true, countries: true },
  })
  return products
}
```

- [ ] **Step 5: Build check**

```bash
bun run build 2>&1 | grep -E "error TS|Error:" | head -20
```

- [ ] **Step 6: Commit**

```bash
git add src/app/(store)/page.tsx src/app/(store)/home-client.tsx src/components/store/country-search.tsx src/services/product-service.ts
git commit -m "feat: rebuild homepage — hero, country search, featured destinations, reviews"
```

---

## Task 2: Rebuild Checkout with Stripe Elements

This is the most critical change in Phase 2. Replaces the Stripe hosted redirect with embedded Stripe Elements — user never leaves Mobialo.

**Files:**
- Create: `src/app/api/checkout/intent/route.ts`
- Rewrite: `src/app/(store)/checkout/page.tsx`

- [ ] **Step 1: Install Stripe React library if not present**

```bash
grep "@stripe/react-stripe-js" package.json || bun add @stripe/react-stripe-js @stripe/stripe-js
```

- [ ] **Step 2: Create PaymentIntent endpoint**

Create `src/app/api/checkout/intent/route.ts`:

```typescript
import { NextRequest } from "next/server"
import { z } from "zod"
import { stripe } from "@/lib/stripe"
import { db } from "@/lib/db"
import { calculateOrderTotal, validateProducts } from "@/services/order-service"
import { successResponse, errorResponse, parseJsonBody } from "@/lib/auth-helpers"
import { checkRateLimit } from "@/lib/rate-limit"
import { logger } from "@/lib/logger"

const log = logger.child("checkout:intent")

const intentSchema = z.object({
  items: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().int().positive().max(10),
  })).min(1).max(5),
  email: z.string().email("Valid email required"),
  currency: z.string().length(3).default("usd"),
})

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  const rateLimit = await checkRateLimit(ip, "checkout:intent")
  if (!rateLimit.success) {
    return errorResponse("Too many requests. Please slow down.", 429)
  }

  const body = await parseJsonBody(request)
  const validation = intentSchema.safeParse(body)
  if (!validation.success) {
    return errorResponse(validation.error.issues[0].message, 400)
  }

  const { items, email, currency } = validation.data

  // Validate products — always from DB, never trust client prices
  const productCheck = await validateProducts(items)
  if (!productCheck.valid) {
    return errorResponse(productCheck.errors.join(", "), 400)
  }

  // Calculate totals server-side
  const totals = await calculateOrderTotal(items)

  // Amount in cents
  const amountCents = Math.round(totals.total * 100)

  if (amountCents < 50) {
    return errorResponse("Order total is below the minimum amount", 400)
  }

  // Create order in DB first
  const { generateOrderNumber } = await import("@/services/order-service")
  const orderNumber = generateOrderNumber()

  const order = await db.order.create({
    data: {
      orderNumber,
      email,
      status: "PENDING",
      paymentStatus: "PENDING",
      subtotal: totals.subtotal,
      total: totals.total,
      tax: totals.tax,
      discount: totals.discount,
      currency: currency.toUpperCase(),
      items: {
        create: await Promise.all(items.map(async (item) => {
          const product = productCheck.products.find(p => p.id === item.productId)!
          return {
            productId: item.productId,
            productName: product.name,
            quantity: item.quantity,
            unitPrice: product.price,
            totalPrice: product.price * item.quantity,
          }
        })),
      },
    },
  })

  // Create Stripe PaymentIntent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: currency.toLowerCase(),
    receipt_email: email,
    metadata: {
      orderId: order.id,
      orderNumber,
    },
    automatic_payment_methods: { enabled: true },
  })

  log.info("PaymentIntent created", { metadata: { orderId: order.id, paymentIntentId: paymentIntent.id } })

  return successResponse({
    clientSecret: paymentIntent.client_secret,
    orderId: order.id,
    orderNumber,
    total: totals.total,
    currency: currency.toUpperCase(),
  })
}
```

- [ ] **Step 3: Update Stripe webhook to handle `payment_intent.succeeded`**

The webhook already handles `checkout.session.completed`. Add handling for `payment_intent.succeeded` in `src/app/api/webhooks/stripe/route.ts` as a fallback:

In the switch statement, ensure `payment_intent.succeeded` maps correctly to the order via `metadata.orderId` and triggers `processOrderWithMobimatter`.

- [ ] **Step 4: Rewrite checkout page**

Rewrite `src/app/(store)/checkout/page.tsx` as a client component that:
1. Reads cart from `CartContext`
2. Calls `POST /api/checkout/intent` to create order + PaymentIntent
3. Renders `<Elements>` wrapper with `clientSecret`
4. Renders `<PaymentElement>` + email input + submit button
5. On confirm: calls `stripe.confirmPayment()` with `return_url: /checkout/success?order_id=...`

Key implementation notes:
- Cart context provides `items[]` — send to `/api/checkout/intent`
- Display order summary (product name, data, price) above payment form
- "Pay now" button shows spinner during confirmation
- On error: display Stripe's error message inline, never redirect
- On success: Stripe redirects to `/checkout/success?payment_intent=...&redirect_status=succeeded`

- [ ] **Step 5: Build and manual test checkout flow locally**

```bash
bun run dev
```

Add a product to cart, go to /checkout, use Stripe test card `4242 4242 4242 4242`, verify:
- Payment form renders on-page (no redirect to stripe.com)
- Success redirect works
- Order appears in DB as PROCESSING

- [ ] **Step 6: Commit**

```bash
git add src/app/api/checkout/intent/ src/app/(store)/checkout/ src/app/api/webhooks/stripe/route.ts
git commit -m "feat: migrate checkout to Stripe Elements — no redirect, on-page payment"
```

---

## Task 3: Rebuild Checkout Success + Order Detail

**Files:**
- Rewrite: `src/app/(store)/checkout/success/page.tsx`
- Rewrite: `src/app/(store)/order/[orderNumber]/page.tsx`
- Create: `src/components/store/esim-card.tsx`
- Create: `src/components/store/activation-guide.tsx`

- [ ] **Step 1: Create `ActivationGuide` component**

Create `src/components/store/activation-guide.tsx`:

```typescript
"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, Check } from "lucide-react"
import { useState } from "react"

interface ActivationGuideProps {
  activationCode?: string | null
  smdpAddress?: string | null
}

export function ActivationGuide({ activationCode, smdpAddress }: ActivationGuideProps) {
  const [copied, setCopied] = useState<string | null>(null)

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="space-y-4">
      {activationCode && (
        <div className="p-4 rounded-xl border border-border bg-card">
          <p className="text-xs text-muted-foreground mb-2">Activation code</p>
          <div className="flex items-center justify-between gap-2">
            <code className="font-mono text-sm text-foreground break-all">{activationCode}</code>
            <button
              onClick={() => copy(activationCode, "code")}
              className="shrink-0 p-2 rounded-lg hover:bg-accent transition-colors"
            >
              {copied === "code" ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4 text-muted-foreground" />}
            </button>
          </div>
        </div>
      )}

      <Tabs defaultValue="ios">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ios">iPhone (iOS)</TabsTrigger>
          <TabsTrigger value="android">Android</TabsTrigger>
        </TabsList>
        <TabsContent value="ios" className="space-y-3 pt-4">
          {[
            "Open Settings → Cellular → Add eSIM",
            "Tap \"Use QR Code\" and scan the code above",
            "Follow the prompts to activate",
            "Turn off your physical SIM if needed for this line",
          ].map((step, i) => (
            <div key={i} className="flex gap-3 text-sm">
              <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs text-white font-medium"
                style={{ background: "var(--brand-gradient)" }}>
                {i + 1}
              </span>
              <span className="text-muted-foreground pt-0.5">{step}</span>
            </div>
          ))}
        </TabsContent>
        <TabsContent value="android" className="space-y-3 pt-4">
          {[
            "Open Settings → Network & Internet → SIMs",
            "Tap \"Add eSIM\" → \"Scan QR code\"",
            "Scan the QR code above",
            "Follow the on-screen instructions to activate",
          ].map((step, i) => (
            <div key={i} className="flex gap-3 text-sm">
              <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs text-white font-medium"
                style={{ background: "var(--brand-gradient)" }}>
                {i + 1}
              </span>
              <span className="text-muted-foreground pt-0.5">{step}</span>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

- [ ] **Step 2: Create `EsimCard` component**

Create `src/components/store/esim-card.tsx`:

```typescript
import Image from "next/image"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ActivationGuide } from "./activation-guide"

interface EsimCardProps {
  orderNumber: string
  status: string
  qrCodeUrl?: string
  activationCode?: string | null
  smdpAddress?: string | null
  productName?: string
}

export function EsimCard({
  orderNumber,
  status,
  qrCodeUrl,
  activationCode,
  smdpAddress,
  productName,
}: EsimCardProps) {
  const isProcessing = status === "PROCESSING" || status === "PENDING"
  const isReady = status === "COMPLETED"

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="p-6 border-b border-border">
        <h2 className="font-semibold text-lg">Your eSIM</h2>
        {productName && <p className="text-sm text-muted-foreground mt-0.5">{productName}</p>}
      </div>

      <div className="p-6 flex flex-col md:flex-row gap-8">
        {/* QR Code */}
        <div className="flex flex-col items-center gap-4">
          {isReady && qrCodeUrl ? (
            <>
              <div className="p-4 bg-white rounded-2xl shadow-sm">
                <Image src={qrCodeUrl} alt="eSIM QR Code" width={200} height={200} unoptimized />
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href={qrCodeUrl} download={`mobialo-${orderNumber}.png`}>
                  <Download className="size-4 mr-2" />
                  Download QR
                </a>
              </Button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Skeleton className="w-[200px] h-[200px] rounded-2xl" />
              <p className="text-sm text-muted-foreground text-center max-w-[180px]">
                {isProcessing ? "Activating your eSIM… usually takes under 60 seconds." : "QR code unavailable"}
              </p>
            </div>
          )}
        </div>

        {/* Activation guide */}
        <div className="flex-1">
          {isReady ? (
            <ActivationGuide activationCode={activationCode} smdpAddress={smdpAddress} />
          ) : (
            <div className="space-y-3">
              <Skeleton className="h-12 rounded-xl" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-24 rounded-xl" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Rewrite checkout success page**

`src/app/(store)/checkout/success/page.tsx` — key behavior:
- Reads `payment_intent` from URL params
- Fetches order via `GET /api/orders?paymentIntentId=...`
- Polls every 5s until status is COMPLETED (max 120s)
- Shows `EsimCard` immediately — skeleton while PROCESSING, real QR when COMPLETED
- Shows email confirmation notice: "We'll also send your eSIM to [email]"
- Shows order number prominently for reference

- [ ] **Step 4: Rewrite order detail page**

`src/app/(store)/order/[orderNumber]/page.tsx`:
- Server component, fetches order server-side
- Shows `EsimCard` component
- Shows usage bar if MobiMatter usage data available
- Shows order metadata: date, amount paid, plan details
- "Top Up" button if plan supports it
- "Need help?" → links to guide

- [ ] **Step 5: Build check + manual test**

```bash
bun run build 2>&1 | grep -E "error TS" | head -10
```

Complete a test checkout. Verify QR code renders on success page once order is COMPLETED.

- [ ] **Step 6: Commit**

```bash
git add src/components/store/ src/app/(store)/checkout/success/ src/app/(store)/order/
git commit -m "feat: rebuild checkout success, order detail, eSIM card + activation guide"
```

---

## Task 4: Rebuild eSIM Browse Page

**Files:**
- Rewrite: `src/app/(store)/esim/page.tsx`
- Create: `src/app/(store)/esim/filter-sidebar.tsx`
- Create: `src/components/store/product-card.tsx`

- [ ] **Step 1: Create `ProductCard` component**

Create `src/components/store/product-card.tsx`:

```typescript
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface ProductCardProps {
  id: string
  name: string
  slug?: string
  flag?: string
  dataAmount: number
  dataUnit: string
  validityDays: number
  price: number
  currency?: string
  provider?: string
  isBestValue?: boolean
  href: string
}

export function ProductCard({
  name, flag, dataAmount, dataUnit, validityDays, price, currency = "USD",
  provider, isBestValue, href,
}: ProductCardProps) {
  return (
    <Link href={href} className="block">
      <div className="group p-5 rounded-2xl border border-border bg-card hover:brand-glow transition-all duration-200 h-full flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {flag && <span className="text-2xl">{flag}</span>}
            <div>
              <p className="font-semibold text-sm leading-tight">{name}</p>
              {provider && <p className="text-xs text-muted-foreground">{provider}</p>}
            </div>
          </div>
          {isBestValue && <Badge variant="brand" className="text-xs">Best value</Badge>}
        </div>

        <div className="flex gap-4">
          <div>
            <p className="text-2xl font-bold">
              {dataAmount === -1 ? "∞" : dataAmount}
              <span className="text-sm font-normal text-muted-foreground ml-1">{dataUnit}</span>
            </p>
            <p className="text-xs text-muted-foreground">{validityDays} days</p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-auto">
          <p className="text-xl font-bold">
            ${price.toFixed(2)}
            <span className="text-xs font-normal text-muted-foreground ml-1">{currency}</span>
          </p>
          <Button variant="brand" size="sm" className="text-xs">Get eSIM</Button>
        </div>
      </div>
    </Link>
  )
}
```

- [ ] **Step 2: Rewrite eSIM browse page**

`src/app/(store)/esim/page.tsx` — server component that:
- Accepts search params: `region`, `minData`, `maxData`, `maxDays`, `maxPrice`, `sort`
- Fetches filtered products server-side (paginated, 24/page)
- Renders filter sidebar + product grid
- Mobile: filter sheet accessible via sticky "Filters" button at bottom

- [ ] **Step 3: Build and visual check**

```bash
bun run dev
```

Go to `/esim`. Verify products grid renders, filters work, cards look polished.

- [ ] **Step 4: Commit**

```bash
git add src/app/(store)/esim/ src/components/store/product-card.tsx
git commit -m "feat: rebuild eSIM browse — filter sidebar, product grid, server-side filtering"
```

---

## Task 5: Phase 2 Final Check

- [ ] Run full test suite: `bun run test 2>&1 | tail -20`
- [ ] Run build: `bun run build 2>&1 | tail -10`
- [ ] Complete end-to-end purchase flow manually: homepage → browse → product → checkout → success → check email
- [ ] Verify mobile layout on iPhone viewport (375px width in dev tools)
- [ ] Push: `git push origin main`
- [ ] Verify Vercel deployment and test on production URL

---

## Phase 2 Complete

**Next:** `docs/superpowers/plans/2026-04-20-phase3-account-postpurchase.md`
