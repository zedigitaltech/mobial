/**
 * POST /api/auth/login
 * Authenticate user and return tokens
 */

import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { setAuthCookies, setVerifiedCookie } from "@/lib/auth-cookies";
import { z } from "zod";
import { verifyPassword, isBcryptHash, hashPassword } from "@/lib/password";
import { generateTokenPair } from "@/lib/jwt";
import { logAuditWithContext } from "@/lib/audit";
import { checkRateLimit, createRateLimitHeaders } from "@/lib/rate-limit";
import { verifyTOTPCode, verifyBackupCode } from "@/lib/two-factor";
import { decrypt } from "@/lib/encryption";
import { db } from "@/lib/db";
import {
  errorResponse,
  parseJsonBody,
  getClientIP,
  getUserAgent,
} from "@/lib/auth-helpers";
import { getPostHogClient } from "@/lib/posthog-server";
import { logger } from "@/lib/logger";

// Validation schema
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  totpCode: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Get client identifier for rate limiting
    const clientIP = getClientIP(request);

    // Check rate limit
    const rateLimitResult = await checkRateLimit(clientIP, "auth:login");

    if (!rateLimitResult.success) {
      const headers = createRateLimitHeaders(rateLimitResult);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Too many login attempts. Please try again later.",
          retryAfter: rateLimitResult.retryAfter,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            ...Object.fromEntries(headers.entries()),
          },
        },
      );
    }

    // Parse and validate input
    const body = await parseJsonBody(request);

    if (!body) {
      return errorResponse("Invalid request body", 400);
    }

    const validationResult = loginSchema.safeParse(body);

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return errorResponse(firstError?.message || "Invalid input", 400);
    }

    const { email, password, totpCode } = validationResult.data;

    // Find user
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Log failed attempt
      await logAuditWithContext({
        action: "login_failed",
        entity: "user",
        newValues: { email, reason: "user_not_found" },
      });

      return errorResponse("Invalid email or password", 401);
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      await logAuditWithContext({
        userId: user.id,
        action: "login_failed",
        entity: "user",
        entityId: user.id,
        newValues: { reason: "account_locked" },
      });

      return errorResponse(
        "Account is temporarily locked. Please try again later.",
        423,
      );
    }

    // Check if account is deleted
    if (user.deletedAt || user.status === "DELETED") {
      return errorResponse("Account not found", 404);
    }

    // Check if user has a password (Google-only accounts don't)
    if (!user.passwordHash) {
      return errorResponse(
        "This account uses Google sign-in. Please use the Google button to log in.",
        400,
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash);

    if (!isValidPassword) {
      // Increment failed attempts
      const failedAttempts = user.failedLoginAttempts + 1;

      // Lock account after 5 failed attempts
      const lockUntil =
        failedAttempts >= 5
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
        action: "login_failed",
        entity: "user",
        entityId: user.id,
        newValues: { reason: "invalid_password", attempts: failedAttempts },
      });

      return errorResponse("Invalid email or password", 401);
    }

    // Transparently re-hash legacy PBKDF2 passwords to bcrypt
    if (!isBcryptHash(user.passwordHash)) {
      const bcryptHash = await hashPassword(password);
      await db.user.update({
        where: { id: user.id },
        data: { passwordHash: bcryptHash },
      });
    }

    // Check 2FA if enabled
    if (user.twoFactorEnabled) {
      if (!totpCode) {
        // Return a challenge response so the client can redirect to the 2FA page.
        // Generate a short-lived temp token (5 minutes) scoped to this user.
        const tempToken = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        await db.systemConfig.upsert({
          where: { key: `2fa_temp_${user.id}` },
          update: { value: JSON.stringify({ token: tempToken, expiresAt }) },
          create: { key: `2fa_temp_${user.id}`, value: JSON.stringify({ token: tempToken, expiresAt }) },
        });
        return NextResponse.json(
          { success: true, data: { requires2FA: true, tempToken } },
          { status: 200 },
        );
      }

      // Verify TOTP code (decrypt if stored encrypted, backward-compatible with plaintext)
      const rawSecret = user.twoFactorSecret;
      let totpSecret = rawSecret;
      if (rawSecret && rawSecret.includes(":")) {
        try {
          totpSecret = decrypt(rawSecret);
        } catch {
          totpSecret = rawSecret;
        }
      }
      // Parse backup codes defensively — corrupt JSON should not crash login.
      let backupCodes: string[] = [];
      if (user.twoFactorBackupCodes) {
        try {
          const parsed: unknown = JSON.parse(user.twoFactorBackupCodes);
          if (Array.isArray(parsed)) backupCodes = parsed as string[];
        } catch {
          backupCodes = [];
        }
      }

      if (totpSecret) {
        const isValidTOTP = verifyTOTPCode(totpSecret, totpCode);

        if (!isValidTOTP) {
          // Check if it's a backup code
          const { valid, remainingCodes } = verifyBackupCode(
            totpCode,
            backupCodes,
          );

          if (!valid) {
            await logAuditWithContext({
              userId: user.id,
              action: "login_failed",
              entity: "user",
              entityId: user.id,
              newValues: { reason: "invalid_2fa" },
            });

            return errorResponse("Invalid two-factor authentication code", 401);
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

    // Track login in PostHog
    const distinctId = user.id;
    const posthog = getPostHogClient();
    if (posthog) {
      posthog.identify({ distinctId: user.id, properties: { email: user.email, name: user.name } });
      posthog.capture({ distinctId, event: 'user_logged_in', properties: { user_id: user.id, email: user.email } });
    }

    // Log audit event
    await logAuditWithContext({
      userId: user.id,
      action: "login",
      entity: "user",
      entityId: user.id,
    });

    // Return user and tokens (exclude sensitive fields)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _pw, twoFactorSecret: _ts, twoFactorBackupCodes: _bc, ...safeUser } = user;

    const rateHeaders = createRateLimitHeaders(rateLimitResult);

    const response = NextResponse.json(
      {
        success: true,
        data: {
          user: safeUser,
          tokens: {
            accessToken: tokens.accessToken,
            expiresIn: tokens.expiresIn,
          },
        },
        message: "Login successful",
      },
      { status: 200 },
    );

    for (const [k, v] of rateHeaders.entries()) response.headers.set(k, v);
    setAuthCookies(response, tokens.refreshToken);
    if (user.emailVerified) {
      setVerifiedCookie(response);
    }
    return response;
  } catch (error) {
    logger.errorWithException("Login error", error);
    return errorResponse("An error occurred during login", 500);
  }
}
