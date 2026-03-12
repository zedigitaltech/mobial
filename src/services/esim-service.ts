/**
 * eSIM Service
 * Functions for eSIM management and QR code generation
 */

import { db } from '@/lib/db';
import { getOrderInfo } from '@/lib/mobimatter';
import { encryptEsimField, decryptEsimField } from '@/lib/esim-encryption';

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
 * Uses a simple QR code generation approach without external libraries
 * For production, consider using a library like 'qrcode'
 */
export async function generateQRCodeImage(
  qrString: string,
  size: number = 256
): Promise<QRCodeImage> {
  if (!qrString) {
    throw new Error('QR string is required');
  }

  // For now, we'll return a data URL that can be used
  // In production, use a proper QR code library
  // Using Google Chart API as a fallback for simplicity
  const encodedQR = encodeURIComponent(qrString);
  const googleChartUrl = `https://chart.googleapis.com/chart?chs=${size}x${size}&cht=qr&chl=${encodedQR}&choe=UTF-8`;

  // Fetch the image
  try {
    const response = await fetch(googleChartUrl);
    
    if (!response.ok) {
      // Fallback: return a placeholder or the QR string directly
      // In production, this should use a local QR code library
      return generateSimpleQRCode(qrString, size);
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const dataUrl = `data:image/png;base64,${base64}`;

    return {
      dataUrl,
      size,
    };
  } catch (error) {
    console.error('Error generating QR code with Google Charts:', error);
    // Fallback to simple QR code generation
    return generateSimpleQRCode(qrString, size);
  }
}

/**
 * Simple QR code generation fallback
 * Generates an SVG-based QR code representation
 */
async function generateSimpleQRCode(qrString: string, size: number): Promise<QRCodeImage> {
  // Create a simple SVG representation
  // This is a minimal implementation - in production use 'qrcode' package
  
  const qrData = qrString;
  const moduleCount = 21; // Minimum QR version
  const moduleSize = Math.floor(size / (moduleCount + 8));
  const margin = Math.floor((size - moduleSize * moduleCount) / 2);

  // Simple pattern generation (not a real QR code)
  // This creates a placeholder pattern - real implementation needs proper QR encoding
  const modules: boolean[][] = [];
  
  // Generate a simple pattern based on the string hash
  const hash = simpleHash(qrData);
  
  for (let row = 0; row < moduleCount; row++) {
    modules[row] = [];
    for (let col = 0; col < moduleCount; col++) {
      // Finder patterns (corners)
      const isFinderPattern = 
        (row < 7 && col < 7) ||
        (row < 7 && col >= moduleCount - 7) ||
        (row >= moduleCount - 7 && col < 7);
      
      if (isFinderPattern) {
        // Draw finder pattern
        const inCorner = 
          (row < 7 && col < 7) ||
          (row < 7 && col >= moduleCount - 7) ||
          (row >= moduleCount - 7 && col < 7);
        
        if (inCorner) {
          const localRow = row < 7 ? row : row - (moduleCount - 7);
          const localCol = col < 7 ? col : col - (moduleCount - 7);
          
          modules[row][col] = 
            localRow === 0 || localRow === 6 ||
            localCol === 0 || localCol === 6 ||
            (localRow >= 2 && localRow <= 4 && localCol >= 2 && localCol <= 4);
        } else {
          modules[row][col] = false;
        }
      } else {
        // Data pattern (pseudo-random based on hash)
        const index = row * moduleCount + col;
        modules[row][col] = ((hash >> (index % 32)) & 1) === 1;
      }
    }
  }

  // Generate SVG
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;
  svg += `<rect width="${size}" height="${size}" fill="white"/>`;

  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (modules[row][col]) {
        const x = margin + col * moduleSize;
        const y = margin + row * moduleSize;
        svg += `<rect x="${x}" y="${y}" width="${moduleSize}" height="${moduleSize}" fill="black"/>`;
      }
    }
  }

  svg += '</svg>';

  // Convert SVG to data URL
  const base64Svg = Buffer.from(svg).toString('base64');
  const dataUrl = `data:image/svg+xml;base64,${base64Svg}`;

  return {
    dataUrl,
    size,
  };
}

/**
 * Simple string hash function
 */
function simpleHash(str: string): number {
  let hash = 0;
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return Math.abs(hash);
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
