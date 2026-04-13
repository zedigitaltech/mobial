import { NextRequest } from 'next/server';
import { createResponse, createErrorResponse, createServerErrorResponse } from '@/lib/api-response';
import { trackEvent } from '@/services/monitoring-service';
import { checkRateLimit } from '@/lib/rate-limit';
import { getAuthUser } from '@/lib/auth-helpers';
import { logger } from '@/lib/logger';

const ALLOWED_EVENTS = new Set([
  'product_view',
  'add_to_cart',
  'remove_from_cart',
  'checkout_start',
  'checkout_complete',
  'purchase',
  'search',
  'filter_change',
  'currency_change',
  'signup',
  'login',
  'share',
  'review_submit',
  'usage_check',
  'topup_start',
  'topup_complete',
  'compare_add',
  'compare_remove',
  'contact_submit',
  'faq_expand',
  'guide_view',
  'cta_click',
]);

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';

  const rateLimitResult = await checkRateLimit(ip, 'monitoring-event', { maxRequests: 120, windowMs: 60_000 });
  if (!rateLimitResult.success) {
    return createResponse({ tracked: false }, { status: 200 });
  }

  try {
    const body = await request.json();

    if (!body.name || typeof body.name !== 'string') {
      return createErrorResponse('Missing required field: name');
    }

    if (!ALLOWED_EVENTS.has(body.name)) {
      return createErrorResponse(`Unknown event: ${body.name}`);
    }

    if (!body.sessionId || typeof body.sessionId !== 'string') {
      return createErrorResponse('Missing required field: sessionId');
    }

    // Derive userId from verified JWT — never trust body.userId (spoofable).
    const authUser = await getAuthUser(request);

    await trackEvent({
      name: body.name,
      category: typeof body.category === 'string' ? body.category : undefined,
      properties: typeof body.properties === 'object' && body.properties !== null
        ? body.properties
        : undefined,
      value: typeof body.value === 'number' ? body.value : undefined,
      sessionId: body.sessionId,
      userId: authUser?.id,
      ipAddress: ip,
      path: typeof body.path === 'string' ? body.path : undefined,
    });

    return createResponse({ tracked: true }, { status: 201 });
  } catch (err) {
    logger.errorWithException('[api/monitoring/event] Failed', err);
    return createServerErrorResponse();
  }
}
