/**
 * GET /api/admin/affiliates
 * List all affiliates (admin only)
 */

import { NextRequest } from 'next/server';
import { requireAdmin, errorResponse, successResponse } from '@/lib/auth-helpers';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const url = new URL(request.url);

    // Parse query parameters
    const status = url.searchParams.get('status') as string | null;
    const search = url.searchParams.get('search') as string | null;
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    // Validate status
    const validStatuses = ['PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED'];
    if (status && !validStatuses.includes(status)) {
      return errorResponse(`Invalid status. Valid options: ${validStatuses.join(', ')}`, 400);
    }

    // Build where clause
    const where: {
      status?: string;
      OR?: Array<{
        affiliateCode?: { contains: string; mode: 'insensitive' };
        companyName?: { contains: string; mode: 'insensitive' };
        user?: {
          OR: Array<{
            email?: { contains: string; mode: 'insensitive' };
            name?: { contains: string; mode: 'insensitive' };
          }>;
        };
      }>;
    } = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { affiliateCode: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
        {
          user: {
            OR: [
              { email: { contains: search, mode: 'insensitive' } },
              { name: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    // Get affiliates
    const [affiliates, total] = await Promise.all([
      db.affiliateProfile.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              createdAt: true,
            },
          },
        },
      }),
      db.affiliateProfile.count({ where }),
    ]);

    return successResponse({
      affiliates: affiliates.map(a => ({
        id: a.id,
        userId: a.userId,
        affiliateCode: a.affiliateCode,
        companyName: a.companyName,
        website: a.website,
        status: a.status,
        commissionRate: a.commissionRate,
        totalClicks: a.totalClicks,
        totalConversions: a.totalConversions,
        totalEarnings: a.totalEarnings,
        totalPaidOut: a.totalPaidOut,
        createdAt: a.createdAt,
        approvedAt: a.approvedAt,
        user: a.user,
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('List affiliates error:', error);
    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return errorResponse(error.message, 401);
      }
      if (error.message === 'Admin access required') {
        return errorResponse(error.message, 403);
      }
    }
    return errorResponse('Failed to list affiliates', 500);
  }
}
