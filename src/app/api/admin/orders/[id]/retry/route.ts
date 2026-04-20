/**
 * POST /api/admin/orders/[id]/retry
 * Retry fulfillment for a FAILED or PROCESSING order (admin only)
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin, AuthError } from "@/lib/auth-helpers"
import { processOrderWithMobimatter } from "@/services/order-service"
import { logAudit } from "@/lib/audit"
import { logger } from "@/lib/logger"

const log = logger.child("admin:retry-order")

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
    select: { id: true, status: true, orderNumber: true },
  })

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 })
  }

  if (order.status !== "FAILED" && order.status !== "PROCESSING") {
    return NextResponse.json(
      { error: `Cannot retry order with status ${order.status}. Only FAILED or PROCESSING orders can be retried.` },
      { status: 400 }
    )
  }

  log.info("Admin retrying fulfillment", { metadata: { orderId: id, adminId: admin.id } })

  await db.order.update({
    where: { id },
    data: { status: "PROCESSING" },
  })

  const result = await processOrderWithMobimatter(id, "ADMIN_RETRY")

  await logAudit({
    action: "admin_retry_fulfillment",
    entity: "order",
    entityId: id,
    userId: admin.id,
    newValues: { success: result.success, error: result.success ? undefined : result.error },
  })

  if (!result.success) {
    return NextResponse.json(
      { error: `Retry failed: ${result.error ?? "Unknown error"}` },
      { status: 502 }
    )
  }

  return NextResponse.json({ success: true, message: "Fulfillment retry successful" })
}
