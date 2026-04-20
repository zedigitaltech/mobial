# Mobialo Overhaul — Phase 1: Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all showstoppers, install the new design system across every component, add error boundaries, CSRF protection, email verification gate, and admin action tooling — so Phase 2 page rebuilds start from solid ground.

**Architecture:** Design tokens live in `globals.css` as CSS variables consumed by Tailwind. shadcn/ui components are updated in-place (never recreated from scratch). New brand utilities added as Tailwind plugins. Admin actions are new API routes + minimal UI additions to the existing admin orders page.

**Tech Stack:** Next.js 16, Tailwind CSS 4, shadcn/ui, Prisma, Stripe, Resend, Zod, Vitest

**Spec:** `docs/superpowers/specs/2026-04-20-mobialo-overhaul-design.md`

---

## MANUAL PREREQUISITES (do these before running any task)

These require Vercel dashboard access — not automatable.

- [ ] In Vercel → Settings → Environment Variables, update `STRIPE_WEBHOOK_SECRET` to the signing secret from the new `https://mobialo.eu/api/webhooks/stripe` webhook endpoint in Stripe dashboard
- [ ] Add/update `GOOGLE_CLIENT_ID` = new OAuth client ID from Google Cloud Console
- [ ] Add/update `NEXT_PUBLIC_GOOGLE_CLIENT_ID` = same value as above
- [ ] Add/update `GOOGLE_CLIENT_SECRET` = new OAuth client secret
- [ ] Add/update `SENTRY_DSN` = DSN from Sentry project settings (non-public version)
- [ ] Redeploy: Vercel dashboard → Deployments → Redeploy latest
- [ ] Verify: make a test purchase and confirm Stripe webhook shows `200 OK` in Stripe dashboard

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `src/app/globals.css` | Modify | Replace color palette with new brand tokens |
| `src/app/layout.tsx` | Modify | Call `validateEnv()` at startup |
| `src/components/ui/button.tsx` | Modify | Add `brand` + `brand-outline` variants, pill sizes |
| `src/components/ui/badge.tsx` | Modify | Order status semantic variants |
| `src/components/ui/card.tsx` | Modify | Add hover glow effect, update radius |
| `src/components/ui/input.tsx` | Modify | Dark fill style, always-visible label standard |
| `src/components/ui/skeleton.tsx` | Modify | Branded pulse animation |
| `src/components/ui/sonner.tsx` | Modify | Dark theme toast config |
| `src/app/error.tsx` | Create | Global error boundary |
| `src/app/(store)/error.tsx` | Create | Store error boundary |
| `src/middleware.ts` | Modify | Add CSRF header check for mutation routes |
| `src/lib/csrf.ts` | Create | CSRF validation helper |
| `src/app/api/admin/orders/[id]/retry/route.ts` | Create | Admin: retry fulfillment |
| `src/app/api/admin/orders/[id]/refund/route.ts` | Create | Admin: issue Stripe refund |
| `src/app/api/admin/orders/[id]/resend/route.ts` | Create | Admin: resend confirmation email |
| `src/app/api/admin/orders/[id]/esim/route.ts` | Create | Admin: view decrypted eSIM details |
| `src/app/admin/orders/page.tsx` | Modify | Add action buttons to orders table |
| `src/lib/email-verification.ts` | Create | Email verification token logic |
| `src/app/api/auth/verify-email/route.ts` | Modify | Use new token logic |
| `src/app/api/auth/verify-email/resend/route.ts` | Create | Resend verification email |
| `src/middleware.ts` | Modify | Gate /dashboard, /orders, /settings to verified users |
| `src/app/(store)/verify-email/page.tsx` | Modify | Add resend button |

---

## Task 1: Apply New Brand Color Palette

Update `globals.css` CSS variables to the new indigo/teal design system. This is the single highest-impact visual change — every component inherits it.

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Replace the `:root` and `.dark` CSS variable blocks**

Open `src/app/globals.css`. Replace the entire `:root { ... }` and `.dark { ... }` blocks (lines ~43–100) with:

```css
:root {
  --radius: 0.75rem;

  /* Light mode */
  --background: oklch(0.98 0.003 250);
  --foreground: oklch(0.10 0.02 250);
  --card: oklch(1 0 0 / 0.9);
  --card-foreground: oklch(0.10 0.02 250);
  --popover: oklch(0.98 0.003 250);
  --popover-foreground: oklch(0.10 0.02 250);
  --primary: oklch(0.52 0.24 280);
  --primary-foreground: oklch(0.99 0 0);
  --secondary: oklch(0.93 0.01 250);
  --secondary-foreground: oklch(0.15 0.02 250);
  --muted: oklch(0.94 0.008 250);
  --muted-foreground: oklch(0.50 0.02 250);
  --accent: oklch(0.55 0.18 185);
  --accent-foreground: oklch(0.99 0 0);
  --destructive: #ef4444;
  --destructive-foreground: #ffffff;
  --border: oklch(0.88 0.01 250);
  --input: oklch(0.92 0.008 250);
  --ring: oklch(0.52 0.24 280 / 0.4);
  --price-green: #16a34a;

  /* Brand tokens */
  --brand-primary: #6C4FFF;
  --brand-secondary: #00D9B8;
  --brand-gradient: linear-gradient(135deg, #6C4FFF 0%, #00D9B8 100%);
  --bg-base: #07090F;
  --bg-surface: #0F1624;
  --bg-elevated: #161F33;
}

.dark {
  --background: oklch(0.08 0.015 250);
  --foreground: oklch(0.93 0.008 250);
  --card: oklch(0.11 0.018 250 / 0.6);
  --card-foreground: oklch(0.95 0.008 250);
  --popover: oklch(0.11 0.018 250 / 0.92);
  --popover-foreground: oklch(0.95 0.008 250);
  --primary: oklch(0.62 0.22 280);
  --primary-foreground: oklch(0.08 0.015 250);
  --secondary: oklch(0.14 0.018 250);
  --secondary-foreground: oklch(0.93 0.008 250);
  --muted: oklch(0.14 0.018 250);
  --muted-foreground: oklch(0.58 0.015 250);
  --accent: oklch(0.60 0.16 185);
  --accent-foreground: oklch(0.08 0.015 250);
  --destructive: #f87171;
  --destructive-foreground: oklch(0.08 0.015 250);
  --border: oklch(0.20 0.018 250 / 0.7);
  --input: oklch(0.14 0.018 250);
  --ring: oklch(0.62 0.22 280 / 0.35);
  --price-green: #4ade80;
}
```

- [ ] **Step 2: Update the body gradient to use new brand colors**

Find the `body { ... }` block in `@layer base`. Replace the `background-image` gradient:

```css
body {
  @apply bg-background text-foreground antialiased selection:bg-primary/20;
  background-image:
    radial-gradient(at 0% 0%, rgba(108, 79, 255, 0.06) 0px, transparent 50%),
    radial-gradient(at 100% 100%, rgba(0, 217, 184, 0.04) 0px, transparent 50%);
  background-attachment: fixed;
}
```

- [ ] **Step 3: Update the `gradient-accent` utility to use brand gradient**

Find `.gradient-accent` in `@layer utilities` and replace:

```css
.gradient-accent {
  background: var(--brand-gradient);
  color: white;
}
```

- [ ] **Step 4: Add new brand utility classes at the end of `@layer utilities`**

```css
.brand-glow {
  box-shadow: 0 0 0 1px rgba(108, 79, 255, 0.3), 0 8px 32px rgba(108, 79, 255, 0.12);
}

.brand-glow-hover {
  transition: box-shadow 200ms ease;
}
.brand-glow-hover:hover {
  box-shadow: 0 0 0 1px rgba(108, 79, 255, 0.3), 0 8px 32px rgba(108, 79, 255, 0.12);
}

.text-brand-gradient {
  background: var(--brand-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

- [ ] **Step 5: Run the dev server and visually verify**

```bash
bun run dev
```

Open `http://localhost:3000`. The app should now have the deep navy/indigo brand palette. Cards should have a subtle purple tint, primary buttons should be indigo. No build errors.

- [ ] **Step 6: Run build to confirm no CSS errors**

```bash
bun run build 2>&1 | tail -20
```

Expected: `✓ Compiled successfully` with no warnings about unknown CSS properties.

- [ ] **Step 7: Commit**

```bash
git add src/app/globals.css
git commit -m "design: apply Mobialo brand palette — indigo/teal dark-first system"
```

---

## Task 2: Update Button Component — Brand Variants

Add `brand` (gradient fill) and `brand-outline` variants. Update pill sizing.

**Files:**
- Modify: `src/components/ui/button.tsx`

- [ ] **Step 1: Replace the button variants**

Replace the entire `buttonVariants` definition in `src/components/ui/button.tsx`:

```typescript
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
        brand:
          "text-white shadow-sm hover:opacity-90 hover:shadow-md",
        "brand-outline":
          "border border-[#6C4FFF] text-[#6C4FFF] dark:text-white dark:border-white/30 bg-transparent hover:bg-[#6C4FFF]/10",
        destructive:
          "bg-destructive text-white shadow-sm hover:bg-destructive/90",
        outline:
          "border border-border bg-background shadow-sm hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 py-2 rounded-full has-[>svg]:px-4",
        sm: "h-8 rounded-full gap-1.5 px-4 text-xs has-[>svg]:px-3",
        lg: "h-12 rounded-full px-8 text-base has-[>svg]:px-6",
        xl: "h-14 rounded-full px-10 text-lg font-semibold has-[>svg]:px-8",
        icon: "size-10 rounded-full",
        "icon-sm": "size-8 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

- [ ] **Step 2: Add gradient style to the brand button via `cn` + inline style**

The `brand` variant needs the CSS gradient. Update the `Button` component body:

```typescript
function Button({
  className,
  variant,
  size,
  asChild = false,
  style,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  const brandStyle = variant === "brand"
    ? { background: "var(--brand-gradient)", ...style }
    : style

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      style={brandStyle}
      {...props}
    />
  )
}
```

- [ ] **Step 3: Verify in browser**

With dev server running, check a page that uses Button. Primary buttons should be pill-shaped. No TypeScript errors in the editor.

- [ ] **Step 4: Run type check**

```bash
cd /Users/ezekaj/Desktop/Code/Tools/mobial && bun run build 2>&1 | grep -E "error|Error" | head -20
```

Expected: no type errors related to button.tsx.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/button.tsx
git commit -m "design: update Button — brand gradient variant + pill shapes"
```

---

## Task 3: Update Badge Component — Order Status Variants

**Files:**
- Modify: `src/components/ui/badge.tsx`

- [ ] **Step 1: Read current badge.tsx**

```bash
cat src/components/ui/badge.tsx
```

- [ ] **Step 2: Replace badgeVariants**

Replace the `badgeVariants` definition with:

```typescript
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive text-white",
        outline:
          "text-foreground",
        // Order status variants
        completed:
          "border-transparent bg-emerald-500/15 text-emerald-400 dark:bg-emerald-500/20 dark:text-emerald-300",
        processing:
          "border-transparent bg-amber-500/15 text-amber-500 dark:bg-amber-500/20 dark:text-amber-300",
        pending:
          "border-transparent bg-blue-500/15 text-blue-500 dark:bg-blue-500/20 dark:text-blue-300",
        failed:
          "border-transparent bg-red-500/15 text-red-500 dark:bg-red-500/20 dark:text-red-300",
        cancelled:
          "border-transparent bg-slate-500/15 text-slate-400 dark:bg-slate-500/20 dark:text-slate-400",
        refunded:
          "border-transparent bg-purple-500/15 text-purple-400 dark:bg-purple-500/20 dark:text-purple-300",
        // Generic
        brand:
          "border-transparent text-white",
        success:
          "border-transparent bg-emerald-500/15 text-emerald-400 dark:text-emerald-300",
        warning:
          "border-transparent bg-amber-500/15 text-amber-500 dark:text-amber-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)
```

For the `brand` variant, add inline gradient (same pattern as Button):

```typescript
function Badge({
  className,
  variant,
  style,
  ...props
}: React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof badgeVariants> & { style?: React.CSSProperties }) {
  const brandStyle = variant === "brand"
    ? { background: "var(--brand-gradient)", ...style }
    : style

  return (
    <div
      className={cn(badgeVariants({ variant }), className)}
      style={brandStyle}
      {...props}
    />
  )
}
```

- [ ] **Step 3: Create a helper function for order status → badge variant**

Add at the end of `badge.tsx` (before the export):

```typescript
export type OrderStatusBadgeVariant = "completed" | "processing" | "pending" | "failed" | "cancelled" | "refunded"

export function orderStatusVariant(status: string): OrderStatusBadgeVariant {
  const map: Record<string, OrderStatusBadgeVariant> = {
    COMPLETED: "completed",
    PROCESSING: "processing",
    PENDING: "pending",
    FAILED: "failed",
    CANCELLED: "cancelled",
    REFUNDED: "refunded",
  }
  return map[status] ?? "pending"
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/badge.tsx
git commit -m "design: update Badge — order status semantic variants + brand variant"
```

---

## Task 4: Update Card Component — Brand Glow Hover

**Files:**
- Modify: `src/components/ui/card.tsx`

- [ ] **Step 1: Read current card.tsx**

```bash
cat src/components/ui/card.tsx
```

- [ ] **Step 2: Add `interactive` prop that enables hover glow**

Find the `Card` function and update it to accept an `interactive` prop:

```typescript
function Card({
  className,
  interactive = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
        interactive && "transition-all duration-200 cursor-pointer brand-glow-hover hover:border-[#6C4FFF]/40",
        className
      )}
      {...props}
    />
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/card.tsx
git commit -m "design: update Card — interactive hover glow variant"
```

---

## Task 5: Update Skeleton — Branded Pulse Animation

**Files:**
- Modify: `src/components/ui/skeleton.tsx`

- [ ] **Step 1: Replace skeleton.tsx**

```typescript
import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "relative overflow-hidden rounded-md bg-muted",
        "after:absolute after:inset-0 after:-translate-x-full",
        "after:animate-[shimmer_1.8s_infinite]",
        "after:bg-gradient-to-r after:from-transparent after:via-white/5 after:to-transparent",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
```

- [ ] **Step 2: Add shimmer keyframe to globals.css**

Add inside `@layer utilities` in `src/app/globals.css`:

```css
@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/skeleton.tsx src/app/globals.css
git commit -m "design: update Skeleton — shimmer animation replaces pulse"
```

---

## Task 6: Add Global Error Boundaries

**Files:**
- Create: `src/app/error.tsx`
- Create: `src/app/(store)/error.tsx`

- [ ] **Step 1: Create root error boundary**

Create `src/app/error.tsx`:

```typescript
"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <p className="text-6xl font-bold text-brand-gradient" style={{ background: "var(--brand-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>500</p>
          <h1 className="text-2xl font-semibold text-foreground">Something went wrong</h1>
          <p className="text-muted-foreground">
            An unexpected error occurred. We&apos;ve been notified and are looking into it.
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground font-mono">
              Error ID: {error.digest}
            </p>
          )}
        </div>
        <div className="flex gap-3 justify-center">
          <Button variant="brand" onClick={reset}>
            Try again
          </Button>
          <Button variant="outline" onClick={() => window.location.href = "/"}>
            Go home
          </Button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create store-level error boundary**

Create `src/app/(store)/error.tsx`:

```typescript
"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function StoreError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <p className="text-5xl">⚡</p>
          <h1 className="text-2xl font-semibold">Something went wrong</h1>
          <p className="text-muted-foreground text-sm">
            We hit an unexpected error. Your order and payment are safe — this is a display issue only.
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button variant="brand" size="sm" onClick={reset}>
            Retry
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/orders">My Orders</Link>
          </Button>
        </div>
        {error.digest && (
          <p className="text-xs text-muted-foreground font-mono">
            Ref: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Run build to confirm error boundaries compile**

```bash
bun run build 2>&1 | grep -E "error|Error" | head -10
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/error.tsx src/app/(store)/error.tsx
git commit -m "feat: add global and store-level error boundaries with Sentry capture"
```

---

## Task 7: CSRF Protection for Mutation Routes

**Files:**
- Create: `src/lib/csrf.ts`
- Modify: `src/middleware.ts`

The CSRF protection uses the `SameSite=Strict` cookie strategy already present from auth cookies. We add a secondary `X-Requested-With` header requirement on JSON mutation endpoints from non-browser clients. Browser fetch always includes this when explicitly set.

- [ ] **Step 1: Create CSRF helper**

Create `src/lib/csrf.ts`:

```typescript
import { NextRequest } from "next/server"

// Routes that mutate state and require CSRF check
const MUTATION_PATHS = [
  "/api/checkout",
  "/api/orders",
  "/api/auth/logout",
  "/api/auth/password",
  "/api/settings",
  "/api/wallet",
  "/api/reviews",
  "/api/referrals",
  "/api/free-trial",
]

// Admin routes are protected by requireAdmin() — CSRF handled by SameSite cookie
// Webhook routes skip CSRF (they come from Stripe, not browsers)
const CSRF_SKIP_PATHS = [
  "/api/webhooks",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/google",
  "/api/auth/2fa",
  "/api/auth/verify-email",
  "/api/cron",
  "/api/health",
]

export function shouldCheckCsrf(pathname: string, method: string): boolean {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) return false
  if (CSRF_SKIP_PATHS.some((p) => pathname.startsWith(p))) return false
  return MUTATION_PATHS.some((p) => pathname.startsWith(p))
}

export function validateCsrf(request: NextRequest): boolean {
  // Check Origin header matches our domain
  const origin = request.headers.get("origin")
  const host = request.headers.get("host")

  if (origin) {
    try {
      const originHost = new URL(origin).host
      if (originHost !== host) return false
    } catch {
      return false
    }
  }

  // Also accept X-Requested-With from same-origin fetch
  const xRequestedWith = request.headers.get("x-requested-with")
  if (xRequestedWith === "XMLHttpRequest") return true

  // If no Origin and no X-Requested-With, block (non-browser client without proper headers)
  if (!origin) return false

  return true
}
```

- [ ] **Step 2: Read current middleware.ts to understand its structure**

```bash
cat src/middleware.ts | head -60
```

- [ ] **Step 3: Add CSRF check to middleware**

Find the section in `src/middleware.ts` where the middleware function processes requests (before the security headers response). Add after the early returns for public assets:

```typescript
import { shouldCheckCsrf, validateCsrf } from "@/lib/csrf"

// Inside the middleware function, after existing auth/CSP logic:

// CSRF protection for state-mutating API routes
if (shouldCheckCsrf(pathname, request.method)) {
  if (!validateCsrf(request)) {
    return new NextResponse(
      JSON.stringify({ error: "CSRF validation failed" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    )
  }
}
```

- [ ] **Step 4: Add X-Requested-With to all client-side fetch calls**

Search for fetch calls in the client-side code to add the header:

```bash
grep -r "fetch(" src/app --include="*.tsx" --include="*.ts" -l | grep -v "route.ts" | head -20
```

The cleanest fix is adding a global fetch wrapper. Create `src/lib/fetch.ts`:

```typescript
/**
 * Same-origin fetch with CSRF headers pre-set.
 * Use this instead of bare `fetch()` for all client → API calls.
 */
export function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers)
  headers.set("X-Requested-With", "XMLHttpRequest")
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }
  return fetch(input, { ...init, headers })
}
```

Note: Existing client components will be migrated to `apiFetch` as each page is rebuilt in Phase 2 and 3. This task just establishes the pattern.

- [ ] **Step 5: Build to confirm no errors**

```bash
bun run build 2>&1 | tail -10
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/csrf.ts src/lib/fetch.ts src/middleware.ts
git commit -m "feat: add CSRF protection for mutation API routes"
```

---

## Task 8: Admin — Retry Fulfillment Route

**Files:**
- Create: `src/app/api/admin/orders/[id]/retry/route.ts`

- [ ] **Step 1: Write the failing test**

Create `src/app/api/admin/orders/[id]/retry/route.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/db", () => ({
  db: {
    order: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    auditLog: { create: vi.fn() },
  },
}))

vi.mock("@/lib/auth-helpers", () => ({
  requireAdmin: vi.fn(),
}))

vi.mock("@/services/order-service", () => ({
  processOrderWithMobimatter: vi.fn(),
}))

import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/auth-helpers"
import { processOrderWithMobimatter } from "@/services/order-service"
import { POST } from "./route"
import { NextRequest } from "next/server"

const mockAdmin = { id: "admin-1", role: "ADMIN", email: "admin@mobialo.eu" }

describe("POST /api/admin/orders/[id]/retry", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireAdmin).mockResolvedValue(mockAdmin as never)
  })

  it("returns 404 when order not found", async () => {
    vi.mocked(db.order.findUnique).mockResolvedValue(null)
    const req = new NextRequest("http://localhost/api/admin/orders/bad-id/retry", { method: "POST" })
    const res = await POST(req, { params: Promise.resolve({ id: "bad-id" }) })
    expect(res.status).toBe(404)
  })

  it("returns 400 when order status is not FAILED or PROCESSING", async () => {
    vi.mocked(db.order.findUnique).mockResolvedValue({ id: "o1", status: "COMPLETED", orderNumber: "MBL-001" } as never)
    const req = new NextRequest("http://localhost/api/admin/orders/o1/retry", { method: "POST" })
    const res = await POST(req, { params: Promise.resolve({ id: "o1" }) })
    expect(res.status).toBe(400)
  })

  it("retries fulfillment and returns 200 on success", async () => {
    vi.mocked(db.order.findUnique).mockResolvedValue({ id: "o1", status: "FAILED", orderNumber: "MBL-001" } as never)
    vi.mocked(processOrderWithMobimatter).mockResolvedValue({ success: true } as never)
    const req = new NextRequest("http://localhost/api/admin/orders/o1/retry", { method: "POST" })
    const res = await POST(req, { params: Promise.resolve({ id: "o1" }) })
    expect(res.status).toBe(200)
    expect(processOrderWithMobimatter).toHaveBeenCalledWith("o1", "ADMIN_RETRY")
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
bun run test src/app/api/admin/orders/retry/route.test.ts 2>&1 | tail -10
```

Expected: FAIL — `route.ts` does not exist yet.

- [ ] **Step 3: Create the route**

Create `src/app/api/admin/orders/[id]/retry/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/auth-helpers"
import { processOrderWithMobimatter } from "@/services/order-service"
import { logAudit } from "@/lib/audit"
import { logger } from "@/lib/logger"
import { AuthError } from "@/lib/auth-helpers"

const log = logger.child("admin:retry-order")

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let admin
  try {
    admin = await requireAdmin(request)
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const order = await db.order.findUnique({
    where: { id },
    select: { id: true, status: true, orderNumber: true },
  })

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 })
  }

  if (order.status !== "FAILED" && order.status !== "PROCESSING") {
    return NextResponse.json(
      { error: `Cannot retry order with status ${order.status}. Only FAILED or PROCESSING orders can be retried.` },
      { status: 400 }
    )
  }

  log.info("Admin retrying fulfillment", { metadata: { orderId: id, adminId: admin.id } })

  // Reset to PROCESSING before retry
  await db.order.update({
    where: { id },
    data: { status: "PROCESSING" },
  })

  const result = await processOrderWithMobimatter(id, "ADMIN_RETRY")

  await logAudit({
    action: "admin_retry_fulfillment",
    entity: "order",
    entityId: id,
    userId: admin.id,
    newValues: { success: result.success, error: result.success ? undefined : result.error },
  })

  if (!result.success) {
    log.error("Admin retry failed", { metadata: { orderId: id, error: result.error } })
    return NextResponse.json(
      { error: `Retry failed: ${result.error}` },
      { status: 502 }
    )
  }

  return NextResponse.json({ success: true, message: "Fulfillment retry successful" })
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
bun run test src/app/api/admin/orders/retry/route.test.ts 2>&1 | tail -10
```

Expected: all 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/admin/orders/[id]/retry/
git commit -m "feat: admin retry fulfillment endpoint POST /api/admin/orders/[id]/retry"
```

---

## Task 9: Admin — Issue Refund Route

**Files:**
- Create: `src/app/api/admin/orders/[id]/refund/route.ts`

- [ ] **Step 1: Create the route**

Create `src/app/api/admin/orders/[id]/refund/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { stripe } from "@/lib/stripe"
import { requireAdmin, AuthError } from "@/lib/auth-helpers"
import { logAudit } from "@/lib/audit"
import { logger } from "@/lib/logger"

const log = logger.child("admin:refund-order")

const refundSchema = z.object({
  reason: z.enum(["duplicate", "fraudulent", "requested_by_customer"]).default("requested_by_customer"),
  amount: z.number().positive().optional(), // partial refund in cents; omit for full refund
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let admin
  try {
    admin = await requireAdmin(request)
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const order = await db.order.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      orderNumber: true,
      paymentReference: true,
      paymentStatus: true,
      total: true,
    },
  })

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 })
  }

  if (order.paymentStatus !== "PAID") {
    return NextResponse.json(
      { error: "Order has not been paid — nothing to refund" },
      { status: 400 }
    )
  }

  if (order.status === "REFUNDED") {
    return NextResponse.json(
      { error: "Order has already been refunded" },
      { status: 400 }
    )
  }

  let body: z.infer<typeof refundSchema> = { reason: "requested_by_customer" }
  try {
    const raw = await request.json().catch(() => ({}))
    body = refundSchema.parse(raw)
  } catch {
    // Use defaults if body is empty or invalid
  }

  // Retrieve the Stripe PaymentIntent from the CheckoutSession
  const session = await stripe.checkout.sessions.retrieve(order.paymentReference!, {
    expand: ["payment_intent"],
  }).catch(() => null)

  if (!session?.payment_intent) {
    return NextResponse.json(
      { error: "Cannot find Stripe payment intent for this order. Manual refund required." },
      { status: 422 }
    )
  }

  const paymentIntentId = typeof session.payment_intent === "string"
    ? session.payment_intent
    : session.payment_intent.id

  log.info("Admin issuing refund", { metadata: { orderId: id, adminId: admin.id } })

  const refund = await stripe.refunds.create({
    payment_intent: paymentIntentId,
    reason: body.reason,
    ...(body.amount ? { amount: body.amount } : {}),
  })

  await db.order.update({
    where: { id },
    data: {
      status: "REFUNDED",
      paymentStatus: "REFUNDED",
    },
  })

  await logAudit({
    action: "admin_refund",
    entity: "order",
    entityId: id,
    userId: admin.id,
    newValues: {
      refundId: refund.id,
      amount: refund.amount,
      reason: body.reason,
      stripeStatus: refund.status,
    },
  })

  return NextResponse.json({
    success: true,
    refundId: refund.id,
    amount: refund.amount / 100,
    status: refund.status,
  })
}
```

- [ ] **Step 2: Build check**

```bash
bun run build 2>&1 | grep -E "error TS" | head -10
```

Expected: no type errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/orders/[id]/refund/
git commit -m "feat: admin refund endpoint POST /api/admin/orders/[id]/refund"
```

---

## Task 10: Admin — Resend Confirmation Email Route

**Files:**
- Create: `src/app/api/admin/orders/[id]/resend/route.ts`

- [ ] **Step 1: Create the route**

Create `src/app/api/admin/orders/[id]/resend/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin, AuthError } from "@/lib/auth-helpers"
import { sendOrderConfirmation } from "@/services/email-service"
import { decryptEsimField } from "@/lib/esim-encryption"
import { logAudit } from "@/lib/audit"
import { logger } from "@/lib/logger"

const log = logger.child("admin:resend-email")

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let admin
  try {
    admin = await requireAdmin(request)
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const order = await db.order.findUnique({
    where: { id },
    include: { items: true },
  })

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 })
  }

  if (order.status !== "COMPLETED") {
    return NextResponse.json(
      { error: "Can only resend emails for COMPLETED orders" },
      { status: 400 }
    )
  }

  const lpaString = decryptEsimField(order.esimQrCode)
  const activationCode = decryptEsimField(order.esimActivationCode)
  const smdpAddress = decryptEsimField(order.esimSmdpAddress)

  log.info("Admin resending confirmation email", {
    metadata: { orderId: id, email: order.email, adminId: admin.id },
  })

  const result = await sendOrderConfirmation(
    order.email,
    order.orderNumber,
    order.items.map((item) => ({
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
    })),
    order.total,
    lpaString ? { lpaString, activationCode, smdpAddress } : undefined,
  )

  if (!result.success) {
    return NextResponse.json({ error: "Failed to send email" }, { status: 502 })
  }

  await logAudit({
    action: "admin_resend_email",
    entity: "order",
    entityId: id,
    userId: admin.id,
    newValues: { email: order.email },
  })

  return NextResponse.json({ success: true, message: `Email resent to ${order.email}` })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/admin/orders/[id]/resend/
git commit -m "feat: admin resend confirmation email POST /api/admin/orders/[id]/resend"
```

---

## Task 11: Admin — View Decrypted eSIM Details Route

**Files:**
- Create: `src/app/api/admin/orders/[id]/esim/route.ts`

- [ ] **Step 1: Create the route**

Create `src/app/api/admin/orders/[id]/esim/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin, AuthError } from "@/lib/auth-helpers"
import { decryptEsimField } from "@/lib/esim-encryption"
import { logAudit } from "@/lib/audit"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let admin
  try {
    admin = await requireAdmin(request)
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const order = await db.order.findUnique({
    where: { id },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      esimQrCode: true,
      esimActivationCode: true,
      esimSmdpAddress: true,
      esimIccid: true,
      mobimatterOrderId: true,
    },
  })

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 })
  }

  await logAudit({
    action: "admin_view_esim",
    entity: "order",
    entityId: id,
    userId: admin.id,
    newValues: { orderNumber: order.orderNumber },
  })

  return NextResponse.json({
    orderNumber: order.orderNumber,
    status: order.status,
    mobimatterOrderId: order.mobimatterOrderId,
    lpaString: decryptEsimField(order.esimQrCode),
    activationCode: decryptEsimField(order.esimActivationCode),
    smdpAddress: decryptEsimField(order.esimSmdpAddress),
    iccid: order.esimIccid,
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/admin/orders/[id]/esim/
git commit -m "feat: admin view decrypted eSIM details GET /api/admin/orders/[id]/esim"
```

---

## Task 12: Add Action Buttons to Admin Orders Page

**Files:**
- Modify: `src/app/admin/orders/page.tsx`

- [ ] **Step 1: Read the current admin orders page**

```bash
cat src/app/admin/orders/page.tsx | head -100
```

- [ ] **Step 2: Add OrderActions component**

Find where each order row is rendered in the table. Add an `OrderActions` component:

```typescript
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface OrderActionsProps {
  orderId: string
  orderNumber: string
  status: string
  paymentStatus: string
  onActionComplete: () => void
}

function OrderActions({ orderId, orderNumber, status, paymentStatus, onActionComplete }: OrderActionsProps) {
  const [loading, setLoading] = useState<string | null>(null)

  async function handleAction(action: "retry" | "refund" | "resend") {
    setLoading(action)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/${action}`, {
        method: action === "resend" ? "POST" : "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || `${action} failed`)
      } else {
        toast.success(data.message || `${action} successful`)
        onActionComplete()
      }
    } catch {
      toast.error(`Network error during ${action}`)
    } finally {
      setLoading(null)
    }
  }

  const canRetry = status === "FAILED" || status === "PROCESSING"
  const canRefund = paymentStatus === "PAID" && status !== "REFUNDED"
  const canResend = status === "COMPLETED"

  return (
    <div className="flex gap-1.5">
      {canRetry && (
        <Button
          size="sm"
          variant="outline"
          disabled={loading === "retry"}
          onClick={() => handleAction("retry")}
          className="text-xs"
        >
          {loading === "retry" ? "Retrying..." : "Retry"}
        </Button>
      )}
      {canRefund && (
        <Button
          size="sm"
          variant="destructive"
          disabled={loading === "refund"}
          onClick={() => handleAction("refund")}
          className="text-xs"
        >
          {loading === "refund" ? "Refunding..." : "Refund"}
        </Button>
      )}
      {canResend && (
        <Button
          size="sm"
          variant="ghost"
          disabled={loading === "resend"}
          onClick={() => handleAction("resend")}
          className="text-xs"
        >
          {loading === "resend" ? "Sending..." : "Resend"}
        </Button>
      )}
    </div>
  )
}
```

Add this `OrderActions` component to each order row in the table. Also add a column header "Actions" to the orders table.

- [ ] **Step 3: Build check**

```bash
bun run build 2>&1 | grep -E "error TS" | head -10
```

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/orders/page.tsx
git commit -m "feat: add retry/refund/resend action buttons to admin orders table"
```

---

## Task 13: Email Verification Gate

Unverified users should not access `/dashboard`, `/orders`, `/settings`. They can still checkout as guests. This task adds the gate in middleware and a `resend verification` endpoint.

**Files:**
- Modify: `src/middleware.ts`
- Modify: `src/app/(store)/verify-email/page.tsx`
- Create: `src/app/api/auth/verify-email/resend/route.ts`

- [ ] **Step 1: Read current verify-email page**

```bash
cat src/app/(store)/verify-email/page.tsx | head -60
```

- [ ] **Step 2: Read middleware.ts to understand current structure**

```bash
cat src/middleware.ts
```

- [ ] **Step 3: Add verified-user gate to middleware**

Find the section in `src/middleware.ts` that handles authenticated routes. Add a check for email verification on protected routes:

The protected routes that require verified email: `/dashboard`, `/orders`, `/settings`

```typescript
// Routes that require email verification (not just authentication)
const EMAIL_VERIFIED_ROUTES = ["/dashboard", "/orders", "/settings"]

// Inside middleware, after JWT verification succeeds:
if (EMAIL_VERIFIED_ROUTES.some((r) => pathname.startsWith(r))) {
  const user = verifiedUser // the decoded JWT payload
  if (user && !user.emailVerified) {
    const url = new URL("/verify-email", request.url)
    url.searchParams.set("required", "1")
    return NextResponse.redirect(url)
  }
}
```

Note: This requires `emailVerified` to be included in the JWT payload. Check `src/lib/jwt.ts` for the token shape. If `emailVerified` is not in the payload, add it when issuing tokens in the login route.

- [ ] **Step 4: Create resend verification email route**

Create `src/app/api/auth/verify-email/resend/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getAuthUser } from "@/lib/auth-helpers"
import { sendVerificationEmail } from "@/services/email-service"
import { checkRateLimit } from "@/lib/rate-limit"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  const rateLimit = await checkRateLimit(ip, "email:resend-verification")
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before resending." },
      { status: 429 }
    )
  }

  const user = await getAuthUser(request)
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: { id: true, email: true, emailVerified: true },
  })

  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  if (dbUser.emailVerified) {
    return NextResponse.json({ error: "Email is already verified" }, { status: 400 })
  }

  // Generate new token
  const token = crypto.randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  await db.emailVerification.upsert({
    where: { userId: dbUser.id },
    create: { userId: dbUser.id, token, expiresAt },
    update: { token, expiresAt },
  })

  await sendVerificationEmail(dbUser.email, token)

  return NextResponse.json({ success: true, message: "Verification email sent" })
}
```

Note: If `EmailVerification` model doesn't exist in `prisma/schema.prisma`, check how verification tokens are currently stored (likely in a different model). Adapt accordingly — don't add a new Prisma model without a migration.

- [ ] **Step 5: Add resend button to verify-email page**

In `src/app/(store)/verify-email/page.tsx`, add a "Resend verification email" button that calls `POST /api/auth/verify-email/resend`. Include a 60-second cooldown after clicking to prevent spam.

- [ ] **Step 6: Build check**

```bash
bun run build 2>&1 | tail -15
```

- [ ] **Step 7: Commit**

```bash
git add src/middleware.ts src/app/api/auth/verify-email/resend/ src/app/(store)/verify-email/page.tsx
git commit -m "feat: email verification gate on dashboard/orders/settings + resend endpoint"
```

---

## Task 14: Final Phase 1 Integration Check

- [ ] **Step 1: Run full test suite**

```bash
bun run test 2>&1 | tail -20
```

Expected: all existing tests pass, new admin route tests pass.

- [ ] **Step 2: Run production build**

```bash
bun run build 2>&1 | tail -15
```

Expected: `✓ Compiled successfully`. Zero type errors.

- [ ] **Step 3: Start production server and do manual smoke test**

```bash
bun run start &
sleep 3
curl http://localhost:3000/api/health
```

Expected: `{"status":"ok"}` or similar health response.

- [ ] **Step 4: Verify design system in browser**

Open `http://localhost:3000`. Confirm:
- Background is deep navy (`#07090F` tone)
- Primary buttons are pill-shaped with indigo/teal gradient
- Badges use semantic colors (check any page that shows order status)
- Skeletons shimmer (navigate to orders or dashboard while unauthenticated)

- [ ] **Step 5: Push to main and confirm Vercel deployment**

```bash
git push origin main
```

Wait for Vercel deployment. Confirm at `https://mobialo.eu`.

- [ ] **Step 6: Make test purchase on production**

1. Go to `https://mobialo.eu`, find any product
2. Complete checkout with a real card (or Stripe test card if in test mode)
3. Check Stripe dashboard — webhook should show `200 OK`
4. Check email inbox — confirmation email with QR code should arrive within 60 seconds
5. Check order in admin — status should be `COMPLETED`

---

## Phase 1 Complete

**Next:** Run `docs/superpowers/plans/2026-04-20-phase2-core-purchase-flow.md` to rebuild the 5 revenue-critical pages.
