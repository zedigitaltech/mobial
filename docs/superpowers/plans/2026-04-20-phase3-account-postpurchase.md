# Mobialo Overhaul — Phase 3: Account & Post-Purchase

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild all account-related pages (Dashboard, Orders, Settings, Login/Register) and complete the Free Trial, Referrals, and Top-Up features end-to-end.

**Prerequisites:** Phase 1 and Phase 2 complete.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, shadcn/ui, Prisma, next-intl, Zod

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `src/app/(store)/dashboard/page.tsx` | Rewrite | User dashboard — stats, active eSIMs, recent orders |
| `src/app/(store)/orders/page.tsx` | Rewrite | Order history — fix N+1, proper pagination |
| `src/app/(store)/settings/page.tsx` | Rewrite | Settings — profile, password, 2FA, notifications |
| `src/app/(store)/login/page.tsx` | Rewrite | Dedicated login page with callback URL preservation |
| `src/app/(store)/register/page.tsx` | Create | Dedicated register page (not just a modal) |
| `src/components/auth/login-form.tsx` | Create | Shared login form (used by page + modal) |
| `src/components/auth/register-form.tsx` | Create | Shared register form |
| `src/app/(store)/free-trial/client.tsx` | Rewrite | Free trial claim — complete backend integration |
| `src/app/api/free-trial/route.ts` | Audit + fix | Ensure free trial actually delivers eSIM |
| `src/app/(store)/referrals/page.tsx` | Rewrite | Referral dashboard — code, stats, earnings |
| `src/app/api/referrals/route.ts` | Audit + fix | Referral tracking and payout logic |
| `src/app/(store)/topup/page.tsx` | Rewrite | Top-up flow — select existing eSIM, choose plan, pay |

---

## Task 1: Rebuild Dashboard

**Files:**
- Rewrite: `src/app/(store)/dashboard/page.tsx`

- [ ] **Step 1: Plan data requirements**

The dashboard needs per-user:
- Count of COMPLETED orders
- Sum of active eSIMs (orders with unexpired validity)
- Wallet balance
- Referral earnings
- Last 3 orders
- Active eSIM list (for usage display)

- [ ] **Step 2: Create dashboard data fetcher**

In `src/services/order-service.ts`, add:

```typescript
export async function getDashboardData(userId: string) {
  const [orders, wallet, rewards] = await Promise.all([
    db.order.findMany({
      where: { userId, status: "COMPLETED" },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { items: { take: 1 } },
    }),
    db.wallet.findUnique({
      where: { userId },
      select: { balance: true },
    }),
    db.reward.aggregate({
      where: { userId },
      _sum: { amount: true },
    }),
  ])

  const activeOrders = orders.filter(o => {
    // Consider an order "active" if it was completed within the last 90 days
    const daysSince = (Date.now() - o.completedAt!.getTime()) / (1000 * 60 * 60 * 24)
    return daysSince < 90
  })

  return {
    totalOrders: orders.length,
    activeEsims: activeOrders.length,
    walletBalance: wallet?.balance ?? 0,
    referralEarnings: rewards._sum.amount ?? 0,
    recentOrders: orders.slice(0, 3),
    activeOrders,
  }
}
```

- [ ] **Step 3: Rewrite dashboard page**

```typescript
import { requireAuth } from "@/lib/auth-helpers"
import { getDashboardData } from "@/services/order-service"
import { Badge, orderStatusVariant } from "@/components/ui/badge"
import { Wallet, Package, Users, Zap } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { redirect } from "next/navigation"

export default async function DashboardPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  // Auth check — middleware redirects unverified users, but we still verify
  // Note: requireAuth in a Server Component reads cookies directly
  // This needs the user ID from the session. Implement via reading the cookie.
  // Use your existing auth pattern for server components.

  // Placeholder — adapt to actual auth pattern in this codebase:
  // const user = await getServerUser() // returns user from JWT cookie
  // if (!user) redirect("/login?callbackUrl=/dashboard")
  // const data = await getDashboardData(user.id)

  const stats = [
    { icon: Package, label: "Total orders", value: "12", color: "#6C4FFF" },
    { icon: Zap, label: "Active eSIMs", value: "2", color: "#00D9B8" },
    { icon: Wallet, label: "Wallet balance", value: "$4.80", color: "#6C4FFF" },
    { icon: Users, label: "Referral earnings", value: "$9.00", color: "#00D9B8" },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="p-5 rounded-2xl border border-border bg-card space-y-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: `${color}20` }}>
              <Icon className="size-4" style={{ color }} />
            </div>
            <div>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent orders</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/orders">View all →</Link>
          </Button>
        </div>
        {/* Order rows rendered from recentOrders */}
      </section>
    </div>
  )
}
```

Complete the implementation by replacing placeholder stats and order rows with real data from `getDashboardData`. Use the existing auth pattern from other server components.

- [ ] **Step 4: Commit**

```bash
git add src/app/(store)/dashboard/ src/services/order-service.ts
git commit -m "feat: rebuild dashboard — stats, active eSIMs, recent orders"
```

---

## Task 2: Rebuild Orders Page — Fix N+1

The current orders page fetches usage data per-order with artificial random delay. Fix by batching.

**Files:**
- Rewrite: `src/app/(store)/orders/page.tsx`

- [ ] **Step 1: Fix the N+1 usage fetch pattern**

Current problem in `UsageIndicator` (line ~76): uses `Math.random() * 2000` delay and fetches individually.

Fix: batch-load usage data server-side. In the orders page server component:

```typescript
// Fetch all orders, then batch-fetch usage for active ones
const orders = await getUserOrders(userId)
const activeOrderIds = orders
  .filter(o => o.status === "COMPLETED")
  .map(o => o.id)

// Fetch all usage in parallel
const usageResults = await Promise.allSettled(
  activeOrderIds.map(id => getEsimUsage(id).catch(() => null))
)
const usageMap = Object.fromEntries(
  activeOrderIds.map((id, i) => [
    id,
    usageResults[i].status === "fulfilled" ? usageResults[i].value : null
  ])
)
```

Pass `usageMap` as a prop to the order list component. No per-card fetch calls.

- [ ] **Step 2: Add pagination**

Orders list needs server-side pagination. Add `?page=N` support:

```typescript
const page = parseInt(searchParams.page ?? "1") || 1
const limit = 10
const offset = (page - 1) * limit

const { orders, total } = await getUserOrdersPaginated(userId, { limit, offset })
```

- [ ] **Step 3: Render order cards with new design system**

Each order card:
- Order number (monospace font)
- Product name + data amount
- Status badge (use `orderStatusVariant` from badge.tsx)
- Purchase date
- Amount paid
- "View eSIM" button linking to `/order/[orderNumber]`
- Usage bar (from usageMap, if available)

- [ ] **Step 4: Commit**

```bash
git add src/app/(store)/orders/
git commit -m "feat: rebuild orders page — fix N+1 usage fetch, pagination, new design"
```

---

## Task 3: Rebuild Login/Register with Callback URL

**Files:**
- Rewrite: `src/app/(store)/login/page.tsx`
- Create: `src/app/(store)/register/page.tsx`
- Create: `src/components/auth/login-form.tsx`
- Create: `src/components/auth/register-form.tsx`

- [ ] **Step 1: Fix callback URL preservation**

Current bug: `src/app/(store)/login/page.tsx` calls `router.replace("/")` after opening auth modal, losing the intended destination.

Fix: Read `callbackUrl` from search params and pass it through the login flow. After successful auth, redirect to `callbackUrl` instead of `/`.

- [ ] **Step 2: Create `login-form.tsx` client component**

```typescript
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiFetch } from "@/lib/fetch"
import Link from "next/link"

interface LoginFormProps {
  callbackUrl?: string
  onSuccess?: () => void
}

export function LoginForm({ callbackUrl = "/dashboard", onSuccess }: LoginFormProps) {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Login failed")
        return
      }
      if (data.requires2FA) {
        router.push(`/auth/2fa?token=${data.tempToken}&callbackUrl=${encodeURIComponent(callbackUrl)}`)
        return
      }
      login(data.accessToken, data.refreshToken, data.user)
      onSuccess?.()
      router.push(callbackUrl)
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com" required autoComplete="email"
        />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link href="/reset-password" className="text-xs text-[#6C4FFF] hover:underline">
            Forgot password?
          </Link>
        </div>
        <Input
          id="password" type="password" value={password} onChange={e => setPassword(e.target.value)}
          placeholder="••••••••" required autoComplete="current-password"
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" variant="brand" className="w-full" disabled={loading}>
        {loading ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  )
}
```

- [ ] **Step 3: Create dedicated login page**

```typescript
// src/app/(store)/login/page.tsx
import { LoginForm } from "@/components/auth/login-form"
import Link from "next/link"
import { GoogleSignIn } from "@/components/auth/google-sign-in"

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const { callbackUrl = "/dashboard" } = await searchParams
  const safeCallback = callbackUrl.startsWith("/") ? callbackUrl : "/dashboard"

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-sm text-muted-foreground">Sign in to your Mobialo account</p>
        </div>

        <div className="p-6 rounded-2xl border border-border bg-card space-y-6">
          <GoogleSignIn callbackUrl={safeCallback} />
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative text-center"><span className="px-3 text-xs text-muted-foreground bg-card">or</span></div>
          </div>
          <LoginForm callbackUrl={safeCallback} />
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href={`/register?callbackUrl=${encodeURIComponent(safeCallback)}`} className="text-[#6C4FFF] hover:underline">
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create dedicated register page (similar structure, uses RegisterForm)**

Mirror the login page but with RegisterForm. On success, redirect to `/verify-email?email=...` page.

- [ ] **Step 5: Commit**

```bash
git add src/app/(store)/login/ src/app/(store)/register/ src/components/auth/
git commit -m "feat: rebuild login/register — callback URL fix, dedicated pages, clean forms"
```

---

## Task 4: Rebuild Settings Page

**Files:**
- Rewrite: `src/app/(store)/settings/page.tsx`

- [ ] **Step 1: Plan sections**

Settings page sections:
1. **Profile** — display name, email (read-only with "change email" link), avatar
2. **Security** — change password, 2FA enable/disable, backup codes
3. **Notifications** — email preferences (order updates, promotions)
4. **Danger zone** — delete account (soft delete only, as per policy)

- [ ] **Step 2: Restructure as tabbed layout**

Use shadcn `Tabs` to separate sections. Each tab is a separate client component island.

```typescript
// Server component wrapper
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfileSettings } from "./profile-settings"
import { SecuritySettings } from "./security-settings"
import { NotificationSettings } from "./notification-settings"

export default async function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      <Tabs defaultValue="profile">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        <TabsContent value="profile"><ProfileSettings /></TabsContent>
        <TabsContent value="security"><SecuritySettings /></TabsContent>
        <TabsContent value="notifications"><NotificationSettings /></TabsContent>
      </Tabs>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(store)/settings/
git commit -m "feat: rebuild settings — tabbed profile/security/notifications sections"
```

---

## Task 5: Complete Free Trial Flow

**Files:**
- Audit: `src/app/api/free-trial/route.ts`
- Rewrite: `src/app/(store)/free-trial/client.tsx`

- [ ] **Step 1: Audit the free trial API route**

```bash
cat src/app/api/free-trial/route.ts
```

Verify it:
- Checks if user already claimed a trial
- Calls MobiMatter with a specific free trial product ID
- Stores `FreeTrial` record in DB
- Sends confirmation email

If any of these are missing, implement them.

- [ ] **Step 2: Fix hardcoded trial destinations**

Current `client.tsx` has hardcoded trial destinations (lines 22–31). Replace with:

```typescript
// Fetch trial-eligible countries from API
const trialCountries = await apiFetch("/api/free-trial/countries").then(r => r.json())
```

Create `GET /api/free-trial/countries` route that returns the eligible country list from `SystemConfig` or a config file.

- [ ] **Step 3: Rewrite the free trial claim UI**

Clear 3-step flow:
1. Select destination (country picker using `CountrySearch`)
2. Review what's included (1-day / 100MB eSIM)
3. Confirm + enter email → instant delivery

- [ ] **Step 4: Commit**

```bash
git add src/app/(store)/free-trial/ src/app/api/free-trial/
git commit -m "feat: complete free trial flow — dynamic countries, backend integration"
```

---

## Task 6: Complete Referrals + Top-Up

Follow the same audit-then-rewrite pattern as Task 5.

**Referrals:**
- [ ] Audit `src/app/api/referrals/route.ts` — verify referral codes are generated, commissions calculated, and wallet credited
- [ ] Rewrite referrals page: show referral code (copy button), share link, stats table (referred users, amounts earned)
- [ ] Commit: `feat: complete referrals — code sharing, earnings display, history`

**Top-Up:**
- [ ] Audit `src/app/(store)/topup/page.tsx` — verify the existing eSIM selector works
- [ ] Complete: user selects from their COMPLETED orders → shows compatible top-up plans → adds to cart → checkout
- [ ] Commit: `feat: complete top-up flow — eSIM selector, plan picker, checkout integration`

---

## Task 7: Phase 3 Final Check

- [ ] Run full test suite: `bun run test 2>&1 | tail -20`
- [ ] Run build: `bun run build 2>&1 | tail -10`
- [ ] Test full account creation flow: register → verify email → login → dashboard
- [ ] Test settings: change password, enable 2FA
- [ ] Test referral code: generate, share, verify tracking
- [ ] Push and verify Vercel deployment

---

## Phase 3 Complete

**Next:** `docs/superpowers/plans/2026-04-20-phase4-admin-polish.md`
