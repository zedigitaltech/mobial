/**
 * POST /api/admin/orders/[id]/refund
 * Issue a Stripe refund for a paid order (admin only)
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { stripe } from "@/lib/stripe"
import { requireAdmin, AuthError } from "@/lib/auth-helpers"
import { logAudit } from "@/lib/audit"
import { logger } from "@/lib/logger"

const log = logger.child("admin:refund-order")

const refundSchema = z.object({
  reason: z.enum(["duplicate", "fraudulent", "requested_by_customer"]).default("requested_by_customer"),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let admin
  try {
    admin = await requireAdmin(request)
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const order = await db.order.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      orderNumber: true,
      paymentReference: true,
      paymentStatus: true,
    },
  })

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 })
  }

  if (order.paymentStatus !== "PAID") {
    return NextResponse.json({ error: "Order has not been paid — nothing to refund" }, { status: 400 })
  }

  if (order.status === "REFUNDED") {
    return NextResponse.json({ error: "Order has already been refunded" }, { status: 400 })
  }

  if (!order.paymentReference) {
    return NextResponse.json({ error: "No payment reference found. Manual refund required." }, { status: 422 })
  }

  let body: z.infer<typeof refundSchema> = { reason: "requested_by_customer" }
  try {
    const raw = await request.json().catch(() => ({}))
    body = refundSchema.parse(raw)
  } catch {
    // use defaults
  }

  // Retrieve PaymentIntent from Stripe session
  const session = await stripe.checkout.sessions.retrieve(order.paymentReference, {
    expand: ["payment_intent"],
  }).catch(() => null)

  if (!session?.payment_intent) {
    return NextResponse.json({ error: "Cannot find Stripe payment intent. Manual refund required." }, { status: 422 })
  }

  const paymentIntentId = typeof session.payment_intent === "string"
    ? session.payment_intent
    : session.payment_intent.id

  log.info("Admin issuing refund", { metadata: { orderId: id, adminId: admin.id } })

  const refund = await stripe.refunds.create({
    payment_intent: paymentIntentId,
    reason: body.reason,
  })

  await db.order.update({
    where: { id },
    data: { status: "REFUNDED", paymentStatus: "REFUNDED" },
  })

  await logAudit({
    action: "admin_refund",
    entity: "order",
    entityId: id,
    userId: admin.id,
    newValues: { refundId: refund.id, amount: refund.amount, reason: body.reason, stripeStatus: refund.status },
  })

  return NextResponse.json({
    success: true,
    refundId: refund.id,
    amount: refund.amount / 100,
    status: refund.status,
  })
}
