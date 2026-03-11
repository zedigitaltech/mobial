import { NextRequest } from 'next/server';
import { createResponse, createErrorResponse, createServerErrorResponse } from '@/lib/api-response';
import { trackPageView } from '@/services/monitoring-service';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';

  const rateLimitResult = await checkRateLimit(ip, 'monitoring-pageview', { maxRequests: 60, windowMs: 60_000 });
  if (!rateLimitResult.success) {
    return createResponse({ tracked: false }, { status: 200 });
  }

  try {
    const body = await request.json();

    if (!body.path || typeof body.path !== 'string') {
      return createErrorResponse('Missing required field: path');
    }

    if (!body.sessionId || typeof body.sessionId !== 'string') {
      return createErrorResponse('Missing required field: sessionId');
    }

    await trackPageView({
      path: body.path,
      referrer: typeof body.referrer === 'string' ? body.referrer : undefined,
      sessionId: body.sessionId,
      userId: typeof body.userId === 'string' ? body.userId : undefined,
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || undefined,
      device: typeof body.device === 'string' ? body.device : undefined,
      browser: typeof body.browser === 'string' ? body.browser : undefined,
      os: typeof body.os === 'string' ? body.os : undefined,
      country: typeof body.country === 'string' ? body.country : undefined,
      loadTimeMs: typeof body.loadTimeMs === 'number' ? body.loadTimeMs : undefined,
    });

    return createResponse({ tracked: true }, { status: 201 });
  } catch (err) {
    console.error('[api/monitoring/pageview] Failed:', err);
    return createServerErrorResponse();
  }
}
