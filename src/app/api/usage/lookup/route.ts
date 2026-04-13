import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/auth-helpers';
import { getOrderByIccid, getStructuredUsage } from '@/lib/mobimatter';
import { db } from '@/lib/db';
import { checkRateLimit } from '@/lib/rate-limit';
import { logAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 10 lookups per minute
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rateLimit = await checkRateLimit(ip, 'api:general', {
      windowMs: 60 * 1000,
      maxRequests: 10,
    });

    if (!rateLimit.success) {
      return errorResponse('Too many requests. Please try again later.', 429);
    }

    const body = await request.json().catch(() => null);

    if (!body) {
      return errorResponse('Invalid request body', 400);
    }

    const { type, value } = body as { type?: string; value?: string };

    if (!type || !value) {
      return errorResponse('Missing type or value', 400);
    }

    if (type !== 'iccid' && type !== 'order_number') {
      return errorResponse('Type must be "iccid" or "order_number"', 400);
    }

    const trimmedValue = value.trim();

    if (!trimmedValue) {
      return errorResponse('Value cannot be empty', 400);
    }

    let mobimatterOrderId: string | null = null;
    let orderNumber: string | null = null;
    let iccid: string | null = null;

    if (type === 'order_number') {
      // Look up order by order number in our database
      const order = await db.order.findUnique({
        where: { orderNumber: trimmedValue.toUpperCase() },
        select: {
          id: true,
          mobimatterOrderId: true,
          orderNumber: true,
          status: true,
          items: {
            select: { esimIccid: true },
          },
        },
      });

      if (!order) {
        return errorResponse('Order not found', 404);
      }

      if (order.status !== 'COMPLETED') {
        return errorResponse('Order is not completed yet', 400);
      }

      if (!order.mobimatterOrderId) {
        return errorResponse('eSIM not yet provisioned', 400);
      }

      mobimatterOrderId = order.mobimatterOrderId;
      orderNumber = order.orderNumber;
      iccid = order.items[0]?.esimIccid || null;
    } else {
      // Look up by ICCID via MobiMatter API
      try {
        const orderInfo = await getOrderByIccid(trimmedValue);
        mobimatterOrderId = orderInfo.orderId;
        iccid = orderInfo.lineItem?.iccid || trimmedValue;
      } catch {
        return errorResponse('No eSIM found with this ICCID', 404);
      }
    }

    if (!mobimatterOrderId) {
      return errorResponse('Could not find eSIM data', 404);
    }

    // Fetch structured usage from MobiMatter
    const usage = await getStructuredUsage(mobimatterOrderId);

    // Aggregate usage across all packages
    let totalDataMb = 0;
    let usedDataMb = 0;
    let latestExpiration: string | null = null;

    for (const pkg of usage.packages) {
      if (pkg.totalAllowanceMb) totalDataMb += pkg.totalAllowanceMb;
      if (pkg.usedMb) usedDataMb += pkg.usedMb;
      if (pkg.expirationDate) {
        if (!latestExpiration || pkg.expirationDate > latestExpiration) {
          latestExpiration = pkg.expirationDate;
        }
      }
    }

    const percentage = totalDataMb > 0
      ? Math.min(100, Math.round((usedDataMb / totalDataMb) * 100))
      : 0;

    const remainingDays = latestExpiration
      ? Math.max(0, Math.ceil((new Date(latestExpiration).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : null;

    const isActive = usage.esimStatus === 'Installed';

    await logAudit({
      action: 'usage_lookup',
      entity: 'order',
      entityId: mobimatterOrderId,
      newValues: { type, lookupValue: type === 'iccid' ? '***' : trimmedValue },
      ipAddress: ip,
    });

    return successResponse({
      orderId: mobimatterOrderId,
      orderNumber,
      iccid: iccid || usage.iccid,
      dataUsed: usedDataMb,
      dataTotal: totalDataMb,
      dataUnit: 'MB',
      percentage,
      remainingDays,
      isActive,
      status: isActive ? 'active' : usage.esimStatus === 'Available' ? 'not_activated' : 'expired',
      packages: usage.packages,
    });
  } catch (error) {
    logger.errorWithException('Usage lookup error', error);
    return errorResponse('Failed to fetch usage data', 500);
  }
}
