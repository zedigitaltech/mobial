/**
 * Payment Methods API
 * GET /api/user/payment-methods - List saved payment methods for authenticated user
 */

import { NextRequest } from "next/server";
import {
  requireAuth,
  successResponse,
  errorResponse,
  AuthError,
} from "@/lib/auth-helpers";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

const log = logger.child("api:payment-methods");

/**
 * GET /api/user/payment-methods
 * List saved payment methods for the authenticated user's Stripe customer
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { stripeCustomerId: true },
    });

    if (!dbUser?.stripeCustomerId) {
      return successResponse({ paymentMethods: [] });
    }

    const paymentMethods = await stripe.paymentMethods.list({
      customer: dbUser.stripeCustomerId,
      type: "card",
    });

    const cards = paymentMethods.data.map((pm) => ({
      id: pm.id,
      brand: pm.card?.brand ?? "unknown",
      last4: pm.card?.last4 ?? "****",
      expMonth: pm.card?.exp_month ?? 0,
      expYear: pm.card?.exp_year ?? 0,
      isDefault: false,
    }));

    return successResponse({ paymentMethods: cards });
  } catch (error) {
    if (error instanceof AuthError) {
      return errorResponse(error.message, error.statusCode);
    }
    log.errorWithException("Failed to list payment methods", error);
    return errorResponse("Failed to retrieve payment methods", 500);
  }
}
