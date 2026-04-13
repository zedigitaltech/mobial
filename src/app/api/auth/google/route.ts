import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { OAuth2Client } from 'google-auth-library';
import { db } from '@/lib/db';
import { generateTokenPair } from '@/lib/jwt';
import { errorResponse, parseJsonBody } from '@/lib/auth-helpers';
import { checkRateLimit } from '@/lib/rate-limit';
import { setAuthCookies } from '@/lib/auth-cookies';
import { logger } from '@/lib/logger';

const googleAuthSchema = z.object({
  credential: z.string().min(1, 'Google credential is required'),
});

interface GoogleTokenPayload {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
  iss: string;
  aud: string;
}

async function verifyGoogleToken(credential: string, clientId: string): Promise<GoogleTokenPayload | null> {
  try {
    const oAuth2Client = new OAuth2Client(clientId);
    const ticket = await oAuth2Client.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });

    const payload = ticket.getPayload();
    if (!payload) return null;

    return {
      sub: payload.sub,
      email: payload.email ?? '',
      email_verified: payload.email_verified ?? false,
      name: payload.name,
      picture: payload.picture,
      iss: payload.iss ?? '',
      aud: typeof payload.aud === 'string' ? payload.aud : '',
    };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rateLimit = await checkRateLimit(ip, 'auth:login');
    if (!rateLimit.success) {
      return errorResponse('Too many login attempts. Please try again later.', 429);
    }

    const body = await parseJsonBody(request);
    const validation = googleAuthSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse(validation.error.issues[0].message, 400);
    }

    const { credential } = validation.data;

    // Guard: ensure Google OAuth is configured before attempting verification
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return errorResponse('Google authentication not configured', 503);
    }

    // Verify the Google ID token
    const googleUser = await verifyGoogleToken(credential, clientId);
    if (!googleUser || !googleUser.email) {
      return errorResponse('Invalid Google credential', 401);
    }

    if (!googleUser.email_verified) {
      return errorResponse('Google account email is not verified', 401);
    }

    // Find or create user
    let user = await db.user.findFirst({
      where: {
        OR: [
          { googleId: googleUser.sub },
          { email: googleUser.email.toLowerCase() },
        ],
      },
    });

    if (user) {
      // Existing user — link Google account if not already linked
      if (!user.googleId) {
        user = await db.user.update({
          where: { id: user.id },
          data: {
            googleId: googleUser.sub,
            authProvider: user.authProvider === 'email' ? 'email' : user.authProvider,
          },
        });
      }

      // Check account status
      if (user.status === 'SUSPENDED') {
        return errorResponse('Account is suspended', 403);
      }
      if (user.deletedAt) {
        return errorResponse('Account not found', 404);
      }

      // Update login info
      await db.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          lastLoginIp: ip,
          failedLoginAttempts: 0,
          // Set email as verified since Google verified it
          emailVerified: user.emailVerified || new Date(),
        },
      });
    } else {
      // New user — create account
      user = await db.user.create({
        data: {
          email: googleUser.email.toLowerCase(),
          name: googleUser.name || null,
          avatar: googleUser.picture || null,
          googleId: googleUser.sub,
          authProvider: 'google',
          status: 'ACTIVE',
          emailVerified: new Date(),
          lastLoginAt: new Date(),
          lastLoginIp: ip,
        },
      });
    }

    // Generate JWT tokens
    const tokens = generateTokenPair(user.id, user.email, user.role);

    // Create session
    await db.session.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ipAddress: ip,
        userAgent: request.headers.get('user-agent') || undefined,
      },
    });

    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
        },
        tokens: {
          accessToken: tokens.accessToken,
          expiresIn: tokens.expiresIn,
        },
      },
    }, { status: 200 });
    setAuthCookies(response, tokens.refreshToken);
    return response;
  } catch (error) {
    logger.errorWithException('Google auth error', error);
    return errorResponse('Authentication failed', 500);
  }
}
