/**
 * POST /api/auth/password/reset
 * Reset password using reset token
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

// Validation schema
const resetSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate input
    const body = await parseJsonBody(request);
    
    if (!body) {
      return errorResponse('Invalid request body', 400);
    }
    
    const validationResult = resetSchema.safeParse(body);
    
    if (!validationResult.success) {
      return errorResponse(validationResult.error.errors[0]?.message || 'Invalid input', 400);
    }
    
    const { token, newPassword } = validationResult.data;
    
    // Check password strength
    const passwordCheck = checkPasswordStrength(newPassword);
    if (!passwordCheck.isStrong) {
      return errorResponse(
        `Password is too weak: ${passwordCheck.feedback.join(', ')}`,
        400
      );
    }
    
    // Find reset token in system config
    // We need to find which user has this token
    const configs = await db.systemConfig.findMany({
      where: {
        key: { startsWith: 'password_reset_' },
      },
    });
    
    let userId: string | null = null;
    let tokenData: { token: string; expiresAt: string } | null = null;
    
    for (const config of configs) {
      try {
        const data = JSON.parse(config.value) as { token: string; expiresAt: string };
        if (data.token === token) {
          userId = config.key.replace('password_reset_', '');
          tokenData = data;
          break;
        }
      } catch {
        // Skip invalid entries
      }
    }
    
    if (!userId || !tokenData) {
      return errorResponse('Invalid or expired reset token', 400);
    }
    
    // Check if token is expired
    if (new Date(tokenData.expiresAt) < new Date()) {
      // Delete expired token
      await db.systemConfig.delete({
        where: { key: `password_reset_${userId}` },
      });
      return errorResponse('Reset token has expired', 400);
    }
    
    // Find user
    const user = await db.user.findUnique({
      where: { id: userId },
    });
    
    if (!user || user.status === 'DELETED' || user.deletedAt) {
      return errorResponse('Account not found', 404);
    }
    
    // Hash new password
    const passwordHash = await hashPassword(newPassword);
    
    // Update password
    await db.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
    
    // Delete the reset token
    await db.systemConfig.delete({
      where: { key: `password_reset_${userId}` },
    });
    
    // Invalidate all existing sessions
    await db.session.deleteMany({
      where: { userId },
    });
    
    // Log audit event
    await logAuditWithContext({
      userId,
      action: 'password_change',
      entity: 'user',
      entityId: userId,
      newValues: { method: 'reset' },
    });
    
    return successResponse(null, 'Password has been reset successfully. Please login with your new password.');
    
  } catch (error) {
    console.error('Password reset error:', error);
    return errorResponse('An error occurred', 500);
  }
}
