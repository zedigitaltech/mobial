/**
 * Affiliate Tracking Helper
 * Functions for tracking affiliate referrals and managing commissions
 */

import { NextRequest } from 'next/server';
import { db } from './db';
import { getClientIP, getUserAgent } from './auth-helpers';

export interface AffiliateValidationResult {
  valid: boolean;
  affiliateId?: string;
  affiliateCode?: string;
  commissionRate?: number;
  error?: string;
}

export interface ClickTrackingData {
  affiliateCode: string;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  deviceId?: string;
}

/**
 * Validate an affiliate code
 * Returns affiliate info if valid, null otherwise
 */
export async function validateAffiliateCode(code: string): Promise<AffiliateValidationResult> {
  if (!code || typeof code !== 'string') {
    return { valid: false, error: 'Invalid affiliate code format' };
  }

  const normalizedCode = code.toUpperCase().trim();

  const affiliateProfile = await db.affiliateProfile.findUnique({
    where: { affiliateCode: normalizedCode },
    select: {
      id: true,
      affiliateCode: true,
      commissionRate: true,
      status: true,
      userId: true,
    },
  });

  if (!affiliateProfile) {
    return { valid: false, error: 'Affiliate code not found' };
  }

  if (affiliateProfile.status !== 'ACTIVE') {
    return { valid: false, error: 'Affiliate account is not active' };
  }

  return {
    valid: true,
    affiliateId: affiliateProfile.userId,
    affiliateCode: affiliateProfile.affiliateCode,
    commissionRate: affiliateProfile.commissionRate,
  };
}

/**
 * Get affiliate profile by code
 */
export async function getAffiliateByCode(code: string) {
  const normalizedCode = code.toUpperCase().trim();

  return db.affiliateProfile.findUnique({
    where: { affiliateCode: normalizedCode },
    include: {
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
 * Track an affiliate click
 * Creates a click record for conversion tracking
 */
export async function trackClick(
  data: ClickTrackingData,
  request?: NextRequest
): Promise<{ clickId: string } | null> {
  try {
    // Validate the affiliate code first
    const validation = await validateAffiliateCode(data.affiliateCode);
    
    if (!validation.valid || !validation.affiliateId) {
      return null;
    }

    // Get IP and user agent from request if provided
    const ipAddress = data.ipAddress || (request ? getClientIP(request) : null);
    const userAgent = data.userAgent || (request ? getUserAgent(request) : null);

    // Check if there's a recent click from the same IP/device for this affiliate
    // to prevent click spam (within the last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const recentClick = await db.affiliateClick.findFirst({
      where: {
        affiliateId: validation.affiliateId,
        ipAddress,
        createdAt: { gte: oneHourAgo },
        converted: false,
      },
    });

    if (recentClick) {
      // Return existing click ID instead of creating a new one
      return { clickId: recentClick.id };
    }

    // Create new click record
    const click = await db.affiliateClick.create({
      data: {
        affiliateId: validation.affiliateId,
        ipAddress,
        userAgent,
        referrer: data.referrer,
        deviceId: data.deviceId,
        converted: false,
      },
    });

    // Update affiliate profile stats (increment click count)
    await db.affiliateProfile.update({
      where: { userId: validation.affiliateId },
      data: {
        totalClicks: { increment: 1 },
      },
    });

    return { clickId: click.id };
  } catch (error) {
    console.error('Error tracking affiliate click:', error);
    return null;
  }
}

/**
 * Create a commission record for an affiliate
 */
export async function createCommission(
  orderId: string,
  affiliateId: string,
  orderTotal: number,
  commissionRate: number
) {
  const commissionAmount = orderTotal * commissionRate;

  const commission = await db.commission.create({
    data: {
      affiliateId,
      orderId,
      type: 'SALE',
      status: 'PENDING',
      amount: commissionAmount,
      baseAmount: orderTotal,
      currency: 'USD',
    },
  });

  return commission;
}

/**
 * Mark a click as converted and link it to an order
 */
export async function convertClick(
  clickId: string,
  orderId: string,
  conversionValue: number
) {
  try {
    const click = await db.affiliateClick.update({
      where: { id: clickId },
      data: {
        converted: true,
        orderId,
        conversionValue,
        convertedAt: new Date(),
      },
    });

    // Update affiliate profile conversion stats
    await db.affiliateProfile.update({
      where: { userId: click.affiliateId },
      data: {
        totalConversions: { increment: 1 },
        totalEarnings: { increment: conversionValue },
      },
    });

    return click;
  } catch (error) {
    console.error('Error converting click:', error);
    return null;
  }
}

/**
 * Get affiliate click by ID
 */
export async function getAffiliateClick(clickId: string) {
  return db.affiliateClick.findUnique({
    where: { id: clickId },
    include: {
      affiliate: {
        select: {
          id: true,
          email: true,
          name: true,
          affiliateProfile: {
            select: {
              commissionRate: true,
              status: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Get pending clicks for an affiliate
 */
export async function getPendingClicks(affiliateId: string, limit: number = 100) {
  return db.affiliateClick.findMany({
    where: {
      affiliateId,
      converted: false,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * Calculate affiliate earnings summary
 */
export async function getAffiliateEarnings(affiliateId: string) {
  const commissions = await db.commission.aggregate({
    where: { affiliateId },
    _sum: {
      amount: true,
      baseAmount: true,
    },
    _count: {
      id: true,
    },
  });

  const paidCommissions = await db.commission.aggregate({
    where: {
      affiliateId,
      status: 'PAID',
    },
    _sum: {
      amount: true,
    },
  });

  const pendingCommissions = await db.commission.aggregate({
    where: {
      affiliateId,
      status: 'PENDING',
    },
    _sum: {
      amount: true,
    },
  });

  return {
    totalEarnings: commissions._sum.amount || 0,
    totalBaseAmount: commissions._sum.baseAmount || 0,
    totalOrders: commissions._count.id || 0,
    paidAmount: paidCommissions._sum.amount || 0,
    pendingAmount: pendingCommissions._sum.amount || 0,
  };
}

/**
 * Update commission status
 */
export async function updateCommissionStatus(
  commissionId: string,
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'CANCELLED' | 'REFUNDED'
) {
  return db.commission.update({
    where: { id: commissionId },
    data: { status },
  });
}

/**
 * Cancel commission for an order (e.g., when order is cancelled)
 */
export async function cancelCommissionForOrder(orderId: string) {
  try {
    const commission = await db.commission.findUnique({
      where: { orderId },
    });

    if (!commission) {
      return null;
    }

    // Update commission status
    const updatedCommission = await db.commission.update({
      where: { id: commission.id },
      data: { status: 'CANCELLED' },
    });

    // Update affiliate earnings (reduce by the commission amount)
    await db.affiliateProfile.update({
      where: { userId: commission.affiliateId },
      data: {
        totalEarnings: { decrement: commission.amount },
        totalConversions: { decrement: 1 },
      },
    });

    return updatedCommission;
  } catch (error) {
    console.error('Error cancelling commission:', error);
    return null;
  }
}
