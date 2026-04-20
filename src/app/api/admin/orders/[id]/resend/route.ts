/**
 * POST /api/admin/orders/[id]/resend
 * Resend order confirmation email for a completed order (admin only)
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin, AuthError } from "@/lib/auth-helpers"
import { sendOrderConfirmation } from "@/services/email-service"
import { decryptEsimField } from "@/lib/esim-encryption"
import { logAudit } from "@/lib/audit"
import { logger } from "@/lib/logger"

const log = logger.child("admin:resend-email")

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
    include: { items: true },
  })

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 })
  }

  if (order.status !== "COMPLETED") {
    return NextResponse.json({ error: "Can only resend emails for COMPLETED orders" }, { status: 400 })
  }

  const lpaString = decryptEsimField(order.esimQrCode)
  const activationCode = decryptEsimField(order.esimActivationCode)
  const smdpAddress = decryptEsimField(order.esimSmdpAddress)

  log.info("Admin resending confirmation email", {
    metadata: { orderId: id, email: order.email, adminId: admin.id },
  })

  const result = await sendOrderConfirmation(
    order.email,
    order.orderNumber,
    order.items.map((item) => ({
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
    })),
    order.total,
    lpaString ? { lpaString, activationCode, smdpAddress } : undefined,
  )

  if (!result.success) {
    return NextResponse.json({ error: "Failed to send email" }, { status: 502 })
  }

  await logAudit({
    action: "admin_resend_email",
    entity: "order",
    entityId: id,
    userId: admin.id,
    newValues: { email: order.email },
  })

  return NextResponse.json({ success: true, message: `Email resent to ${order.email}` })
}
