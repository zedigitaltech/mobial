/**
 * Orders API Routes
 * POST /api/orders - Create a new order
 * GET /api/orders - Get orders (authenticated)
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  successResponse,
  errorResponse,
  parseJsonBody,
  getClientIP,
  getUserAgent,
  getAuthUser,
} from '@/lib/auth-helpers';
import { logger } from '@/lib/logger';
import {
  createOrder,
  getUserOrders,
  getAllOrders,
  type CreateOrderItem,
} from '@/services/order-service';

// Validation schema for creating an order
const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1, 'Product ID is required'),
        quantity: z.number().int().min(1).max(10),
      })
    )
    .min(1, 'At least one item is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  isTopUp: z.boolean().optional(),
  parentMobimatterOrderId: z.string().optional(),
  affiliateCode: z.string().optional(),
});

// Validation schema for query params
const getOrdersQuerySchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'REFUNDED', 'FAILED']).optional(),
  paymentStatus: z.enum(['PENDING', 'PROCESSING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED']).optional(),
  // Coerce to bounded integers at the schema boundary so downstream code
  // never sees raw strings or out-of-range values.
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).max(10000).optional(),
});

/**
 * POST /api/orders
 * Create a new order
 * Works for both guests and authenticated users
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate input
    const body = await parseJsonBody(request);
    
    if (!body) {
      return errorResponse('Invalid request body', 400);
    }

    const validationResult = createOrderSchema.safeParse(body);

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return errorResponse(
        firstError?.message || 'Invalid input',
        400
      );
    }

    const { items, email, phone, isTopUp, parentMobimatterOrderId, affiliateCode } = validationResult.data;

    // Check if user is authenticated (optional)
    const user = await getAuthUser(request);

    // Get client info for tracking
    const ipAddress = getClientIP(request);
    const userAgent = getUserAgent(request);

    // Create the order
    const result = await createOrder(
      {
        items: items as CreateOrderItem[],
        email,
        phone,
        isTopUp,
        parentMobimatterOrderId,
        affiliateCode,
      },
      user?.id,
      ipAddress,
      userAgent
    );

    return successResponse(
      { order: result.order },
      'Order created successfully'
    );
  } catch (error) {
    logger.errorWithException('Create order error', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to create order';
    
    if (errorMessage.includes('Validation failed') || errorMessage.includes('not found') || errorMessage.includes('not active')) {
      return errorResponse(errorMessage, 400);
    }

    return errorResponse('An error occurred while creating the order', 500);
  }
}

/**
 * GET /api/orders
 * Get orders for authenticated user
 * Admin can see all orders with filters
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await getAuthUser(request);

    if (!user) {
      return errorResponse('Authentication required', 401);
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    
    const validationResult = getOrdersQuerySchema.safeParse(queryParams);
    
    if (!validationResult.success) {
      return errorResponse('Invalid query parameters', 400);
    }

    const { status, paymentStatus, limit, offset } = validationResult.data;

    const pagination = {
      limit: limit ?? 20,
      offset: offset ?? 0,
    };

    let result;

    if (user.role === 'ADMIN') {
      // Admin can see all orders
      result = await getAllOrders(
        {
          status,
          paymentStatus,
        },
        pagination
      );
    } else {
      // Regular users see only their orders
      result = await getUserOrders(user.id, pagination);
    }

    return successResponse(result);
  } catch (error) {
    logger.errorWithException('Get orders error', error);
    return errorResponse('Failed to retrieve orders', 500);
  }
}
