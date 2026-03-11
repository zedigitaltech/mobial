import { NextRequest } from 'next/server';
import { syncProductsFromMobimatter } from '@/services/product-service';
import { logAudit } from '@/lib/audit';
import { db } from '@/lib/db';

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

  if (token !== cronSecret) {
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
    console.error('Cron product sync failed:', error);

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
