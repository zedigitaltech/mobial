/**
 * GET /api/orders/[id]
 * Get a specific order by ID or order number
 * Only owner or admin can access
 */

import { NextRequest } from 'next/server';
import {
  successResponse,
  errorResponse,
  getAuthUser,
} from '@/lib/auth-helpers';
import { getOrderById, getOrderByNumber, userOwnsOrder } from '@/services/order-service';
import { getESIMDetails } from '@/services/esim-service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/orders/[id]
 * Get order by ID or order number
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!id) {
      return errorResponse('Order ID is required', 400);
    }

    // Check authentication
    const user = await getAuthUser(request);

    // Try to find by ID first, then by order number
    let order: any = await getOrderById(id);

    if (!order) {
      order = await getOrderByNumber(id);
    }

    if (!order) {
      return errorResponse('Order not found', 404);
    }

    // Check access permissions
    // User must be either:
    // 1. Admin
    // 2. The owner of the order (by userId or email)
    if (user) {
      if (user.role !== 'ADMIN') {
        const isOwner = await userOwnsOrder(user.id, order.id);
        
        if (!isOwner && order.email !== user.email) {
          return errorResponse('Access denied', 403);
        }
      }
    } else {
      // Guest user - only allow access via order number
      if (order.id === id && order.orderNumber !== id) {
        return errorResponse('Authentication required', 401);
      }

      const email = request.nextUrl.searchParams.get('email');

      if (!email) {
        return successResponse({
          order: {
            orderNumber: order.orderNumber,
            status: order.status,
            paymentStatus: order.paymentStatus,
            createdAt: order.createdAt,
          },
        });
      }

      if (email.toLowerCase() !== order.email?.toLowerCase()) {
        return errorResponse('Access denied', 403);
      }
    }

    // Get eSIM details if order is completed
    const esimDetails = order.status === 'COMPLETED' ? await getESIMDetails(order.id) : null;

    // Format response
    const response = {
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        subtotal: order.subtotal,
        discount: order.discount,
        tax: order.tax,
        total: order.total,
        currency: order.currency,
        email: order.email,
        phone: order.phone,
        createdAt: order.createdAt,
        completedAt: order.completedAt,
        items: order.items.map((item: any) => ({
          id: item.id,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          esimIccid: item.esimIccid,
          product: item.product ? {
            name: item.product.name,
            provider: item.product.provider,
            dataAmount: item.product.dataAmount,
            dataUnit: item.product.dataUnit,
            validityDays: item.product.validityDays,
            countries: (item.product.countries as string[]) || [],
          } : null,
        })),
        user: order.user,
        esim: esimDetails ? {
          qrCode: esimDetails.qrCode,
          activationCode: esimDetails.activationCode,
          smdpAddress: esimDetails.smdpAddress,
          status: esimDetails.status,
        } : null,
      },
    };

    return successResponse(response);
  } catch (error) {
    console.error('Get order error:', error);
    return errorResponse('Failed to retrieve order', 500);
  }
}
