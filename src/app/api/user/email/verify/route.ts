import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { logAuditWithContext } from '@/lib/audit';
import { checkRateLimit, createRateLimitHeaders } from '@/lib/rate-limit';
import {
  errorResponse,
  successResponse,
  parseJsonBody,
  getClientIP,
} from '@/lib/auth-helpers';
import { logger } from '@/lib/logger';

const verifySchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);

    const rateLimitResult = await checkRateLimit(clientIP, 'auth:verify');
    if (!rateLimitResult.success) {
      const headers = createRateLimitHeaders(rateLimitResult);
      return new Response(
        JSON.stringify({ success: false, error: 'Too many requests. Please try again later.' }),
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

    const validation = verifySchema.safeParse(body);
    if (!validation.success) {
      return errorResponse('Invalid token', 400);
    }

    const { token } = validation.data;

    const configEntry = await db.systemConfig.findUnique({
      where: { key: `email-change:${token}` },
    });

    if (!configEntry) {
      return errorResponse('Invalid or expired verification token', 400);
    }

    const pendingChange = JSON.parse(configEntry.value) as {
      userId: string;
      newEmail: string;
      createdAt: string;
    };

    // Check if token is expired (24 hours)
    const createdAt = new Date(pendingChange.createdAt);
    const now = new Date();
    const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursDiff > 24) {
      // Clean up expired token
      await db.systemConfig.delete({
        where: { key: `email-change:${token}` },
      });
      return errorResponse('Verification token has expired', 400);
    }

    // Verify the email isn't already taken (could have changed since request)
    const existingUser = await db.user.findUnique({
      where: { email: pendingChange.newEmail },
      select: { id: true },
    });

    if (existingUser && existingUser.id !== pendingChange.userId) {
      await db.systemConfig.delete({
        where: { key: `email-change:${token}` },
      });
      return errorResponse('This email is already in use', 409);
    }

    // Get old email for audit log
    const user = await db.user.findUnique({
      where: { id: pendingChange.userId },
      select: { email: true },
    });

    if (!user) {
      return errorResponse('User not found', 404);
    }

    const oldEmail = user.email;

    // Update the user's email
    await db.user.update({
      where: { id: pendingChange.userId },
      data: {
        email: pendingChange.newEmail,
        emailVerified: new Date(),
      },
    });

    // Clean up the token
    await db.systemConfig.delete({
      where: { key: `email-change:${token}` },
    });

    await logAuditWithContext({
      userId: pendingChange.userId,
      action: 'profile_update',
      entity: 'user',
      entityId: pendingChange.userId,
      oldValues: { email: oldEmail },
      newValues: { email: pendingChange.newEmail, action: 'email_change_confirmed' },
    });

    return successResponse(undefined, 'Email updated successfully');
  } catch (error) {
    logger.errorWithException('Email verify error', error);
    return errorResponse('Failed to verify email change', 500);
  }
}
