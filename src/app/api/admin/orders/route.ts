/**
 * GET /api/admin/orders
 * Get all orders with filters (admin only)
 */

import { NextRequest } from 'next/server';
import { requireAdmin, AuthError, errorResponse, successResponse } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { OrderStatus, PaymentStatus, Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const url = new URL(request.url);

    // Parse query parameters
    const statusParam = url.searchParams.get('status');
    const paymentStatusParam = url.searchParams.get('paymentStatus');
    const search = url.searchParams.get('search') as string | null;
    const startDate = url.searchParams.get('startDate') as string | null;
    const endDate = url.searchParams.get('endDate') as string | null;
    const format = url.searchParams.get('format');
    const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '20', 10) || 20, 1), 200);

    // Page-based pagination: if ?page is present, compute offset from it; otherwise fall back to ?offset
    const pageParam = url.searchParams.get('page');
    let offset: number;
    if (pageParam !== null) {
      const page = Math.max(parseInt(pageParam, 10) || 1, 1);
      offset = (page - 1) * limit;
    } else {
      offset = Math.min(Math.max(parseInt(url.searchParams.get('offset') || '0', 10) || 0, 0), 10000);
    }

    // Validate status
    const validStatuses: OrderStatus[] = ['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'REFUNDED', 'FAILED'];
    if (statusParam && !validStatuses.includes(statusParam as OrderStatus)) {
      return errorResponse(`Invalid status. Valid options: ${validStatuses.join(', ')}`, 400);
    }
    const status = statusParam as OrderStatus | null;

    // Validate payment status
    const validPaymentStatuses: PaymentStatus[] = ['PENDING', 'PROCESSING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'];
    if (paymentStatusParam && !validPaymentStatuses.includes(paymentStatusParam as PaymentStatus)) {
      return errorResponse(`Invalid payment status. Valid options: ${validPaymentStatuses.join(', ')}`, 400);
    }
    const paymentStatus = paymentStatusParam as PaymentStatus | null;

    // Build where clause
    const where: Prisma.OrderWhereInput = {};

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
      const createdAt: Prisma.DateTimeFilter = {};
      if (startDate) createdAt.gte = new Date(startDate);
      if (endDate) {
        // Use end of day UTC so orders created throughout the specified date are included
        const d = new Date(endDate)
        d.setUTCHours(23, 59, 59, 999)
        createdAt.lte = d
      }
      where.createdAt = createdAt;
    }

    // Get orders
    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          user: { select: { id: true, email: true, name: true } },
          items: true,
        },
      }),
      db.order.count({ where }),
    ]);

    // CSV export — no stats query needed for this branch
    if (format === 'csv') {
      const csv = [
        'Order Number,Email,Product,Amount,Currency,Status,Payment,Date',
        ...orders.map(o => [
          o.orderNumber,
          o.email,
          o.items[0]?.productName ?? '',
          o.total.toFixed(2),
          o.currency,
          o.status,
          o.paymentStatus,
          new Date(o.createdAt).toISOString(),
        ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="mobialo-orders-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

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

    const currentPage = Math.floor(offset / limit) + 1;
    const pages = Math.ceil(total / limit);

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
      })),
      stats: {
        total: stats._count,
        totalRevenue: stats._sum.total ?? 0,
        totalSubtotal: stats._sum.subtotal ?? 0,
        totalDiscount: stats._sum.discount ?? 0,
      },
      pagination: {
        total,
        page: currentPage,
        pages,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    logger.errorWithException('Admin orders error', error);
    if (error instanceof AuthError) {
      return errorResponse(error.message, error.statusCode);
    }
    return errorResponse('Failed to fetch orders', 500);
  }
}
