/**
 * GET /api/affiliate/validate?code=<code>
 * Validates an affiliate code and returns discount information.
 * Used by the checkout page to display the discount to the user.
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/auth-helpers';

interface AffiliateProfile {
  userId: string;
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
  commissionRate: number;
  createdAt: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code || code.trim().length === 0) {
    return errorResponse('Affiliate code is required', 400);
  }

  const normalizedCode = code.trim().toUpperCase();

  const config = await db.systemConfig.findUnique({
    where: { key: `affiliate:${normalizedCode}` },
  });

  if (!config) {
    return successResponse({ valid: false });
  }

  let profile: AffiliateProfile | null = null;
  try {
    profile = JSON.parse(config.value) as AffiliateProfile;
  } catch {
    return successResponse({ valid: false });
  }

  if (!profile || profile.status !== 'ACTIVE') {
    return successResponse({ valid: false });
  }

  // Look up the affiliate user's name for a friendly display
  const user = await db.user.findUnique({
    where: { id: profile.userId },
    select: { name: true },
  });

  return successResponse({
    valid: true,
    affiliateCode: normalizedCode,
    affiliateName: user?.name ?? null,
    discount: profile.commissionRate,
  });
}
