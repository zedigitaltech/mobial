import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { verifyPassword } from '@/lib/password';
import { generateEmailVerificationToken } from '@/lib/jwt';
import { sendEmailVerification } from '@/services/email-service';
import { logAuditWithContext } from '@/lib/audit';
import { checkRateLimit, createRateLimitHeaders } from '@/lib/rate-limit';
import {
  requireAuth,
  AuthError,
  errorResponse,
  successResponse,
  parseJsonBody,
  getClientIP,
  isValidEmail,
} from '@/lib/auth-helpers';
import { logger } from '@/lib/logger';

const emailChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newEmail: z.string().email('Invalid email address'),
});

export async function PUT(request: NextRequest) {
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

    const user = await requireAuth(request);

    const body = await parseJsonBody(request);
    if (!body) {
      return errorResponse('Invalid request body', 400);
    }

    const validation = emailChangeSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return errorResponse(firstError?.message || 'Invalid input', 400);
    }

    const { currentPassword, newEmail } = validation.data;
    const normalizedEmail = newEmail.toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      return errorResponse('Invalid email format', 400);
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true, email: true },
    });

    if (!dbUser) {
      return errorResponse('User not found', 404);
    }

    if (dbUser.email === normalizedEmail) {
      return errorResponse('New email must be different from current email', 400);
    }

    if (!dbUser.passwordHash) {
      return errorResponse('This account uses Google sign-in. Email cannot be changed via password.', 400);
    }

    const isValidPassword = await verifyPassword(currentPassword, dbUser.passwordHash);
    if (!isValidPassword) {
      return errorResponse('Current password is incorrect', 401);
    }

    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingUser) {
      return errorResponse('This email is already in use', 409);
    }

    const verificationToken = generateEmailVerificationToken();

    // Store the pending email change in the token metadata
    // The token itself is stored temporarily; the verify endpoint will use it
    // We store it as a system config for retrieval during verification
    await db.systemConfig.upsert({
      where: { key: `email-change:${verificationToken}` },
      create: {
        key: `email-change:${verificationToken}`,
        value: JSON.stringify({
          userId: user.id,
          newEmail: normalizedEmail,
          createdAt: new Date().toISOString(),
        }),
        description: 'Pending email change verification',
      },
      update: {
        value: JSON.stringify({
          userId: user.id,
          newEmail: normalizedEmail,
          createdAt: new Date().toISOString(),
        }),
      },
    });

    await sendEmailVerification(normalizedEmail, verificationToken);

    await logAuditWithContext({
      userId: user.id,
      action: 'profile_update',
      entity: 'user',
      entityId: user.id,
      newValues: { action: 'email_change_requested', newEmail: normalizedEmail },
    });

    return successResponse(undefined, 'Verification email sent to new address');
  } catch (error) {
    if (error instanceof AuthError) {
      return errorResponse(error.message, error.statusCode);
    }
    logger.errorWithException('Email change error', error);
    return errorResponse('Failed to process email change', 500);
  }
}
