/**
 * GET /api/affiliate/links
 * Get all affiliate's links
 *
 * POST /api/affiliate/links
 * Create new affiliate link
 */

import { NextRequest } from 'next/server';
import { requireAuth, errorResponse, successResponse, parseJsonBody } from '@/lib/auth-helpers';
import { getAffiliateLinks, createAffiliateLink, getAffiliateProfile } from '@/services/affiliate-service';

interface CreateLinkRequest {
  name?: string;
  productId?: string;
  targetUrl?: string;
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Check if user has affiliate profile
    const profile = await getAffiliateProfile(user.id);
    if (!profile) {
      return errorResponse('Affiliate profile not found', 404);
    }

    const links = await getAffiliateLinks(user.id);

    // Add full URL to each link
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://mobial.com';
    const linksWithUrl = links.map(link => ({
      ...link,
      fullUrl: `${baseUrl}/track/${link.code}?ref=${profile.affiliateCode}`,
    }));

    return successResponse({
      links: linksWithUrl,
      total: links.length,
    });
  } catch (error) {
    console.error('Get affiliate links error:', error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return errorResponse(error.message, 401);
    }
    return errorResponse('Failed to get affiliate links', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await parseJsonBody<CreateLinkRequest>(request);

    // Check if user has active affiliate profile
    const profile = await getAffiliateProfile(user.id);
    if (!profile) {
      return errorResponse('Affiliate profile not found. Please register as an affiliate first.', 404);
    }

    if (profile.status !== 'ACTIVE') {
      return errorResponse('Your affiliate account is not active yet. Please wait for approval.', 403);
    }

    // Validate target URL if provided
    if (body?.targetUrl) {
      try {
        new URL(body.targetUrl);
      } catch {
        return errorResponse('Invalid target URL', 400);
      }
    }

    // Create link
    const link = await createAffiliateLink(user.id, {
      name: body?.name,
      productId: body?.productId,
      targetUrl: body?.targetUrl,
    });

    // Add full URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://mobial.com';
    const fullUrl = `${baseUrl}/track/${link.code}?ref=${profile.affiliateCode}`;

    return successResponse({
      link: {
        ...link,
        fullUrl,
        conversionRate: 0,
      },
    }, 'Affiliate link created successfully');
  } catch (error) {
    console.error('Create affiliate link error:', error);
    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return errorResponse(error.message, 401);
      }
      return errorResponse(error.message, 400);
    }
    return errorResponse('Failed to create affiliate link', 500);
  }
}
