/**
 * eSIM Service
 * Functions for eSIM management and QR code generation
 */

import { db } from '@/lib/db';
import { getOrderInfo } from '@/lib/mobimatter';
import { encryptEsimField, decryptEsimField } from '@/lib/esim-encryption';
import QRCode from 'qrcode';

// Types
export interface ESIMDetails {
  iccid: string;
  qrCode: string;
  activationCode?: string;
  smdpAddress?: string;
  status: 'active' | 'inactive' | 'expired';
  product?: {
    name: string;
    provider: string;
    dataAmount?: number | null;
    dataUnit?: string | null;
    validityDays?: number | null;
  };
}

export interface QRCodeImage {
  dataUrl: string;
  size: number;
}

/**
 * Get eSIM details for an order
 */
export async function getESIMDetails(orderId: string): Promise<ESIMDetails | null> {
  // Get order with items
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: {
            select: {
              name: true,
              provider: true,
              dataAmount: true,
              dataUnit: true,
              validityDays: true,
            },
          },
        },
      },
    },
  });

  if (!order) {
    return null;
  }

  // Get the first item's eSIM details
  const firstItem = order.items[0];
  
  if (!firstItem) {
    return null;
  }

  // Determine status based on order status
  let status: 'active' | 'inactive' | 'expired' = 'inactive';
  
  if (order.status === 'COMPLETED') {
    status = 'active';
  } else if (order.status === 'CANCELLED' || order.status === 'REFUNDED') {
    status = 'expired';
  }

  return {
    iccid: firstItem.esimIccid || decryptEsimField(order.esimActivationCode) || '',
    qrCode: decryptEsimField(firstItem.esimQrCode) || decryptEsimField(order.esimQrCode) || '',
    activationCode: decryptEsimField(order.esimActivationCode) || undefined,
    smdpAddress: decryptEsimField(order.esimSmdpAddress) || undefined,
    status,
    product: {
      name: firstItem.product.name,
      provider: firstItem.product.provider,
      dataAmount: firstItem.product.dataAmount,
      dataUnit: firstItem.product.dataUnit,
      validityDays: firstItem.product.validityDays,
    },
  };
}

/**
 * Get eSIM details for an order item
 */
export async function getESIMDetailsForItem(orderItemId: string): Promise<ESIMDetails | null> {
  const orderItem = await db.orderItem.findUnique({
    where: { id: orderItemId },
    include: {
      order: {
        select: {
          id: true,
          status: true,
          esimActivationCode: true,
          esimSmdpAddress: true,
        },
      },
      product: {
        select: {
          name: true,
          provider: true,
          dataAmount: true,
          dataUnit: true,
          validityDays: true,
        },
      },
    },
  });

  if (!orderItem) {
    return null;
  }

  // Determine status
  let status: 'active' | 'inactive' | 'expired' = 'inactive';
  
  if (orderItem.order.status === 'COMPLETED') {
    status = 'active';
  } else if (orderItem.order.status === 'CANCELLED' || orderItem.order.status === 'REFUNDED') {
    status = 'expired';
  }

  return {
    iccid: orderItem.esimIccid || decryptEsimField(orderItem.order.esimActivationCode) || '',
    qrCode: decryptEsimField(orderItem.esimQrCode) || '',
    activationCode: decryptEsimField(orderItem.order.esimActivationCode) || undefined,
    smdpAddress: decryptEsimField(orderItem.order.esimSmdpAddress) || undefined,
    status,
    product: {
      name: orderItem.product.name,
      provider: orderItem.product.provider,
      dataAmount: orderItem.product.dataAmount,
      dataUnit: orderItem.product.dataUnit,
      validityDays: orderItem.product.validityDays,
    },
  };
}

/**
 * Generate QR code image data URL from QR string
 */
export async function generateQRCodeImage(
  qrString: string,
  size: number = 256
): Promise<QRCodeImage> {
  if (!qrString) {
    throw new Error('QR string is required');
  }

  const dataUrl = await QRCode.toDataURL(qrString, {
    width: size,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: { dark: '#000000', light: '#FFFFFF' },
  });

  return { dataUrl, size };
}

/**
 * Parse eSIM activation string
 * Format: LPA:1$<smdpAddress>$<activationCode>
 */
export function parseActivationString(activationString: string): {
  smdpAddress: string;
  activationCode: string;
} | null {
  if (!activationString) {
    return null;
  }

  // Try to parse standard LPA format
  const lpaMatch = activationString.match(/^LPA:1\$([^$]+)\$([^$]+)$/i);
  
  if (lpaMatch) {
    return {
      smdpAddress: lpaMatch[1],
      activationCode: lpaMatch[2],
    };
  }

  // Try alternative formats
  const parts = activationString.split('$');
  
  if (parts.length >= 2) {
    return {
      smdpAddress: parts[0].replace(/^LPA:1\$/i, ''),
      activationCode: parts[1],
    };
  }

  return null;
}

/**
 * Get all eSIMs for a user
 */
export async function getUserESIMs(userId: string): Promise<Array<{
  orderId: string;
  orderNumber: string;
  iccid: string;
  status: string;
  productName: string;
  provider: string;
  purchasedAt: Date;
}>> {
  const orders = await db.order.findMany({
    where: {
      OR: [
        { userId },
        // Also get orders by user's email
        {
          email: (
            await db.user.findUnique({
              where: { id: userId },
              select: { email: true },
            })
          )?.email,
        },
      ],
      status: 'COMPLETED',
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              name: true,
              provider: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return orders.flatMap((order) =>
    order.items.map((item) => ({
      orderId: order.id,
      orderNumber: order.orderNumber,
      iccid: item.esimIccid || decryptEsimField(order.esimActivationCode) || '',
      status: order.status,
      productName: item.productName,
      provider: item.product.provider,
      purchasedAt: order.createdAt,
    }))
  );
}

/**
 * Sync eSIM status from MobiMatter
 */
export async function syncESIMStatus(orderId: string): Promise<{
  success: boolean;
  status?: string;
  error?: string;
}> {
  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      select: { mobimatterOrderId: true },
    });

    if (!order || !order.mobimatterOrderId) {
      return { success: false, error: 'Order not found or no MobiMatter order ID' };
    }

    const orderInfo = await getOrderInfo(order.mobimatterOrderId);

    // Update order with latest status
    await db.order.update({
      where: { id: orderId },
      data: {
        mobimatterStatus: orderInfo.orderState,
        ...(orderInfo.lineItem?.qrCode && { esimQrCode: encryptEsimField(orderInfo.lineItem.qrCode) }),
        ...(orderInfo.lineItem?.activationCode && { esimActivationCode: encryptEsimField(orderInfo.lineItem.activationCode) }),
        ...(orderInfo.lineItem?.smdpAddress && { esimSmdpAddress: encryptEsimField(orderInfo.lineItem.smdpAddress) }),
      },
    });

    // Update order item ICCID if available
    if (orderInfo.lineItem?.iccid) {
      await db.orderItem.updateMany({
        where: { orderId },
        data: { esimIccid: orderInfo.lineItem.iccid },
      });
    }

    return {
      success: true,
      status: orderInfo.orderState,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: errorMessage,
    };
  }
}
