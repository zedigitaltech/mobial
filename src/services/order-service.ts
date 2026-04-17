/**
 * Order Service
 * Functions for order management and processing
 */

import crypto from "crypto";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import {
  createOrder as mobimatterCreateOrder,
  completeOrder as mobimatterCompleteOrder,
  getWalletBalance,
} from "@/lib/mobimatter";
import { encryptEsimField } from "@/lib/esim-encryption";
// email sent by stripe webhook after fulfillment
import { logger } from "@/lib/logger";
import { Prisma, OrderStatus, PaymentStatus } from "@prisma/client";

const log = logger.child("order-service");

// Types
export interface CreateOrderItem {
  productId: string;
  quantity: number;
}

export interface CreateOrderData {
  items: CreateOrderItem[];
  email: string;
  phone?: string;
  isTopUp?: boolean;
  parentMobimatterOrderId?: string;
  affiliateCode?: string;
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
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = crypto.randomBytes(8);
  let result = "MBL-";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(bytes[i] % chars.length);
  }
  return result;
}

/**
 * Calculate order totals from items
 */
export async function calculateOrderTotal(
  items: CreateOrderItem[],
): Promise<OrderTotals> {
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

  // No automatic discounts at order level
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
  userAgent?: string,
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
}> {
  // Validate products
  const validation = await validateProducts(data.items);

  if (!validation.valid) {
    throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
  }

  // Calculate totals
  const totals = await calculateOrderTotal(data.items);

  // Apply affiliate discount if a valid code was supplied
  let affiliateDiscount = 0;
  let resolvedAffiliateCode: string | undefined;
  if (data.affiliateCode) {
    const normalizedCode = data.affiliateCode.trim().toUpperCase();
    const affiliateConfig = await db.systemConfig.findUnique({
      where: { key: `affiliate:${normalizedCode}` },
    });
    if (affiliateConfig) {
      let profile: { userId: string; status: string; commissionRate: number } | null = null;
      try {
        profile = JSON.parse(affiliateConfig.value) as {
          userId: string;
          status: string;
          commissionRate: number;
        };
      } catch {
        // Malformed JSON — ignore, no discount applied
      }
      if (profile && profile.status === 'ACTIVE' && profile.commissionRate > 0) {
        affiliateDiscount =
          Math.round(totals.total * (profile.commissionRate / 100) * 100) / 100;
        resolvedAffiliateCode = normalizedCode;
      }
    }
  }

  const finalTotal = totals.total - affiliateDiscount;

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
        status: "PENDING",
        paymentStatus: "PENDING",
        subtotal: totals.subtotal,
        discount: affiliateDiscount,
        tax: totals.tax,
        total: finalTotal,
        isTopUp: data.isTopUp || false,
        parentOrderId: data.parentMobimatterOrderId || null,
        ipAddress,
        userAgent,
      },
    });

    // Create order items
    const orderItems = await Promise.all(
      data.items.map(async (item) => {
        const product = validation.products.find(
          (p) => p.id === item.productId,
        );

        if (!product) {
          throw new Error(
            `Product not found in validation results: ${item.productId}`,
          );
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
      }),
    );

    return { ...newOrder, items: orderItems };
  });

  // Log audit event
  await logAudit({
    userId: userId || undefined,
    action: "order_create",
    entity: "order",
    entityId: order.id,
    newValues: {
      orderNumber: order.orderNumber,
      email: order.email,
      subtotal: totals.total,
      discount: affiliateDiscount,
      total: order.total,
      affiliateCode: resolvedAffiliateCode ?? null,
      itemCount: data.items.length,
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
  };
}

/**
 * Process order with MobiMatter API
 * Called after payment is confirmed.
 * Tracks per-item fulfillment status and supports partial fulfillment.
 */
export async function processOrderWithMobimatter(
  orderId: string,
  processedBy?: string,
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
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              select: {
                mobimatterId: true,
                name: true,
                wholesalePrice: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    const allowedStatuses: OrderStatus[] = [
      "PENDING",
      "PROCESSING",
      "PARTIALLY_FULFILLED",
      "FAILED",
    ];
    if (!allowedStatuses.includes(order.status)) {
      return {
        success: false,
        error: `Cannot process order with status: ${order.status}`,
      };
    }

    // Only process items that haven't been fulfilled yet
    const pendingItems = order.items.filter(
      (item) => item.fulfillmentStatus !== "COMPLETED",
    );

    if (pendingItems.length === 0) {
      return {
        success: true,
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
        },
      };
    }

    // Wallet balance check before fulfillment
    try {
      const wallet = await getWalletBalance();
      const estimatedCost = pendingItems.reduce(
        (sum, item) => sum + (item.product.wholesalePrice || 0) * item.quantity,
        0,
      );

      if (wallet.balance < estimatedCost) {
        log.error("Insufficient MobiMatter wallet balance", {
          metadata: {
            balance: wallet.balance,
            estimatedCost,
            orderId,
            orderNumber: order.orderNumber,
          },
        });
        return {
          success: false,
          error: "Insufficient wallet balance for fulfillment",
        };
      }

      if (wallet.balance < 50 || wallet.balance < estimatedCost * 2) {
        log.warn("MobiMatter wallet balance is low", {
          metadata: { balance: wallet.balance, currency: wallet.currency },
        });
      }
    } catch (walletError) {
      log.errorWithException(
        "Failed to check wallet balance, proceeding with fulfillment",
        walletError,
      );
    }

    await db.order.update({
      where: { id: orderId },
      data: { status: "PROCESSING" },
    });

    const mobimatterResults: Array<{
      itemId: string;
      orderId?: string;
      qrCode?: string;
      lpa?: string;
      activationCode?: string;
      smdpAddress?: string;
      iccid?: string;
      kycUrl?: string;
      error?: string;
    }> = [];

    for (const item of pendingItems) {
      try {
        const pendingOrder = await mobimatterCreateOrder({
          productId: item.product.mobimatterId,
          productCategory: order.isTopUp ? "esim_addon" : "esim_realtime",
          label: order.orderNumber,
        });

        const fulfilledOrder = await mobimatterCompleteOrder(
          pendingOrder.orderId,
        );
        const lineItem = fulfilledOrder.lineItem;

        if (!lineItem) {
          throw new Error(
            `Order ${pendingOrder.orderId} completed but no line item returned`,
          );
        }

        await db.orderItem.update({
          where: { id: item.id },
          data: {
            esimQrCode: encryptEsimField(lineItem.qrCode),
            esimIccid: lineItem.iccid,
            fulfillmentStatus: "COMPLETED",
            mobimatterOrderId: fulfilledOrder.orderId,
            fulfillmentError: null,
          },
        });

        mobimatterResults.push({
          itemId: item.id,
          orderId: fulfilledOrder.orderId,
          qrCode: lineItem.qrCode,
          lpa: lineItem.lpa,
          activationCode: lineItem.activationCode,
          smdpAddress: lineItem.smdpAddress,
          iccid: lineItem.iccid,
          kycUrl: lineItem.kycUrl,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        await db.orderItem.update({
          where: { id: item.id },
          data: {
            fulfillmentStatus: "FAILED",
            fulfillmentError: errorMessage,
          },
        });

        mobimatterResults.push({
          itemId: item.id,
          error: errorMessage,
        });
      }
    }

    const successItems = mobimatterResults.filter((r) => !r.error);
    const failedItems = mobimatterResults.filter((r) => r.error);

    const totalCompleted =
      order.items.filter((item) => item.fulfillmentStatus === "COMPLETED")
        .length + successItems.length;
    const totalItems = order.items.length;

    let finalStatus: OrderStatus;
    if (failedItems.length === 0) {
      const primarySuccess = successItems[0];
      const isKycPending = primarySuccess?.kycUrl;
      finalStatus = isKycPending ? "PROCESSING" : "COMPLETED";
    } else if (totalCompleted > 0) {
      finalStatus = "PARTIALLY_FULFILLED";
    } else {
      finalStatus = "FAILED";
    }

    const primaryResult =
      successItems[0] || mobimatterResults.find((r) => r.orderId);
    const qrCodeValue = primaryResult?.lpa || primaryResult?.qrCode;

    const updatedOrder = await db.order.update({
      where: { id: orderId },
      data: {
        status: finalStatus,
        mobimatterOrderId: primaryResult?.orderId || order.mobimatterOrderId,
        mobimatterStatus:
          finalStatus === "COMPLETED" ? "COMPLETED" : finalStatus,
        esimQrCode: qrCodeValue
          ? encryptEsimField(qrCodeValue)
          : order.esimQrCode,
        esimActivationCode: primaryResult?.activationCode
          ? encryptEsimField(primaryResult.activationCode)
          : order.esimActivationCode,
        esimSmdpAddress: primaryResult?.smdpAddress
          ? encryptEsimField(primaryResult.smdpAddress)
          : order.esimSmdpAddress,
        completedAt: finalStatus === "COMPLETED" ? new Date() : undefined,
      },
    });

    await logAudit({
      userId: processedBy,
      action: "order_complete",
      entity: "order",
      entityId: orderId,
      newValues: {
        orderNumber: order.orderNumber,
        mobimatterOrderId: primaryResult?.orderId,
        itemsProcessed: pendingItems.length,
        itemsSucceeded: successItems.length,
        itemsFailed: failedItems.length,
        finalStatus,
      },
    });

    if (failedItems.length > 0) {
      log.error("Partial fulfillment failure", {
        metadata: {
          orderId,
          orderNumber: order.orderNumber,
          succeeded: successItems.length,
          failed: failedItems.length,
          total: totalItems,
          errors: failedItems.map((f) => f.error),
        },
      });
    }

    // Email is sent by the Stripe webhook after fulfillment, with the QR code included.

    return {
      success: failedItems.length === 0,
      order: {
        id: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        status: updatedOrder.status,
        mobimatterOrderId: updatedOrder.mobimatterOrderId || undefined,
        esimQrCode: updatedOrder.esimQrCode || undefined,
      },
      error:
        failedItems.length > 0
          ? `${failedItems.length}/${totalItems} items failed fulfillment`
          : undefined,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    log.errorWithException("Error processing order with MobiMatter", error, {
      metadata: { orderId },
    });

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
  pagination: PaginationParams = {},
) {
  const { limit = 20, offset = 0 } = pagination;

  const [orders, total] = await Promise.all([
    db.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
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
  pagination: PaginationParams = {},
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
      orderBy: { createdAt: "desc" },
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
export async function completeOrder(orderId: string, completedBy?: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.status !== "PROCESSING" && order.status !== "PENDING") {
    throw new Error(`Cannot complete order with status: ${order.status}`);
  }

  // Update order in transaction
  const updatedOrder = await db.order.update({
    where: { id: orderId },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
    },
  });

  // Log audit event
  await logAudit({
    userId: completedBy,
    action: "order_complete",
    entity: "order",
    entityId: orderId,
    newValues: {
      orderNumber: order.orderNumber,
      status: "COMPLETED",
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
  cancelledBy?: string,
) {
  const order = await db.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.status === "COMPLETED") {
    throw new Error("Cannot cancel a completed order");
  }

  if (order.status === "CANCELLED") {
    throw new Error("Order is already cancelled");
  }

  // Update order status
  const updatedOrder = await db.order.update({
    where: { id: orderId },
    data: {
      status: "CANCELLED",
    },
  });

  // Log audit event
  await logAudit({
    userId: cancelledBy,
    action: "order_cancel",
    entity: "order",
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
export async function userOwnsOrder(
  userId: string,
  orderId: string,
): Promise<boolean> {
  const order = await db.order.findFirst({
    where: {
      id: orderId,
      OR: [
        { userId },
        {
          email: (
            await db.user.findUnique({
              where: { id: userId },
              select: { email: true },
            })
          )?.email,
        },
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

  const [totalOrders, pendingOrders, completedOrders, totalRevenue] =
    await Promise.all([
      db.order.count({ where }),
      db.order.count({ where: { ...where, status: "PENDING" } }),
      db.order.count({ where: { ...where, status: "COMPLETED" } }),
      db.order.aggregate({
        where: { ...where, status: "COMPLETED" },
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
