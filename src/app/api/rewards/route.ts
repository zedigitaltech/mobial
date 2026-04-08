/**
 * Rewards API
 * GET /api/rewards - List rewards for authenticated user + total balance
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

const log = logger.child("api:rewards");

/**
 * GET /api/rewards
 * Returns all rewards for the authenticated user with summary totals.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const rewards = await db.reward.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const totals = rewards.reduce(
      (acc, r) => {
        if (r.type === "cashback") {
          return { ...acc, cashback: acc.cashback + r.amount };
        }
        if (r.type === "referral_bonus") {
          return { ...acc, referral: acc.referral + r.amount };
        }
        if (r.type === "discount" && r.amount < 0) {
          return { ...acc, spent: acc.spent + Math.abs(r.amount) };
        }
        return acc;
      },
      { cashback: 0, referral: 0, spent: 0 },
    );

    const totalEarned =
      Math.round((totals.cashback + totals.referral) * 100) / 100;
    const totalSpent = Math.round(totals.spent * 100) / 100;

    return successResponse({
      rewards: rewards.map((r) => ({
        id: r.id,
        type: r.type,
        amount: r.amount,
        orderId: r.orderId,
        description: r.description,
        createdAt: r.createdAt.toISOString(),
      })),
      summary: {
        totalEarned,
        totalSpent,
        netBalance: Math.round((totalEarned - totalSpent) * 100) / 100,
        cashbackTotal: Math.round(totals.cashback * 100) / 100,
        referralTotal: Math.round(totals.referral * 100) / 100,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return errorResponse(error.message, error.statusCode);
    }
    log.errorWithException("Failed to get rewards", error);
    return errorResponse("Failed to retrieve rewards", 500);
  }
}
