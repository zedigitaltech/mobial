import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  const cookie = request.cookies.get("token");
  return cookie?.value ?? null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Generate a cryptographic nonce for this request
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' https://js.stripe.com https://client.crisp.chat https://accounts.google.com;
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
  // X-XSS-Protection removed — deprecated and causes issues in older browsers. CSP provides better protection.

  // Admin route protection
  const isProtectedPath =
    pathname.startsWith("/admin") || pathname.startsWith("/api/admin");

  // UX-only redirect: if no token present, redirect to login.
  // Actual authorization is enforced in route handlers via requireAdmin()
  // which does full HMAC signature verification.
  if (isProtectedPath) {
    const rawToken = getTokenFromRequest(request);

    if (!rawToken) {
      const url = new URL("/login", request.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.png|logo.svg|manifest.json|api/health).*)",
  ],
};
