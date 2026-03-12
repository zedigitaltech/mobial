/**
 * POST /api/auth/login
 * Authenticate user and return tokens
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { verifyPassword } from '@/lib/password';
import { generateTokenPair } from '@/lib/jwt';
import { logAuditWithContext } from '@/lib/audit';
import { checkRateLimit, createRateLimitHeaders } from '@/lib/rate-limit';
import { verifyTOTPCode, verifyBackupCode } from '@/lib/two-factor';
import { db } from '@/lib/db';
import {
  errorResponse,
  parseJsonBody,
  getClientIP,
  getUserAgent
} from '@/lib/auth-helpers';

// Validation schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  totpCode: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Get client identifier for rate limiting
    const clientIP = getClientIP(request);
    
    // Check rate limit
    const rateLimitResult = await checkRateLimit(clientIP, 'auth:login');
    
    if (!rateLimitResult.success) {
      const headers = createRateLimitHeaders(rateLimitResult);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Too many login attempts. Please try again later.',
          retryAfter: rateLimitResult.retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...Object.fromEntries(headers.entries()),
          },
        }
      );
    }
    
    // Parse and validate input
    const body = await parseJsonBody(request);
    
    if (!body) {
      return errorResponse('Invalid request body', 400);
    }
    
    const validationResult = loginSchema.safeParse(body);

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return errorResponse(firstError?.message || 'Invalid input', 400);
    }
    
    const { email, password, totpCode } = validationResult.data;
    
    // Find user
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    
    if (!user) {
      // Log failed attempt
      await logAuditWithContext({
        action: 'login_failed',
        entity: 'user',
        newValues: { email, reason: 'user_not_found' },
      });
      
      return errorResponse('Invalid email or password', 401);
    }
    
    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      await logAuditWithContext({
        userId: user.id,
        action: 'login_failed',
        entity: 'user',
        entityId: user.id,
        newValues: { reason: 'account_locked' },
      });
      
      return errorResponse('Account is temporarily locked. Please try again later.', 423);
    }
    
    // Check if account is deleted
    if (user.deletedAt || user.status === 'DELETED') {
      return errorResponse('Account not found', 404);
    }
    
    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    
    if (!isValidPassword) {
      // Increment failed attempts
      const failedAttempts = user.failedLoginAttempts + 1;
      
      // Lock account after 5 failed attempts
      const lockUntil = failedAttempts >= 5 
        ? new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
        : null;
      
      await db.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: failedAttempts,
          lockedUntil: lockUntil,
        },
      });
      
      await logAuditWithContext({
        userId: user.id,
        action: 'login_failed',
        entity: 'user',
        entityId: user.id,
        newValues: { reason: 'invalid_password', attempts: failedAttempts },
      });
      
      return errorResponse('Invalid email or password', 401);
    }
    
    // Check 2FA if enabled
    if (user.twoFactorEnabled) {
      if (!totpCode) {
        return errorResponse('Two-factor authentication code required', 401);
      }
      
      // Verify TOTP code
      const totpSecret = user.twoFactorSecret;
      const backupCodes = user.twoFactorBackupCodes 
        ? JSON.parse(user.twoFactorBackupCodes) 
        : [];
      
      if (totpSecret) {
        const isValidTOTP = verifyTOTPCode(totpSecret, totpCode);
        
        if (!isValidTOTP) {
          // Check if it's a backup code
          const { valid, remainingCodes } = verifyBackupCode(totpCode, backupCodes);
          
          if (!valid) {
            await logAuditWithContext({
              userId: user.id,
              action: 'login_failed',
              entity: 'user',
              entityId: user.id,
              newValues: { reason: 'invalid_2fa' },
            });
            
            return errorResponse('Invalid two-factor authentication code', 401);
          }
          
          // Update backup codes
          await db.user.update({
            where: { id: user.id },
            data: {
              twoFactorBackupCodes: JSON.stringify(remainingCodes),
            },
          });
        }
      }
    }
    
    // Generate tokens
    const tokens = generateTokenPair(user.id, user.email, user.role);
    
    // Update user login info
    await db.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: clientIP,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
    
    // Create session
    await db.session.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        userAgent: getUserAgent(request),
        ipAddress: clientIP,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });
    
    // Log audit event
    await logAuditWithContext({
      userId: user.id,
      action: 'login',
      entity: 'user',
      entityId: user.id,
    });
    
    // Return user and tokens (exclude sensitive fields)
    const {
      passwordHash: _pw,
      twoFactorSecret: _ts,
      twoFactorBackupCodes: _bc,
      ...safeUser
    } = user;
    
    const headers = createRateLimitHeaders(rateLimitResult);
    
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          user: safeUser,
          tokens: {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresIn: tokens.expiresIn,
          },
        },
        message: 'Login successful',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...Object.fromEntries(headers.entries()),
        },
      }
    );
    
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse('An error occurred during login', 500);
  }
}
