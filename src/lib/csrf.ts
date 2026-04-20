import { NextRequest } from "next/server";

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
];

// These skip CSRF — external services, or need to work without browser context
const CSRF_SKIP_PATHS = [
  "/api/webhooks",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/google",
  "/api/auth/2fa",
  "/api/auth/verify-email",
  "/api/cron",
  "/api/health",
  "/api/admin", // admin routes are protected by requireAdmin() + SameSite cookies
];

export function shouldCheckCsrf(pathname: string, method: string): boolean {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) return false;
  if (CSRF_SKIP_PATHS.some((p) => pathname.startsWith(p))) return false;
  return MUTATION_PATHS.some((p) => pathname.startsWith(p));
}

export function validateCsrf(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (origin) {
    try {
      const originHost = new URL(origin).host;
      if (originHost !== host) return false;
    } catch {
      return false;
    }
  }

  // Accept X-Requested-With from same-origin fetch
  const xRequestedWith = request.headers.get("x-requested-with");
  if (xRequestedWith === "XMLHttpRequest") return true;

  // If no Origin and no X-Requested-With header, block
  if (!origin) return false;

  return true;
}
