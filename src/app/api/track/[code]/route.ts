/**
 * GET /api/track/[code]
 * Track affiliate click and redirect to target URL
 *
 * This route:
 * 1. Captures click data (IP, user agent, referrer, etc.)
 * 2. Creates an AffiliateClick record
 * 3. Sets a cookie for conversion tracking
 * 4. Redirects to target URL
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { trackClick, getAffiliateByCode } from '@/services/affiliate-service';
import { logger } from '@/lib/logger';
import { BASE_URL } from '@/lib/env';

// Hash device identifiers with a server-side salt so the stored value
// isn't reversible back to raw user-agent / IP / accept-language.
function hashDeviceId(ipAddress: string, userAgent: string, acceptLanguage: string): string {
  const salt = process.env.DEVICE_ID_SALT || process.env.ENCRYPTION_KEY || 'dev-fallback-salt';
  return createHmac('sha256', salt)
    .update(`${ipAddress}|${userAgent}|${acceptLanguage}`)
    .digest('hex')
    .slice(0, 40);
}

interface RouteParams {
  params: Promise<{ code: string }>;
}

// Cookie name for storing click ID
const CLICK_COOKIE_NAME = 'affiliate_click';
const CLICK_COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { code } = await params;
    const url = new URL(request.url);

    // Get affiliate code from query params (ref parameter)
    const affiliateCode = url.searchParams.get('ref');
    const linkCode = code?.toUpperCase();

    if (!affiliateCode) {
      // If no affiliate code, just redirect to home
      return NextResponse.redirect(BASE_URL, 302);
    }

    // Validate affiliate code
    const profile = await getAffiliateByCode(affiliateCode.toUpperCase());
    if (!profile || profile.status !== 'ACTIVE') {
      // Invalid affiliate, redirect without tracking
      return NextResponse.redirect(BASE_URL, 302);
    }

    // Gather tracking data
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';

    const userAgent = request.headers.get('user-agent') || 'unknown';
    const referrer = request.headers.get('referer') || undefined;
    const acceptLanguage = request.headers.get('accept-language') || '';

    // Generate device fingerprint — HMAC-SHA256 of (ip|ua|lang) with server-side salt
    const deviceFingerprint = hashDeviceId(ipAddress, userAgent, acceptLanguage);

    // Try to get country from headers (could be set by Cloudflare, etc.)
    const country = request.headers.get('cf-ipcountry')
      || request.headers.get('x-country-code')
      || undefined;

    // Track the click
    const { clickId, targetUrl } = await trackClick(
      affiliateCode.toUpperCase(),
      {
        ipAddress,
        userAgent: userAgent.slice(0, 500), // Limit length
        referrer: referrer?.slice(0, 500),
        country,
        deviceId: deviceFingerprint,
      },
      linkCode
    );

    // Create redirect response
    const response = NextResponse.redirect(targetUrl, 302);

    // Set click tracking cookie
    response.cookies.set(CLICK_COOKIE_NAME, JSON.stringify({
      clickId,
      affiliateCode: affiliateCode.toUpperCase(),
      linkCode,
      timestamp: Date.now(),
    }), {
      maxAge: CLICK_COOKIE_MAX_AGE,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return response;
  } catch (error) {
    logger.errorWithException('Track click error', error);

    // On error, still redirect to home page to not break user experience
    return NextResponse.redirect(BASE_URL, 302);
  }
}
