import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { stripe } from '@/lib/stripe';
import { logAuditWithContext } from '@/lib/audit';
import {
  requireAdmin,
  AuthError,
  errorResponse,
  successResponse,
  parseJsonBody,
} from '@/lib/auth-helpers';

const refundSchema = z.object({
  reason: z.string().min(1, 'Refund reason is required').max(500),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    const { id: orderId } = await params;

    const body = await parseJsonBody(request);
    if (!body) {
      return errorResponse('Invalid request body', 400);
    }

    const validation = refundSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return errorResponse(firstError?.message || 'Invalid input', 400);
    }

    const { reason } = validation.data;

    const order = await db.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return errorResponse('Order not found', 404);
    }

    if (order.status !== 'COMPLETED') {
      return errorResponse(`Cannot refund order with status: ${order.status}`, 400);
    }

    if (!order.paymentReference) {
      return errorResponse('Order has no payment reference', 400);
    }

    // paymentReference stores the Stripe checkout session ID
    // Retrieve the session to get the payment intent
    const session = await stripe.checkout.sessions.retrieve(order.paymentReference);
    const paymentIntentId = session.payment_intent;

    if (!paymentIntentId || typeof paymentIntentId !== 'string') {
      return errorResponse('Could not resolve payment intent for this order', 400);
    }

    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      reason: 'requested_by_customer',
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        adminId: admin.id,
        refundReason: reason,
      },
    });

    // Update order status to REFUNDED
    await db.order.update({
      where: { id: orderId },
      data: {
        status: 'REFUNDED',
        paymentStatus: 'REFUNDED',
      },
    });

    await logAuditWithContext({
      userId: admin.id,
      action: 'order_refund',
      entity: 'order',
      entityId: orderId,
      oldValues: { status: order.status, paymentStatus: order.paymentStatus },
      newValues: {
        status: 'REFUNDED',
        paymentStatus: 'REFUNDED',
        refundId: refund.id,
        refundAmount: refund.amount,
        reason,
      },
    });

    return successResponse({
      refundId: refund.id,
      amount: refund.amount / 100,
      currency: refund.currency,
      status: refund.status,
      orderNumber: order.orderNumber,
    }, 'Refund processed successfully');
  } catch (error) {
    if (error instanceof AuthError) {
      return errorResponse(error.message, error.statusCode);
    }
    console.error('Refund error:', error);
    return errorResponse('Failed to process refund', 500);
  }
}
