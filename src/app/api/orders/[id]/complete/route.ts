/**
 * POST /api/orders/[id]/complete
 * Mark an order as completed
 * Updates commission status to APPROVED
 */

import { NextRequest } from 'next/server';
import {
  successResponse,
  errorResponse,
  requireAdmin,
} from '@/lib/auth-helpers';
import { completeOrder, getOrderById } from '@/services/order-service';
import { logger } from '@/lib/logger';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/orders/[id]/complete
 * Mark order as completed
 * 
 * This endpoint:
 * 1. Updates order status to COMPLETED
 * 2. Sets completedAt timestamp
 * 3. Updates commission status to APPROVED
 * 4. Logs audit event
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!id) {
      return errorResponse('Order ID is required', 400);
    }

    const user = await requireAdmin(request);

    const order = await getOrderById(id);

    if (!order) {
      return errorResponse('Order not found', 404);
    }

    // Complete the order
    const updatedOrder = await completeOrder(id, user.id);

    return successResponse(
      {
        order: {
          id: updatedOrder.id,
          orderNumber: updatedOrder.orderNumber,
          status: updatedOrder.status,
          completedAt: updatedOrder.completedAt,
        },
        message: 'Order marked as completed',
      },
      'Order completed successfully'
    );
  } catch (error) {
    logger.errorWithException('Complete order error', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to complete order';
    
    if (errorMessage.includes('not found') || errorMessage.includes('Cannot complete')) {
      return errorResponse(errorMessage, 400);
    }

    return errorResponse('An error occurred while completing the order', 500);
  }
}
