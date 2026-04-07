import { NextRequest } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { syncProductsFromMobimatter } from '@/services/product-service';
import { logAudit } from '@/lib/audit';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

const log = logger.child('cron:sync-products');

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return Response.json(
      { success: false, error: 'Cron sync not configured' },
      { status: 503 }
    );
  }

  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  const isValid =
    token &&
    cronSecret &&
    token.length === cronSecret.length &&
    timingSafeEqual(Buffer.from(token), Buffer.from(cronSecret));
  if (!isValid) {
    return Response.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    await logAudit({
      action: 'product_sync',
      entity: 'product',
      newValues: { source: 'cron', status: 'started' },
    });

    const result = await syncProductsFromMobimatter();

    await logAudit({
      action: 'product_sync',
      entity: 'product',
      newValues: {
        source: 'cron',
        status: 'completed',
        created: result.created,
        updated: result.updated,
        skipped: result.skipped,
        totalProcessed: result.totalProcessed,
      },
    });

    await db.systemConfig.upsert({
      where: { key: 'last_product_sync' },
      update: { value: new Date().toISOString() },
      create: {
        key: 'last_product_sync',
        value: new Date().toISOString(),
        description: 'Last product sync timestamp',
      },
    });

    return Response.json({
      success: result.success,
      stats: {
        created: result.created,
        updated: result.updated,
        skipped: result.skipped,
        totalProcessed: result.totalProcessed,
        errors: result.errors.length > 0 ? result.errors : undefined,
      },
    });
  } catch (error) {
    log.errorWithException('Product sync failed', error);

    await logAudit({
      action: 'product_sync',
      entity: 'product',
      newValues: {
        source: 'cron',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    return Response.json(
      {
        success: false,
        error: process.env.NODE_ENV === 'production' ? 'Sync failed' : (error instanceof Error ? error.message : 'Sync failed'),
      },
      { status: 500 }
    );
  }
}
