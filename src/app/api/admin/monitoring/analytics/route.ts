import { NextRequest } from 'next/server';
import {
  requireAdmin,
  successResponse,
  errorResponse,
  AuthError,
} from '@/lib/auth-helpers';
import { getAnalyticsOverview, getPageViewTimeSeries } from '@/services/monitoring-service';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const period = (request.nextUrl.searchParams.get('period') || '7d') as '24h' | '7d' | '30d' | '90d';
    const view = request.nextUrl.searchParams.get('view') || 'overview';

    if (!['24h', '7d', '30d', '90d'].includes(period)) {
      return errorResponse('Invalid period. Use: 24h, 7d, 30d, 90d');
    }

    if (view === 'timeseries') {
      const timeSeries = await getPageViewTimeSeries(period);
      return successResponse({ timeSeries, period });
    }

    const overview = await getAnalyticsOverview(period);
    return successResponse(overview);
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.statusCode);
    }
    logger.errorWithException('[api/admin/monitoring/analytics] GET failed', err);
    return errorResponse('Failed to fetch analytics', 500);
  }
}
