/**
 * GET /api/affiliate/commissions
 * Get affiliate's commissions with pagination
 */

import { NextRequest } from 'next/server';
import { requireAuth, errorResponse, successResponse } from '@/lib/auth-helpers';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const url = new URL(request.url);

    // Parse query parameters
    const status = url.searchParams.get('status') as string | null;
    const startDate = url.searchParams.get('startDate') as string | null;
    const endDate = url.searchParams.get('endDate') as string | null;
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    // Validate status
    const validStatuses = ['PENDING', 'APPROVED', 'PAID', 'CANCELLED', 'REFUNDED'];
    if (status && !validStatuses.includes(status)) {
      return errorResponse(`Invalid status. Valid options: ${validStatuses.join(', ')}`, 400);
    }

    // Build where clause
    const where: {
      affiliateId: string;
      status?: string;
      createdAt?: { gte?: Date; lte?: Date };
    } = {
      affiliateId: user.id,
    };

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Get commissions
    const [commissions, total] = await Promise.all([
      db.commission.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          order: {
            select: {
              orderNumber: true,
              total: true,
              currency: true,
            },
          },
        },
      }),
      db.commission.count({ where }),
    ]);

    return successResponse({
      commissions: commissions.map(c => ({
        id: c.id,
        type: c.type,
        status: c.status,
        amount: c.amount,
        currency: c.currency,
        baseAmount: c.baseAmount,
        createdAt: c.createdAt,
        order: c.order ? {
          orderNumber: c.order.orderNumber,
          total: c.order.total,
        } : null,
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Get commissions error:', error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return errorResponse(error.message, 401);
    }
    return errorResponse('Failed to get commissions', 500);
  }
}
