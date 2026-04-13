/**
 * POST /api/user/delete-account
 * Request account deletion (GDPR compliance)
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth, successResponse, errorResponse, parseJsonBody } from '@/lib/auth-helpers';
import { verifyPassword } from '@/lib/password';
import { logAuditWithContext } from '@/lib/audit';
import { db } from '@/lib/db';
import { DELETED_USER_EMAIL_DOMAIN } from '@/lib/env';
import { logger } from '@/lib/logger';

// Validation schema
const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required'),
  reason: z.string().max(500).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth(request);
    
    // Parse and validate input
    const body = await parseJsonBody(request);
    
    if (!body) {
      return errorResponse('Invalid request body', 400);
    }
    
    const validationResult = deleteAccountSchema.safeParse(body);

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return errorResponse(firstError?.message || 'Invalid input', 400);
    }
    
    const { password, reason } = validationResult.data;
    
    // Get user with password hash
    const fullUser = await db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        role: true,
      },
    });
    
    if (!fullUser) {
      return errorResponse('User not found', 404);
    }
    
    // Verify password (Google-only accounts don't have a password)
    if (!fullUser.passwordHash) {
      return errorResponse('This account uses Google sign-in. Please contact support for account deletion.', 400);
    }

    const isValidPassword = await verifyPassword(password, fullUser.passwordHash);

    if (!isValidPassword) {
      return errorResponse('Invalid password', 401);
    }
    
    // Atomic: check for pending orders, then mark user as DELETED in a single transaction
    // to prevent TOCTOU where a new order is created between the check and the soft-delete.
    let deletionRequest;
    try {
      deletionRequest = await db.$transaction(async (tx) => {
        const pendingOrders = await tx.order.count({
          where: {
            userId: user.id,
            status: { in: ['PENDING', 'PROCESSING'] },
          },
        });

        if (pendingOrders > 0) {
          throw Object.assign(
            new Error(`You have ${pendingOrders} pending order(s). Please complete or cancel them before deleting your account.`),
            { statusCode: 400 }
          );
        }

        const req = await tx.dataDeletionRequest.create({
          data: {
            userId: user.id,
            userEmail: fullUser.email,
            status: 'PROCESSING',
            reason,
            processedAt: new Date(),
          },
        });

        await tx.user.update({
          where: { id: user.id },
          data: {
            status: 'DELETED',
            deletedAt: new Date(),
            email: `deleted_${user.id}_${Date.now()}@${DELETED_USER_EMAIL_DOMAIN}`,
            name: 'Deleted User',
            phone: null,
            avatar: null,
            twoFactorEnabled: false,
            twoFactorSecret: null,
            twoFactorBackupCodes: null,
          },
        });

        await tx.session.deleteMany({ where: { userId: user.id } });

        return req;
      });
    } catch (txError: unknown) {
      if (txError && typeof txError === 'object' && 'statusCode' in txError) {
        const e = txError as Error & { statusCode: number };
        return errorResponse(e.message, e.statusCode);
      }
      throw txError;
    }
    
    // Log audit event
    await logAuditWithContext({
      userId: user.id,
      action: 'account_delete',
      entity: 'user',
      entityId: user.id,
      newValues: {
        reason,
        requestId: deletionRequest.id,
      },
    });
    
    // Schedule permanent deletion (in production, this would be a background job)
    // For now, we'll just mark it for deletion after 30 days
    // The actual permanent deletion would be handled by a scheduled job
    
    return successResponse({
      requestId: deletionRequest.id,
      message: 'Your account has been scheduled for deletion. You have 30 days to contact support if you wish to recover your account.',
      deletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }, 'Account deletion requested');
    
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') {
      const authError = error as Error & { statusCode?: number };
      return errorResponse(authError.message, authError.statusCode || 500);
    }
    logger.errorWithException('Account deletion error', error);
    return errorResponse('An error occurred', 500);
  }
}
