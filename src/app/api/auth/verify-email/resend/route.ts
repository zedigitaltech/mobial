/**
 * POST /api/auth/verify-email/resend
 * Resend verification email to the authenticated user.
 */

import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { db } from "@/lib/db"
import { getAuthUser, getClientIP } from "@/lib/auth-helpers"
import { sendEmailVerification } from "@/services/email-service"
import { checkRateLimit } from "@/lib/rate-limit"
import { logger } from "@/lib/logger"

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request)
    const rateLimit = await checkRateLimit(ip, "email:resend-verification")
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many requests. Please wait before resending." },
        { status: 429 },
      )
    }

    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, emailVerified: true },
    })

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (dbUser.emailVerified) {
      return NextResponse.json(
        { error: "Email is already verified" },
        { status: 400 },
      )
    }

    // Generate new token (same pattern as existing verify-email and register routes)
    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    await db.systemConfig.upsert({
      where: { key: `verify_token:${dbUser.id}` },
      create: {
        key: `verify_token:${dbUser.id}`,
        value: JSON.stringify({ token, expiresAt: expiresAt.toISOString() }),
      },
      update: {
        value: JSON.stringify({ token, expiresAt: expiresAt.toISOString() }),
      },
    })

    await sendEmailVerification(dbUser.email, token)

    return NextResponse.json({ success: true, message: "Verification email sent" })
  } catch (error) {
    logger.errorWithException("Resend verification email error", error)
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 },
    )
  }
}
