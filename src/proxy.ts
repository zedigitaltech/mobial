import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { shouldCheckCsrf, validateCsrf } from "@/lib/csrf";

// UX-only auth detection: the presence of the `mobial_refresh` HttpOnly
// cookie (set by login/register/refresh) or the `mobial_auth` marker cookie
// indicates the browser has credentials. The proxy never validates them —
// actual authorization is enforced by requireAuth()/requireAdmin() inside
// route handlers, which verify JWT HMAC signatures and user status.
function hasAuthMarker(request: NextRequest): boolean {
  if (request.headers.get("authorization")?.startsWith("Bearer ")) return true;
  if (request.cookies.get("mobial_refresh")?.value) return true;
  if (request.cookies.get("mobial_auth")?.value) return true;
  return false;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Generate a cryptographic nonce for this request
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' https://js.stripe.com https://client.crisp.chat https://accounts.google.com https://us-assets.i.posthog.com https://eu.i.posthog.com;
    style-src 'self' 'unsafe-inline' https://client.crisp.chat;
    img-src 'self' blob: data: https://api.mobimatter.com https://mobimatterstorage.blob.core.windows.net https://client.crisp.chat https://image.crisp.chat;
    font-src 'self' data: https://client.crisp.chat;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    connect-src 'self' https://api.stripe.com https://checkout.stripe.com https://*.posthog.com https://client.crisp.chat wss://client.relay.crisp.chat https://accounts.google.com https://mobimatterstorage.blob.core.windows.net;
    worker-src 'self' blob:;
    frame-src https://checkout.stripe.com https://js.stripe.com https://game.crisp.chat https://accounts.google.com;
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `
    .replace(/\s{2,}/g, " ")
    .trim();

  // Pass nonce to Next.js via request headers so it can add it to inline scripts
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", cspHeader);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Set CSP on the response
  response.headers.set("Content-Security-Policy", cspHeader);
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  );
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload",
  );
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");

  // CSRF protection for state-mutating API routes.
  // shouldCheckCsrf selects only the mutation paths that need protection;
  // validateCsrf enforces same-origin via Origin header + X-Requested-With.
  // Webhooks, cron, auth open-endpoints, and admin routes are exempt (see csrf.ts).
  if (shouldCheckCsrf(pathname, request.method)) {
    if (!validateCsrf(request)) {
      return NextResponse.json(
        { success: false, error: "CSRF validation failed" },
        { status: 403 },
      );
    }
  }
  // X-XSS-Protection removed — deprecated and causes issues in older browsers. CSP provides better protection.

  // Admin route protection
  const isProtectedPath =
    pathname.startsWith("/admin") || pathname.startsWith("/api/admin");

  // UX-only redirect: if no auth marker present, redirect to login.
  // Actual authorization is enforced in route handlers via requireAdmin()
  // which does full HMAC signature verification.
  if (isProtectedPath && !hasAuthMarker(request)) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.png|logo.svg|manifest.json|api/health|monitoring).*)",
  ],
};
