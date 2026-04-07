/**
 * POST /api/auth/register
 * Register a new user account
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { hashPassword, checkPasswordStrength } from '@/lib/password';
import { generateTokenPair, generateEmailVerificationToken } from '@/lib/jwt';
import { logAuditWithContext } from '@/lib/audit';
import { db } from '@/lib/db';
import { sendEmailVerification, sendWelcome } from '@/services/email-service';
import {
  successResponse,
  errorResponse,
  parseJsonBody,
  getClientIP,
  getUserAgent
} from '@/lib/auth-helpers';
import { checkRateLimit, createRateLimitHeaders } from '@/lib/rate-limit';
import { getPostHogClient } from '@/lib/posthog-server';

// Validation schema
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Check rate limit
    const clientIP = getClientIP(request);
    const rateLimitResult = await checkRateLimit(clientIP, 'auth:register');
    if (!rateLimitResult.success) {
      const headers = createRateLimitHeaders(rateLimitResult);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Too many registration attempts. Please try again later.',
          retryAfter: rateLimitResult.retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...Object.fromEntries(headers.entries()),
          },
        },
      );
    }

    // Parse and validate input
    const body = await parseJsonBody(request);
    
    if (!body) {
      return errorResponse('Invalid request body', 400);
    }
    
    const validationResult = registerSchema.safeParse(body);

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return errorResponse(firstError?.message || 'Invalid input', 400);
    }
    
    const { email, password, name, phone } = validationResult.data;
    
    // Check password strength
    const passwordCheck = checkPasswordStrength(password);
    if (!passwordCheck.isStrong) {
      return errorResponse(
        `Password is too weak: ${passwordCheck.feedback.join(', ')}`,
        400
      );
    }
    
    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    
    if (existingUser) {
      return errorResponse('An account with this email already exists', 409);
    }
    
    // Hash password
    const passwordHash = await hashPassword(password);
    
    // Create user
    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        name,
        phone: phone || null,
        role: 'CUSTOMER',
        status: 'PENDING_VERIFICATION',
      },
    });
    
    // Generate tokens
    const tokens = generateTokenPair(user.id, user.email, user.role);
    
    // Create session
    await db.session.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        userAgent: getUserAgent(request),
        ipAddress: getClientIP(request),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });
    
    // Generate email verification token and store it
    const verificationToken = generateEmailVerificationToken();
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await db.systemConfig.create({
      data: {
        key: `verify_token:${user.id}`,
        value: JSON.stringify({
          token: verificationToken,
          expiresAt: verificationExpiry.toISOString(),
        }),
      },
    });

    await sendEmailVerification(user.email, verificationToken);

    // Fire-and-forget welcome email
    sendWelcome(user.email, user.name ?? '').catch((err) =>
      console.error('[Register] Failed to send welcome email:', err)
    );

    // Track signup in PostHog
    const distinctId = user.id;
    const posthog = getPostHogClient();
    if (posthog) {
      posthog.identify({ distinctId: user.id, properties: { email: user.email, name: user.name } });
      posthog.capture({ distinctId, event: 'user_signed_up', properties: { user_id: user.id, email: user.email, name: user.name } });
    }

    // Log audit event
    await logAuditWithContext({
      userId: user.id,
      action: 'account_create',
      entity: 'user',
      entityId: user.id,
      newValues: {
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    // Return user and tokens (exclude sensitive fields)
    const { passwordHash: _pw, ...safeUser } = user;
    
    return successResponse({
      user: safeUser,
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
      },
    }, 'Account created successfully');
    
  } catch (error) {
    console.error('Registration error:', error);
    return errorResponse('An error occurred during registration', 500);
  }
}
