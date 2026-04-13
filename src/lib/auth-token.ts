/**
 * In-memory access token store (client-side only).
 *
 * The access token is short-lived (15 minutes) and intentionally kept out of
 * localStorage so it is not readable by XSS. On page refresh the token is
 * re-minted by calling POST /api/auth/refresh, which reads the long-lived
 * refresh token from the HttpOnly `mobial_refresh` cookie — that cookie
 * is never exposed to JS.
 *
 * Components should use `getAccessToken()` and `setAccessToken()` instead
 * of reading/writing `localStorage.getItem("token")` directly.
 */

let accessToken: string | null = null;

// Subscribers notified on token changes (used by the auth provider to keep
// the isAuthenticated state in sync across the tree when refresh fires).
type Listener = (token: string | null) => void;
const listeners = new Set<Listener>();

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
  for (const l of listeners) {
    try {
      l(token);
    } catch {
      // Listener errors should not propagate.
    }
  }
}

export function clearAccessToken(): void {
  setAccessToken(null);
}

export function onAccessTokenChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Helper: build `Authorization: Bearer` header only when a token is present.
 */
export function authHeaders(): Record<string, string> {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}
