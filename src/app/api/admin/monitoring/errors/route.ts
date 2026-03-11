import { NextRequest } from 'next/server';
import {
  requireAdmin,
  successResponse,
  errorResponse,
  AuthError,
} from '@/lib/auth-helpers';
import { getErrorStats, resolveError } from '@/services/monitoring-service';

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
    console.error('[api/admin/monitoring/errors] GET failed:', err);
    return errorResponse('Failed to fetch error stats', 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    const body = await request.json();

    if (!body.errorId || typeof body.errorId !== 'string') {
      return errorResponse('Missing required field: errorId');
    }

    if (body.action === 'resolve') {
      await resolveError(body.errorId, admin.id);
      return successResponse({ resolved: true });
    }

    return errorResponse('Unknown action. Use: resolve');
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.statusCode);
    }
    console.error('[api/admin/monitoring/errors] PATCH failed:', err);
    return errorResponse('Failed to update error', 500);
  }
}
