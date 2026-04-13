/**
 * POST /api/auth/2fa/verify
 * Verify TOTP code and enable 2FA
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import {
  requireAuth,
  successResponse,
  errorResponse,
  parseJsonBody,
} from "@/lib/auth-helpers";
import {
  verifyTOTPCode,
  generateBackupCodes,
  hashBackupCodes,
} from "@/lib/two-factor";
import { encrypt } from "@/lib/encryption";
import { logAuditWithContext } from "@/lib/audit";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

// Validation schema
const verifySchema = z.object({
  totpCode: z.string().length(6, "TOTP code must be 6 digits"),
});

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth(request);

    // Parse and validate input
    const body = await parseJsonBody(request);

    if (!body) {
      return errorResponse("Invalid request body", 400);
    }

    const validationResult = verifySchema.safeParse(body);

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return errorResponse(firstError?.message || "Invalid input", 400);
    }

    const { totpCode } = validationResult.data;

    // Check if 2FA is already enabled
    if (user.twoFactorEnabled) {
      return errorResponse("Two-factor authentication is already enabled", 400);
    }

    // Get the temporary secret
    const config = await db.systemConfig.findUnique({
      where: { key: `2fa_setup_${user.id}` },
    });

    if (!config) {
      return errorResponse(
        "No 2FA setup in progress. Please start the setup first.",
        400,
      );
    }

    let setupData: { secret: string; createdAt: string } | null = null;
    try {
      setupData = JSON.parse(config.value) as { secret: string; createdAt: string };
    } catch {
      await db.systemConfig.delete({ where: { key: `2fa_setup_${user.id}` } });
      return errorResponse('2FA setup data is corrupted. Please start the setup again.', 400);
    }

    if (!setupData?.secret || !setupData?.createdAt) {
      await db.systemConfig.delete({ where: { key: `2fa_setup_${user.id}` } });
      return errorResponse('2FA setup data is invalid. Please start the setup again.', 400);
    }

    // Check if setup has expired (10 minutes)
    const setupTime = new Date(setupData.createdAt);
    if (Date.now() - setupTime.getTime() > 10 * 60 * 1000) {
      await db.systemConfig.delete({
        where: { key: `2fa_setup_${user.id}` },
      });
      return errorResponse(
        "2FA setup has expired. Please start the setup again.",
        400,
      );
    }

    // Verify TOTP code
    const isValid = verifyTOTPCode(setupData.secret, totpCode);

    if (!isValid) {
      return errorResponse("Invalid verification code", 400);
    }

    // Generate backup codes
    const backupCodes = generateBackupCodes(10);
    const hashedBackupCodes = hashBackupCodes(backupCodes);

    // Enable 2FA (encrypt secret at rest)
    await db.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: encrypt(setupData.secret),
        twoFactorBackupCodes: JSON.stringify(hashedBackupCodes),
      },
    });

    // Delete the temporary setup config
    await db.systemConfig.delete({
      where: { key: `2fa_setup_${user.id}` },
    });

    // Log audit event
    await logAuditWithContext({
      userId: user.id,
      action: "two_factor_enable",
      entity: "user",
      entityId: user.id,
    });

    return successResponse(
      {
        backupCodes,
        message:
          "Save these backup codes in a secure location. They can be used to access your account if you lose your authenticator device.",
      },
      "Two-factor authentication enabled successfully",
    );
  } catch (error) {
    if (error instanceof Error && error.name === "AuthError") {
      const authError = error as Error & { statusCode?: number };
      return errorResponse(authError.message, authError.statusCode || 500);
    }
    logger.errorWithException("2FA verify error", error);
    return errorResponse("An error occurred", 500);
  }
}
