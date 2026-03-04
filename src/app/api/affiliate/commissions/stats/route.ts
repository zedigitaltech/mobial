/**
 * GET /api/affiliate/commissions/stats
 * Get commission statistics
 */

import { NextRequest } from 'next/server';
import { requireAuth, errorResponse, successResponse } from '@/lib/auth-helpers';
import { getCommissionStats } from '@/services/affiliate-service';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const stats = await getCommissionStats(user.id);

    return successResponse({
      stats: {
        totalPending: stats.totalPending,
        totalApproved: stats.totalApproved,
        totalPaid: stats.totalPaid,
        thisMonth: stats.thisMonth,
        lastMonth: stats.lastMonth,
      },
    });
  } catch (error) {
    console.error('Get commission stats error:', error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return errorResponse(error.message, 401);
    }
    return errorResponse('Failed to get commission statistics', 500);
  }
}
