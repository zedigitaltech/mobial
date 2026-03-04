/**
 * Order Service
 * Functions for order management and processing
 */

import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { createOrder as mobimatterCreateOrder, getOrderStatus } from '@/lib/mobimatter';
import {
  validateAffiliateCode,
  trackClick,
  createCommission,
  convertClick,
  getAffiliateClick,
  cancelCommissionForOrder,
} from '@/lib/affiliate-tracking';
import { Prisma, OrderStatus, PaymentStatus, CommissionStatus } from '@prisma/client';

// Types
export interface CreateOrderItem {
  productId: string;
  quantity: number;
}

export interface CreateOrderData {
  items: CreateOrderItem[];
  email: string;
  phone?: string;
  affiliateCode?: string;
  affiliateClickId?: string;
}

export interface OrderTotals {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface OrderFilters {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  userId?: string;
  email?: string;
}

/**
 * Generate a unique order number
 * Format: MBL-XXXXXXXX (8 alphanumeric characters)
 */
export function generateOrderNumber(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'MBL-';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Calculate order totals from items
 */
export async function calculateOrderTotal(items: CreateOrderItem[]): Promise<OrderTotals> {
  let subtotal = 0;

  for (const item of items) {
    const product = await db.product.findUnique({
      where: { id: item.productId },
      select: { price: true, originalPrice: true, isActive: true },
    });

    if (!product) {
      throw new Error(`Product not found: ${item.productId}`);
    }

    if (!product.isActive) {
      throw new Error(`Product is not active: ${item.productId}`);
    }

    const unitPrice = product.price;
    subtotal += unitPrice * item.quantity;
  }

  // No tax for digital eSIM products (can be adjusted based on jurisdiction)
  const tax = 0;
  
  // No automatic discounts at order level (handled via affiliate commissions)
  const discount = 0;

  return {
    subtotal,
    discount,
    tax,
    total: subtotal - discount + tax,
  };
}

/**
 * Validate products exist and are active
 */
export async function validateProducts(items: CreateOrderItem[]): Promise<{
  valid: boolean;
  errors: string[];
  products: Array<{
    id: string;
    name: string;
    price: number;
    mobimatterId: string;
  }>;
}> {
  const errors: string[] = [];
  const products: Array<{
    id: string;
    name: string;
    price: number;
    mobimatterId: string;
  }> = [];

  for (const item of items) {
    const product = await db.product.findUnique({
      where: { id: item.productId },
      select: {
        id: true,
        name: true,
        price: true,
        mobimatterId: true,
        isActive: true,
      },
    });

    if (!product) {
      errors.push(`Product not found: ${item.productId}`);
      continue;
    }

    if (!product.isActive) {
      errors.push(`Product is not available: ${product.name}`);
      continue;
    }

    if (item.quantity < 1 || item.quantity > 10) {
      errors.push(`Invalid quantity for ${product.name}: ${item.quantity}`);
      continue;
    }

    products.push({
      id: product.id,
      name: product.name,
      price: product.price,
      mobimatterId: product.mobimatterId,
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    products,
  };
}

/**
 * Create a new order
 */
export async function createOrder(
  data: CreateOrderData,
  userId?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{
  order: {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    total: number;
    email: string;
    items: Array<{
      productId: string;
      productName: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }>;
  };
  affiliateClickId?: string;
}> {
  // Validate products
  const validation = await validateProducts(data.items);
  
  if (!validation.valid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }

  // Calculate totals
  const totals = await calculateOrderTotal(data.items);

  // Handle affiliate tracking
  let affiliateClickId: string | undefined = data.affiliateClickId;
  let affiliateId: string | undefined;

  if (data.affiliateCode && !affiliateClickId) {
    // Validate affiliate code
    const affiliateValidation = await validateAffiliateCode(data.affiliateCode);
    
    if (affiliateValidation.valid && affiliateValidation.affiliateId) {
      affiliateId = affiliateValidation.affiliateId;
      
      // Track the click
      const clickResult = await trackClick({
        affiliateCode: data.affiliateCode,
        ipAddress,
        userAgent,
      });
      
      if (clickResult) {
        affiliateClickId = clickResult.clickId;
      }
    }
  } else if (data.affiliateClickId) {
    // Get existing click to get affiliate ID
    const existingClick = await getAffiliateClick(data.affiliateClickId);
    if (existingClick) {
      affiliateId = existingClick.affiliateId;
    }
  }

  // Generate unique order number
  let orderNumber = generateOrderNumber();
  let attempts = 0;
  
  while (attempts < 10) {
    const existing = await db.order.findUnique({
      where: { orderNumber },
    });
    
    if (!existing) break;
    
    orderNumber = generateOrderNumber();
    attempts++;
  }

  // Create order with items in a transaction
  const order = await db.$transaction(async (tx) => {
    // Create the order
    const newOrder = await tx.order.create({
      data: {
        orderNumber,
        userId: userId || null,
        email: data.email.toLowerCase(),
        phone: data.phone || null,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        subtotal: totals.subtotal,
        discount: totals.discount,
        tax: totals.tax,
        total: totals.total,
        affiliateClickId: affiliateClickId || null,
        affiliateId: affiliateId || null,
        ipAddress,
        userAgent,
      },
    });

    // Create order items
    const orderItems = await Promise.all(
      data.items.map(async (item) => {
        const product = validation.products.find((p) => p.id === item.productId);
        
        if (!product) {
          throw new Error(`Product not found in validation results: ${item.productId}`);
        }

        return tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            productId: item.productId,
            productName: product.name,
            quantity: item.quantity,
            unitPrice: product.price,
            totalPrice: product.price * item.quantity,
          },
        });
      })
    );

    return { ...newOrder, items: orderItems };
  });

  // Log audit event
  await logAudit({
    userId: userId || undefined,
    action: 'order_create',
    entity: 'order',
    entityId: order.id,
    newValues: {
      orderNumber: order.orderNumber,
      email: order.email,
      total: order.total,
      itemCount: data.items.length,
      affiliateCode: data.affiliateCode,
    },
    ipAddress,
    userAgent,
  });

  return {
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      total: order.total,
      email: order.email,
      items: order.items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      })),
    },
    affiliateClickId,
  };
}

/**
 * Process order with MobiMatter API
 * Called after payment is confirmed
 */
export async function processOrderWithMobimatter(
  orderId: string,
  processedBy?: string
): Promise<{
  success: boolean;
  order?: {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    mobimatterOrderId?: string;
    esimQrCode?: string;
  };
  error?: string;
}> {
  try {
    // Get order with items
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              select: {
                mobimatterId: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    if (order.status !== 'PENDING' && order.status !== 'PROCESSING') {
      return { success: false, error: `Cannot process order with status: ${order.status}` };
    }

    // Update status to PROCESSING
    await db.order.update({
      where: { id: orderId },
      data: { status: 'PROCESSING' },
    });

    // Process each item with MobiMatter
    const mobimatterResults: Array<{
      itemId: string;
      orderId?: string;
      qrCode?: string;
      activationCode?: string;
      smdpAddress?: string;
      iccid?: string;
      error?: string;
    }> = [];

    for (const item of order.items) {
      try {
        // Call MobiMatter API to create order
        const mobimatterOrder = await mobimatterCreateOrder({
          productId: item.product.mobimatterId,
          quantity: item.quantity,
          customerEmail: order.email,
          customerPhone: order.phone || undefined,
        });

        // Update order item with eSIM details
        await db.orderItem.update({
          where: { id: item.id },
          data: {
            esimQrCode: mobimatterOrder.qrCode,
            esimIccid: mobimatterOrder.activationCode,
          },
        });

        mobimatterResults.push({
          itemId: item.id,
          orderId: mobimatterOrder.orderId,
          qrCode: mobimatterOrder.qrCode,
          activationCode: mobimatterOrder.activationCode,
          smdpAddress: mobimatterOrder.smdpAddress,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        mobimatterResults.push({
          itemId: item.id,
          error: errorMessage,
        });
      }
    }

    // Check if all items were processed successfully
    const failedItems = mobimatterResults.filter((r) => r.error);
    
    if (failedItems.length > 0) {
      // Update order status to FAILED
      await db.order.update({
        where: { id: orderId },
        data: {
          status: 'FAILED',
          mobimatterStatus: 'FAILED',
        },
      });

      return {
        success: false,
        error: `Failed to process ${failedItems.length} items`,
      };
    }

    // Get the first MobiMatter order ID (for tracking)
    const primaryResult = mobimatterResults[0];

    // Update order with MobiMatter details
    const updatedOrder = await db.order.update({
      where: { id: orderId },
      data: {
        status: 'COMPLETED',
        mobimatterOrderId: primaryResult?.orderId,
        mobimatterStatus: 'COMPLETED',
        esimQrCode: primaryResult?.qrCode,
        esimActivationCode: primaryResult?.activationCode,
        esimSmdpAddress: primaryResult?.smdpAddress,
        completedAt: new Date(),
      },
    });

    // Handle affiliate commission
    if (order.affiliateClickId && order.affiliateId) {
      // Convert the click
      await convertClick(order.affiliateClickId, orderId, order.total);

      // Get affiliate's commission rate
      const affiliateProfile = await db.affiliateProfile.findUnique({
        where: { userId: order.affiliateId },
        select: { commissionRate: true },
      });

      if (affiliateProfile) {
        // Create commission
        await createCommission(
          orderId,
          order.affiliateId,
          order.total,
          affiliateProfile.commissionRate
        );
      }
    }

    // Log audit event
    await logAudit({
      userId: processedBy,
      action: 'order_complete',
      entity: 'order',
      entityId: orderId,
      newValues: {
        orderNumber: order.orderNumber,
        mobimatterOrderId: primaryResult?.orderId,
        itemsProcessed: mobimatterResults.length,
      },
    });

    return {
      success: true,
      order: {
        id: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        status: updatedOrder.status,
        mobimatterOrderId: updatedOrder.mobimatterOrderId || undefined,
        esimQrCode: updatedOrder.esimQrCode || undefined,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Log the error
    console.error('Error processing order with MobiMatter:', error);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Get order by order number
 */
export async function getOrderByNumber(orderNumber: string) {
  return db.order.findUnique({
    where: { orderNumber: orderNumber.toUpperCase() },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              provider: true,
              dataAmount: true,
              dataUnit: true,
              validityDays: true,
              countries: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Get order by ID
 */
export async function getOrderById(orderId: string) {
  return db.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              provider: true,
              dataAmount: true,
              dataUnit: true,
              validityDays: true,
              countries: true,
            },
          },
        },
      },
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });
}

/**
 * Get orders for a user (paginated)
 */
export async function getUserOrders(
  userId: string,
  pagination: PaginationParams = {}
) {
  const { limit = 20, offset = 0 } = pagination;

  const [orders, total] = await Promise.all([
    db.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        items: {
          select: {
            id: true,
            productName: true,
            quantity: true,
            unitPrice: true,
            totalPrice: true,
          },
        },
      },
    }),
    db.order.count({ where: { userId } }),
  ]);

  return {
    orders,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    },
  };
}

/**
 * Get all orders with filters (admin)
 */
export async function getAllOrders(
  filters: OrderFilters = {},
  pagination: PaginationParams = {}
) {
  const { limit = 20, offset = 0 } = pagination;
  const where: Prisma.OrderWhereInput = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.paymentStatus) {
    where.paymentStatus = filters.paymentStatus;
  }

  if (filters.userId) {
    where.userId = filters.userId;
  }

  if (filters.email) {
    where.email = { contains: filters.email.toLowerCase() };
  }

  const [orders, total] = await Promise.all([
    db.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        items: {
          select: {
            id: true,
            productName: true,
            quantity: true,
            unitPrice: true,
            totalPrice: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    }),
    db.order.count({ where }),
  ]);

  return {
    orders,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    },
  };
}

/**
 * Mark order as completed
 */
export async function completeOrder(
  orderId: string,
  completedBy?: string
) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { commission: true },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  if (order.status !== 'PROCESSING' && order.status !== 'PENDING') {
    throw new Error(`Cannot complete order with status: ${order.status}`);
  }

  // Update order and commission in transaction
  const updatedOrder = await db.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id: orderId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    // Approve commission if exists
    if (order.commission) {
      await tx.commission.update({
        where: { id: order.commission.id },
        data: { status: 'APPROVED' },
      });
    }

    return updated;
  });

  // Log audit event
  await logAudit({
    userId: completedBy,
    action: 'order_complete',
    entity: 'order',
    entityId: orderId,
    newValues: {
      orderNumber: order.orderNumber,
      status: 'COMPLETED',
    },
  });

  return updatedOrder;
}

/**
 * Cancel an order
 */
export async function cancelOrder(
  orderId: string,
  reason: string,
  cancelledBy?: string
) {
  const order = await db.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  if (order.status === 'COMPLETED') {
    throw new Error('Cannot cancel a completed order');
  }

  if (order.status === 'CANCELLED') {
    throw new Error('Order is already cancelled');
  }

  // Update order status and cancel commission
  const updatedOrder = await db.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
      },
    });

    // Cancel commission if exists
    if (order.affiliateClickId) {
      await cancelCommissionForOrder(orderId);
    }

    return updated;
  });

  // Log audit event
  await logAudit({
    userId: cancelledBy,
    action: 'order_cancel',
    entity: 'order',
    entityId: orderId,
    newValues: {
      orderNumber: order.orderNumber,
      reason,
    },
  });

  return updatedOrder;
}

/**
 * Check if user owns the order
 */
export async function userOwnsOrder(userId: string, orderId: string): Promise<boolean> {
  const order = await db.order.findFirst({
    where: {
      id: orderId,
      OR: [
        { userId },
        { email: (await db.user.findUnique({ where: { id: userId }, select: { email: true } }))?.email },
      ],
    },
  });

  return !!order;
}

/**
 * Get order statistics (for dashboard)
 */
export async function getOrderStats(userId?: string) {
  const where: Prisma.OrderWhereInput = userId ? { userId } : {};

  const [totalOrders, pendingOrders, completedOrders, totalRevenue] = await Promise.all([
    db.order.count({ where }),
    db.order.count({ where: { ...where, status: 'PENDING' } }),
    db.order.count({ where: { ...where, status: 'COMPLETED' } }),
    db.order.aggregate({
      where: { ...where, status: 'COMPLETED' },
      _sum: { total: true },
    }),
  ]);

  return {
    totalOrders,
    pendingOrders,
    completedOrders,
    totalRevenue: totalRevenue._sum.total || 0,
  };
}
