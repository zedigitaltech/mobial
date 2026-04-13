import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  successResponse,
  errorResponse,
  parseJsonBody,
  getAuthUser,
  requireAuth,
  AuthError,
} from '@/lib/auth-helpers';
import { getOrderById } from '@/services/order-service';
import { createCheckoutSession } from '@/lib/stripe';
import { checkRateLimit } from '@/lib/rate-limit';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

const checkoutSessionSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  isTopUp: z.boolean().optional(),
  parentMobimatterOrderId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rateLimit = await checkRateLimit(ip, 'order:create');
    if (!rateLimit.success) {
      return errorResponse('Too many checkout attempts. Please try again later.', 429);
    }

    const body = await parseJsonBody(request);
    const validation = checkoutSessionSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(validation.error.issues[0].message, 400);
    }

    const { orderId, isTopUp, parentMobimatterOrderId } = validation.data;

    // Top-up ownership validation — must happen before fetching the new order
    if (isTopUp) {
      if (!parentMobimatterOrderId) {
        return errorResponse('parentMobimatterOrderId is required for top-ups', 400);
      }

      let topUpUser;
      try {
        topUpUser = await requireAuth(request);
      } catch (err) {
        if (err instanceof AuthError) {
          return errorResponse(err.message, err.statusCode);
        }
        return errorResponse('Authentication required for top-ups', 401);
      }

      const originalOrder = await db.order.findFirst({
        where: { mobimatterOrderId: parentMobimatterOrderId },
        select: { userId: true, status: true },
      });

      if (!originalOrder) {
        return errorResponse('Original order not found', 404);
      }

      const isAdmin = topUpUser.role === 'ADMIN';
      if (!isAdmin && originalOrder.userId !== topUpUser.id) {
        return errorResponse('Access denied', 403);
      }

      if (originalOrder.status !== 'COMPLETED') {
        return errorResponse('Top-ups are only allowed on completed orders', 400);
      }
    }

    // 1. Fetch the order
    const order = await getOrderById(orderId);
    if (!order) {
      return errorResponse('Order not found', 404);
    }

    if (order.status !== 'PENDING') {
      return errorResponse('Order cannot be paid in its current status', 400);
    }

    // 2. Resolve authenticated user (optional -- guests can checkout)
    const authUser = await getAuthUser(request);

    // 3. Verify order ownership if order belongs to a user
    if (order.userId && authUser && authUser.id !== order.userId) {
      return errorResponse('Access denied', 403);
    }

    // 4. Create Stripe session
    const session = await createCheckoutSession({
      orderId: order.id,
      orderNumber: order.orderNumber,
      email: order.email,
      amount: order.total,
      isTopUp,
      parentMobimatterOrderId,
      userId: authUser?.id ?? order.userId ?? undefined,
      items: order.items.map(item => ({
        name: isTopUp ? `Top-Up: ${item.productName}` : item.productName,
        amount: item.unitPrice,
        quantity: item.quantity
      }))
    });

    return successResponse({
      sessionId: session.id,
      url: session.url
    });

  } catch (error) {
    logger.errorWithException('Checkout session error', error);
    return errorResponse('Failed to create checkout session', 500);
  }
}
