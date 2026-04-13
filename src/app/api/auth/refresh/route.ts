/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { generateTokenPair } from '@/lib/jwt';
import { db } from '@/lib/db';
import {
  errorResponse,
  parseJsonBody,
} from '@/lib/auth-helpers';
import { readRefreshCookie, setAuthCookies } from '@/lib/auth-cookies';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // CSRF protection: validate Origin header
    const origin = request.headers.get('origin');
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    if (origin && origin !== baseUrl) {
      return errorResponse('Invalid origin', 403);
    }

    // Prefer HttpOnly cookie (XSS-proof) over body for the refresh token.
    // Body is still accepted for backward compatibility with older clients.
    let refreshToken = readRefreshCookie(request);
    if (!refreshToken) {
      const body = await parseJsonBody<{ refreshToken?: string }>(request);
      refreshToken = body?.refreshToken ?? null;
    }

    if (!refreshToken) {
      return errorResponse('Refresh token is required', 400);
    }
    
    // Verify refresh token
    const payload = verifyToken(refreshToken);
    
    if (!payload || payload.type !== 'refresh') {
      return errorResponse('Invalid refresh token', 401);
    }
    
    // Check if session exists
    const session = await db.session.findFirst({
      where: {
        userId: payload.sub,
        token: refreshToken,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: true,
      },
    });
    
    if (!session) {
      return errorResponse('Session not found or expired', 401);
    }
    
    // Check if user is still active
    if (session.user.status === 'DELETED' || session.user.deletedAt) {
      // Delete the session
      await db.session.delete({ where: { id: session.id } });
      return errorResponse('Account not found', 401);
    }
    
    // Generate new tokens
    const tokens = generateTokenPair(
      session.user.id,
      session.user.email,
      session.user.role
    );
    
    // Update session with new refresh token
    await db.session.update({
      where: { id: session.id },
      data: {
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });
    
    // Log audit event (optional - might be too noisy)
    // await logAuditWithContext({
    //   userId: session.user.id,
    //   action: 'login',
    //   entity: 'user',
    //   entityId: session.user.id,
    //   newValues: { action: 'token_refresh' },
    // });
    
    const response = NextResponse.json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn,
      },
      message: 'Token refreshed successfully',
    }, { status: 200 });
    setAuthCookies(response, tokens.refreshToken);
    return response;

  } catch (error) {
    logger.errorWithException('Token refresh error', error);
    return errorResponse('An error occurred during token refresh', 500);
  }
}
