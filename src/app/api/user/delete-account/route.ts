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
      return errorResponse(validationResult.error.errors[0]?.message || 'Invalid input', 400);
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
    
    // Verify password
    const isValidPassword = await verifyPassword(password, fullUser.passwordHash);
    
    if (!isValidPassword) {
      return errorResponse('Invalid password', 401);
    }
    
    // Check for pending orders
    const pendingOrders = await db.order.count({
      where: {
        userId: user.id,
        status: { in: ['PENDING', 'PROCESSING'] },
      },
    });
    
    if (pendingOrders > 0) {
      return errorResponse(
        `You have ${pendingOrders} pending order(s). Please complete or cancel them before deleting your account.`,
        400
      );
    }
    
    // Check for pending payouts (if affiliate)
    if (fullUser.role === 'AFFILIATE') {
      const pendingPayouts = await db.payout.count({
        where: {
          affiliate: { userId: user.id },
          status: { in: ['PENDING', 'PROCESSING'] },
        },
      });
      
      if (pendingPayouts > 0) {
        return errorResponse(
          `You have ${pendingPayouts} pending payout(s). Please wait for them to complete before deleting your account.`,
          400
        );
      }
    }
    
    // Create deletion request
    const deletionRequest = await db.dataDeletionRequest.create({
      data: {
        userId: user.id,
        userEmail: fullUser.email,
        status: 'PENDING',
        reason,
      },
    });
    
    // Soft delete the user (GDPR compliant - can be permanently deleted after retention period)
    await db.user.update({
      where: { id: user.id },
      data: {
        status: 'DELETED',
        deletedAt: new Date(),
        email: `deleted_${user.id}_${Date.now()}@deleted.mobial.com`, // Anonymize email
        name: 'Deleted User',
        phone: null,
        avatar: null,
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: null,
      },
    });
    
    // Delete all sessions
    await db.session.deleteMany({
      where: { userId: user.id },
    });
    
    // Update deletion request status
    await db.dataDeletionRequest.update({
      where: { id: deletionRequest.id },
      data: {
        status: 'PROCESSING',
        processedAt: new Date(),
      },
    });
    
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
      return errorResponse(error.message, (error as { statusCode: number }).statusCode);
    }
    console.error('Account deletion error:', error);
    return errorResponse('An error occurred', 500);
  }
}
