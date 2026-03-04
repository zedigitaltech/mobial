/**
 * POST /api/orders/[id]/cancel
 * Cancel an order
 * Updates order status and cancels commission
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  successResponse,
  errorResponse,
  parseJsonBody,
  getAuthUser,
} from '@/lib/auth-helpers';
import { cancelOrder, getOrderById } from '@/services/order-service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Validation schema
const cancelOrderSchema = z.object({
  reason: z.string().min(1, 'Cancellation reason is required').max(500),
});

/**
 * POST /api/orders/[id]/cancel
 * Cancel an order
 * 
 * This endpoint:
 * 1. Updates order status to CANCELLED
 * 2. Cancels any pending commission
 * 3. Logs audit event
 * 
 * Note: Cannot cancel completed orders
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!id) {
      return errorResponse('Order ID is required', 400);
    }

    // Check authentication
    const user = await getAuthUser(request);

    if (!user) {
      return errorResponse('Authentication required', 401);
    }

    // Parse and validate body
    const body = await parseJsonBody(request);
    
    if (!body) {
      return errorResponse('Request body is required', 400);
    }

    const validationResult = cancelOrderSchema.safeParse(body);
    
    if (!validationResult.success) {
      return errorResponse(
        validationResult.error.errors[0]?.message || 'Invalid input',
        400
      );
    }

    const { reason } = validationResult.data;

    // Get the order first to check permissions
    const order = await getOrderById(id);

    if (!order) {
      return errorResponse('Order not found', 404);
    }

    // Check permissions
    // Admin can cancel any order
    // Order owner can cancel their own pending orders
    if (user.role !== 'ADMIN') {
      if (order.userId !== user.id) {
        return errorResponse('Access denied', 403);
      }

      // Users can only cancel pending orders
      if (order.status !== 'PENDING') {
        return errorResponse('Only pending orders can be cancelled by users', 400);
      }
    }

    // Cancel the order
    const updatedOrder = await cancelOrder(id, reason, user.id);

    return successResponse(
      {
        order: {
          id: updatedOrder.id,
          orderNumber: updatedOrder.orderNumber,
          status: updatedOrder.status,
          cancelledAt: updatedOrder.updatedAt,
          reason,
        },
        message: 'Order cancelled successfully',
      },
      'Order cancelled'
    );
  } catch (error) {
    console.error('Cancel order error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to cancel order';
    
    if (errorMessage.includes('not found') || errorMessage.includes('Cannot cancel')) {
      return errorResponse(errorMessage, 400);
    }

    return errorResponse('An error occurred while cancelling the order', 500);
  }
}
