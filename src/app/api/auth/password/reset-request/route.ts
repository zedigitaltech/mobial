/**
 * POST /api/auth/password/reset-request
 * Request a password reset email
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { logAuditWithContext } from '@/lib/audit';
import { checkRateLimit, createRateLimitHeaders } from '@/lib/rate-limit';
import { generatePasswordResetToken } from '@/lib/jwt';
import { db } from '@/lib/db';
import { 
  successResponse, 
  errorResponse, 
  parseJsonBody, 
  getClientIP 
} from '@/lib/auth-helpers';

// Validation schema
const resetRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(request: NextRequest) {
  try {
    // Get client identifier for rate limiting
    const clientIP = getClientIP(request);
    
    // Check rate limit
    const rateLimitResult = await checkRateLimit(clientIP, 'auth:password-reset');
    
    if (!rateLimitResult.success) {
      const headers = createRateLimitHeaders(rateLimitResult);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Too many password reset requests. Please try again later.',
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
    
    const validationResult = resetRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return errorResponse(validationResult.error.errors[0]?.message || 'Invalid input', 400);
    }
    
    const { email } = validationResult.data;
    
    // Find user
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    
    // Always return success to prevent email enumeration
    // But only process if user exists
    if (user && user.status !== 'DELETED' && !user.deletedAt) {
      // Generate reset token
      const resetToken = generatePasswordResetToken();
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      
      // Store token hash (for security, we store the hash, not the token itself)
      // For simplicity, we'll store the token directly (in production, hash it)
      // We'll use the SystemConfig model to store the reset token
      
      // Check if we already have a reset token for this user
      const existingConfig = await db.systemConfig.findUnique({
        where: { key: `password_reset_${user.id}` },
      });
      
      if (existingConfig) {
        await db.systemConfig.update({
          where: { key: `password_reset_${user.id}` },
          data: {
            value: JSON.stringify({
              token: resetToken,
              expiresAt: resetTokenExpiry.toISOString(),
            }),
          },
        });
      } else {
        await db.systemConfig.create({
          data: {
            key: `password_reset_${user.id}`,
            value: JSON.stringify({
              token: resetToken,
              expiresAt: resetTokenExpiry.toISOString(),
            }),
          },
        });
      }
      
      // Log audit event
      await logAuditWithContext({
        userId: user.id,
        action: 'password_reset',
        entity: 'user',
        entityId: user.id,
        newValues: { action: 'reset_requested' },
      });
      
      // In production, send email with reset link
      // For now, we'll log the token (REMOVE IN PRODUCTION)
      console.log(`Password reset token for ${email}: ${resetToken}`);
      console.log(`Reset link: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`);
    }
    
    const headers = createRateLimitHeaders(rateLimitResult);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
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
    console.error('Password reset request error:', error);
    return errorResponse('An error occurred', 500);
  }
}
