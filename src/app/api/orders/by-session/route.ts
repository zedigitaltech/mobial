import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { successResponse, errorResponse, getAuthUser } from "@/lib/auth-helpers";

/**
 * GET /api/orders/by-session?stripe_session_id=<id>[&email=<email>]
 *
 * Resolves a Stripe Checkout Session ID to an order number.
 * Used by the checkout success page when sessionStorage is lost
 * (browser crash, hard refresh) but the Stripe ?session_id= param
 * is still present in the URL.
 *
 * Auth rules:
 *  - Authenticated users: must be the order owner or an admin.
 *  - Guests: must supply a matching email address.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const sessionId = searchParams.get("stripe_session_id");
  const paymentIntentId = searchParams.get("payment_intent");
  const email = searchParams.get("email")?.toLowerCase();

  const lookupId = sessionId || paymentIntentId;

  if (!lookupId) {
    return errorResponse("stripe_session_id or payment_intent is required", 400);
  }

  const order = await db.order.findFirst({
    where: { paymentReference: lookupId },
    select: { orderNumber: true, email: true, userId: true },
  });

  if (!order) {
    return errorResponse("Order not found", 404);
  }

  // Auth: must be the order owner (or admin), or supply the matching email for guest orders
  const user = await getAuthUser(request);
  if (user) {
    if (
      user.role !== "ADMIN" &&
      order.userId !== user.id &&
      order.email !== user.email
    ) {
      return errorResponse("Forbidden", 403);
    }
  } else {
    if (!email || !order.email || order.email.toLowerCase() !== email) {
      return errorResponse("Order not found", 404);
    }
  }

  return successResponse({ orderNumber: order.orderNumber, email: order.email });
}
