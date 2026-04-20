# Mobialo Platform Overhaul — Design Spec
**Date:** 2026-04-20
**Author:** Z.E Digital Tech
**Status:** Approved — proceeding to implementation

---

## Overview

A full-scale overhaul of the Mobialo eSIM platform — design system, UI/UX, backend architecture, and admin tooling. The goal is a premium, trustworthy product that reflects the Z.E Digital Tech brand. No patches — everything rebuilt to a coherent standard.

**Approach:** Design-First Rebuild. Design system defined first, pages rebuilt against it, backend hardened in parallel.

**Timeline:** 8 weeks across 4 phases.

**Scope:** Web app (mobialo.eu) only. Mobile app inherits design system in Phase 2 (separate project).

---

## 1. Design System

### 1.1 Color Palette

Dark mode first. Light mode as secondary (Phase 4).

```css
/* Backgrounds */
--bg-base:     #07090F;   /* page background */
--bg-surface:  #0F1624;   /* cards, nav, modals */
--bg-elevated: #161F33;   /* hover states, dropdowns */

/* Brand */
--brand-primary:   #6C4FFF;   /* deep indigo/violet */
--brand-secondary: #00D9B8;   /* electric teal */
--brand-gradient:  linear-gradient(135deg, #6C4FFF 0%, #00D9B8 100%);

/* Text */
--text-primary:   #F8FAFC;
--text-secondary: #94A3B8;
--text-muted:     #475569;

/* Functional */
--success: #22C55E;
--warning: #F59E0B;
--error:   #EF4444;
--info:    #3B82F6;

/* Structure */
--border: #1E293B;
```

### 1.2 Typography

Single typeface: **Inter** (variable font, loaded via `next/font/google`).
Monospace: **JetBrains Mono** — activation codes, ICCID, technical strings only.

| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `display` | 64px | 800 | 1.1 | Hero headline |
| `h1` | 40px | 700 | 1.2 | Page titles |
| `h2` | 28px | 600 | 1.3 | Section headers |
| `h3` | 20px | 600 | 1.4 | Card titles |
| `body-lg` | 18px | 400 | 1.6 | Lead paragraphs |
| `body` | 16px | 400 | 1.6 | Default prose |
| `small` | 14px | 400 | 1.5 | Metadata, labels |
| `xs` | 12px | 500 | 1.4 | Badges, tags |
| `mono` | 13px | 500 | 1.5 | Activation codes |

### 1.3 Spacing Scale

Base unit: `4px`. All spacing uses multiples:
`4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128`

### 1.4 Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `sm` | 8px | Inputs, small elements |
| `md` | 12px | Buttons |
| `lg` | 16px | Cards |
| `xl` | 24px | Modals, large cards |
| `full` | 9999px | Pills, badges, avatar |

### 1.5 Component Principles

**Buttons:**
- Primary: brand gradient fill, white text, pill shape, 44px height min
- Secondary: `--border` 1px, white text, same pill shape
- Ghost: text only, brand primary color
- Destructive: `--error` fill
- All buttons: 150ms transition, scale(0.98) on active

**Cards:**
- Background: `--bg-surface`
- Border: `1px solid var(--border)`
- Radius: 16px
- Hover: `box-shadow: 0 0 0 1px rgba(108, 79, 255, 0.3), 0 8px 32px rgba(108, 79, 255, 0.1)`

**Inputs:**
- Background: `--bg-elevated`
- Border: `1px solid var(--border)`
- Focus ring: `0 0 0 2px var(--brand-primary)`
- Label always above (never placeholder-only)
- Error state: red border + error message below

**Badges:**
| Status | Color |
|--------|-------|
| COMPLETED / Active | `--success` |
| PROCESSING | `--warning` |
| PENDING | `--info` |
| FAILED / CANCELLED | `--error` |
| REFUNDED | `--text-muted` |

**Skeleton Loaders:**
- All async data sections show animated skeleton, never "..." text
- Pulse animation: `opacity: 0.5 → 1` at 1.5s interval

---

## 2. Information Architecture

### 2.1 Navigation

**Desktop top bar:**
```
[Mobialo logo]  Plans  Destinations  How It Works  Blog    [Cart (n)] [Sign In] [Get Started →]
```

**Mobile:**
- Top bar: logo (left) + cart icon (right)
- Bottom bar: Home | Browse | Orders | Account

### 2.2 Page Inventory

| Priority | Route | Current Status | Target |
|----------|-------|----------------|--------|
| P0 | `/` | Exists, needs full rebuild | Full rebuild |
| P0 | `/esim` | Exists, needs rebuild | Full rebuild |
| P0 | `/esim/[country]` | Exists (destination-grid) | Full rebuild |
| P0 | `/products/[slug]` or `/esim/[country]/[slug]` | Exists | Full rebuild |
| P0 | `/checkout` | Exists | Full rebuild (Stripe Elements) |
| P0 | `/checkout/success` | Exists | Full rebuild |
| P0 | `/order/[orderNumber]` | Exists | Full rebuild |
| P1 | `/orders` | Exists | Full rebuild |
| P1 | `/dashboard` | Exists | Full rebuild |
| P1 | `/settings` | Exists | Full rebuild |
| P1 | `/login` | Exists | Full rebuild |
| P1 | `/register` | Exists (inline) | Dedicated page |
| P1 | `/verify-email` | Exists | Polish |
| P1 | `/reset-password` | Exists | Polish |
| P2 | `/check-usage` | Exists | Polish |
| P2 | `/free-trial` | Exists, incomplete | Complete + polish |
| P2 | `/referrals` | Exists, incomplete | Complete + polish |
| P2 | `/topup` | Exists, incomplete | Complete + polish |
| P2 | `/blog` | Exists | Polish |
| P2 | `/faq` | Exists | Polish |
| P2 | `/contact` | Exists | Polish |
| P3 | `/admin` | Exists, minimal | Full rebuild |
| P3 | `/admin/orders` | Exists, minimal | Full rebuild |
| P3 | `/admin/affiliates` | Exists | Polish + complete |
| P3 | `/admin/monitoring` | Exists | Polish |
| P3 | `/admin/settings` | Exists | Polish |

---

## 3. Page Designs

### 3.1 Homepage (`/`)

**Hero section (full viewport height):**
- Dark gradient background with subtle animated mesh/noise texture
- Headline: *"Your eSIM. Any Country. Instant."* — Display size, bold
- Subtext: *"Connect in 150+ countries. No roaming. No SIM swaps. Instant activation."* — Body LG, secondary color
- Search bar (centered, 600px max): "Where are you going?" → country autocomplete → routes to `/esim/[country]`
- Trust badges below search: "Instant Delivery" | "150+ Countries" | "24/7 Support" | "5-Star Rated"

**Featured destinations (6 cards):**
- Country photography (Unsplash source photo by country)
- Country name + flag
- "From $X.XX" — lowest price plan
- Hover: scale up + brand glow

**How it works (3 steps):**
1. Search your destination
2. Choose your plan
3. Scan & connect

**Social proof:**
- Average rating (stars) + review count
- 3 featured reviews with avatar, name, country

**FAQ accordion** — top 5 questions

**Footer:** logo, nav links, social links, legal links, language selector

---

### 3.2 eSIM Browse (`/esim`)

**Layout (desktop):** Filter sidebar (240px) | Product grid (fluid)
**Layout (mobile):** Sticky "Filters" button opens bottom sheet

**Filters:**
- Region (chips: Europe, Asia, Americas, Africa, Middle East, Global)
- Data amount (slider: 1GB – Unlimited)
- Validity (chips: 7 days, 15 days, 30 days, 90 days)
- Price range (slider)
- Provider (multi-select)

**Product cards:**
- Country flag + name
- Provider name + logo
- Data amount (bold, large)
- Validity period
- Price (bold) with currency selector
- "Get eSIM" button

**Sorting:** Recommended (default) | Cheapest | Most Data | Shortest Validity

---

### 3.3 Product Detail (`/esim/[country]/[slug]` or `/products/[slug]`)

**Hero:** Country photo (full width, gradient overlay) + country name + flag

**Plan selector:** Card tabs for each data tier of the product family (1GB, 3GB, 5GB, 10GB, Unlimited)

**Key specs (icon grid):**
- Data amount
- Validity
- Countries covered
- Network type (5G/4G)
- Activation type (QR / Manual)
- Hotspot allowed (Yes/No)

**Coverage:** Static coverage map image

**Activation instructions preview:** Collapsible — "How do I install this?"

**Reviews:** Stars, count, 3 most recent

**Sticky bottom bar (mobile):** Price + "Add to Cart"

**Desktop sidebar:** Price card, "Add to Cart", trust signals

---

### 3.4 Checkout (`/checkout`)

**Replace Stripe hosted checkout with Stripe Elements (embedded).**

**Layout (desktop):** 2-column — left: order summary, right: payment form
**Layout (mobile):** Single column, summary collapsible at top

**Flow:**
1. Order summary: product name, data, validity, price, currency selector, promo code input
2. Contact: email field (required — for eSIM delivery)
3. Optional account creation: "Save your eSIM for later — create a free account" (not required)
4. Payment: Stripe Elements card input (supports Apple Pay / Google Pay automatically)
5. "Buy Now" CTA with lock icon + "Secured by Stripe"

**No redirect to Stripe hosted page.** Stripe Elements stays on-site.

---

### 3.5 Checkout Success + Order Detail

**Immediate display — do not wait for MobiMatter.**
As soon as Stripe payment confirmed → show:
- "Payment confirmed. Your eSIM is being activated." status message
- QR code placeholder (spinner) — replaced with actual QR once COMPLETED
- Activation code (LPA string) shown immediately if available
- "We'll email you at [email] once it's ready" reassurance

**Once COMPLETED (polling every 5s, max 120s):**
- QR code fully rendered (large, scannable)
- Copy activation code button
- Download QR as PNG button
- Platform tabs: iOS step-by-step | Android step-by-step
- "Add to wallet" (if applicable)
- Data details: amount, validity start date

**Order detail page (`/order/[orderNumber]`):**
- Same QR + activation info
- Usage bar (data remaining)
- Top-up CTA (if plan supports it)
- Order metadata: order number, purchase date, plan name, price paid

---

### 3.6 Dashboard (`/dashboard`)

**Stats row (4 cards):**
- Active eSIMs count
- Total data remaining (sum across active eSIMs)
- Wallet balance (with "Add funds" link)
- Referral earnings

**Active eSIMs widget:**
- List of COMPLETED orders with active validity
- Data usage bar per eSIM
- "Top Up" button per eSIM (if supported)

**Recent orders (last 3):**
- Status badge, product name, date, price
- "View All" link to `/orders`

**Referral widget:**
- User's referral code (copyable)
- "Share" button
- Count referred + earned

---

### 3.7 Admin Dashboard (`/admin`)

**Overview stats:** Revenue (today/week/month), Orders (fulfilled/failed/pending), Fulfillment rate %, Active users

**Orders table:**
- Columns: Order #, Customer email, Product, Amount, Status, Date, Actions
- Actions per row: "Retry Fulfillment" | "Issue Refund" | "Resend Email" | "View Details"
- Filters: status, date range, search by email/order number
- Bulk actions: retry selected, export CSV

**Order detail modal:**
- Full order info, MobiMatter order ID, payment reference
- eSIM details (encrypted, shown to admin only)
- Audit log timeline
- Manual action buttons

**Products panel:**
- Sync status (last synced, count)
- "Sync Now" button
- Product list with active/inactive toggle

**Users panel:**
- User list, role management, account lookup

**System health:**
- MobiMatter API status
- Stripe webhook last received
- Email service status
- Database connection

---

## 4. Backend Architecture

### 4.1 Immediate Fixes (Phase 1)

1. **Env validation on startup** — `src/lib/env.ts` throws `Error` if any required var is missing. App refuses to start.

2. **Price integrity** — `order-service.ts` always re-fetches product price from DB. Client sends `productId` + `quantity` only. Unit price calculated server-side.

3. **Idempotency** — all MobiMatter calls use `orderId` as idempotency key. Webhook already deduplicates, extend to service layer.

4. **CSRF protection** — all state-mutating API routes (`POST/PUT/DELETE`) require `X-Requested-With: XMLHttpRequest` header or SameSite=Strict cookie configuration.

5. **Email verification gate** — users must verify email before accessing `/dashboard`, `/orders`, `/settings`. Unverified users can still checkout as guests.

6. **Error boundary** — `src/app/error.tsx` and `src/app/(store)/error.tsx` with Sentry capture + user-friendly message.

### 4.2 Service Layer Standards

All service functions return typed union:
```typescript
type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: string };
```

No more `try/catch` with inconsistent returns. No more `throw` in services — errors are return values.

### 4.3 Centralized Schemas

`src/lib/schemas/` directory:
- `order.schema.ts` — Zod schemas for order creation, update
- `auth.schema.ts` — login, register, password reset
- `product.schema.ts` — product filtering, pagination
- `checkout.schema.ts` — session creation request
- `admin.schema.ts` — admin action payloads

Shared between API routes and services. No duplicate schema definitions.

### 4.4 New Admin Action Routes

```
POST /api/admin/orders/[id]/retry     — retry MobiMatter fulfillment
POST /api/admin/orders/[id]/refund    — issue Stripe refund
POST /api/admin/orders/[id]/resend    — resend confirmation email
GET  /api/admin/orders/[id]/esim      — view decrypted eSIM details
POST /api/admin/products/sync         — trigger manual product sync
```

All routes require `requireAdmin()` and log to `AuditLog`.

### 4.5 Stripe Elements Migration

Replace Stripe hosted checkout with Stripe Payment Intents + Elements:
- `POST /api/checkout/intent` — creates PaymentIntent, returns `clientSecret`
- Client uses `@stripe/react-stripe-js` `<PaymentElement>` to render card form
- On confirm: `stripe.confirmPayment()` — stays on Mobialo domain throughout
- Webhook still required for `payment_intent.succeeded` event

### 4.6 Performance

- Product listing API: server-side pagination (20/page), server-side filtering
- Country eSIM count: denormalize into `SystemConfig` key, refresh on product sync
- Exchange rates: cached in `SystemConfig`, refreshed every 4 hours
- All database queries: add `select` to avoid over-fetching

---

## 5. Implementation Phases

### Phase 1 — Foundation (Week 1–2)
- [ ] Update Vercel env vars (STRIPE_WEBHOOK_SECRET, Google OAuth, SENTRY_DSN)
- [ ] Fix price integrity in order-service
- [ ] Add env validation on startup
- [ ] Add CSRF protection
- [ ] Build design system: Tailwind config, base components (Button, Card, Input, Badge, Skeleton, Modal, Toast)
- [ ] Add error boundaries
- [ ] Admin: retry/refund/resend action routes + UI buttons
- [ ] Email verification gate

### Phase 2 — Core Purchase Flow (Week 3–4)
- [ ] Rebuild Homepage
- [ ] Rebuild eSIM Browse page
- [ ] Rebuild Product Detail page
- [ ] Rebuild Checkout (Stripe Elements, no redirect)
- [ ] Rebuild Checkout Success + Order Detail

### Phase 3 — Account & Post-Purchase (Week 5–6)
- [ ] Rebuild Dashboard
- [ ] Rebuild Orders list
- [ ] Rebuild Settings
- [ ] Rebuild Login / Register
- [ ] Complete Free Trial flow
- [ ] Complete Referrals flow
- [ ] Complete Top-Up flow
- [ ] Email verification end-to-end

### Phase 4 — Admin + Polish (Week 7–8)
- [ ] Full Admin dashboard rebuild
- [ ] Image optimization (Next/Image throughout)
- [ ] Server-side pagination on all list views
- [ ] E2E test coverage for P0 flows
- [ ] Accessibility audit (WCAG AA)
- [ ] SEO: meta tags, structured data (Product schema), sitemap
- [ ] Performance audit + Core Web Vitals pass
- [ ] Light mode (optional, based on time)

---

## 6. Success Criteria

The overhaul is complete when:

1. A new user can land on the homepage, find a plan for their country, pay, and receive a working QR code in their email — without any manual intervention.
2. An admin can see every order, retry any failed fulfillment, and issue a refund without touching the database directly.
3. The design passes an informal "would you trust your credit card here?" test from a non-technical person.
4. Lighthouse score: Performance 90+, Accessibility 90+, SEO 90+.
5. Zero silent failures — every error is either handled gracefully for the user or captured in Sentry.

---

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | — |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | — |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 0 | — | — |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | — | — |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | — |

**VERDICT:** NO REVIEWS YET
