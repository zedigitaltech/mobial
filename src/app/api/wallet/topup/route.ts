/**
 * Wallet Top-up API
 * POST /api/wallet/topup - Create a Stripe checkout session to top up wallet
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
import Stripe from "stripe";
import { stripe, getOrCreateStripeCustomer } from "@/lib/stripe";
import { logger } from "@/lib/logger";

const log = logger.child("api:wallet:topup");

const topupSchema = z.object({
  amount: z
    .number()
    .min(1, "Minimum top-up is $1")
    .max(500, "Maximum top-up is $500"),
});

/**
 * POST /api/wallet/topup
 * Creates a Stripe checkout session for wallet top-up.
 * On success, the webhook credits the wallet.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const body = await parseJsonBody(request);
    const validation = topupSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(validation.error.issues[0].message, 400);
    }

    const { amount } = validation.data;

    const stripeCustomerId = await getOrCreateStripeCustomer(
      user.id,
      user.email,
    );

    const sessionParams: Stripe.Checkout.SessionCreateParams =
      {
        client_reference_id: user.id,
        metadata: {
          isWalletTopup: "true",
          userId: user.id,
          walletAmount: amount.toString(),
        },
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "Mobial Wallet Top-Up",
                description: `Add $${amount.toFixed(2)} to your Mobial wallet`,
              },
              unit_amount: Math.round(amount * 100),
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/wallet?topup=success`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/wallet?topup=cancel`,
      };

    if (stripeCustomerId) {
      sessionParams.customer = stripeCustomerId;
    } else {
      sessionParams.customer_email = user.email;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return successResponse({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return errorResponse(error.message, error.statusCode);
    }
    log.errorWithException("Failed to create wallet topup session", error);
    return errorResponse("Failed to create top-up session", 500);
  }
}
