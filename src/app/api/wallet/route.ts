/**
 * Wallet API
 * GET /api/wallet - Get wallet balance for authenticated user
 */

import { NextRequest } from "next/server";
import {
  requireAuth,
  successResponse,
  errorResponse,
  AuthError,
} from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

const log = logger.child("api:wallet");

/**
 * GET /api/wallet
 * Returns wallet balance. Creates wallet if it doesn't exist.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const wallet = await db.wallet.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        balance: 0,
        currency: "USD",
      },
      update: {},
    });

    return successResponse({
      balance: wallet.balance,
      currency: wallet.currency,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return errorResponse(error.message, error.statusCode);
    }
    log.errorWithException("Failed to get wallet", error);
    return errorResponse("Failed to retrieve wallet", 500);
  }
}
