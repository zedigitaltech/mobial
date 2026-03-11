import { NextRequest } from 'next/server';
import { z } from 'zod';
import { 
  successResponse, 
  errorResponse, 
  parseJsonBody 
} from '@/lib/auth-helpers';
import { getOrderById } from '@/services/order-service';
import { createCheckoutSession } from '@/lib/stripe';

const checkoutSessionSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  isTopUp: z.boolean().optional(),
  parentMobimatterOrderId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody(request);
    const validation = checkoutSessionSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(validation.error.issues[0].message, 400);
    }

    const { orderId, isTopUp, parentMobimatterOrderId } = validation.data;

    // 1. Fetch the order
    const order = await getOrderById(orderId);
    if (!order) {
      return errorResponse('Order not found', 404);
    }

    if (order.status !== 'PENDING') {
      return errorResponse(`Order cannot be paid (Status: ${order.status})`, 400);
    }

    // 2. Create Stripe session
    const session = await createCheckoutSession({
      orderId: order.id,
      orderNumber: order.orderNumber,
      email: order.email,
      amount: order.total,
      isTopUp,
      parentMobimatterOrderId,
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
    console.error('Checkout session error:', error);
    return errorResponse('Failed to create checkout session', 500);
  }
}
