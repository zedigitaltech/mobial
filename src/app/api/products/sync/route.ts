/**
 * Products Sync API Route
 * POST /api/products/sync - Sync products from MobiMatter API (Admin only)
 */

import { NextRequest } from 'next/server';
import { syncProductsFromMobimatter } from '@/services/product-service';
import { requireAdmin, successResponse, errorResponse, getClientIP, getUserAgent } from '@/lib/auth-helpers';
import { logAudit } from '@/lib/audit';
import { checkRateLimit, createRateLimitHeaders } from '@/lib/rate-limit';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

/**
 * POST /api/products/sync
 * Sync products from MobiMatter API to database
 * 
 * Admin only endpoint with rate limiting:
 * - 3 requests per hour per admin user
 * 
 * Returns sync statistics:
 * - created: Number of new products created
 * - updated: Number of existing products updated
 * - skipped: Number of products skipped due to errors
 * - errors: Array of error messages
 * - totalProcessed: Total number of products processed
 */
export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const user = await requireAdmin(request);

    // Check rate limit (3 syncs per hour per admin)
    const rateLimitResult = await checkRateLimit(
      user.id,
      'admin:product-sync',
      { windowMs: 60 * 60 * 1000, maxRequests: 3 }
    );

    if (!rateLimitResult.success) {
      const headers = createRateLimitHeaders(rateLimitResult);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Rate limit exceeded. Please wait before syncing again.',
          retryAfter: rateLimitResult.retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...Object.fromEntries(headers.entries()),
          },
        }
      );
    }

    // Get client info for audit
    const ipAddress = getClientIP(request);
    const userAgent = getUserAgent(request);

    // Log sync start
    await logAudit({
      userId: user.id,
      action: 'product_sync',
      entity: 'product',
      newValues: { status: 'started' },
      ipAddress,
      userAgent,
    });

    // Perform sync
    const result = await syncProductsFromMobimatter();

    // Log sync completion
    await logAudit({
      userId: user.id,
      action: 'product_sync',
      entity: 'product',
      newValues: {
        status: 'completed',
        created: result.created,
        updated: result.updated,
        skipped: result.skipped,
        totalProcessed: result.totalProcessed,
      },
      ipAddress,
      userAgent,
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

    // Return 207-style partial success: if any products were created/updated,
    // the sync produced real value even with errors. Only fail (500) when
    // nothing was processed successfully.
    const processedCount = result.created + result.updated;
    if (!result.success && processedCount === 0) {
      return errorResponse(
        `Sync failed: ${result.errors.join('; ')}`,
        500
      );
    }

    return successResponse({
      message: result.success
        ? 'Products synced successfully'
        : `Products synced with ${result.errors.length} error(s)`,
      stats: {
        created: result.created,
        updated: result.updated,
        skipped: result.skipped,
        totalProcessed: result.totalProcessed,
        errors: result.errors.length > 0 ? result.errors : undefined,
      },
    });
  } catch (error) {
    // Handle authentication errors
    if (error instanceof Error && 'statusCode' in error) {
      const authError = error as { statusCode: number; message: string };
      return errorResponse(authError.message, authError.statusCode);
    }

    logger.errorWithException('Error syncing products', error);
    return errorResponse('Failed to sync products', 500);
  }
}
