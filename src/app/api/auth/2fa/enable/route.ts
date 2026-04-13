/**
 * POST /api/auth/2fa/enable
 * Initialize 2FA setup - generates TOTP secret and QR code URL
 */

import { NextRequest } from 'next/server';
import { requireAuth, successResponse, errorResponse } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { generateTOTPSecret, generateOTPAuthURL } from '@/lib/two-factor';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth(request);
    
    // Check if 2FA is already enabled
    if (user.twoFactorEnabled) {
      return errorResponse('Two-factor authentication is already enabled', 400);
    }
    
    // Generate TOTP secret
    const secret = generateTOTPSecret();
    
    // Generate OTP auth URL for QR code
    const otpAuthUrl = generateOTPAuthURL(secret, user.email);
    
    await db.systemConfig.upsert({
      where: { key: `2fa_setup_${user.id}` },
      create: {
        key: `2fa_setup_${user.id}`,
        value: JSON.stringify({
          secret,
          createdAt: new Date().toISOString(),
        }),
      },
      update: {
        value: JSON.stringify({
          secret,
          createdAt: new Date().toISOString(),
        }),
      },
    });
    
    return successResponse({
      secret,
      otpAuthUrl,
      qrCodeData: otpAuthUrl, // Can be used with QR code generator libraries
    }, 'Two-factor authentication setup initiated');
    
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') {
      const authError = error as Error & { statusCode?: number };
      return errorResponse(authError.message, authError.statusCode || 500);
    }
    logger.errorWithException('2FA enable error', error);
    return errorResponse('An error occurred', 500);
  }
}
