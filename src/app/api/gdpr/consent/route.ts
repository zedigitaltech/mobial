import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import {
  getAuthUser,
  errorResponse,
  successResponse,
  parseJsonBody,
  getClientIP,
  getUserAgent,
} from '@/lib/auth-helpers';
import { checkRateLimit, createRateLimitHeaders } from '@/lib/rate-limit';
import { logAuditWithContext } from '@/lib/audit';

const consentSchema = z.object({
  essential: z.boolean(),
  analytics: z.boolean(),
  marketing: z.boolean(),
  thirdParty: z.boolean(),
});

export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);

    const rateLimitResult = await checkRateLimit(clientIP, 'api:write');
    if (!rateLimitResult.success) {
      const headers = createRateLimitHeaders(rateLimitResult);
      return new Response(
        JSON.stringify({ success: false, error: 'Too many requests' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...Object.fromEntries(headers.entries()),
          },
        }
      );
    }

    const body = await parseJsonBody(request);
    if (!body) {
      return errorResponse('Invalid request body', 400);
    }

    const validation = consentSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse('Invalid consent data', 400);
    }

    const { analytics, marketing, thirdParty } = validation.data;
    const user = await getAuthUser(request);
    const ipAddress = clientIP;
    const userAgent = getUserAgent(request);

    if (user) {
      await db.gDPRConsent.create({
        data: {
          userId: user.id,
          analytics,
          marketingEmails: marketing,
          thirdPartySharing: thirdParty,
          ipAddress,
          userAgent,
        },
      });

      await logAuditWithContext({
        userId: user.id,
        action: 'gdpr_consent',
        entity: 'gdpr_consent',
        newValues: { analytics, marketing, thirdParty },
      });
    }

    return successResponse(undefined, 'Consent recorded');
  } catch (error) {
    console.error('GDPR consent error:', error);
    return errorResponse('Failed to record consent', 500);
  }
}
