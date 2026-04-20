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

interface ChartEntry {
  date: string;
  amount: number;
}

interface RevenueStats {
  today: number;
  week: number;
  month: number;
  chart: ChartEntry[];
}

interface OrderStats {
  total: number;
  fulfilled: number;
  failed: number;
  pending: number;
  refunded: number;
}

interface SystemHealth {
  mobimatterApiUp: boolean;
  stripeWebhookLastReceived: string | null;
  emailServiceUp: boolean;
}

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function buildRevenueStats(): Promise<RevenueStats> {
  const now = new Date();
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const weekStart = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(todayStart.getTime() - 29 * 24 * 60 * 60 * 1000);

  const [todayResult, weekResult, monthResult, chartOrders] = await Promise.all([
    db.order.aggregate({
      where: { paymentStatus: 'PAID', createdAt: { gte: todayStart } },
      _sum: { total: true },
    }),
    db.order.aggregate({
      where: { paymentStatus: 'PAID', createdAt: { gte: weekStart } },
      _sum: { total: true },
    }),
    db.order.aggregate({
      where: { paymentStatus: 'PAID', createdAt: { gte: monthStart } },
      _sum: { total: true },
    }),
    db.order.findMany({
      where: { paymentStatus: 'PAID', createdAt: { gte: monthStart } },
      select: { createdAt: true, total: true },
    }),
  ]);

  // Build a map of date -> amount for the last 30 days
  const dailyMap: Record<string, number> = {};
  for (let i = 0; i < 30; i++) {
    const d = new Date(monthStart.getTime() + i * 24 * 60 * 60 * 1000);
    dailyMap[toDateString(d)] = 0;
  }
  for (const order of chartOrders) {
    const key = toDateString(order.createdAt);
    if (key in dailyMap) {
      dailyMap[key] = (dailyMap[key] ?? 0) + order.total;
    }
  }

  const chart: ChartEntry[] = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, amount]) => ({ date, amount: Math.round(amount * 100) / 100 }));

  return {
    today: todayResult._sum.total ?? 0,
    week: weekResult._sum.total ?? 0,
    month: monthResult._sum.total ?? 0,
    chart,
  };
}

async function buildOrderStats(
  total: number,
  completed: number,
  failed: number,
  pending: number,
  processing: number,
): Promise<OrderStats> {
  let refunded = 0;
  try {
    refunded = await db.order.count({ where: { status: 'REFUNDED' } });
  } catch {
    refunded = 0;
  }
  return {
    total,
    fulfilled: completed,
    failed,
    pending: pending + processing,
    refunded,
  };
}

async function buildSystemHealth(): Promise<SystemHealth> {
  const emailServiceUp = Boolean(process.env.RESEND_API_KEY);

  // Real health ping — call getWalletBalance with a 3-second timeout
  let mobimatterApiUp = false;
  try {
    const { getWalletBalance } = await import('@/lib/mobimatter');
    await Promise.race([
      getWalletBalance(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 3000),
      ),
    ]);
    mobimatterApiUp = true;
  } catch {
    mobimatterApiUp = false;
  }

  // Only return a timestamp if an actual Stripe-related audit log exists
  let stripeWebhookLastReceived: string | null = null;
  try {
    const lastStripeLog = await db.auditLog.findFirst({
      where: { action: { contains: 'stripe' } },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });
    if (lastStripeLog) {
      stripeWebhookLastReceived = lastStripeLog.createdAt.toISOString();
    }
  } catch {
    stripeWebhookLastReceived = null;
  }

  return { mobimatterApiUp, stripeWebhookLastReceived, emailServiceUp };
}

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
      recentFailedOrders,
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
      db.order.findMany({
        where: { status: 'FAILED' },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          email: true,
          total: true,
          currency: true,
          createdAt: true,
        },
      }).catch(() => [] as { id: string; orderNumber: string; email: string; total: number; currency: string; createdAt: Date }[]),
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

    // New extended fields — wrapped in try/catch so failures don't break core stats
    let revenue: RevenueStats = { today: 0, week: 0, month: 0, chart: [] };
    let orders: OrderStats = {
      total: totalOrders,
      fulfilled: completedOrders,
      failed: failedOrders,
      pending: pendingOrders + processingOrders,
      refunded: 0,
    };
    let fulfillmentRate = 0;
    let systemHealth: SystemHealth = {
      mobimatterApiUp: false,
      stripeWebhookLastReceived: null,
      emailServiceUp: false,
    };

    try {
      revenue = await buildRevenueStats();
    } catch (err) {
      logger.errorWithException('Failed to build revenue stats', err);
    }

    try {
      orders = await buildOrderStats(
        totalOrders,
        completedOrders,
        failedOrders,
        pendingOrders,
        processingOrders,
      );
    } catch (err) {
      logger.errorWithException('Failed to build order stats', err);
    }

    const denominator = orders.fulfilled + orders.failed;
    fulfillmentRate =
      denominator > 0
        ? Math.round((orders.fulfilled / denominator) * 1000) / 10
        : 0;

    try {
      systemHealth = await buildSystemHealth();
    } catch (err) {
      logger.errorWithException('Failed to build system health', err);
    }

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
      recentFailedOrders,
      ...affiliateData,
      walletBalance,
      conversionRate:
        affiliateData.totalClicks > 0
          ? (totalOrders / affiliateData.totalClicks) * 100
          : 0,
      pendingCommissions: 0,
      revenue,
      orders,
      fulfillmentRate,
      systemHealth,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return errorResponse(error.message, error.statusCode);
    }
    logger.errorWithException('Failed to fetch admin stats', error);
    return errorResponse('Failed to fetch stats', 500);
  }
}
