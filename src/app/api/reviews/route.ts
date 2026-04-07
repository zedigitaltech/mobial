import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/auth-helpers";
import {
  createReview,
  getApprovedReviews,
  getReviewStats,
} from "@/services/review-service";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const destination = searchParams.get("destination") || undefined;
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const offset = parseInt(searchParams.get("offset") || "0");
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
    console.error("Error fetching reviews:", error);
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

    const body = await request.json();
    const {
      orderId,
      name,
      email,
      rating,
      title,
      text,
      destination,
      countryCode,
    } = body;

    // Validation
    if (!name || !email || !rating || !title || !text) {
      return errorResponse(
        "Name, email, rating, title, and text are required",
        400,
      );
    }
    if (rating < 1 || rating > 5) {
      return errorResponse("Rating must be between 1 and 5", 400);
    }
    if (title.length > 200) {
      return errorResponse("Title must be 200 characters or less", 400);
    }
    if (text.length > 2000) {
      return errorResponse("Review text must be 2000 characters or less", 400);
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
    console.error("Error creating review:", error);
    return errorResponse("Failed to submit review", 500);
  }
}
