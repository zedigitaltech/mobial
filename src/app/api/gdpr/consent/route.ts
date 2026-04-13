import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  getAuthUser,
  errorResponse,
  successResponse,
  parseJsonBody,
  getClientIP,
  getUserAgent,
} from "@/lib/auth-helpers";
import { createHmac } from "crypto";
import { checkRateLimit, createRateLimitHeaders } from "@/lib/rate-limit";
import { logAuditWithContext } from "@/lib/audit";
import { logger } from "@/lib/logger";

const log = logger.child("gdpr-consent");

const consentSchema = z.object({
  essential: z.boolean(),
  analytics: z.boolean(),
  marketing: z.boolean(),
  thirdParty: z.boolean(),
});

export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);

    const rateLimitResult = await checkRateLimit(clientIP, "api:write");
    if (!rateLimitResult.success) {
      const headers = createRateLimitHeaders(rateLimitResult);
      return new Response(
        JSON.stringify({ success: false, error: "Too many requests" }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            ...Object.fromEntries(headers.entries()),
          },
        },
      );
    }

    const body = await parseJsonBody(request);
    if (!body) {
      return errorResponse("Invalid request body", 400);
    }

    const validation = consentSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse("Invalid consent data", 400);
    }

    const { analytics, marketing, thirdParty } = validation.data;
    const user = await getAuthUser(request);
    const ipAddress = clientIP;
    const userAgent = getUserAgent(request);

    if (user) {
      // Authenticated user — link consent to their account
      await db.gDPRConsent.create({
        data: {
          userId: user.id,
          analytics,
          marketingEmails: marketing,
          thirdPartySharing: thirdParty,
          ipAddress,
          userAgent,
        },
      });

      await logAuditWithContext({
        userId: user.id,
        action: "gdpr_consent",
        entity: "gdpr_consent",
        newValues: { analytics, marketing, thirdParty },
      });
    } else {
      // Guest user — store consent with hashed IP as identifier
      // GDPR requires demonstrable consent records even for anonymous users
      // HMAC with server-side salt so the guest identifier is not
      // reversible via rainbow tables against common IP/UA combinations.
      const salt = process.env.GUEST_ID_SALT || process.env.ENCRYPTION_KEY || "dev-fallback-salt";
      const hmacHex = (input: string) =>
        createHmac("sha256", salt).update(input).digest("hex");
      const guestIdentifier = hmacHex(`guest:${ipAddress}:${userAgent || ""}`);
      const ipHash = hmacHex(`ip:${ipAddress}`);

      await db.systemConfig.upsert({
        where: { key: `gdpr_guest_${guestIdentifier}` },
        create: {
          key: `gdpr_guest_${guestIdentifier}`,
          value: JSON.stringify({
            analytics,
            marketing,
            thirdParty,
            ipHash,
            consentedAt: new Date().toISOString(),
          }),
          description: "Guest GDPR consent record",
        },
        update: {
          value: JSON.stringify({
            analytics,
            marketing,
            thirdParty,
            ipHash,
            consentedAt: new Date().toISOString(),
          }),
        },
      });
    }

    return successResponse(undefined, "Consent recorded");
  } catch (error) {
    log.errorWithException("GDPR consent error", error);
    return errorResponse("Failed to record consent", 500);
  }
}
