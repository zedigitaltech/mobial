import { NextRequest } from "next/server"
import { timingSafeEqual } from "crypto"
import { db } from "@/lib/db"
import { sendCartRecovery } from "@/services/email-service"
import { logger } from "@/lib/logger"
import { BASE_URL } from "@/lib/env"

const log = logger.child("cron:cart-recovery")

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    return Response.json(
      { success: false, error: "Cron not configured" },
      { status: 503 }
    )
  }

  const authHeader = request.headers.get("authorization")
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null

  if (!token || token.length !== cronSecret.length || !timingSafeEqual(Buffer.from(token), Buffer.from(cronSecret))) {
    return Response.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    )
  }

  try {
    // Find carts abandoned > 1 hour ago that haven't been reminded or recovered
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

    const abandonedCarts = await db.abandonedCart.findMany({
      where: {
        reminderSentAt: null,
        recoveredAt: null,
        updatedAt: { lt: oneHourAgo },
      },
      take: 50,
    })

    let sent = 0
    let failed = 0

    for (const cart of abandonedCarts) {
      try {
        const items = JSON.parse(cart.cartItems) as Array<{
          name: string
          price: number
          quantity: number
        }>

        const recoveryUrl = cart.recoveryToken
          ? `${BASE_URL}/checkout?recover=${cart.recoveryToken}`
          : `${BASE_URL}/products`

        const result = await sendCartRecovery(
          cart.email,
          items,
          cart.totalAmount,
          recoveryUrl
        )

        if (result.success) {
          await db.abandonedCart.update({
            where: { id: cart.id },
            data: { reminderSentAt: new Date() },
          })
          sent++
        } else {
          failed++
        }
      } catch (error) {
        log.errorWithException(`Failed to send recovery email to ${cart.email}`, error)
        failed++
      }
    }

    return Response.json({
      success: true,
      data: {
        processed: abandonedCarts.length,
        sent,
        failed,
      },
    })
  } catch (error) {
    log.errorWithException("Cart recovery cron failed", error)
    return Response.json(
      { success: false, error: "Failed to process abandoned carts" },
      { status: 500 }
    )
  }
}
