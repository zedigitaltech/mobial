import { NextRequest } from "next/server";
import { z } from "zod";
import { stripe } from "@/lib/stripe";
import {
  calculateOrderTotal,
  validateProducts,
  createOrder,
} from "@/services/order-service";
import {
  successResponse,
  errorResponse,
  parseJsonBody,
} from "@/lib/auth-helpers";
import { checkRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";

const log = logger.child("checkout:intent");

const intentSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive().max(10),
      }),
    )
    .min(1)
    .max(5),
  email: z.string().email("Valid email required"),
  currency: z.string().length(3).default("usd"),
});

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rateLimit = await checkRateLimit(ip, "checkout:intent");
  if (!rateLimit.success) {
    return errorResponse("Too many requests", 429);
  }

  const body = await parseJsonBody(request);
  const validation = intentSchema.safeParse(body);
  if (!validation.success) {
    return errorResponse(validation.error.issues[0].message, 400);
  }

  const { items, email, currency } = validation.data;

  const productCheck = await validateProducts(items);
  if (!productCheck.valid) {
    return errorResponse(productCheck.errors.join(", "), 400);
  }

  const totals = await calculateOrderTotal(items);
  const amountCents = Math.round(totals.total * 100);

  if (amountCents < 50) {
    return errorResponse("Order total is below the minimum amount", 400);
  }

  // Guest checkout — userId resolved server-side via auth if available
  const { order } = await createOrder({ items, email }, undefined, ip);

  let paymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: currency.toLowerCase(),
      receipt_email: email,
      metadata: { orderId: order.id, orderNumber: order.orderNumber },
      automatic_payment_methods: { enabled: true },
    });
  } catch (stripeErr) {
    // Compensate: cancel the order so it doesn't sit stuck in PENDING forever
    await db.order.update({
      where: { id: order.id },
      data: { status: "CANCELLED", paymentStatus: "FAILED" },
    });
    log.errorWithException("Stripe PaymentIntent creation failed", stripeErr, {
      metadata: { orderId: order.id },
    });
    return errorResponse("Payment system unavailable. Please try again.", 503);
  }

  log.info("PaymentIntent created", { metadata: { orderId: order.id } });

  return successResponse({
    clientSecret: paymentIntent.client_secret,
    orderId: order.id,
    orderNumber: order.orderNumber,
    total: totals.total,
    currency: currency.toUpperCase(),
  });
}
