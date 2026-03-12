import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { processOrderWithMobimatter } from '@/services/order-service';
import { logAudit } from '@/lib/audit';
import { sendAdminAlert } from '@/services/email-service';

const MAX_RETRIES = 5;

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return Response.json(
      { success: false, error: 'Cron not configured' },
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
    // Find orders that were paid but failed fulfillment, created within last 72 hours
    const failedOrders = await db.order.findMany({
      where: {
        status: 'FAILED',
        paymentStatus: 'PAID',
        createdAt: { gte: new Date(Date.now() - 72 * 60 * 60 * 1000) },
        retryCount: { lt: MAX_RETRIES },
      },
      select: {
        id: true,
        orderNumber: true,
        retryCount: true,
      },
      take: 10,
      orderBy: { createdAt: 'asc' },
    });

    if (failedOrders.length === 0) {
      return Response.json({ success: true, retried: 0 });
    }

    const results: Array<{ orderId: string; orderNumber: string; success: boolean; error?: string }> = [];

    for (const order of failedOrders) {
      try {
        // Increment retry count before attempting
        await db.order.update({
          where: { id: order.id },
          data: { retryCount: { increment: 1 } },
        });

        const result = await processOrderWithMobimatter(order.id, 'CRON_RETRY');

        results.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          success: result.success,
          error: result.error,
        });

        if (result.success) {
          await logAudit({
            action: 'order_complete',
            entity: 'order',
            entityId: order.id,
            newValues: {
              source: 'retry_cron',
              retryCount: order.retryCount + 1,
              orderNumber: order.orderNumber,
            },
          });
        }

        // Alert admin when fulfillment keeps failing after 3+ retries
        if (!result.success && order.retryCount + 1 >= 3) {
          sendAdminAlert({
            type: 'fulfillment_failure',
            subject: `Order ${order.orderNumber} failed fulfillment after ${order.retryCount + 1} retries`,
            details: {
              orderId: order.id,
              orderNumber: order.orderNumber,
              retryCount: order.retryCount + 1,
              error: result.error || 'Unknown error',
              maxRetries: MAX_RETRIES,
            },
          }).catch((err) =>
            console.error('[Retry Cron] Failed to send admin alert:', err)
          );
        }
      } catch (error) {
        results.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const succeeded = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    await logAudit({
      action: 'security_alert',
      entity: 'order',
      newValues: {
        source: 'retry_fulfillment_cron',
        attempted: results.length,
        succeeded,
        failed,
      },
    });

    return Response.json({
      success: true,
      retried: results.length,
      succeeded,
      failed,
      details: results,
    });
  } catch (error) {
    console.error('[Retry Fulfillment Cron] Error:', error);
    return Response.json(
      { success: false, error: 'Retry cron failed' },
      { status: 500 }
    );
  }
}
