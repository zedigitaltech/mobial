# PostHog Analytics Integration Report

**Date:** 2026-03-27
**Project:** Mobial eSIM Marketplace (mobialo.eu)

## Dashboard

| Name | URL |
|------|-----|
| Analytics basics | https://eu.posthog.com/project/149027/dashboard/592112 |

## Insights

| Name | Type | Events | URL |
|------|------|--------|-----|
| Purchase Conversion Funnel | Funnel | product_viewed → buy_now_clicked → payment_succeeded → esim_fulfilled | https://eu.posthog.com/project/149027/insights/aYkhY8az |
| Orders vs Cancellations | Trend | order_completed, checkout_cancelled | https://eu.posthog.com/project/149027/insights/QeEeMeSr |
| Sign Ups & Logins | Trend | user_signed_up, user_logged_in | https://eu.posthog.com/project/149027/insights/7Y8IZC6r |
| Payment Failures | Trend | payment_failed | https://eu.posthog.com/project/149027/insights/dUbznxBC |
| Free Trials & Referrals | Trend | free_trial_claimed, referral_link_copied | https://eu.posthog.com/project/149027/insights/SQ3FNX00 |

## Instrumented Events

### Client-side (`posthog-js` via `usePostHog()`)

| Event | File | Trigger |
|-------|------|---------|
| `product_viewed` | `src/app/(store)/products/[slug]/client.tsx` | Product detail page mount |
| `buy_now_clicked` | `src/app/(store)/products/[slug]/client.tsx` | "Buy Now" / "Add to Cart" button click |
| `checkout_cancelled` | `src/app/(store)/checkout/cancel/page.tsx` | Stripe checkout cancel redirect |
| `referral_link_copied` | `src/app/(store)/referrals/page.tsx` | Copy referral code or link |

### Server-side (`posthog-node` via `getPostHogClient()`)

| Event | File | Trigger |
|-------|------|---------|
| `user_signed_up` | `src/app/api/auth/register/route.ts` | Successful account registration |
| `user_logged_in` | `src/app/api/auth/login/route.ts` | Successful email/password login |
| `payment_succeeded` | `src/app/api/webhooks/stripe/route.ts` | Stripe `checkout.session.completed` |
| `esim_fulfilled` | `src/app/api/webhooks/stripe/route.ts` | Successful MobiMatter fulfillment |
| `payment_failed` | `src/app/api/webhooks/stripe/route.ts` | Stripe `payment_intent.payment_failed` |

## Architecture

- **Client SDK:** `posthog-js` (already installed), initialised in `src/components/providers/PostHogProvider.tsx`
- **Server SDK:** `posthog-node`, singleton at `src/lib/posthog-server.ts` (`flushAt: 1, flushInterval: 0` for immediate delivery)
- **Identity correlation:** Server routes read `X-POSTHOG-DISTINCT-ID` header to link anonymous client sessions to identified users; falls back to `user.id`
- **Environment variables:** `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`
