import { NextRequest } from 'next/server';
import {
  successResponse,
  errorResponse,
  getAuthUser
} from '@/lib/auth-helpers';
import { getStructuredUsage } from '@/lib/mobimatter';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getAuthUser(request);

    // Allow guest access via order number
    const orderNumberHeader = request.headers.get('x-order-number');

    let order;

    if (user) {
      // Authenticated: find by ID, verify ownership
      order = await db.order.findUnique({
        where: { id },
        select: { id: true, userId: true, mobimatterOrderId: true, status: true, orderNumber: true }
      });

      if (!order || (order.userId !== user.id && user.role !== 'ADMIN')) {
        return errorResponse('Order not found', 404);
      }
    } else if (orderNumberHeader) {
      // Guest: find by ID and verify order number matches
      order = await db.order.findUnique({
        where: { id },
        select: { id: true, userId: true, mobimatterOrderId: true, status: true, orderNumber: true }
      });

      if (!order || order.orderNumber !== orderNumberHeader) {
        return errorResponse('Order not found', 404);
      }
    } else {
      return errorResponse('Authentication required', 401);
    }

    if (order.status !== 'COMPLETED') {
      return errorResponse('Order is not completed', 400);
    }

    if (!order.mobimatterOrderId) {
      return errorResponse('Order not fulfilled yet', 400);
    }

    // Fetch structured usage from MobiMatter
    const usage = await getStructuredUsage(order.mobimatterOrderId);

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

    return successResponse({
      orderId: order.mobimatterOrderId,
      iccid: usage.iccid,
      dataUsed: usedDataMb,
      dataTotal: totalDataMb,
      dataUnit: 'MB',
      percentage,
      isActive,
      remainingDays,
      status: isActive ? 'active' : usage.esimStatus === 'Available' ? 'not_activated' : 'expired',
      packages: usage.packages,
    });

  } catch (error) {
    logger.errorWithException('Usage check error', error);
    // Any failure past the DB lookup is an upstream (MobiMatter) problem —
    // the DB branch returns 404 before this catch runs. Surface it as 502
    // with a retry hint so clients show "try again later" instead of "not found".
    return Response.json(
      {
        success: false,
        error: 'eSIM provider temporarily unavailable. Please try again in a few moments.',
        retryable: true,
      },
      { status: 502, headers: { 'Retry-After': '30' } },
    );
  }
}
