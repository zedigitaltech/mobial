/**
 * GET /api/admin/orders/[id]/esim
 * View decrypted eSIM details for an order (admin only)
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin, AuthError } from "@/lib/auth-helpers"
import { decryptEsimField } from "@/lib/esim-encryption"
import { logAudit } from "@/lib/audit"

export async function GET(
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
      orderNumber: true,
      status: true,
      esimQrCode: true,
      esimActivationCode: true,
      esimSmdpAddress: true,
      mobimatterOrderId: true,
      items: {
        select: { esimIccid: true },
        take: 1,
        orderBy: { createdAt: "asc" },
      },
    },
  })

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 })
  }

  await logAudit({
    action: "admin_view_esim",
    entity: "order",
    entityId: id,
    userId: admin.id,
    newValues: { orderNumber: order.orderNumber },
  })

  return NextResponse.json({
    orderNumber: order.orderNumber,
    status: order.status,
    mobimatterOrderId: order.mobimatterOrderId,
    lpaString: decryptEsimField(order.esimQrCode),
    activationCode: decryptEsimField(order.esimActivationCode),
    smdpAddress: decryptEsimField(order.esimSmdpAddress),
    iccid: order.items[0]?.esimIccid ?? null,
  })
}
