import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { randomBytes } from "crypto"
import { checkRateLimit } from "@/lib/rate-limit"
import { logger } from "@/lib/logger"

const cartRecoverySchema = z.object({
  email: z.string().email("Invalid email address"),
  cartItems: z.array(z.unknown()).min(1, "Cart must have at least one item"),
  totalAmount: z.number(),
  sessionId: z.string().optional(),
})

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
    const parsed = cartRecoverySchema.safeParse(body)

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid input"
      return Response.json(
        { success: false, error: firstError },
        { status: 400 }
      )
    }

    const { email, cartItems, totalAmount, sessionId } = parsed.data

    const recoveryToken = randomBytes(32).toString("hex")

    // Only update an existing cart if it matches the caller's sessionId.
    // This prevents attackers who know a victim's email from overwriting
    // their abandoned cart contents. Without a matching sessionId we create
    // a new record rather than updating the victim's record.
    const existingCart = sessionId
      ? await db.abandonedCart.findFirst({
          where: {
            email,
            sessionId,
            recoveredAt: null,
            reminderSentAt: null,
          },
          orderBy: { createdAt: "desc" },
        })
      : null

    if (existingCart) {
      await db.abandonedCart.update({
        where: { id: existingCart.id },
        data: {
          cartItems: JSON.stringify(cartItems),
          totalAmount,
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
