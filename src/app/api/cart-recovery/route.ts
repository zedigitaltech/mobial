import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { randomBytes } from "crypto"
import { checkRateLimit } from "@/lib/rate-limit"
import { logger } from "@/lib/logger"

const log = logger.child("api:cart-recovery")

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
    const rateLimit = await checkRateLimit(ip, "api:write")
    if (!rateLimit.success) {
      return Response.json(
        { success: false, error: "Too many requests" },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { email, cartItems, totalAmount, sessionId } = body

    if (!email || !cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return Response.json(
        { success: false, error: "Email and cart items required" },
        { status: 400 }
      )
    }

    const recoveryToken = randomBytes(32).toString("hex")

    // Upsert: update existing abandoned cart for this email, or create new
    const existingCart = await db.abandonedCart.findFirst({
      where: {
        email,
        recoveredAt: null,
        reminderSentAt: null,
      },
      orderBy: { createdAt: "desc" },
    })

    if (existingCart) {
      await db.abandonedCart.update({
        where: { id: existingCart.id },
        data: {
          cartItems: JSON.stringify(cartItems),
          totalAmount,
          sessionId,
          recoveryToken,
          updatedAt: new Date(),
        },
      })
    } else {
      await db.abandonedCart.create({
        data: {
          email,
          sessionId,
          cartItems: JSON.stringify(cartItems),
          totalAmount,
          recoveryToken,
        },
      })
    }

    return Response.json({ success: true })
  } catch (error) {
    log.errorWithException("Cart recovery save failed", error)
    return Response.json(
      { success: false, error: "Failed to save cart" },
      { status: 500 }
    )
  }
}
