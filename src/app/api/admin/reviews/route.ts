import { NextRequest } from "next/server"
import { z } from "zod"
import { successResponse, errorResponse, requireAdmin, AuthError } from "@/lib/auth-helpers"
import { getPendingReviews, approveReview, rejectReview } from "@/services/review-service"
import { logger } from "@/lib/logger"

const patchReviewSchema = z.object({
  reviewId: z.string().min(1),
  action: z.enum(["approve", "reject"]),
})

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request)

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50)
    const offset = parseInt(searchParams.get("offset") || "0")

    const reviews = await getPendingReviews(limit, offset)
    return successResponse({ reviews })
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return errorResponse(error.message, error.statusCode)
    }
    logger.errorWithException("Error fetching pending reviews", error)
    return errorResponse("Failed to fetch reviews", 500)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin(request)

    const raw = await request.json()
    const parsed = patchReviewSchema.safeParse(raw)

    if (!parsed.success) {
      return errorResponse(`Validation error: ${parsed.error.issues.map((e) => e.message).join(", ")}`, 400)
    }

    const { reviewId, action } = parsed.data

    if (action === "approve") {
      await approveReview(reviewId)
      return successResponse({ message: "Review approved" })
    } else {
      await rejectReview(reviewId)
      return successResponse({ message: "Review rejected" })
    }
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return errorResponse(error.message, error.statusCode)
    }
    logger.errorWithException("Error updating review", error)
    return errorResponse("Failed to update review", 500)
  }
}
