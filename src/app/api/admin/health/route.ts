import { NextRequest } from 'next/server';
import { requireAdmin, successResponse, errorResponse } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { testConnection } from '@/lib/mobimatter';

const startTime = Date.now();

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const checks: Record<string, { status: string; message?: string; responseTime?: number }> = {};

    const dbStart = Date.now();
    try {
      await db.$queryRaw`SELECT 1`;
      checks.database = {
        status: 'healthy',
        responseTime: Date.now() - dbStart,
      };
    } catch (error) {
      checks.database = {
        status: 'down',
        message: error instanceof Error ? error.message : 'Connection failed',
      };
    }

    const mmStart = Date.now();
    try {
      const result = await testConnection();
      checks.mobimatter = {
        status: result.success ? 'healthy' : 'down',
        message: result.message,
        responseTime: Date.now() - mmStart,
      };
    } catch (error) {
      checks.mobimatter = {
        status: 'down',
        message: error instanceof Error ? error.message : 'Connection failed',
      };
    }

    checks.stripe = {
      status: process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET
        ? 'healthy'
        : 'not_configured',
      message: !process.env.STRIPE_SECRET_KEY
        ? 'STRIPE_SECRET_KEY not set'
        : !process.env.STRIPE_WEBHOOK_SECRET
        ? 'STRIPE_WEBHOOK_SECRET not set'
        : 'Keys configured',
    };

    checks.resend = {
      status: process.env.RESEND_API_KEY ? 'healthy' : 'not_configured',
      message: process.env.RESEND_API_KEY ? 'API key configured' : 'RESEND_API_KEY not set',
    };

    let lastProductSync: string | null = null;
    try {
      const syncConfig = await db.systemConfig.findUnique({
        where: { key: 'last_product_sync' },
      });
      lastProductSync = syncConfig?.value || null;
    } catch {}

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [orders24h, orders7d, orders30d] = await Promise.all([
      db.order.count({ where: { createdAt: { gte: twentyFourHoursAgo } } }),
      db.order.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      db.order.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    ]);

    const uptimeMs = Date.now() - startTime;
    const uptimeHours = Math.floor(uptimeMs / (1000 * 60 * 60));
    const uptimeMinutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));

    const allHealthy = Object.values(checks).every(
      (c) => c.status === 'healthy' || c.status === 'not_configured'
    );
    const anyDown = Object.values(checks).some((c) => c.status === 'down');

    return successResponse({
      status: anyDown ? 'unhealthy' : allHealthy ? 'healthy' : 'degraded',
      checks,
      lastProductSync,
      uptime: `${uptimeHours}h ${uptimeMinutes}m`,
      uptimeMs,
      orders: {
        last24h: orders24h,
        last7d: orders7d,
        last30d: orders30d,
      },
      timestamp: now.toISOString(),
    });
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      const authError = error as { statusCode: number; message: string };
      return errorResponse(authError.message, authError.statusCode);
    }
    console.error('Error in health check:', error);
    return errorResponse('Health check failed', 500);
  }
}
