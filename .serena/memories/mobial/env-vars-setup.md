# Mobial Environment Variables Setup Guide

## Google OAuth
1. Go to console.cloud.google.com
2. Create project or use existing
3. APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID
4. Application type: Web application
5. Authorized JavaScript origins: `https://mobialo.eu` and `http://localhost:3000`
6. Authorized redirect URIs: `https://mobialo.eu` and `http://localhost:3000`
7. Copy Client ID → `GOOGLE_CLIENT_ID`
8. Copy Client Secret → `GOOGLE_CLIENT_SECRET`

## Sentry
1. Go to sentry.io → Create account (free tier: 5K errors/month)
2. Create project → Platform: Next.js
3. Copy DSN from project settings → `NEXT_PUBLIC_SENTRY_DSN`
4. Settings → Developer Settings → Auth Tokens → Create → `SENTRY_AUTH_TOKEN`
5. Org slug (visible in URL) → `SENTRY_ORG`
6. Project slug → `SENTRY_PROJECT`

## PostHog
1. Go to posthog.com → Create account (free tier: 1M events/month)
2. Project Settings → Project API Key → `NEXT_PUBLIC_POSTHOG_KEY`
3. `NEXT_PUBLIC_POSTHOG_HOST` = `https://us.i.posthog.com` (or eu variant)

## Crisp Live Chat
1. Go to crisp.chat → Create account (free tier: 2 seats)
2. Settings → Website Settings → Setup instructions
3. Copy Website ID → `NEXT_PUBLIC_CRISP_WEBSITE_ID`

## Apple Pay (Stripe Dashboard, no env var)
1. Stripe Dashboard → Settings → Payment methods → Enable Apple Pay & Google Pay
2. Stripe Dashboard → Settings → Apple Pay → Add domain → `mobialo.eu`
3. Download verification file → host at `https://mobialo.eu/.well-known/apple-developer-merchantid-domain-association`

## Adding to Vercel
```bash
cd ~/Desktop/Projects/mobial
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET
vercel env add NEXT_PUBLIC_SENTRY_DSN
vercel env add SENTRY_AUTH_TOKEN
vercel env add SENTRY_ORG
vercel env add SENTRY_PROJECT
vercel env add NEXT_PUBLIC_POSTHOG_KEY
vercel env add NEXT_PUBLIC_POSTHOG_HOST
vercel env add NEXT_PUBLIC_CRISP_WEBSITE_ID
```

Or add all at once in Vercel Dashboard → Project → Settings → Environment Variables.
Also add to local `.env.local` for development.
