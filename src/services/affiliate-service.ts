import { db } from '@/lib/db';

// Safe JSON parse — returns fallback on null, empty, or corrupt input
function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

interface AffiliateProfile {
  userId: string;
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
  commissionRate: number;
  createdAt: string;
}

interface AffiliateStats {
  clicks: number;
  orders: number;
  commission: number;
}

interface AffiliateWithDetails {
  id: string;
  code: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  status: string;
  commissionRate: number;
  clicks: number;
  orders: number;
  commission: number;
  createdAt: string;
}

export async function getAffiliateByCode(code: string): Promise<AffiliateProfile | null> {
  const config = await db.systemConfig.findUnique({
    where: { key: `affiliate:${code}` },
  });
  if (!config) return null;
  try {
    return JSON.parse(config.value) as AffiliateProfile;
  } catch {
    return null;
  }
}

export async function trackClick(
  affiliateCode: string,
  data: {
    ipAddress: string;
    userAgent: string;
    referrer?: string;
    country?: string;
    deviceId?: string;
  },
  linkCode?: string
) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://mobialo.eu';
  const clickId = crypto.randomUUID();

  await db.auditLog.create({
    data: {
      action: 'affiliate_click',
      entity: 'affiliate',
      entityId: affiliateCode,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      newValues: JSON.stringify({
        clickId,
        affiliateCode,
        linkCode,
        referrer: data.referrer,
        country: data.country,
      }),
    },
  });

  const statsKey = `affiliate_stats:${affiliateCode}`;
  const existing = await db.systemConfig.findUnique({ where: { key: statsKey } });
  const stats: AffiliateStats = existing
    ? safeJsonParse(existing.value, { clicks: 0, orders: 0, commission: 0 })
    : { clicks: 0, orders: 0, commission: 0 };

  stats.clicks += 1;

  await db.systemConfig.upsert({
    where: { key: statsKey },
    update: { value: JSON.stringify(stats) },
    create: {
      key: statsKey,
      value: JSON.stringify(stats),
      description: `Stats for affiliate ${affiliateCode}`,
    },
  });

  return {
    clickId,
    targetUrl: `${baseUrl}/products?ref=${affiliateCode}`,
  };
}

export async function createAffiliate(
  userId: string,
  code: string,
  commissionRate: number = 10
): Promise<AffiliateProfile> {
  const profile: AffiliateProfile = {
    userId,
    status: 'PENDING',
    commissionRate,
    createdAt: new Date().toISOString(),
  };

  await db.systemConfig.upsert({
    where: { key: `affiliate:${code}` },
    update: { value: JSON.stringify(profile) },
    create: {
      key: `affiliate:${code}`,
      value: JSON.stringify(profile),
      description: `Affiliate profile for code ${code}`,
    },
  });

  await db.systemConfig.upsert({
    where: { key: `affiliate_stats:${code}` },
    update: {},
    create: {
      key: `affiliate_stats:${code}`,
      value: JSON.stringify({ clicks: 0, orders: 0, commission: 0 }),
      description: `Stats for affiliate ${code}`,
    },
  });

  await db.systemConfig.upsert({
    where: { key: `affiliate_user:${userId}` },
    update: { value: code },
    create: {
      key: `affiliate_user:${userId}`,
      value: code,
      description: `Affiliate code mapping for user ${userId}`,
    },
  });

  return profile;
}

export async function getAffiliateStats(userId: string): Promise<{
  code: string | null;
  profile: AffiliateProfile | null;
  stats: AffiliateStats;
}> {
  const codeConfig = await db.systemConfig.findUnique({
    where: { key: `affiliate_user:${userId}` },
  });

  if (!codeConfig) {
    return { code: null, profile: null, stats: { clicks: 0, orders: 0, commission: 0 } };
  }

  const code = codeConfig.value;
  const profile = await getAffiliateByCode(code);
  const statsConfig = await db.systemConfig.findUnique({
    where: { key: `affiliate_stats:${code}` },
  });

  const stats: AffiliateStats = statsConfig
    ? safeJsonParse(statsConfig.value, { clicks: 0, orders: 0, commission: 0 })
    : { clicks: 0, orders: 0, commission: 0 };

  return { code, profile, stats };
}

export async function getAllAffiliates(filters?: {
  status?: string;
  search?: string;
}): Promise<AffiliateWithDetails[]> {
  const configs = await db.systemConfig.findMany({
    where: {
      key: { startsWith: 'affiliate:' },
      NOT: {
        key: { startsWith: 'affiliate_stats:' },
      },
    },
  });

  const affiliateConfigs = configs.filter(
    (c) => !c.key.startsWith('affiliate_user:') && !c.key.startsWith('affiliate_stats:')
  );

  const affiliates: AffiliateWithDetails[] = [];

  for (const config of affiliateConfigs) {
    const code = config.key.replace('affiliate:', '');
    const profile = safeJsonParse<AffiliateProfile | null>(config.value, null);
    if (!profile) continue;

    if (filters?.status && profile.status !== filters.status) continue;

    const user = await db.user.findUnique({
      where: { id: profile.userId },
      select: { id: true, name: true, email: true },
    });

    if (!user) continue;

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      if (
        !user.email.toLowerCase().includes(search) &&
        !(user.name || '').toLowerCase().includes(search) &&
        !code.toLowerCase().includes(search)
      ) {
        continue;
      }
    }

    const statsConfig = await db.systemConfig.findUnique({
      where: { key: `affiliate_stats:${code}` },
    });
    const stats: AffiliateStats = statsConfig
      ? safeJsonParse(statsConfig.value, { clicks: 0, orders: 0, commission: 0 })
      : { clicks: 0, orders: 0, commission: 0 };

    affiliates.push({
      id: config.id,
      code,
      userId: profile.userId,
      userName: user.name,
      userEmail: user.email,
      status: profile.status,
      commissionRate: profile.commissionRate,
      clicks: stats.clicks,
      orders: stats.orders,
      commission: stats.commission,
      createdAt: profile.createdAt,
    });
  }

  return affiliates;
}

export async function updateAffiliateStatus(
  code: string,
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED'
): Promise<AffiliateProfile | null> {
  const config = await db.systemConfig.findUnique({
    where: { key: `affiliate:${code}` },
  });
  if (!config) return null;

  const profile = safeJsonParse<AffiliateProfile | null>(config.value, null);
  if (!profile) return null;
  const updatedProfile: AffiliateProfile = { ...profile, status };

  await db.systemConfig.update({
    where: { key: `affiliate:${code}` },
    data: { value: JSON.stringify(updatedProfile) },
  });

  return updatedProfile;
}

export async function updateAffiliateCommissionRate(
  code: string,
  commissionRate: number
): Promise<AffiliateProfile | null> {
  const config = await db.systemConfig.findUnique({
    where: { key: `affiliate:${code}` },
  });
  if (!config) return null;

  const profile = safeJsonParse<AffiliateProfile | null>(config.value, null);
  if (!profile) return null;
  const updatedProfile: AffiliateProfile = { ...profile, commissionRate };

  await db.systemConfig.update({
    where: { key: `affiliate:${code}` },
    data: { value: JSON.stringify(updatedProfile) },
  });

  return updatedProfile;
}

export async function recordAffiliateOrder(
  code: string,
  orderTotal: number
): Promise<void> {
  const profile = await getAffiliateByCode(code);
  if (!profile || profile.status !== 'ACTIVE') return;

  const commission = (orderTotal * profile.commissionRate) / 100;

  const statsKey = `affiliate_stats:${code}`;
  const existing = await db.systemConfig.findUnique({ where: { key: statsKey } });
  const stats: AffiliateStats = existing
    ? safeJsonParse(existing.value, { clicks: 0, orders: 0, commission: 0 })
    : { clicks: 0, orders: 0, commission: 0 };

  const updatedStats: AffiliateStats = {
    ...stats,
    orders: stats.orders + 1,
    commission: stats.commission + commission,
  };

  await db.systemConfig.update({
    where: { key: statsKey },
    data: { value: JSON.stringify(updatedStats) },
  });
}
