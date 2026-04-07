import { NextRequest } from "next/server";
import { z } from "zod";
import {
  requireAuth,
  successResponse,
  errorResponse,
  parseJsonBody,
  AuthError,
} from "@/lib/auth-helpers";
import { db } from "@/lib/db";

const registerSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(["ios", "android"]),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await parseJsonBody(request);
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse("Invalid input", 400);
    }

    const { token, platform } = validation.data;

    await db.pushToken.upsert({
      where: { token },
      create: { userId: user.id, token, platform },
      update: { userId: user.id, platform, updatedAt: new Date() },
    });

    return successResponse({ registered: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return errorResponse(error.message, error.statusCode);
    }
    return errorResponse("Failed to register push token", 500);
  }
}
