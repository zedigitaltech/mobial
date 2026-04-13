/**
 * POST /api/auth/2fa/disable
 * Disable 2FA for the authenticated user
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import {
  requireAuth,
  successResponse,
  errorResponse,
  parseJsonBody,
} from "@/lib/auth-helpers";
import { verifyTOTPCode, verifyBackupCode } from "@/lib/two-factor";
import { verifyPassword } from "@/lib/password";
import { decrypt } from "@/lib/encryption";
import { logAuditWithContext } from "@/lib/audit";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

// Validation schema
const disableSchema = z
  .object({
    password: z.string().optional(),
    totpCode: z.string().optional(),
    backupCode: z.string().optional(),
  })
  .refine((data) => data.password || data.totpCode || data.backupCode, {
    message: "Password, TOTP code, or backup code is required",
  });

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth(request);

    // Check if 2FA is enabled
    if (!user.twoFactorEnabled) {
      return errorResponse("Two-factor authentication is not enabled", 400);
    }

    // Parse and validate input
    const body = await parseJsonBody(request);

    if (!body) {
      return errorResponse("Invalid request body", 400);
    }

    const validationResult = disableSchema.safeParse(body);

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return errorResponse(firstError?.message || "Invalid input", 400);
    }

    const { password, totpCode, backupCode } = validationResult.data;

    // Get full user data
    const fullUser = await db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        passwordHash: true,
        twoFactorSecret: true,
        twoFactorBackupCodes: true,
      },
    });

    if (!fullUser) {
      return errorResponse("User not found", 404);
    }

    let verified = false;

    // Verify password if provided
    if (password && fullUser.passwordHash) {
      verified = await verifyPassword(password, fullUser.passwordHash);
    }

    // Verify TOTP code if provided and not already verified
    if (!verified && totpCode && fullUser.twoFactorSecret) {
      let secret = fullUser.twoFactorSecret;
      if (secret.includes(":")) {
        try {
          secret = decrypt(secret);
        } catch {
          /* use as-is if decrypt fails */
        }
      }
      verified = verifyTOTPCode(secret, totpCode);
    }

    // Verify backup code if provided and not already verified
    if (!verified && backupCode && fullUser.twoFactorBackupCodes) {
      let backupCodes: string[] = [];
      try {
        const parsed: unknown = JSON.parse(fullUser.twoFactorBackupCodes);
        if (Array.isArray(parsed)) backupCodes = parsed as string[];
      } catch {
        backupCodes = [];
      }
      const { valid, remainingCodes } = verifyBackupCode(
        backupCode,
        backupCodes,
      );

      if (valid) {
        verified = true;
        // Update backup codes
        await db.user.update({
          where: { id: user.id },
          data: {
            twoFactorBackupCodes: JSON.stringify(remainingCodes),
          },
        });
      }
    }

    if (!verified) {
      return errorResponse(
        "Invalid verification. Please provide correct password, TOTP code, or backup code.",
        401,
      );
    }

    // Disable 2FA
    await db.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: null,
      },
    });

    // Log audit event
    await logAuditWithContext({
      userId: user.id,
      action: "two_factor_disable",
      entity: "user",
      entityId: user.id,
    });

    return successResponse(null, "Two-factor authentication has been disabled");
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AuthError") {
        const authError = error as Error & { statusCode?: number };
        return errorResponse(authError.message, authError.statusCode || 500);
      }
    }
    logger.errorWithException("2FA disable error", error);
    return errorResponse("An error occurred", 500);
  }
}
