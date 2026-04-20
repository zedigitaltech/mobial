# Mobialo Overhaul — Phase 4: Admin + Polish

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the admin dashboard into a fully operational back-office tool, then do a complete performance, accessibility, and SEO pass across the whole platform.

**Prerequisites:** Phases 1, 2, and 3 complete.

**Tech Stack:** Next.js 16, Recharts (for admin charts), Tailwind CSS 4, shadcn/ui, Playwright (E2E tests)

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `src/app/admin/page.tsx` | Rewrite | Admin overview — revenue, orders, fulfillment rate |
| `src/app/admin/orders/page.tsx` | Rewrite | Full orders table — filters, search, pagination, actions |
| `src/app/admin/layout.tsx` | Rewrite | Admin layout — sidebar nav, responsive |
| `src/app/admin/monitoring/page.tsx` | Polish | Error log viewer |
| `src/app/admin/affiliates/page.tsx` | Polish | Affiliate management |
| `src/app/admin/settings/page.tsx` | Polish | System config editor |
| `src/app/api/admin/stats/route.ts` | Audit | Verify all stats queries are correct |
| `src/app/layout.tsx` | Modify | Add Inter + JetBrains Mono font loading |
| Various page files | Modify | Add proper `generateMetadata()` for SEO |
| `public/sitemap.xml` → `src/app/sitemap.ts` | Create | Dynamic sitemap |
| `src/app/robots.ts` | Create | robots.txt |
| `e2e/checkout.spec.ts` | Extend | Full checkout E2E test |
| `e2e/auth.spec.ts` | Extend | Register + verify + login E2E |

---

## Task 1: Rebuild Admin Layout + Sidebar

**Files:**
- Rewrite: `src/app/admin/layout.tsx`

- [ ] **Step 1: Rewrite admin layout with sidebar navigation**

```typescript
// src/app/admin/layout.tsx
import Link from "next/link"
import { cn } from "@/lib/utils"
import { LayoutDashboard, ShoppingCart, Package, Users, Settings, BarChart3, Zap } from "lucide-react"

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/affiliates", label: "Affiliates", icon: Users },
  { href: "/admin/monitoring", label: "Monitoring", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden md:flex w-56 flex-col border-r border-border bg-card shrink-0">
        <div className="flex items-center gap-2 px-5 py-5 border-b border-border">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "var(--brand-gradient)" }}>
            <Zap className="size-4 text-white" />
          </div>
          <span className="font-bold text-sm">Admin</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/admin/layout.tsx
git commit -m "feat: rebuild admin layout — responsive sidebar navigation"
```

---

## Task 2: Rebuild Admin Overview Dashboard

**Files:**
- Rewrite: `src/app/admin/page.tsx`

- [ ] **Step 1: Add revenue chart data to stats API**

In `src/app/api/admin/stats/route.ts`, ensure it returns:

```typescript
{
  revenue: { today: number, week: number, month: number, chart: { date: string, amount: number }[] },
  orders: { total: number, fulfilled: number, failed: number, pending: number, refunded: number },
  fulfillmentRate: number, // fulfilled / (fulfilled + failed) * 100
  activeUsers: number,
  topCountries: { code: string, name: string, count: number }[],
  systemHealth: {
    mobimatterApiUp: boolean,
    stripeWebhookLastReceived: string | null,
    emailServiceUp: boolean,
  }
}
```

Implement the system health check by:
- MobiMatter: calling `GET /api/health` or checking last successful order creation time
- Stripe webhook: reading the most recent `AuditLog` with action `stripe_payment_success`
- Email service: checking if `RESEND_API_KEY` is set

- [ ] **Step 2: Rewrite admin overview page**

```typescript
// src/app/admin/page.tsx
// Server component — fetches stats server-side

// Layout:
// Row 1: Revenue (today / week / month) — 3 stat cards
// Row 2: Orders (total / fulfilled / failed / pending) — 4 stat cards
// Row 3 left: Revenue chart (last 30 days, Recharts AreaChart)
// Row 3 right: System health + quick actions
// Row 4: Recent failed orders (last 5 FAILED orders with retry buttons)
```

Install Recharts if not present:
```bash
grep "recharts" package.json || bun add recharts
```

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/page.tsx src/app/api/admin/stats/
git commit -m "feat: rebuild admin overview — revenue chart, order stats, system health"
```

---

## Task 3: Rebuild Admin Orders Table

**Files:**
- Rewrite: `src/app/admin/orders/page.tsx`

The orders table already has action buttons from Phase 1 Task 12. This task completes the full table with filters and pagination.

- [ ] **Step 1: Add server-side filtering and pagination to admin orders API**

In `src/app/api/admin/orders/route.ts`, ensure it accepts:
- `?status=FAILED` — filter by status
- `?search=MBL-001` — search by order number or email
- `?page=1&limit=20` — pagination
- `?from=2026-01-01&to=2026-04-20` — date range

Return: `{ orders: Order[], total: number, page: number, pages: number }`

- [ ] **Step 2: Rewrite orders page with filter bar**

```typescript
// Filter bar: status dropdown | search input | date range | "Export CSV" button
// Table columns: Order # | Email | Product | Amount | Status | Payment | Date | Actions
// Pagination: prev/next + page indicator
// "Export CSV" → calls GET /api/admin/orders?format=csv
```

- [ ] **Step 3: Add CSV export to admin orders API**

When `?format=csv` is in the request, return a CSV file instead of JSON:

```typescript
if (format === "csv") {
  const csv = [
    "Order Number,Email,Product,Amount,Currency,Status,Date",
    ...orders.map(o => `${o.orderNumber},${o.email},${o.items[0]?.productName ?? ""},${o.total},${o.currency},${o.status},${o.createdAt.toISOString()}`)
  ].join("\n")

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="mobialo-orders-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  })
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/orders/ src/app/api/admin/orders/
git commit -m "feat: rebuild admin orders — filters, pagination, CSV export, action buttons"
```

---

## Task 4: Font Loading Optimization

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Add Inter + JetBrains Mono via next/font**

```typescript
import { Inter, JetBrains_Mono } from "next/font/google"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
  weight: ["400", "500"],
})
```

Add both variables to the `<html>` tag:
```typescript
<html className={`${inter.variable} ${jetbrainsMono.variable} dark`}>
```

Update `globals.css` font references:
```css
--font-sans: var(--font-inter), system-ui, sans-serif;
--font-mono: var(--font-jetbrains-mono), "Courier New", monospace;
```

- [ ] **Step 2: Commit**

```bash
git add src/app/layout.tsx src/app/globals.css
git commit -m "perf: load Inter + JetBrains Mono via next/font for zero layout shift"
```

---

## Task 5: Image Optimization Pass

- [ ] **Step 1: Find all raw `<img>` tags**

```bash
grep -rn "<img " src/app --include="*.tsx" | grep -v "node_modules"
```

- [ ] **Step 2: Replace each `<img>` with Next.js `<Image>`**

For each occurrence:
- Import `Image from "next/image"`
- Set explicit `width` and `height` (or use `fill` with a sized container)
- Add `alt` text if missing
- Add `loading="lazy"` for below-fold images

- [ ] **Step 3: Add remote image domains to `next.config.ts`**

If any external image sources are used (Unsplash, MobiMatter CDN), add them:

```typescript
images: {
  remotePatterns: [
    { protocol: "https", hostname: "images.unsplash.com" },
    { protocol: "https", hostname: "cdn.mobimatter.com" },
  ],
},
```

- [ ] **Step 4: Commit**

```bash
git add src/ next.config.ts
git commit -m "perf: replace all img tags with Next Image, add remote patterns"
```

---

## Task 6: SEO — Metadata + Sitemap + Structured Data

- [ ] **Step 1: Add `generateMetadata()` to all P0 pages**

Each of these pages needs proper meta tags:

```typescript
// Homepage
export const metadata: Metadata = {
  title: "Mobialo — eSIM for 150+ Countries | Instant Delivery",
  description: "Buy an eSIM online. Connect instantly in 150+ countries. No roaming charges. Scan a QR code and go.",
  openGraph: {
    title: "Mobialo — Your eSIM for any country",
    description: "Instant eSIM delivery. 150+ countries. No SIM swap needed.",
    url: "https://mobialo.eu",
    siteName: "Mobialo",
    type: "website",
  },
}
```

Apply similar metadata to: `/esim`, `/esim/[country]`, `/products/[slug]`, `/blog/[slug]`

- [ ] **Step 2: Add Product structured data to product detail pages**

```typescript
// In product detail page, add JSON-LD:
const productSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: product.name,
  description: product.description,
  offers: {
    "@type": "Offer",
    price: product.price,
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
  },
}
```

- [ ] **Step 3: Create dynamic sitemap**

Create `src/app/sitemap.ts`:

```typescript
import { MetadataRoute } from "next"
import { db } from "@/lib/db"
import { BASE_URL } from "@/lib/env"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await db.product.findMany({
    where: { isActive: true },
    select: { slug: true, updatedAt: true },
  })

  const staticRoutes = [
    "/", "/esim", "/check-usage", "/free-trial",
    "/faq", "/about", "/contact", "/blog",
  ].map(route => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "/" ? 1 : 0.8,
  }))

  const productRoutes = products.map(p => ({
    url: `${BASE_URL}/products/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "daily" as const,
    priority: 0.9,
  }))

  return [...staticRoutes, ...productRoutes]
}
```

- [ ] **Step 4: Create robots.ts**

Create `src/app/robots.ts`:

```typescript
import { MetadataRoute } from "next"
import { BASE_URL } from "@/lib/env"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/sitemap.ts src/app/robots.ts src/app/(store)/
git commit -m "feat: SEO — metadata, Product schema, sitemap, robots.txt"
```

---

## Task 7: E2E Test Coverage for P0 Flows

**Files:**
- Extend: `e2e/checkout.spec.ts`
- Extend: `e2e/auth.spec.ts`

- [ ] **Step 1: Complete checkout E2E test**

`e2e/checkout.spec.ts` should test the full Stripe Elements flow:

```typescript
test("complete purchase with Stripe test card", async ({ page }) => {
  // 1. Pre-seed localStorage (cookie consent + cart with test product)
  await page.addInitScript(() => {
    localStorage.setItem("cookie-consent", JSON.stringify({
      essential: true, analytics: false, marketing: false, thirdParty: false,
      timestamp: new Date().toISOString(),
    }))
    localStorage.setItem("mobial_cart", JSON.stringify([{
      productId: process.env.TEST_PRODUCT_ID || "test-product-id",
      name: "Test eSIM 1GB",
      price: 4.99,
      dataAmount: 1,
      dataUnit: "GB",
      validityDays: 7,
      quantity: 1,
    }]))
  })

  // 2. Navigate to checkout
  await page.goto("/checkout")
  await expect(page.locator("[data-testid='checkout-form']")).toBeVisible()

  // 3. Fill email
  await page.fill("input[type='email']", "test@example.com")

  // 4. Fill Stripe Elements card (uses Stripe's iframe)
  const cardFrame = page.frameLocator("[data-testid='stripe-card-frame']")
  await cardFrame.locator("[placeholder*='Card number']").fill("4242424242424242")
  await cardFrame.locator("[placeholder*='MM']").fill("12/28")
  await cardFrame.locator("[placeholder*='CVC']").fill("123")

  // 5. Submit
  await page.click("[data-testid='pay-button']")

  // 6. Assert redirect to success page
  await expect(page).toHaveURL(/\/checkout\/success/)
  await expect(page.locator("[data-testid='order-number']")).toBeVisible({ timeout: 10000 })
})
```

Note: Stripe Elements in test mode uses test card numbers. The `frameLocator` selectors may need adjustment based on Stripe's actual iframe structure. Check with `page.frames()` during test development.

- [ ] **Step 2: Complete auth E2E test**

`e2e/auth.spec.ts` should test:
- Register with new email
- Verify email (skip in test env if token is in DB)
- Login → lands on dashboard
- Logout

- [ ] **Step 3: Run E2E tests**

```bash
bun run test:e2e 2>&1 | tail -30
```

Fix any failures before marking this task complete.

- [ ] **Step 4: Commit**

```bash
git add e2e/
git commit -m "test: extend E2E coverage — full checkout flow, auth registration flow"
```

---

## Task 8: Accessibility Audit

- [ ] **Step 1: Run automated accessibility check**

```bash
npx @axe-core/cli http://localhost:3000 --exit
npx @axe-core/cli http://localhost:3000/esim --exit
npx @axe-core/cli http://localhost:3000/checkout --exit
```

- [ ] **Step 2: Fix critical issues**

Common issues to check:
- All `<img>` have `alt` text
- All form inputs have associated `<label>` elements
- Color contrast ratio ≥ 4.5:1 for normal text (check muted text on dark cards)
- Focus order makes sense (tab through checkout form)
- Interactive elements are keyboard navigable
- `<button>` not `<div onClick>`

- [ ] **Step 3: Check contrast of muted text**

`text-muted-foreground` on `--bg-surface` must pass WCAG AA.
Current `--muted-foreground: oklch(0.58 0.015 250)` on `--bg-surface: #0F1624` — verify with a contrast checker tool.

- [ ] **Step 4: Commit fixes**

```bash
git add src/
git commit -m "a11y: fix contrast, label associations, keyboard navigation"
```

---

## Task 9: Performance Audit + Core Web Vitals

- [ ] **Step 1: Run Lighthouse on production**

```bash
npx lighthouse https://mobialo.eu --output json --output html --output-path ./lighthouse-report
```

Target scores: Performance 90+, Accessibility 90+, SEO 90+, Best Practices 90+

- [ ] **Step 2: Fix LCP issues**

Largest Contentful Paint target: < 2.5s

Common fixes:
- Add `priority` prop to hero image (if hero has an image): `<Image priority>`
- Preload brand font in `layout.tsx`
- Check if any server components are slow (add `generateStaticParams` where possible)

- [ ] **Step 3: Fix CLS issues**

Cumulative Layout Shift target: < 0.1

Common fixes:
- Set explicit dimensions on all images
- Reserve space for async-loaded content (skeleton loaders already added in Phase 1)
- Avoid FOUC on theme switch

- [ ] **Step 4: Server-side pagination on all list views**

Verify these pages paginate server-side (not client-side):
- `/esim` — 24 products/page ✓ (done in Phase 2)
- `/orders` — 10 orders/page ✓ (done in Phase 3)
- `/admin/orders` — 20 orders/page ✓ (done in Phase 4 Task 3)
- `/blog` — 10 posts/page (check and add if missing)

- [ ] **Step 5: Commit performance fixes**

```bash
git add src/ next.config.ts
git commit -m "perf: LCP image priority, pagination verification, CLS fixes"
```

---

## Task 10: Final Production Checklist

- [ ] All manual Vercel env var prerequisites from Phase 1 are done
- [ ] `bun run test` — all unit tests pass
- [ ] `bun run test:e2e` — all E2E tests pass
- [ ] `bun run build` — zero TypeScript errors
- [ ] Lighthouse scores: Performance 90+, Accessibility 90+, SEO 90+
- [ ] Test full purchase flow on production: `https://mobialo.eu`
- [ ] Verify webhook delivers eSIM correctly
- [ ] Verify order confirmation email arrives with QR code
- [ ] Test Google OAuth login on production
- [ ] Test admin: retry a stuck order, view eSIM details, check stats
- [ ] Review Sentry for any unhandled errors from test purchases
- [ ] Push final commit: `git push origin main`

---

## All Phases Complete

The platform is production-ready. Handing off to Phase 2 of the roadmap: mobile app (`mobial-app`) inherits the design system.
