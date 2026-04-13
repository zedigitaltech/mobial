import { NextRequest } from "next/server";
import { z } from "zod";
import { successResponse, errorResponse, parseJsonBody } from "@/lib/auth-helpers";
import { logger } from "@/lib/logger";
import {
  createReview,
  getApprovedReviews,
  getReviewStats,
} from "@/services/review-service";
import { checkRateLimit } from "@/lib/rate-limit";
import { db } from "@/lib/db";

const reviewSchema = z.object({
  orderId: z.string().optional(),
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Valid email is required"),
  rating: z.number().int().min(1).max(5),
  title: z.string().min(1, "Title is required").max(200),
  text: z.string().min(1, "Review text is required").max(2000),
  destination: z.string().optional(),
  countryCode: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const destination = searchParams.get("destination") || undefined;
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20", 10) || 20, 1), 50);
    const offset = Math.min(Math.max(parseInt(searchParams.get("offset") || "0", 10) || 0, 0), 10000);
    const statsOnly = searchParams.get("stats") === "true";

    if (statsOnly) {
      const stats = await getReviewStats();
      return new Response(JSON.stringify({ success: true, data: stats }), {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
        },
      });
    }

    const result = await getApprovedReviews({ destination, limit, offset });
    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200",
      },
    });
  } catch (error) {
    logger.errorWithException("Error fetching reviews", error);
    return errorResponse("Failed to fetch reviews", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const rateCheck = await checkRateLimit(ip, "review:submit");
    const allowed = rateCheck.success;
    if (!allowed) {
      return errorResponse(
        "Too many review submissions. Please try again later.",
        429,
      );
    }

    const body = await parseJsonBody(request);
    const validation = reviewSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(validation.error.issues[0].message, 400);
    }

    const {
      orderId,
      name,
      email,
      rating,
      title,
      text,
      destination,
      countryCode,
    } = validation.data;

    // Verify order ownership if orderId is provided
    if (orderId) {
      const order = await db.order.findUnique({
        where: { id: orderId },
        select: { email: true },
      });
      if (!order || order.email?.toLowerCase() !== email.toLowerCase()) {
        return errorResponse("Order not found or email does not match", 403);
      }
    }

    const review = await createReview({
      orderId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      rating: Math.round(rating),
      title: title.trim(),
      text: text.trim(),
      destination: destination?.trim(),
      countryCode: countryCode?.trim(),
    });

    return successResponse({
      id: review.id,
      message: "Review submitted successfully. It will appear after approval.",
    });
  } catch (error) {
    logger.errorWithException("Error creating review", error);
    return errorResponse("Failed to submit review", 500);
  }
}
