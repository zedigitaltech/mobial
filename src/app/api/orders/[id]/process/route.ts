/**
 * POST /api/orders/[id]/process
 * Process an order with MobiMatter API
 * Internal/Admin endpoint - triggers MobiMatter order creation
 */

import { NextRequest } from 'next/server';
import {
  successResponse,
  errorResponse,
  parseJsonBody,
  getAuthUser,
} from '@/lib/auth-helpers';
import { processOrderWithMobimatter, getOrderById } from '@/services/order-service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/orders/[id]/process
 * Process order with MobiMatter API
 * 
 * This endpoint should be called after payment is confirmed.
 * It will:
 * 1. Call MobiMatter API to create orders for each item
 * 2. Store eSIM details (QR code, activation code)
 * 3. Update order status
 * 4. Create affiliate commission if applicable
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!id) {
      return errorResponse('Order ID is required', 400);
    }

    // Check authentication
    const user = await getAuthUser(request);

    // This is typically an internal endpoint
    // Could be called by:
    // 1. Admin
    // 2. Payment webhook
    // 3. Internal system
    // For security, we require authentication
    if (!user) {
      return errorResponse('Authentication required', 401);
    }

    // Only admin or system can process orders
    // In a real system, this might also accept webhook signatures
    if (user.role !== 'ADMIN') {
      // Check if user owns this order (for payment callback scenario)
      const order = await getOrderById(id);
      
      if (!order) {
        return errorResponse('Order not found', 404);
      }

      if (order.userId !== user.id) {
        return errorResponse('Access denied', 403);
      }
    }

    // Parse optional body for additional parameters
    const body = await parseJsonBody<{
      paymentReference?: string;
      forceReprocess?: boolean;
    }>(request);

    // Process the order with MobiMatter
    const result = await processOrderWithMobimatter(id, user.id);

    if (!result.success) {
      return errorResponse(result.error || 'Failed to process order', 400);
    }

    return successResponse(
      {
        order: result.order,
        message: 'Order processed successfully',
      },
      'Order processed with MobiMatter'
    );
  } catch (error) {
    console.error('Process order error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to process order';
    
    return errorResponse(errorMessage, 500);
  }
}
