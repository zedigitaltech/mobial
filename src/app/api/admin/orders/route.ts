/**
 * GET /api/admin/orders
 * Get all orders with filters (admin only)
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
    const paymentStatus = url.searchParams.get('paymentStatus') as string | null;
    const search = url.searchParams.get('search') as string | null;
    const startDate = url.searchParams.get('startDate') as string | null;
    const endDate = url.searchParams.get('endDate') as string | null;
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    // Validate status
    const validStatuses = ['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'REFUNDED', 'FAILED'];
    if (status && !validStatuses.includes(status)) {
      return errorResponse(`Invalid status. Valid options: ${validStatuses.join(', ')}`, 400);
    }

    // Validate payment status
    const validPaymentStatuses = ['PENDING', 'PROCESSING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'];
    if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) {
      return errorResponse(`Invalid payment status. Valid options: ${validPaymentStatuses.join(', ')}`, 400);
    }

    // Build where clause
    const where: {
      status?: string;
      paymentStatus?: string;
      OR?: Array<{
        orderNumber?: { contains: string; mode: 'insensitive' };
        email?: { contains: string; mode: 'insensitive' };
        user?: {
          OR: Array<{
            email?: { contains: string; mode: 'insensitive' };
            name?: { contains: string; mode: 'insensitive' };
          }>;
        };
      }>;
      createdAt?: {
        gte?: Date;
        lte?: Date;
      };
    } = {};

    if (status) {
      where.status = status;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
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

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Get orders
    const [orders, total] = await Promise.all([
      db.order.findMany({
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
            },
          },
          items: {
            select: {
              id: true,
              productName: true,
              quantity: true,
              unitPrice: true,
              totalPrice: true,
            },
          },
          commission: {
            select: {
              id: true,
              amount: true,
              status: true,
              affiliate: {
                select: {
                  id: true,
                  affiliateCode: true,
                  user: {
                    select: {
                      name: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      db.order.count({ where }),
    ]);

    // Get order stats
    const stats = await db.order.aggregate({
      where,
      _count: true,
      _sum: {
        total: true,
        subtotal: true,
        discount: true,
      },
    });

    return successResponse({
      orders: orders.map(o => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        paymentStatus: o.paymentStatus,
        subtotal: o.subtotal,
        discount: o.discount,
        total: o.total,
        currency: o.currency,
        email: o.email,
        phone: o.phone,
        createdAt: o.createdAt,
        completedAt: o.completedAt,
        user: o.user,
        items: o.items,
        commission: o.commission,
        affiliateClickId: o.affiliateClickId,
      })),
      stats: {
        total: stats._count,
        totalRevenue: stats._sum.total || 0,
        totalSubtotal: stats._sum.subtotal || 0,
        totalDiscount: stats._sum.discount || 0,
      },
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Admin orders error:', error);
    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return errorResponse(error.message, 401);
      }
      if (error.message === 'Admin access required') {
        return errorResponse(error.message, 403);
      }
    }
    return errorResponse('Failed to fetch orders', 500);
  }
}
