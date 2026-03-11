import { db } from '@/lib/db';
import { ErrorLevel, ErrorSource } from '@prisma/client';
import crypto from 'crypto';

// ==================== ERROR LOGGING ====================

interface LogErrorInput {
  level?: ErrorLevel;
  source?: ErrorSource;
  message: string;
  stack?: string;
  digest?: string;
  path?: string;
  method?: string;
  statusCode?: number;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

function generateFingerprint(message: string, stack?: string): string {
  const normalizedStack = stack
    ? stack
        .split('\n')
        .slice(0, 3)
        .map((line) => line.replace(/:\d+:\d+/g, ''))
        .join('\n')
    : '';
  return crypto
    .createHash('sha256')
    .update(`${message}::${normalizedStack}`)
    .digest('hex')
    .slice(0, 32);
}

export async function logError(input: LogErrorInput): Promise<void> {
  const fingerprint = generateFingerprint(input.message, input.stack);

  try {
    const existing = await db.errorLog.findFirst({
      where: {
        fingerprint,
        resolved: false,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });

    if (existing) {
      await db.errorLog.update({
        where: { id: existing.id },
        data: {
          occurrences: { increment: 1 },
          lastSeenAt: new Date(),
          ipAddress: input.ipAddress || existing.ipAddress,
          userId: input.userId || existing.userId,
        },
      });
      return;
    }

    await db.errorLog.create({
      data: {
        level: input.level || 'ERROR',
        source: input.source || 'SERVER',
        message: input.message.slice(0, 2000),
        stack: input.stack?.slice(0, 10000),
        digest: input.digest,
        path: input.path,
        method: input.method,
        statusCode: input.statusCode,
        userId: input.userId,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent?.slice(0, 500),
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
        fingerprint,
      },
    });
  } catch (err) {
    console.error('[monitoring] Failed to log error:', err);
  }
}

// ==================== PAGE VIEW TRACKING ====================

interface TrackPageViewInput {
  path: string;
  referrer?: string;
  sessionId: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  device?: string;
  browser?: string;
  os?: string;
  country?: string;
  loadTimeMs?: number;
}

export async function trackPageView(input: TrackPageViewInput): Promise<void> {
  try {
    await db.pageView.create({
      data: {
        path: input.path,
        referrer: input.referrer?.slice(0, 2000),
        sessionId: input.sessionId,
        userId: input.userId,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent?.slice(0, 500),
        device: input.device,
        browser: input.browser,
        os: input.os,
        country: input.country,
        loadTimeMs: input.loadTimeMs,
      },
    });
  } catch (err) {
    console.error('[monitoring] Failed to track page view:', err);
  }
}

// ==================== ANALYTICS EVENT TRACKING ====================

interface TrackEventInput {
  name: string;
  category?: string;
  properties?: Record<string, unknown>;
  value?: number;
  sessionId: string;
  userId?: string;
  ipAddress?: string;
  path?: string;
}

export async function trackEvent(input: TrackEventInput): Promise<void> {
  try {
    await db.analyticsEvent.create({
      data: {
        name: input.name,
        category: input.category,
        properties: input.properties ? JSON.stringify(input.properties) : null,
        value: input.value,
        sessionId: input.sessionId,
        userId: input.userId,
        ipAddress: input.ipAddress,
        path: input.path,
      },
    });
  } catch (err) {
    console.error('[monitoring] Failed to track event:', err);
  }
}

// ==================== ADMIN QUERIES ====================

interface DateRange {
  from: Date;
  to: Date;
}

function getDateRange(period: '24h' | '7d' | '30d' | '90d'): DateRange {
  const to = new Date();
  const from = new Date();
  switch (period) {
    case '24h':
      from.setHours(from.getHours() - 24);
      break;
    case '7d':
      from.setDate(from.getDate() - 7);
      break;
    case '30d':
      from.setDate(from.getDate() - 30);
      break;
    case '90d':
      from.setDate(from.getDate() - 90);
      break;
  }
  return { from, to };
}

export async function getErrorStats(period: '24h' | '7d' | '30d' | '90d' = '7d') {
  const { from } = getDateRange(period);

  const [errors, unresolvedCount, criticalCount, topErrors] = await Promise.all([
    db.errorLog.findMany({
      where: { createdAt: { gte: from } },
      orderBy: { lastSeenAt: 'desc' },
      take: 50,
      select: {
        id: true,
        level: true,
        source: true,
        message: true,
        path: true,
        statusCode: true,
        occurrences: true,
        resolved: true,
        createdAt: true,
        lastSeenAt: true,
        fingerprint: true,
      },
    }),
    db.errorLog.count({
      where: { resolved: false, createdAt: { gte: from } },
    }),
    db.errorLog.count({
      where: { level: 'CRITICAL', resolved: false, createdAt: { gte: from } },
    }),
    db.errorLog.findMany({
      where: { createdAt: { gte: from } },
      orderBy: { occurrences: 'desc' },
      take: 10,
      select: {
        id: true,
        message: true,
        path: true,
        occurrences: true,
        level: true,
        source: true,
        lastSeenAt: true,
      },
    }),
  ]);

  return {
    errors,
    unresolvedCount,
    criticalCount,
    topErrors,
    period,
  };
}

export async function getAnalyticsOverview(period: '24h' | '7d' | '30d' | '90d' = '7d') {
  const { from } = getDateRange(period);

  const [
    totalPageViews,
    uniqueVisitors,
    topPages,
    topEvents,
    deviceBreakdown,
    countryBreakdown,
    conversionFunnel,
  ] = await Promise.all([
    db.pageView.count({ where: { createdAt: { gte: from } } }),

    db.pageView.groupBy({
      by: ['sessionId'],
      where: { createdAt: { gte: from } },
    }).then((groups) => groups.length),

    db.pageView.groupBy({
      by: ['path'],
      where: { createdAt: { gte: from } },
      _count: { path: true },
      orderBy: { _count: { path: 'desc' } },
      take: 15,
    }),

    db.analyticsEvent.groupBy({
      by: ['name'],
      where: { createdAt: { gte: from } },
      _count: { name: true },
      orderBy: { _count: { name: 'desc' } },
      take: 15,
    }),

    db.pageView.groupBy({
      by: ['device'],
      where: { createdAt: { gte: from }, device: { not: null } },
      _count: { device: true },
      orderBy: { _count: { device: 'desc' } },
    }),

    db.pageView.groupBy({
      by: ['country'],
      where: { createdAt: { gte: from }, country: { not: null } },
      _count: { country: true },
      orderBy: { _count: { country: 'desc' } },
      take: 10,
    }),

    Promise.all([
      db.pageView.groupBy({
        by: ['sessionId'],
        where: { createdAt: { gte: from } },
      }).then((g) => g.length),
      db.analyticsEvent.groupBy({
        by: ['sessionId'],
        where: { name: 'product_view', createdAt: { gte: from } },
      }).then((g) => g.length),
      db.analyticsEvent.groupBy({
        by: ['sessionId'],
        where: { name: 'add_to_cart', createdAt: { gte: from } },
      }).then((g) => g.length),
      db.analyticsEvent.groupBy({
        by: ['sessionId'],
        where: { name: 'checkout_start', createdAt: { gte: from } },
      }).then((g) => g.length),
      db.analyticsEvent.groupBy({
        by: ['sessionId'],
        where: { name: 'purchase', createdAt: { gte: from } },
      }).then((g) => g.length),
    ]),
  ]);

  return {
    totalPageViews,
    uniqueVisitors,
    topPages: topPages.map((p) => ({ path: p.path, views: p._count.path })),
    topEvents: topEvents.map((e) => ({ name: e.name, count: e._count.name })),
    deviceBreakdown: deviceBreakdown.map((d) => ({
      device: d.device || 'unknown',
      count: d._count.device,
    })),
    countryBreakdown: countryBreakdown.map((c) => ({
      country: c.country || 'unknown',
      count: c._count.country,
    })),
    conversionFunnel: {
      visitors: conversionFunnel[0],
      productViews: conversionFunnel[1],
      addToCarts: conversionFunnel[2],
      checkoutStarts: conversionFunnel[3],
      purchases: conversionFunnel[4],
    },
    period,
  };
}

export async function getPageViewTimeSeries(
  period: '24h' | '7d' | '30d' | '90d' = '7d'
) {
  const { from, to } = getDateRange(period);
  const views = await db.pageView.findMany({
    where: { createdAt: { gte: from, lte: to } },
    select: { createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  const bucketMs =
    period === '24h'
      ? 60 * 60 * 1000
      : period === '7d'
      ? 24 * 60 * 60 * 1000
      : 24 * 60 * 60 * 1000;

  const buckets: Record<string, number> = {};
  let cursor = new Date(from);

  while (cursor <= to) {
    const key =
      period === '24h'
        ? cursor.toISOString().slice(0, 13) + ':00'
        : cursor.toISOString().slice(0, 10);
    buckets[key] = 0;
    cursor = new Date(cursor.getTime() + bucketMs);
  }

  for (const view of views) {
    const key =
      period === '24h'
        ? view.createdAt.toISOString().slice(0, 13) + ':00'
        : view.createdAt.toISOString().slice(0, 10);
    if (key in buckets) {
      buckets[key]++;
    }
  }

  return Object.entries(buckets).map(([date, count]) => ({ date, count }));
}

export async function resolveError(errorId: string, resolvedBy: string): Promise<void> {
  await db.errorLog.update({
    where: { id: errorId },
    data: {
      resolved: true,
      resolvedAt: new Date(),
      resolvedBy,
    },
  });
}

export async function cleanupOldMonitoringData(retentionDays: number = 90): Promise<{
  deletedPageViews: number;
  deletedEvents: number;
  deletedErrors: number;
}> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - retentionDays);

  const [pageViews, events, errors] = await Promise.all([
    db.pageView.deleteMany({ where: { createdAt: { lt: cutoff } } }),
    db.analyticsEvent.deleteMany({ where: { createdAt: { lt: cutoff } } }),
    db.errorLog.deleteMany({ where: { createdAt: { lt: cutoff }, resolved: true } }),
  ]);

  return {
    deletedPageViews: pageViews.count,
    deletedEvents: events.count,
    deletedErrors: errors.count,
  };
}
