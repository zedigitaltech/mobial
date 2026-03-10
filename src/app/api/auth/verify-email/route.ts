/**
 * GET /api/auth/verify-email
 * Verify email address using verification token
 */

import { NextRequest } from 'next/server';
import { logAuditWithContext } from '@/lib/audit';
import { db } from '@/lib/db';
import {
  successResponse,
  errorResponse,
} from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return errorResponse('Verification token is required', 400);
    }

    // Find the verification token across SystemConfig entries
    const configs = await db.systemConfig.findMany({
      where: {
        key: { startsWith: 'verify_token:' },
      },
    });

    let userId: string | null = null;
    let tokenData: { token: string; expiresAt: string } | null = null;

    for (const config of configs) {
      try {
        const data = JSON.parse(config.value) as { token: string; expiresAt: string };
        if (data.token === token) {
          userId = config.key.replace('verify_token:', '');
          tokenData = data;
          break;
        }
      } catch {
        // Skip invalid entries
      }
    }

    if (!userId || !tokenData) {
      return errorResponse('Invalid or expired verification token', 400);
    }

    if (new Date(tokenData.expiresAt) < new Date()) {
      await db.systemConfig.delete({
        where: { key: `verify_token:${userId}` },
      });
      return errorResponse('Verification token has expired. Please request a new one.', 400);
    }

    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.status === 'DELETED' || user.deletedAt) {
      return errorResponse('Account not found', 404);
    }

    if (user.status === 'ACTIVE' && user.emailVerified) {
      // Already verified, clean up token
      await db.systemConfig.delete({
        where: { key: `verify_token:${userId}` },
      });
      return successResponse(null, 'Email is already verified.');
    }

    await db.user.update({
      where: { id: userId },
      data: {
        status: 'ACTIVE',
        emailVerified: new Date(),
      },
    });

    await db.systemConfig.delete({
      where: { key: `verify_token:${userId}` },
    });

    await logAuditWithContext({
      userId,
      action: 'email_verify',
      entity: 'user',
      entityId: userId,
      newValues: { status: 'ACTIVE' },
    });

    return successResponse(null, 'Email verified successfully. You can now log in.');
  } catch (error) {
    console.error('Email verification error:', error);
    return errorResponse('An error occurred', 500);
  }
}
