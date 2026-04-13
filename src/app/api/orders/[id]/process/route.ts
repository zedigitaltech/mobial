/**
 * POST /api/orders/[id]/process
 * Process an order with MobiMatter API
 * Internal/Admin endpoint - triggers MobiMatter order creation
 */

import { NextRequest } from 'next/server';
import {
  successResponse,
  errorResponse,
  requireAdmin,
} from '@/lib/auth-helpers';
import { processOrderWithMobimatter } from '@/services/order-service';
import { logger } from '@/lib/logger';

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

    const user = await requireAdmin(request);

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
    logger.errorWithException('Process order error', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to process order';
    
    return errorResponse(errorMessage, 500);
  }
}
