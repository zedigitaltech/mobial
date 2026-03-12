# CLAUDE.md — Mobial eSIM Platform

## Project Identity

**Mobial** is a B2C eSIM marketplace at **mobialo.eu** — users browse eSIM data plans for 150+ countries, buy via Stripe, and receive instant eSIM activation (QR code / LPA string). Products are sourced wholesale from MobiMatter's B2B API and resold with markup.

**Business model:** MobiMatter wholesale → Mobial retail markup → Stripe checkout → MobiMatter order fulfillment → eSIM delivery.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4, shadcn/ui (Radix primitives) |
| Database | PostgreSQL (Supabase), Prisma ORM |
| Payments | Stripe Checkout Sessions + Webhooks |
| eSIM Source | MobiMatter Partner API (`api.mobimatter.com`) |
| Auth | Custom JWT (HS256) + TOTP 2FA + Google OAuth |
| i18n | next-intl (17 languages, Accept-Language detection, NO URL prefixes) |
| Email | Resend |
| Monitoring | Sentry (@sentry/nextjs), PostHog (posthog-js), custom ErrorLog/PageView tables |
| Live Chat | Crisp + WhatsApp fallback |
| Runtime | Bun (package manager + production server) |
| Hosting | Vercel (standalone output) |
| Cron | Vercel Cron Jobs (product sync daily 3AM UTC, retry fulfillment daily 4AM UTC) |

## Commands

```bash
bun install                   # Install dependencies
bun run dev                   # Dev server on :3000 (logs to dev.log)
bun run build                 # Production build (standalone + static copy)
bun run start                 # Production server via Bun
bun run lint                  # ESLint

# Database
bun run db:generate           # Generate Prisma client
bun run db:push               # Push schema (no migration history)
bun run db:migrate            # Run migrations (dev)

# Data
bun run seed:admin            # Create admin user
bun run sync:products         # Manual product sync from MobiMatter

# Testing
bun run test                  # Vitest unit tests
bun run test:watch            # Vitest watch mode
bun run test:coverage         # Vitest with coverage
bun run test:e2e              # Playwright E2E tests
bun run test:e2e:ui           # Playwright UI mode
```

## Path Alias

`@/*` maps to `src/*` — always use this in imports.

## Project Structure

```
src/
├── app/
│   ├── layout.tsx                 # Root layout (providers stack)
│   ├── (store)/                   # Public storefront route group
│   │   ├── page.tsx               # Homepage
│   │   ├── esim/                  # Browse by country/region
│   │   ├── products/[slug]/       # Product detail + purchase
│   │   ├── checkout/              # Stripe checkout flow
│   │   ├── check-usage/           # eSIM data usage checker
│   │   ├── topup/                 # Top-up existing eSIM
│   │   ├── guides/[country]/      # Country travel guides (12 countries)
│   │   ├── blog/[slug]/           # Blog posts
│   │   ├── settings/              # Profile + 2FA settings
│   │   ├── dashboard/             # User dashboard
│   │   ├── orders/                # Order history
│   │   └── ...                    # about, faq, privacy, terms, etc.
│   ├── admin/                     # Admin dashboard (RBAC-protected)
│   └── api/                       # API routes (~67 endpoints)
│       ├── auth/                  # Login, register, 2FA, Google OAuth, password reset
│       ├── admin/                 # Admin CRUD (products, orders, users, analytics)
│       ├── checkout/              # Stripe session creation
│       ├── webhooks/stripe/       # Stripe webhook handler
│       ├── products/              # Product search, detail, featured
│       ├── orders/                # Order lookup, eSIM details
│       ├── usage/                 # eSIM data usage (via MobiMatter)
│       ├── cron/                  # Scheduled jobs (sync-products, retry-fulfillment)
│       ├── health/                # Health check endpoint
│       ├── reviews/               # Review submission + listing
│       ├── exchange-rates/        # Multi-currency rates
│       └── ...
├── services/                      # Business logic layer
│   ├── order-service.ts           # Order creation, fulfillment, retry
│   ├── product-service.ts         # Product queries, filtering, recommendations
│   ├── esim-service.ts            # eSIM status, activation, usage
│   ├── email-service.ts           # Transactional emails via Resend
│   ├── review-service.ts          # Review management
│   ├── trial-service.ts           # Free trial eSIM logic
│   ├── affiliate-service.ts       # Affiliate/referral tracking
│   └── monitoring-service.ts      # Custom error/event logging
├── lib/                           # Utilities and integrations
│   ├── db.ts                      # Prisma client singleton
│   ├── mobimatter.ts              # MobiMatter API client (THE critical integration)
│   ├── stripe.ts                  # Stripe client + checkout session creation
│   ├── jwt.ts                     # JWT sign/verify (HS256, 15min access + 7d refresh)
│   ├── encryption.ts              # AES encryption for sensitive data
│   ├── rate-limit.ts              # IP-based rate limiting
│   ├── api-response.ts            # Standardized API response helpers
│   ├── auth-helpers.ts            # requireAuth(), requireAdmin() middleware
│   ├── countries.ts               # Country metadata (code, name, flag, slug)
│   ├── regions.ts                 # Region groupings (Europe, Asia, etc.)
│   ├── blog.ts                    # Blog post content
│   ├── currency.ts                # Multi-currency conversion
│   ├── cache.ts                   # In-memory caching
│   ├── logger.ts                  # Structured logging
│   ├── sanitize.ts                # Input sanitization (DOMPurify)
│   └── ...
├── components/
│   ├── ui/                        # shadcn/ui primitives (DO NOT manually edit)
│   ├── layout/                    # Header, Footer, BottomNav
│   ├── store/                     # Store-specific (product cards, filters, compare)
│   ├── admin/                     # Admin dashboard components
│   ├── auth/                      # Login modal, Google sign-in, 2FA
│   ├── common/                    # Chat widget, JSON-LD, page transition, install prompt
│   ├── providers/                 # Auth, Theme, ReactQuery, PostHog, Monitoring
│   └── gdpr/                      # Cookie consent
├── contexts/                      # React contexts
│   ├── cart-context.tsx           # Shopping cart (localStorage-backed)
│   ├── currency-context.tsx       # Selected currency
│   └── compare-context.tsx        # Product comparison
├── hooks/                         # Custom React hooks
├── i18n.ts                        # next-intl configuration
└── middleware.ts                  # CSP headers, security headers, admin redirect
```

## Critical Architecture Patterns

### API Response Convention
All API routes use `successResponse()` and `errorResponse()` from `src/lib/api-response.ts`. Input validation uses Zod schemas. Never return raw JSON — always use these helpers.

### Authentication Flow
1. **Login:** `POST /api/auth/login` → returns `{ accessToken, refreshToken }` (JWT HS256)
2. **Access token:** 15-minute expiry, sent as `Authorization: Bearer <token>`
3. **Refresh:** `POST /api/auth/refresh` with refresh token → new token pair
4. **2FA:** If enabled, login returns `{ requires2FA: true }` → user submits TOTP → `POST /api/auth/2fa/verify`
5. **Google OAuth:** `POST /api/auth/google` with Google ID token → JWT pair
6. **Admin routes:** Protected by `requireAdmin()` which verifies JWT + checks `role === ADMIN`
7. **Middleware:** Only does UX redirect (no token → redirect to `/login`). Real auth is in route handlers.

### Order Flow (Critical Path)
```
User selects product → Add to cart (CartContext, localStorage)
  → Checkout page → POST /api/checkout/session (creates Stripe Checkout Session)
  → Stripe hosted checkout → Payment
  → Stripe webhook (checkout.session.completed)
  → order-service.ts: create Order + call MobiMatter API to purchase eSIM
  → Store eSIM details (ICCID, QR code, activation code)
  → Send confirmation email via Resend
  → User views eSIM in /order/[orderNumber]
```

### MobiMatter Integration (`src/lib/mobimatter.ts`)
This is the core integration. All MobiMatter API calls go through this client.
- **Base URL:** `https://api.mobimatter.com/mobimatter`
- **Auth:** `merchantId` header + `api-key` header
- **Key operations:** Product listing, order creation, order completion, eSIM status, data usage, top-ups, refunds, wallet balance
- **Credentials are AES-encrypted** at rest in SystemConfig table
- **Never call MobiMatter directly from client components** — always go through API routes → services → mobimatter.ts

### Provider Stack (Root Layout)
The provider nesting order matters:
```
NextIntlClientProvider → ReactQueryProvider → AuthProvider → PostHogProvider → ThemeProvider → CurrencyProvider → CartProvider → CompareProvider → MonitoringProvider
```
AuthProvider must wrap PostHogProvider so PostHog can identify users. CartProvider needs CurrencyProvider for price display.

### i18n Strategy
- **17 languages** configured in `src/i18n.ts`
- Uses **Accept-Language header detection** — NO URL prefixes (all languages share same URLs)
- Translation files in `messages/` directory
- Server components: `getTranslations()`, Client components: `useTranslations()`
- SEO: `x-default` hreflang only (since one URL per page)

## Database Rules (MANDATORY)

1. **NEVER delete records** — use soft deletes (`deletedAt` timestamp, `status: DELETED`)
2. **NEVER drop tables** — preserve all structures
3. **NEVER truncate** — even in development
4. Prisma client singleton at `src/lib/db.ts` — always import from there
5. All JSON fields (countries, regions, features, networks, tags) are stored as `String` and parsed with `JSON.parse()` — handle parse errors gracefully
6. PostgreSQL on Supabase — use connection pooler URL for `DATABASE_URL`, direct URL for `DIRECT_URL` (migrations)

### Key Models (25+)
- **User** — email/Google auth, 2FA, RBAC (ADMIN/CUSTOMER), soft delete
- **Product** — synced from MobiMatter, enriched with SEO fields, pricing, carrier data
- **Order / OrderItem** — Stripe payment + MobiMatter fulfillment, retry tracking
- **Review** — verified purchase reviews, admin approval required
- **AuditLog** — tracks all sensitive operations
- **SecurityEvent** — login attempts, rate limits, suspicious activity
- **ErrorLog / PageView / AnalyticsEvent** — custom monitoring
- **FreeTrial / AbandonedCart** — growth features
- **GDPRConsent / DataExportRequest / DataDeletionRequest** — GDPR compliance

## Security

### Middleware (`src/middleware.ts`)
Sets on every response:
- Content-Security-Policy (nonce-based scripts, Stripe frames allowed)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Strict-Transport-Security (HSTS with preload)
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy (camera, mic, geolocation denied)

### Rate Limiting
- Auth endpoints: 5 attempts / 15 minutes per IP
- Account lockout after repeated failures
- Rate limit state stored in `RateLimitLog` table

### Encryption
- JWT: HS256 with `JWT_SECRET`
- Sensitive data: AES-256-GCM with `ENCRYPTION_KEY` (hex format)
- MobiMatter credentials encrypted at rest
- 2FA secrets encrypted in database

## Environment Variables

### Required (App Won't Function Without These)
```
DATABASE_URL                  # Supabase pooler connection string
DIRECT_URL                    # Supabase direct connection (for migrations)
JWT_SECRET                    # HS256 signing key (min 32 chars)
ENCRYPTION_KEY                # AES-256 key in hex format
MOBIMATTER_MERCHANT_ID        # MobiMatter partner merchant ID
MOBIMATTER_API_KEY            # MobiMatter partner API key
STRIPE_SECRET_KEY             # Stripe secret key (sk_live_...)
STRIPE_PUBLISHABLE_KEY        # Stripe publishable key (pk_live_...)
STRIPE_WEBHOOK_SECRET         # Stripe webhook signing secret (whsec_...)
NEXT_PUBLIC_BASE_URL          # https://mobialo.eu (prod) or http://localhost:3000 (dev)
```

### Required for Full Functionality
```
RESEND_API_KEY                # Email delivery
SENTRY_DSN                    # Error tracking (client + server)
SENTRY_AUTH_TOKEN             # Source map uploads
SENTRY_ORG                    # Sentry organization slug
SENTRY_PROJECT                # Sentry project slug
NEXT_PUBLIC_POSTHOG_KEY       # PostHog analytics
NEXT_PUBLIC_POSTHOG_HOST      # PostHog host URL
GOOGLE_CLIENT_ID              # Google OAuth
GOOGLE_CLIENT_SECRET          # Google OAuth (server-side)
GEMINI_API_KEY                # AI features (if any)
```

### Optional
```
NEXT_PUBLIC_WHATSAPP_NUMBER   # WhatsApp support number
NEXT_PUBLIC_CRISP_WEBSITE_ID  # Crisp live chat widget
CRON_SECRET                   # Vercel cron job auth (auto-set by Vercel)
```

## Vercel Deployment

- **Build:** `next build` → standalone output → static files copied into standalone dir
- **Cron Jobs:** Defined in `vercel.json` — product sync (daily 3 AM UTC), retry fulfillment (daily 4 AM UTC). **Hobby plan limit: max 1 run/day per job**
- **Sentry:** `withSentryConfig()` wraps the Next.js config — set `silent: true` to avoid build failures when `SENTRY_AUTH_TOKEN` is missing
- **next-intl:** Configured via `createNextIntlPlugin("./src/i18n.ts")`
- **Config chain:** `withSentryConfig(withNextIntl(nextConfig), sentryOptions)`

### Deployment Checklist
1. All env vars set in Vercel dashboard
2. Supabase database accessible from Vercel's IP range
3. Stripe webhook endpoint configured: `https://mobialo.eu/api/webhooks/stripe`
4. Apple Pay domain verified in Stripe dashboard
5. Google OAuth redirect URI: `https://mobialo.eu`

## Testing Strategy

### Unit Tests (Vitest)
- Located alongside source files: `*.test.ts`
- Existing tests: `order-service`, `product-service`, `cache`, `currency`, `encryption`, `env`, `jwt`, `logger`, `password`, `rate-limit`
- Run: `bun run test`

### E2E Tests (Playwright)
- Located in `e2e/` directory
- Tests: `checkout.spec.ts`, `auth.spec.ts`, `usage-check.spec.ts`
- Projects: chromium + webkit
- Run: `bun run test:e2e`

### Test Before Committing
Always run `bun run build` to verify no TypeScript errors. Run relevant tests for changed areas.

## Code Style

- **TypeScript strict** — no `any` unless absolutely necessary
- **Zod validation** on all API inputs — define schema, parse with `schema.parse()`
- **shadcn/ui components** in `src/components/ui/` — do not manually edit, use `npx shadcn@latest add <component>`
- **Tailwind CSS 4** — utility-first, dark mode via class strategy (default theme is dark)
- **Server Components by default** — only add `"use client"` when state/effects are needed
- **API routes:** Always use `successResponse()` / `errorResponse()`, always validate input with Zod
- **Services layer:** Business logic goes in `src/services/`, not in API route handlers
- **No inline secrets** — always use environment variables

## Common Pitfalls

1. **Product countries/regions/features are JSON strings** — always `JSON.parse()` with try/catch
2. **Stripe webhook needs raw body** — the webhook route at `/api/webhooks/stripe` handles this
3. **MobiMatter API is the single point of failure** — all eSIM operations depend on it; handle timeouts and errors gracefully
4. **Cart is localStorage-only** — not synced to server; guests can purchase without accounts
5. **next-intl has no URL prefixes** — don't create `/en/`, `/fr/` routes; language is detected from headers
6. **CSP nonce** — inline scripts need the nonce from `x-nonce` header; Stripe and Google Scripts are allowlisted
7. **Admin auth in middleware is UX-only** — the real authorization is in `requireAdmin()` in route handlers
8. **Prisma doesn't auto-reconnect** — the singleton in `db.ts` handles this; don't create new PrismaClient instances

## Git Workflow

- Commit after every change, push immediately
- No co-author attribution in commits
- Meaningful commit messages: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`
- Main branch is `main` — deploy on push
- Run `bun run build` before pushing to catch TypeScript errors

## Domain Knowledge

- **eSIM activation:** User scans QR code or enters LPA/activation code in phone settings. Works on iPhone XS+ and most modern Android phones.
- **MobiMatter product categories:** `esim_realtime` (standard eSIM), `esim_manual` (manually fulfilled)
- **Product ranking:** `penalizedRank` field is MobiMatter's quality-adjusted sort score; use it for default ordering
- **Top-ups:** Some eSIM plans support top-ups via `productFamilyId` — products sharing this ID can be used to extend data
- **Coverage:** A product's `countries` field contains ISO country codes (e.g., `["US", "CA", "MX"]`); multi-country plans cover multiple destinations with one eSIM
