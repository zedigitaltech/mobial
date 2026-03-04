/**
 * GET /api/affiliate/dashboard
 * Get affiliate dashboard data
 */

import { NextRequest } from 'next/server';
import { requireAuth, errorResponse, successResponse } from '@/lib/auth-helpers';
import { getAffiliateDashboard, getAffiliateProfile } from '@/services/affiliate-service';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Check affiliate profile
    const profile = await getAffiliateProfile(user.id);
    if (!profile) {
      return errorResponse('Affiliate profile not found', 404);
    }

    // Get dashboard data
    const dashboard = await getAffiliateDashboard(user.id);

    return successResponse({
      profile: {
        id: profile.id,
        affiliateCode: profile.affiliateCode,
        companyName: profile.companyName,
        status: profile.status,
        commissionRate: profile.commissionRate,
      },
      stats: dashboard.stats,
      recentClicks: dashboard.recentClicks,
      recentCommissions: dashboard.recentCommissions,
      topLinks: dashboard.topLinks,
      earningsChart: dashboard.earningsChart,
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return errorResponse(error.message, 401);
    }
    return errorResponse('Failed to get dashboard data', 500);
  }
}
