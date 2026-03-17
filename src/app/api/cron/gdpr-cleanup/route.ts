/**
 * GET /api/cron/gdpr-cleanup
 * Permanently anonymizes user data 30 days after account deletion request.
 * GDPR Article 17 — Right to Erasure.
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { secureCompare } from '@/lib/encryption';
import { logger } from '@/lib/logger';

const log = logger.child('cron:gdpr-cleanup');
const RETENTION_DAYS = 30;

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

  if (!token || !secureCompare(token, cronSecret)) {
    return Response.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const cutoffDate = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

    // Find deletion requests that are past the retention period
    const pendingDeletions = await db.dataDeletionRequest.findMany({
      where: {
        status: 'PROCESSING',
        processedAt: { lte: cutoffDate },
      },
      take: 20,
    });

    if (pendingDeletions.length === 0) {
      return Response.json({ success: true, processed: 0 });
    }

    let processed = 0;

    for (const request of pendingDeletions) {
      try {
        // Anonymize order data for this user
        await db.order.updateMany({
          where: { userId: request.userId },
          data: {
            email: `anonymized_${request.userId}@deleted.mobialo.eu`,
            phone: null,
            ipAddress: null,
            userAgent: null,
          },
        });

        // Remove audit logs containing user data
        await db.auditLog.updateMany({
          where: { userId: request.userId },
          data: {
            ipAddress: null,
            userAgent: null,
          },
        });

        // Remove page views
        await db.pageView.updateMany({
          where: { userId: request.userId },
          data: {
            ipAddress: null,
            userAgent: null,
            sessionId: `anon_${request.userId}`,
          },
        });

        // Remove analytics events
        await db.analyticsEvent.updateMany({
          where: { userId: request.userId },
          data: {
            ipAddress: null,
            sessionId: `anon_${request.userId}`,
          },
        });

        // Mark deletion as completed
        await db.dataDeletionRequest.update({
          where: { id: request.id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
          },
        });

        await logAudit({
          action: 'gdpr_permanent_delete',
          entity: 'user',
          entityId: request.userId,
          newValues: {
            deletionRequestId: request.id,
            userEmail: request.userEmail,
          },
        });

        processed++;
      } catch (error) {
        log.errorWithException(
          `Failed to process deletion for user ${request.userId}`,
          error
        );
      }
    }

    log.info(`GDPR cleanup completed: ${processed}/${pendingDeletions.length} processed`);

    return Response.json({
      success: true,
      processed,
      total: pendingDeletions.length,
    });
  } catch (error) {
    log.errorWithException('GDPR cleanup cron failed', error);
    return Response.json(
      { success: false, error: 'Cleanup failed' },
      { status: 500 }
    );
  }
}
