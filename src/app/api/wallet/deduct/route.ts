/**
 * Wallet Deduct API
 * POST /api/wallet/deduct - Deduct from wallet (used internally during checkout)
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import {
  requireAuth,
  successResponse,
  errorResponse,
  parseJsonBody,
  AuthError,
} from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

const log = logger.child("api:wallet:deduct");

const deductSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  orderId: z.string().optional(),
  description: z.string().optional(),
});

/**
 * POST /api/wallet/deduct
 * Deducts from the authenticated user's wallet.
 * Used internally during checkout to apply wallet balance.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const body = await parseJsonBody(request);
    const validation = deductSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(validation.error.issues[0].message, 400);
    }

    const { amount, orderId, description } = validation.data;

    // Use a transaction to ensure atomicity
    const result = await db.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId: user.id },
      });

      if (!wallet) {
        throw new Error("Wallet not found");
      }

      if (wallet.balance < amount) {
        throw new Error("Insufficient wallet balance");
      }

      const updatedWallet = await tx.wallet.update({
        where: { userId: user.id },
        data: {
          balance: { decrement: amount },
        },
      });

      // Record in the wallet ledger (signed by `type`, amount is non-negative).
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          userId: user.id,
          type: "debit",
          amount,
          orderId: orderId ?? null,
          description: description ?? "Wallet payment",
        },
      });

      return updatedWallet;
    });

    return successResponse({
      balance: result.balance,
      deducted: amount,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return errorResponse(error.message, error.statusCode);
    }

    const message =
      error instanceof Error ? error.message : "Failed to deduct from wallet";

    if (
      message === "Insufficient wallet balance" ||
      message === "Wallet not found"
    ) {
      return errorResponse(message, 400);
    }

    log.errorWithException("Failed to deduct from wallet", error);
    return errorResponse("Failed to process wallet deduction", 500);
  }
}
