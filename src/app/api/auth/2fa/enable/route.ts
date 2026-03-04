/**
 * POST /api/auth/2fa/enable
 * Initialize 2FA setup - generates TOTP secret and QR code URL
 */

import { NextRequest } from 'next/server';
import { requireAuth, successResponse, errorResponse } from '@/lib/auth-helpers';
import { generateTOTPSecret, generateOTPAuthURL } from '@/lib/two-factor';

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
    
    // Store the secret temporarily (user needs to verify before it's actually enabled)
    // We'll use a temporary config key
    const { db } = await import('@/lib/db');
    
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
      return errorResponse(error.message, (error as { statusCode: number }).statusCode);
    }
    console.error('2FA enable error:', error);
    return errorResponse('An error occurred', 500);
  }
}
