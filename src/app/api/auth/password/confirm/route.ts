/**
 * POST /api/auth/password/confirm
 * Confirm password reset using token
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { hashPassword, checkPasswordStrength } from '@/lib/password';
import { logAuditWithContext } from '@/lib/audit';
import { db } from '@/lib/db';
import {
  successResponse,
  errorResponse,
  parseJsonBody
} from '@/lib/auth-helpers';
import { logger } from '@/lib/logger';

const confirmSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody(request);

    if (!body) {
      return errorResponse('Invalid request body', 400);
    }

    const validationResult = confirmSchema.safeParse(body);

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return errorResponse(firstError?.message || 'Invalid input', 400);
    }

    const { token, password } = validationResult.data;

    const passwordCheck = checkPasswordStrength(password);
    if (!passwordCheck.isStrong) {
      return errorResponse(
        `Password is too weak: ${passwordCheck.feedback.join(', ')}`,
        400
      );
    }

    // Find reset token using an indexed prefix scan + value search
    // This avoids loading all tokens into memory (N+1 pattern)
    const config = await db.systemConfig.findFirst({
      where: {
        key: { startsWith: 'reset_token:' },
        value: { contains: token },
      },
    });

    let userId: string | null = null;
    let tokenData: { token: string; expiresAt: string } | null = null;

    if (config) {
      try {
        const data = JSON.parse(config.value) as { token: string; expiresAt: string };
        if (data.token === token) {
          userId = config.key.replace('reset_token:', '');
          tokenData = data;
        }
      } catch {
        // Corrupted entry — fall through to invalid token response
      }
    }

    if (!userId || !tokenData) {
      return errorResponse('Invalid or expired reset token', 400);
    }

    if (new Date(tokenData.expiresAt) < new Date()) {
      await db.systemConfig.delete({
        where: { key: `reset_token:${userId}` },
      });
      return errorResponse('Reset token has expired. Please request a new one.', 400);
    }

    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.status === 'DELETED' || user.deletedAt) {
      return errorResponse('Account not found', 404);
    }

    const passwordHash = await hashPassword(password);

    await db.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    await db.systemConfig.delete({
      where: { key: `reset_token:${userId}` },
    });

    await db.session.deleteMany({
      where: { userId },
    });

    await logAuditWithContext({
      userId,
      action: 'password_change',
      entity: 'user',
      entityId: userId,
      newValues: { method: 'reset' },
    });

    return successResponse(
      null,
      'Password has been reset successfully. You can now log in with your new password.'
    );
  } catch (error) {
    logger.errorWithException('Password reset confirm error', error);
    return errorResponse('An error occurred', 500);
  }
}
