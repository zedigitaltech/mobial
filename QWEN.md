# MobiaL — eSIM Commerce Platform

> Next.js 16 eSIM storefront with MobiMatter B2B API integration, Stripe payments, multi-language support, and a full admin panel.

## Project Overview

MobiaL is a full-stack eSIM commerce platform that resells MobiMatter eSIM products through a customer-facing storefront. The business model: MobiMatter wholesale prices → markup → Stripe checkout → eSIM delivery (QR code / activation code).

### Architecture

```
┌─────────────────────────────────────────────────────┐
│  Customer Storefront (Next.js App Router)            │
│  ├── i18n (17 languages, Accept-Language detection)  │
│  ├── Stripe Checkout                                 │
│  ├── Auth (JWT HS256 + TOTP 2FA + Google OAuth)     │
│  └── PostHog Analytics + Sentry Monitoring           │
├─────────────────────────────────────────────────────┤
│  API Layer (src/app/api/)                            │
│  ├── /api/checkout  – Stripe payment intent flow     │
│  ├── /api/orders    – Order management               │
│  ├── /api/products  – Product catalog                │
│  ├── /api/webhooks/stripe – Payment webhooks         │
│  └── /api/cron/*    – Scheduled jobs (product sync)  │
├─────────────────────────────────────────────────────┤
│  MobiMatter B2B API Client (src/lib/mobimatter.ts)   │
│  ├── Products, Orders, Usage, Refunds, Replacements  │
│  ├── Wallet balance checks                           │
│  └── Composite flows (purchase, topup, replacement)  │
├─────────────────────────────────────────────────────┤
│  Database (PostgreSQL + Prisma ORM)                  │
│  ├── User, Product, Order, OrderItem                 │
│  ├── Wallet, Reward, Review, Notification            │
│  ├── GDPRConsent, DataExport/Deletion requests       │
│  ├── AuditLog, SecurityEvent, ErrorLog, PageView     │
│  └── FreeTrial, AbandonedCart, APIKey, SystemConfig  │
└─────────────────────────────────────────────────────┘
```

### Key Routes

| Route | Purpose |
|-------|---------|
| `/` | Storefront homepage |
| `/products` | Product catalog |
| `/esim/[slug]` | Product detail page |
| `/checkout` | Stripe checkout |
| `/order/[id]` | Order confirmation & eSIM details |
| `/dashboard` | Customer account dashboard |
| `/login` | Authentication |
| `/admin` | Admin panel |
| `/free-trial` | Free trial flow |
| `/topup` | eSIM top-up flow |
| `/check-usage` | Data usage checker |

## Building and Running

### Prerequisites

- **Node.js** v24+ (via nvm) or **Bun** (latest)
- **PostgreSQL** (Supabase recommended, with pgbouncer pooling)
- **MobiMatter** merchant account (for API credentials)

### Development

```bash
# Install dependencies
bun install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your DATABASE_URL, JWT_SECRET, MobiMatter keys, etc.

# Initialize database
bun run db:push
bun run db:generate

# Seed admin user
bun run seed:admin

# Start dev server (port 3000)
bun run dev
```

### Production

```bash
# Build (creates .next/standalone)
bun run build

# Start production server
bun start
```

### Database Commands

```bash
bun run db:push      # Push schema to database
bun run db:generate  # Generate Prisma client
bun run db:migrate   # Run Prisma migrations (dev)
bun run db:reset     # Reset database (BLOCKED in production)
bunx prisma studio   # Open Prisma Studio GUI
```

### Testing

```bash
bun run test           # Vitest unit tests
bun run test:watch     # Vitest watch mode
bun run test:coverage  # Coverage report
bun run test:e2e       # Playwright E2E tests
bun run test:e2e:ui    # Playwright with UI
```

### Product Sync

```bash
# Manual product sync from MobiMatter API
bun run sync:products

# Automated via cron (requires CRON_SECRET)
# POST /api/cron/sync-products with header: Authorization: Bearer <CRON_SECRET>
```

## Technology Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16 (App Router), React 19 |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 4, shadcn/ui, Framer Motion |
| **Database** | PostgreSQL + Prisma ORM |
| **Payments** | Stripe (Checkout + Webhooks) |
| **Auth** | JWT HS256 + TOTP 2FA + Google OAuth |
| **i18n** | next-intl (17 languages, Accept-Language detection — NO URL prefixes) |
| **Analytics** | PostHog (client + server) |
| **Monitoring** | Sentry (client + server + cron monitors) |
| **Email** | Resend |
| **Testing** | Vitest + Playwright |
| **Runtime** | Bun (dev + prod) |

## Provider Ordering (Critical)

React providers MUST be nested in this exact order in the root layout:

```
NextIntlClientProvider → ReactQueryProvider → AuthProvider → PostHogProvider → ThemeProvider → CurrencyProvider → CartProvider
```

## MobiMatter Integration

### Business Model
- **Wholesale** → MobiMatter wholesale price (our cost)
- **Retail** → Our marked-up selling price
- **Order Flow**: Create order (pending) → Complete order (capture payment from MobiMatter wallet) → Notify customer (email with QR code)

### Key API Endpoints (MobiMatter)

| Endpoint | Purpose |
|----------|---------|
| `GET /api/v2/products` | Product catalog |
| `POST /api/v2/order` | Create order (pending) |
| `PUT /api/v2/order/complete` | Fulfill order (capture payment, get QR code) |
| `GET /api/v2/order/{id}` | Order status |
| `POST /api/v2/email` | Send order confirmation email |
| `GET /api/v2/merchant/balance` | Wallet balance |

### MobiMatter Client (`src/lib/mobimatter.ts`)

| Function | Purpose |
|----------|---------|
| `fetchProducts()` | Get product catalog with filters |
| `createOrder()` | Create pending order |
| `completeOrder()` | Fulfill order, get eSIM details |
| `purchaseEsim()` | Composite: create + complete |
| `topupOrder()` | Composite: top-up an existing eSIM |
| `requestReplacement()` | Composite: replacement with polling |
| `getWalletBalance()` | Check MobiMatter wallet balance |
| `notifyUser()` | Send order confirmation email |
| `checkOrderUsage()` | Get eSIM data usage |
| `getStructuredUsage()` | Get structured eSIM info |
| `sendSmsToEsim()` | Send SMS to eSIM |
| `cancelMobimatterOrder()` | Cancel pending order |
| `refundOrder()` | Refund completed order |
| `testConnection()` | Health check for API credentials |

## Known Pitfalls

1. **Product countries/regions are JSON strings** — Always `JSON.parse()` with try/catch
2. **Stripe webhook needs raw body** — Handled at `/api/webhooks/stripe` (use raw body parsing, not JSON middleware)
3. **MobiMatter `PLAN_VALIDITY` is in hours** — Convert to days: `hours / 24`
4. **MobiMatter `PLAN_DATA_LIMIT` needs unit check** — `PLAN_DATA_UNIT` may be "MB" (convert: MB / 1000 = GB)
5. **`productDetails` keys may have trailing spaces** — Always `.trim()` before lookup
6. **`db:reset` is blocked in production** — Guarded by environment check
7. **i18n uses Accept-Language, NOT URL prefixes** — No `/en/`, `/fr/` URL paths

## Project Structure

```
src/
├── app/
│   ├── (store)/          # Customer-facing pages (products, checkout, dashboard, etc.)
│   ├── admin/            # Admin panel
│   ├── api/              # API route handlers
│   ├── layout.tsx        # Root layout with provider chain
│   └── globals.css       # Global styles
├── components/           # React components
│   └── ui/              # shadcn/ui components
├── contexts/             # React contexts (Auth, Cart, Currency, etc.)
├── hooks/                # Custom React hooks
├── i18n/                 # Internationalization config
├── lib/
│   ├── mobimatter.ts     # MobiMatter API client (PRIMARY INTEGRATION)
│   ├── stripe.ts         # Stripe client
│   ├── auth.ts           # Auth utilities (JWT, TOTP)
│   ├── prisma.ts         # Prisma client singleton
│   └── ...               # Other utilities
├── messages/             # i18n translation JSON files
├── services/             # Business logic services
├── types/                # TypeScript type definitions
└── middleware.ts         # Auth + CSP + security headers
```

## Key Scripts

| Script | Location | Purpose |
|--------|----------|---------|
| `seed-admin.js` | `scripts/` | Create admin user |
| `sync-products.js` | `scripts/` | Sync products from MobiMatter API |

## Environment Variables (Required)

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection (pgbouncer pooled, port 6543) |
| `DIRECT_URL` | PostgreSQL direct connection (for migrations, port 5432) |
| `JWT_SECRET` | JWT signing secret |
| `ENCRYPTION_KEY` | Hex encryption key (64 chars = 32 bytes) |
| `MOBIMATTER_MERCHANT_ID` | MobiMatter merchant ID |
| `MOBIMATTER_API_KEY` | MobiMatter API key |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `RESEND_API_KEY` | Resend email API key |
| `CRON_SECRET` | Secret for cron job authentication |
| `NEXT_PUBLIC_BASE_URL` | Application base URL |

## Database Policy

- **NEVER delete records** — use soft deletes (`deleted_at` or `is_deleted` flags)
- **NEVER drop tables or truncate** — even in development
- Always ask for explicit confirmation if a task seems to require deletion

## Deployment

- **Output mode**: `standalone` (Docker / VPS friendly)
- **Caddyfile** included for reverse proxy + SSL
- **Vercel** compatible (vercel.json configured)
- **Docker**: See `DEPLOYMENT.md` for container setup
