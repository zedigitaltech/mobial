/**
 * POST /api/auth/password/reset
 * Request a password reset email
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { logAuditWithContext } from '@/lib/audit';
import { checkRateLimit, createRateLimitHeaders } from '@/lib/rate-limit';
import { generatePasswordResetToken } from '@/lib/jwt';
import { db } from '@/lib/db';
import { sendPasswordReset } from '@/services/email-service';
import {
  successResponse,
  errorResponse,
  parseJsonBody,
  getClientIP
} from '@/lib/auth-helpers';
import { logger } from '@/lib/logger';

const resetRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);

    const rateLimitResult = await checkRateLimit(clientIP, 'auth:password-reset');

    if (!rateLimitResult.success) {
      const headers = createRateLimitHeaders(rateLimitResult);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Too many password reset requests. Please try again later.',
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

    const body = await parseJsonBody(request);

    if (!body) {
      return errorResponse('Invalid request body', 400);
    }

    const validationResult = resetRequestSchema.safeParse(body);

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return errorResponse(firstError?.message || 'Invalid input', 400);
    }

    const { email } = validationResult.data;

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (user && user.status !== 'DELETED' && !user.deletedAt) {
      // Check if a reset was requested in the last 2 minutes
      const existingConfig = await db.systemConfig.findUnique({
        where: { key: `reset_token:${user.id}` },
      });

      if (existingConfig) {
        try {
          const parsed = JSON.parse(existingConfig.value);
          const requestedAt = new Date(parsed.requestedAt || existingConfig.updatedAt);
          const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

          if (requestedAt > twoMinutesAgo) {
            // Rate limit: already requested within 2 minutes
            return successResponse(
              null,
              "If an account exists with this email, you'll receive a reset link."
            );
          }
        } catch {
          // Invalid stored data, proceed with new token
        }
      }

      const resetToken = generatePasswordResetToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      const tokenValue = JSON.stringify({
        token: resetToken,
        expiresAt: expiresAt.toISOString(),
        requestedAt: new Date().toISOString(),
      });

      await db.systemConfig.upsert({
        where: { key: `reset_token:${user.id}` },
        update: { value: tokenValue },
        create: {
          key: `reset_token:${user.id}`,
          value: tokenValue,
        },
      });

      await sendPasswordReset(email, resetToken);

      await logAuditWithContext({
        userId: user.id,
        action: 'password_reset',
        entity: 'user',
        entityId: user.id,
        newValues: { action: 'reset_requested' },
      });
    }

    return successResponse(
      null,
      "If an account exists with this email, you'll receive a reset link."
    );
  } catch (error) {
    logger.errorWithException('Password reset request error', error);
    return errorResponse('An error occurred', 500);
  }
}
