import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  requireAdmin,
  successResponse,
  errorResponse,
  AuthError,
} from '@/lib/auth-helpers';
import { getErrorStats, resolveError } from '@/services/monitoring-service';
import { logger } from '@/lib/logger';

const resolveSchema = z.object({
  errorId: z.string().min(1),
  action: z.enum(['resolve']),
});

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const period = (request.nextUrl.searchParams.get('period') || '7d') as '24h' | '7d' | '30d' | '90d';

    if (!['24h', '7d', '30d', '90d'].includes(period)) {
      return errorResponse('Invalid period. Use: 24h, 7d, 30d, 90d');
    }

    const stats = await getErrorStats(period);
    return successResponse(stats);
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.statusCode);
    }
    logger.errorWithException('[api/admin/monitoring/errors] GET failed', err);
    return errorResponse('Failed to fetch error stats', 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    const raw = await request.json();

    const parsed = resolveSchema.safeParse(raw);
    if (!parsed.success) {
      return errorResponse(`Validation error: ${parsed.error.issues.map((e) => e.message).join(', ')}`);
    }

    const { errorId, action } = parsed.data;

    if (action === 'resolve') {
      await resolveError(errorId, admin.id);
      return successResponse({ resolved: true });
    }

    return errorResponse('Unknown action. Use: resolve');
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.statusCode);
    }
    logger.errorWithException('[api/admin/monitoring/errors] PATCH failed', err);
    return errorResponse('Failed to update error', 500);
  }
}
