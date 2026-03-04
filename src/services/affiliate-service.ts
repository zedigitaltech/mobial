/**
 * Affiliate Service - Core business logic for affiliate system
 */

import { db } from '@/lib/db';
import { AffiliateProfile, AffiliateLink, AffiliateClick, Commission, Payout, AffiliateStatus, CommissionStatus, CommissionType, PayoutStatus } from '@prisma/client';
import crypto from 'crypto';

// Constants
const AFFILIATE_CODE_LENGTH = 8;
const LINK_CODE_LENGTH = 6;
const MIN_PAYOUT_AMOUNT = 50;

// Types
export interface RegisterAffiliateData {
  companyName?: string;
  website?: string;
  paymentMethod: string;
  paymentDetails: string;
  taxId?: string;
}

export interface AffiliateStats {
  totalClicks: number;
  totalConversions: number;
  totalEarnings: number;
  totalPaidOut: number;
  pendingEarnings: number;
  conversionRate: number;
}

export interface ClickTrackingData {
  ipAddress: string;
  userAgent: string;
  referrer?: string;
  country?: string;
  city?: string;
  deviceId?: string;
}

export interface DashboardData {
  stats: AffiliateStats;
  recentClicks: Array<{
    id: string;
    createdAt: Date;
    country?: string | null;
    converted: boolean;
    conversionValue?: number | null;
  }>;
  recentCommissions: Array<{
    id: string;
    amount: number;
    status: CommissionStatus;
    createdAt: Date;
    type: CommissionType;
  }>;
  topLinks: Array<{
    id: string;
    name: string | null;
    code: string;
    clicks: number;
    conversions: number;
    conversionRate: number;
  }>;
  earningsChart: Array<{
    date: string;
    earnings: number;
    clicks: number;
    conversions: number;
  }>;
}

export interface CommissionStats {
  totalPending: number;
  totalApproved: number;
  totalPaid: number;
  thisMonth: number;
  lastMonth: number;
}

/**
 * Generate a unique affiliate code
 */
export async function generateAffiliateCode(): Promise<string> {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars like I, O, 0, 1
  let code = '';
  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    code = '';
    for (let i = 0; i < AFFILIATE_CODE_LENGTH; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Check if code already exists
    const existing = await db.affiliateProfile.findUnique({
      where: { affiliateCode: code },
    });

    if (!existing) {
      return code;
    }
    attempts++;
  }

  throw new Error('Failed to generate unique affiliate code');
}

/**
 * Generate a unique link short code
 */
export async function generateLinkCode(): Promise<string> {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    code = '';
    for (let i = 0; i < LINK_CODE_LENGTH; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Check if code already exists
    const existing = await db.affiliateLink.findUnique({
      where: { code },
    });

    if (!existing) {
      return code;
    }
    attempts++;
  }

  throw new Error('Failed to generate unique link code');
}

/**
 * Hash IP address for privacy
 */
export function hashIpAddress(ip: string): string {
  const secret = process.env.ENCRYPTION_KEY || 'default-secret-key';
  return crypto.createHash('sha256').update(ip + secret).digest('hex').substring(0, 32);
}

/**
 * Hash device fingerprint
 */
export function hashDeviceId(deviceId: string): string {
  const secret = process.env.ENCRYPTION_KEY || 'default-secret-key';
  return crypto.createHash('sha256').update(deviceId + secret).digest('hex').substring(0, 32);
}

/**
 * Register a new affiliate
 */
export async function registerAffiliate(
  userId: string,
  data: RegisterAffiliateData
): Promise<AffiliateProfile> {
  // Check if user already has an affiliate profile
  const existingProfile = await db.affiliateProfile.findUnique({
    where: { userId },
  });

  if (existingProfile) {
    throw new Error('User already has an affiliate profile');
  }

  // Get user
  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Generate unique affiliate code
  const affiliateCode = await generateAffiliateCode();

  // Create affiliate profile
  const profile = await db.affiliateProfile.create({
    data: {
      userId,
      affiliateCode,
      companyName: data.companyName,
      website: data.website,
      paymentMethod: data.paymentMethod,
      paymentDetails: data.paymentDetails,
      taxId: data.taxId,
      status: 'PENDING',
      commissionRate: 0.10, // Default 10%
    },
  });

  // Update user role to AFFILIATE
  await db.user.update({
    where: { id: userId },
    data: { role: 'AFFILIATE' },
  });

  return profile;
}

/**
 * Get affiliate profile by user ID
 */
export async function getAffiliateProfile(userId: string): Promise<AffiliateProfile | null> {
  return db.affiliateProfile.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  }) as Promise<AffiliateProfile | null>;
}

/**
 * Get affiliate stats
 */
export async function getAffiliateStats(affiliateId: string): Promise<AffiliateStats> {
  const profile = await db.affiliateProfile.findFirst({
    where: { userId: affiliateId },
  });

  if (!profile) {
    throw new Error('Affiliate profile not found');
  }

  // Get pending commissions total
  const pendingCommissions = await db.commission.aggregate({
    where: {
      affiliateId,
      status: 'PENDING',
    },
    _sum: { amount: true },
  });

  const totalPending = pendingCommissions._sum.amount || 0;

  return {
    totalClicks: profile.totalClicks,
    totalConversions: profile.totalConversions,
    totalEarnings: profile.totalEarnings,
    totalPaidOut: profile.totalPaidOut,
    pendingEarnings: totalPending,
    conversionRate: profile.totalClicks > 0
      ? (profile.totalConversions / profile.totalClicks) * 100
      : 0,
  };
}

/**
 * Track an affiliate click
 */
export async function trackClick(
  affiliateCode: string,
  trackingData: ClickTrackingData,
  linkCode?: string
): Promise<{ clickId: string; targetUrl: string }> {
  // Find affiliate profile by code
  const profile = await db.affiliateProfile.findUnique({
    where: { affiliateCode: affiliateCode.toUpperCase() },
  });

  if (!profile || profile.status !== 'ACTIVE') {
    throw new Error('Invalid or inactive affiliate code');
  }

  // Find link if linkCode provided
  let link: AffiliateLink | null = null;
  let targetUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://mobial.com';

  if (linkCode) {
    link = await db.affiliateLink.findFirst({
      where: {
        code: linkCode.toUpperCase(),
        affiliateId: profile.userId,
      },
    });

    if (link) {
      targetUrl = link.targetUrl;
    }
  }

  // Hash IP for privacy
  const hashedIp = trackingData.ipAddress ? hashIpAddress(trackingData.ipAddress) : null;
  const hashedDeviceId = trackingData.deviceId ? hashDeviceId(trackingData.deviceId) : null;

  // Create click record
  const click = await db.affiliateClick.create({
    data: {
      linkId: link?.id || null,
      affiliateId: profile.userId,
      ipAddress: hashedIp,
      userAgent: trackingData.userAgent,
      referrer: trackingData.referrer,
      country: trackingData.country,
      city: trackingData.city,
      deviceId: hashedDeviceId,
      converted: false,
    },
  });

  // Update click count on profile
  await db.affiliateProfile.update({
    where: { id: profile.id },
    data: { totalClicks: { increment: 1 } },
  });

  // Update click count on link if exists
  if (link) {
    await db.affiliateLink.update({
      where: { id: link.id },
      data: { clicks: { increment: 1 } },
    });
  }

  return {
    clickId: click.id,
    targetUrl,
  };
}

/**
 * Attribute a conversion to a click
 */
export async function attributeConversion(
  clickId: string,
  orderId: string,
  orderAmount: number
): Promise<Commission | null> {
  // Find the click
  const click = await db.affiliateClick.findUnique({
    where: { id: clickId },
    include: {
      affiliate: {
        include: { affiliateProfile: true },
      },
    },
  });

  if (!click || click.converted) {
    return null;
  }

  const affiliateProfile = click.affiliate.affiliateProfile;
  if (!affiliateProfile || affiliateProfile.status !== 'ACTIVE') {
    return null;
  }

  // Calculate commission
  const commissionAmount = calculateCommission(orderAmount, affiliateProfile.commissionRate);

  // Create commission
  const commission = await db.commission.create({
    data: {
      affiliateId: click.affiliateId,
      orderId,
      type: 'SALE',
      status: 'PENDING',
      amount: commissionAmount,
      baseAmount: orderAmount,
      currency: 'USD',
    },
  });

  // Mark click as converted
  await db.affiliateClick.update({
    where: { id: clickId },
    data: {
      converted: true,
      orderId,
      conversionValue: orderAmount,
      convertedAt: new Date(),
    },
  });

  // Update affiliate stats
  await db.affiliateProfile.update({
    where: { id: affiliateProfile.id },
    data: {
      totalConversions: { increment: 1 },
      totalEarnings: { increment: commissionAmount },
    },
  });

  // Update link conversion count if applicable
  if (click.linkId) {
    await db.affiliateLink.update({
      where: { id: click.linkId },
      data: { conversions: { increment: 1 } },
    });
  }

  return commission;
}

/**
 * Calculate commission amount
 */
export function calculateCommission(orderAmount: number, commissionRate: number): number {
  return Math.round(orderAmount * commissionRate * 100) / 100; // Round to 2 decimal places
}

/**
 * Get comprehensive affiliate stats
 */
export async function getAffiliateDashboard(affiliateId: string): Promise<DashboardData> {
  const profile = await db.affiliateProfile.findFirst({
    where: { userId: affiliateId },
  });

  if (!profile) {
    throw new Error('Affiliate profile not found');
  }

  // Get basic stats
  const stats = await getAffiliateStats(affiliateId);

  // Get recent clicks
  const recentClicks = await db.affiliateClick.findMany({
    where: { affiliateId },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      createdAt: true,
      country: true,
      converted: true,
      conversionValue: true,
    },
  });

  // Get recent commissions
  const recentCommissions = await db.commission.findMany({
    where: { affiliateId },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      amount: true,
      status: true,
      createdAt: true,
      type: true,
    },
  });

  // Get top performing links
  const links = await db.affiliateLink.findMany({
    where: { affiliateId },
    orderBy: { conversions: 'desc' },
    take: 5,
    select: {
      id: true,
      name: true,
      code: true,
      clicks: true,
      conversions: true,
    },
  });

  const topLinks = links.map(link => ({
    ...link,
    conversionRate: link.clicks > 0 ? (link.conversions / link.clicks) * 100 : 0,
  }));

  // Get earnings chart data (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const dailyStats = await db.$queryRaw<Array<{ date: string; earnings: number; clicks: number; conversions: number }>>`
    SELECT
      DATE(createdAt) as date,
      SUM(CASE WHEN "converted" = 1 THEN "conversionValue" ELSE 0 END) as earnings,
      COUNT(*) as clicks,
      SUM(CASE WHEN "converted" = 1 THEN 1 ELSE 0 END) as conversions
    FROM "AffiliateClick"
    WHERE "affiliateId" = ${affiliateId}
      AND "createdAt" >= ${thirtyDaysAgo}
    GROUP BY DATE(createdAt)
    ORDER BY date DESC
  `;

  // Fill in missing days with zeros
  const earningsChart: Array<{ date: string; earnings: number; clicks: number; conversions: number }> = [];
  const statsMap = new Map(dailyStats.map(s => [s.date, s]));

  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayStats = statsMap.get(dateStr);

    earningsChart.push({
      date: dateStr,
      earnings: dayStats?.earnings || 0,
      clicks: dayStats?.clicks || 0,
      conversions: dayStats?.conversions || 0,
    });
  }

  return {
    stats,
    recentClicks,
    recentCommissions,
    topLinks,
    earningsChart,
  };
}

/**
 * Request a payout
 */
export async function requestPayout(
  affiliateId: string,
  amount: number
): Promise<Payout> {
  const profile = await db.affiliateProfile.findFirst({
    where: { userId: affiliateId },
  });

  if (!profile) {
    throw new Error('Affiliate profile not found');
  }

  if (profile.status !== 'ACTIVE') {
    throw new Error('Affiliate account is not active');
  }

  if (amount < MIN_PAYOUT_AMOUNT) {
    throw new Error(`Minimum payout amount is $${MIN_PAYOUT_AMOUNT}`);
  }

  // Calculate available balance
  const approvedCommissions = await db.commission.aggregate({
    where: {
      affiliateId,
      status: 'APPROVED',
    },
    _sum: { amount: true },
  });

  const totalApproved = approvedCommissions._sum.amount || 0;
  const availableBalance = totalApproved - profile.totalPaidOut;

  if (amount > availableBalance) {
    throw new Error('Insufficient balance for payout');
  }

  if (!profile.paymentMethod) {
    throw new Error('Payment method not configured');
  }

  // Create payout
  const payout = await db.payout.create({
    data: {
      affiliateId: profile.id,
      amount,
      currency: 'USD',
      status: 'PENDING',
      paymentMethod: profile.paymentMethod,
    },
  });

  return payout;
}

/**
 * Get commission statistics
 */
export async function getCommissionStats(affiliateId: string): Promise<CommissionStats> {
  // Get totals by status
  const [pending, approved, paid] = await Promise.all([
    db.commission.aggregate({
      where: { affiliateId, status: 'PENDING' },
      _sum: { amount: true },
    }),
    db.commission.aggregate({
      where: { affiliateId, status: 'APPROVED' },
      _sum: { amount: true },
    }),
    db.commission.aggregate({
      where: { affiliateId, status: 'PAID' },
      _sum: { amount: true },
    }),
  ]);

  // Get this month's earnings
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const thisMonthResult = await db.commission.aggregate({
    where: {
      affiliateId,
      createdAt: { gte: startOfMonth },
      status: { notIn: ['CANCELLED', 'REFUNDED'] },
    },
    _sum: { amount: true },
  });

  // Get last month's earnings
  const startOfLastMonth = new Date(startOfMonth);
  startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
  const endOfLastMonth = new Date(startOfMonth);

  const lastMonthResult = await db.commission.aggregate({
    where: {
      affiliateId,
      createdAt: {
        gte: startOfLastMonth,
        lt: endOfLastMonth,
      },
      status: { notIn: ['CANCELLED', 'REFUNDED'] },
    },
    _sum: { amount: true },
  });

  return {
    totalPending: pending._sum.amount || 0,
    totalApproved: approved._sum.amount || 0,
    totalPaid: paid._sum.amount || 0,
    thisMonth: thisMonthResult._sum.amount || 0,
    lastMonth: lastMonthResult._sum.amount || 0,
  };
}

/**
 * Create an affiliate link
 */
export async function createAffiliateLink(
  affiliateId: string,
  data: { name?: string; productId?: string; targetUrl?: string }
): Promise<AffiliateLink> {
  const code = await generateLinkCode();

  // Determine target URL
  let targetUrl = data.targetUrl || process.env.NEXT_PUBLIC_BASE_URL || 'https://mobial.com';
  if (data.productId) {
    targetUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://mobial.com'}/products/${data.productId}`;
  }

  return db.affiliateLink.create({
    data: {
      affiliateId,
      code,
      name: data.name,
      targetUrl,
      productId: data.productId,
    },
  });
}

/**
 * Get affiliate links with stats
 */
export async function getAffiliateLinks(affiliateId: string): Promise<Array<AffiliateLink & { conversionRate: number }>> {
  const links = await db.affiliateLink.findMany({
    where: { affiliateId },
    orderBy: { createdAt: 'desc' },
  });

  return links.map(link => ({
    ...link,
    conversionRate: link.clicks > 0 ? (link.conversions / link.clicks) * 100 : 0,
  }));
}

/**
 * Update affiliate profile
 */
export async function updateAffiliateProfile(
  userId: string,
  data: {
    companyName?: string;
    website?: string;
    paymentMethod?: string;
    paymentDetails?: string;
    taxId?: string;
  }
): Promise<AffiliateProfile> {
  const profile = await db.affiliateProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    throw new Error('Affiliate profile not found');
  }

  return db.affiliateProfile.update({
    where: { userId },
    data,
  });
}

/**
 * Check if user is an affiliate
 */
export async function isAffiliate(userId: string): Promise<boolean> {
  const profile = await db.affiliateProfile.findUnique({
    where: { userId },
    select: { status: true },
  });

  return profile?.status === 'ACTIVE';
}

/**
 * Get affiliate ID by affiliate code
 */
export async function getAffiliateByCode(code: string): Promise<AffiliateProfile | null> {
  return db.affiliateProfile.findUnique({
    where: { affiliateCode: code.toUpperCase() },
  });
}
