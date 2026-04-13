import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import {
  requireAdmin,
  successResponse,
  errorResponse,
  AuthError,
} from '@/lib/auth-helpers';
import { getAllAffiliates } from '@/services/affiliate-service';
import { logger } from '@/lib/logger';

async function tryGetWalletBalance(): Promise<number | null> {
  try {
    const { getWalletBalance } = await import('@/lib/mobimatter');
    if (typeof getWalletBalance === 'function') {
      const wallet = await getWalletBalance();
      return wallet.balance;
    }
  } catch {}
  return null;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const [
      totalOrders,
      pendingOrders,
      completedOrders,
      failedOrders,
      cancelledOrders,
      processingOrders,
      totalRevenueResult,
      totalUsers,
      recentOrders,
    ] = await Promise.all([
      db.order.count(),
      db.order.count({ where: { status: 'PENDING' } }),
      db.order.count({ where: { status: 'COMPLETED' } }),
      db.order.count({ where: { status: 'FAILED' } }),
      db.order.count({ where: { status: 'CANCELLED' } }),
      db.order.count({ where: { status: 'PROCESSING' } }),
      db.order.aggregate({
        where: { paymentStatus: 'PAID' },
        _sum: { total: true },
      }),
      db.user.count({
        where: { deletedAt: null },
      }),
      db.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          email: true,
          status: true,
          paymentStatus: true,
          total: true,
          currency: true,
          createdAt: true,
        },
      }),
    ]);

    const totalRevenue = totalRevenueResult._sum.total || 0;

    let affiliateData = { totalAffiliates: 0, pendingAffiliates: 0, activeAffiliates: 0, totalClicks: 0, totalCommission: 0 };
    try {
      const affiliates = await getAllAffiliates();
      affiliateData = {
        totalAffiliates: affiliates.length,
        pendingAffiliates: affiliates.filter((a) => a.status === 'PENDING').length,
        activeAffiliates: affiliates.filter((a) => a.status === 'ACTIVE').length,
        totalClicks: affiliates.reduce((sum, a) => sum + a.clicks, 0),
        totalCommission: affiliates.reduce((sum, a) => sum + a.commission, 0),
      };
    } catch {}

    const walletBalance = await tryGetWalletBalance();

    return successResponse({
      totalOrders,
      pendingOrders,
      completedOrders,
      totalRevenue,
      totalUsers,
      ordersByStatus: {
        PENDING: pendingOrders,
        PROCESSING: processingOrders,
        COMPLETED: completedOrders,
        FAILED: failedOrders,
        CANCELLED: cancelledOrders,
      },
      recentOrders,
      ...affiliateData,
      walletBalance,
      conversionRate:
        affiliateData.totalClicks > 0
          ? (totalOrders / affiliateData.totalClicks) * 100
          : 0,
      pendingCommissions: 0,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return errorResponse(error.message, error.statusCode);
    }
    logger.errorWithException('Failed to fetch admin stats', error);
    return errorResponse('Failed to fetch stats', 500);
  }
}
