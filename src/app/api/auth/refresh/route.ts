/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { verifyToken } from '@/lib/jwt';
import { generateTokenPair } from '@/lib/jwt';
import { logAuditWithContext } from '@/lib/audit';
import { db } from '@/lib/db';
import { 
  successResponse, 
  errorResponse, 
  parseJsonBody 
} from '@/lib/auth-helpers';

// Validation schema
const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate input
    const body = await parseJsonBody(request);
    
    if (!body) {
      return errorResponse('Invalid request body', 400);
    }
    
    const validationResult = refreshSchema.safeParse(body);
    
    if (!validationResult.success) {
      return errorResponse(validationResult.error.errors[0]?.message || 'Invalid input', 400);
    }
    
    const { refreshToken } = validationResult.data;
    
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
    
    return successResponse({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    }, 'Token refreshed successfully');
    
  } catch (error) {
    console.error('Token refresh error:', error);
    return errorResponse('An error occurred during token refresh', 500);
  }
}
