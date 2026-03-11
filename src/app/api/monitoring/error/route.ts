import { NextRequest } from 'next/server';
import { createResponse, createErrorResponse, createServerErrorResponse } from '@/lib/api-response';
import { logError } from '@/services/monitoring-service';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';

  const rateLimitResult = await checkRateLimit(ip, 'monitoring-error', { maxRequests: 30, windowMs: 60_000 });
  if (!rateLimitResult.success) {
    return createErrorResponse('Rate limit exceeded', { status: 429 });
  }

  try {
    const body = await request.json();

    if (!body.message || typeof body.message !== 'string') {
      return createErrorResponse('Missing required field: message');
    }

    await logError({
      level: body.level || 'ERROR',
      source: 'CLIENT',
      message: body.message,
      stack: typeof body.stack === 'string' ? body.stack : undefined,
      digest: typeof body.digest === 'string' ? body.digest : undefined,
      path: typeof body.path === 'string' ? body.path : undefined,
      statusCode: typeof body.statusCode === 'number' ? body.statusCode : undefined,
      userId: typeof body.userId === 'string' ? body.userId : undefined,
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || undefined,
      metadata: typeof body.metadata === 'object' ? body.metadata : undefined,
    });

    return createResponse({ logged: true }, { status: 201 });
  } catch (err) {
    console.error('[api/monitoring/error] Failed:', err);
    return createServerErrorResponse();
  }
}
