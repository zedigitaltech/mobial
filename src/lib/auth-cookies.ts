/**
 * Auth cookie helpers.
 *
 * Security model:
 * - refresh token → HttpOnly cookie (`mobial_refresh`), not readable by JS.
 *   This protects long-lived credentials from XSS.
 * - access token → NOT stored server-side; returned in the response body.
 *   Client keeps it in memory/localStorage and sends it as `Authorization: Bearer`.
 * - auth_state marker → non-HttpOnly cookie set on login, cleared on logout.
 *   Used by middleware/proxy for UX redirects only — NEVER trusted as auth.
 */

import { NextResponse } from 'next/server';

const REFRESH_COOKIE = 'mobial_refresh';
const AUTH_STATE_COOKIE = 'mobial_auth';

const REFRESH_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

export function setAuthCookies(response: NextResponse, refreshToken: string): void {
  const isProd = process.env.NODE_ENV === 'production';

  response.cookies.set(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: REFRESH_MAX_AGE,
  });

  response.cookies.set(AUTH_STATE_COOKIE, '1', {
    httpOnly: false,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: REFRESH_MAX_AGE,
  });
}

export function clearAuthCookies(response: NextResponse): void {
  const isProd = process.env.NODE_ENV === 'production';
  const opts = {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0,
  };
  response.cookies.set(REFRESH_COOKIE, '', opts);
  response.cookies.set(AUTH_STATE_COOKIE, '', { ...opts, httpOnly: false });
}

export function readRefreshCookie(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`${REFRESH_COOKIE}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export const REFRESH_COOKIE_NAME = REFRESH_COOKIE;
export const AUTH_STATE_COOKIE_NAME = AUTH_STATE_COOKIE;

const VERIFIED_COOKIE = 'mobial_ev';

export const VERIFIED_COOKIE_NAME = VERIFIED_COOKIE;

export function setVerifiedCookie(response: NextResponse): void {
  const isProd = process.env.NODE_ENV === 'production';
  response.cookies.set(VERIFIED_COOKIE, '1', {
    httpOnly: false,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: REFRESH_MAX_AGE,
  });
}

export function clearVerifiedCookie(response: NextResponse): void {
  const isProd = process.env.NODE_ENV === 'production';
  response.cookies.set(VERIFIED_COOKIE, '', {
    httpOnly: false,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
