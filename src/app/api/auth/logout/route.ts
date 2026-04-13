/**
 * POST /api/auth/logout
 * Logout user and invalidate session
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logAuditWithContext } from '@/lib/audit';
import { db } from '@/lib/db';
import {
  errorResponse,
  parseJsonBody,
  getAuthUser,
} from '@/lib/auth-helpers';
import { clearAuthCookies, readRefreshCookie } from '@/lib/auth-cookies';
import { verifyToken } from '@/lib/jwt';
import { logger } from '@/lib/logger';

// Validation schema
const logoutSchema = z.object({
  refreshToken: z.string().optional(),
  allDevices: z.boolean().optional(),
});

function success(message = 'Logged out successfully'): NextResponse {
  const response = NextResponse.json(
    { success: true, data: null, message },
    { status: 200 },
  );
  clearAuthCookies(response);
  return response;
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);

    const body = await parseJsonBody(request) || {};
    const validationResult = logoutSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse('Invalid request body', 400);
    }

    const { refreshToken: bodyRefreshToken, allDevices } = validationResult.data;
    // Prefer cookie-sourced refresh token over body.
    const refreshToken = readRefreshCookie(request) || bodyRefreshToken;

    // Derive user identity from whichever credential is present.
    // Access token may be missing or expired, but a valid refresh token
    // still uniquely identifies the caller and must revoke the session.
    let userId: string | null = authUser?.id ?? null;
    if (!userId && refreshToken) {
      const payload = verifyToken(refreshToken);
      if (payload && payload.type === 'refresh') {
        userId = payload.sub;
      }
    }

    if (!userId) {
      // No identifiable credential — clear cookies and move on.
      return success();
    }

    if (allDevices) {
      await db.session.deleteMany({ where: { userId } });
    } else if (refreshToken) {
      // Revoke the specific session tied to this refresh token.
      await db.session.deleteMany({
        where: { userId, token: refreshToken },
      });
    }

    await logAuditWithContext({
      userId,
      action: 'logout',
      entity: 'user',
      entityId: userId,
      newValues: { allDevices: allDevices || false },
    });

    return success();

  } catch (error) {
    logger.errorWithException('Logout error', error);
    return errorResponse('An error occurred during logout', 500);
  }
}
