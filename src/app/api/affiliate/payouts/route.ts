/**
 * GET /api/affiliate/payouts
 * Get affiliate's payout history with pagination
 */

import { NextRequest } from 'next/server';
import { requireAuth, errorResponse, successResponse } from '@/lib/auth-helpers';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const url = new URL(request.url);

    // Parse query parameters
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);
    const status = url.searchParams.get('status') as string | null;

    // Validate status
    const validStatuses = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'];
    if (status && !validStatuses.includes(status)) {
      return errorResponse(`Invalid status. Valid options: ${validStatuses.join(', ')}`, 400);
    }

    // Get affiliate profile
    const profile = await db.affiliateProfile.findUnique({
      where: { userId: user.id },
    });

    if (!profile) {
      return errorResponse('Affiliate profile not found', 404);
    }

    // Build where clause
    const where: {
      affiliateId: string;
      status?: string;
    } = {
      affiliateId: profile.id,
    };

    if (status) {
      where.status = status;
    }

    // Get payouts
    const [payouts, total] = await Promise.all([
      db.payout.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.payout.count({ where }),
    ]);

    return successResponse({
      payouts: payouts.map(p => ({
        id: p.id,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        paymentMethod: p.paymentMethod,
        paymentReference: p.paymentReference,
        createdAt: p.createdAt,
        processedAt: p.processedAt,
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Get payouts error:', error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return errorResponse(error.message, 401);
    }
    return errorResponse('Failed to get payouts', 500);
  }
}
