import { NextRequest } from "next/server"
import { timingSafeEqual } from "crypto"
import { db } from "@/lib/db"
import {
  sendInstallationReminder,
  sendFeedbackRequest,
} from "@/services/email-service"
import { logger } from "@/lib/logger"

const log = logger.child("cron:email-sequences")

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

  const results = {
    installationReminders: { sent: 0, failed: 0 },
    feedbackRequests: { sent: 0, failed: 0 },
  }

  try {
    // 1. Installation reminders: 1 hour after order completion, if not already sent
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)

    const recentOrders = await db.order.findMany({
      where: {
        status: "COMPLETED",
        completedAt: {
          gte: twoHoursAgo,
          lte: oneHourAgo,
        },
        notifySent: false,
      },
      include: {
        items: {
          include: { product: true },
          take: 1,
        },
      },
      take: 50,
    })

    for (const order of recentOrders) {
      try {
        const productName = order.items[0]?.productName || "eSIM"
        const result = await sendInstallationReminder(
          order.email,
          order.orderNumber,
          productName
        )

        if (result.success) {
          await db.order.update({
            where: { id: order.id },
            data: { notifySent: true },
          })
          results.installationReminders.sent++
        } else {
          results.installationReminders.failed++
        }
      } catch {
        results.installationReminders.failed++
      }
    }

    // 2. Feedback requests: 3 days after order completion
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)

    const feedbackOrders = await db.order.findMany({
      where: {
        status: "COMPLETED",
        completedAt: {
          gte: fourDaysAgo,
          lte: threeDaysAgo,
        },
        notifySent: true, // Already got installation reminder
      },
      include: {
        items: { take: 1 },
      },
      take: 50,
    })

    for (const order of feedbackOrders) {
      try {
        const productName = order.items[0]?.productName || "eSIM"
        const result = await sendFeedbackRequest(
          order.email,
          order.orderNumber,
          productName
        )

        if (result.success) {
          results.feedbackRequests.sent++
        } else {
          results.feedbackRequests.failed++
        }
      } catch {
        results.feedbackRequests.failed++
      }
    }

    return Response.json({ success: true, data: results })
  } catch (error) {
    log.errorWithException("Email sequences cron failed", error)
    return Response.json(
      { success: false, error: "Failed to process email sequences" },
      { status: 500 }
    )
  }
}
