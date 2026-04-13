import { NextRequest } from "next/server";
import { timingSafeEqual } from "crypto";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { processOrderWithMobimatter } from "@/services/order-service";
import { logAudit } from "@/lib/audit";
import { sendAdminAlert, sendOrderFailed } from "@/services/email-service";
import { logger } from "@/lib/logger";

const log = logger.child("cron:retry-fulfillment");

const MAX_RETRIES = 5;

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return Response.json(
      { success: false, error: "Cron not configured" },
      { status: 503 },
    );
  }

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  const isValid =
    token &&
    cronSecret &&
    token.length === cronSecret.length &&
    timingSafeEqual(Buffer.from(token), Buffer.from(cronSecret));
  if (!isValid) {
    return Response.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    // Find orders that were paid but failed (or partially fulfilled), created within last 72 hours.
    // Also pick up PROCESSING orders stuck >10 minutes — these indicate a process crash
    // after payment was confirmed but before fulfillment completed.
    const failedOrders = await db.order.findMany({
      where: {
        OR: [
          {
            status: { in: ["FAILED", "PARTIALLY_FULFILLED"] },
            paymentStatus: "PAID",
            createdAt: { gte: new Date(Date.now() - 72 * 60 * 60 * 1000) },
            retryCount: { lt: MAX_RETRIES },
          },
          {
            status: "PROCESSING",
            paymentStatus: "PAID",
            updatedAt: { lt: new Date(Date.now() - 10 * 60 * 1000) }, // stuck >10 min
            retryCount: { lt: MAX_RETRIES },
          },
        ],
      },
      select: {
        id: true,
        orderNumber: true,
        retryCount: true,
      },
      take: 10,
      orderBy: { createdAt: "asc" },
    });

    if (failedOrders.length === 0) {
      return Response.json({ success: true, retried: 0 });
    }

    const results: Array<{
      orderId: string;
      orderNumber: string;
      success: boolean;
      error?: string;
    }> = [];

    for (const order of failedOrders) {
      try {
        // Increment retry count before attempting
        await db.order.update({
          where: { id: order.id },
          data: { retryCount: { increment: 1 } },
        });

        const result = await processOrderWithMobimatter(order.id, "CRON_RETRY");

        results.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          success: result.success,
          error: result.error,
        });

        if (result.success) {
          await logAudit({
            action: "order_complete",
            entity: "order",
            entityId: order.id,
            newValues: {
              source: "retry_cron",
              retryCount: order.retryCount + 1,
              orderNumber: order.orderNumber,
            },
          });
        }

        // Alert admin when fulfillment keeps failing after 3+ retries
        if (!result.success && order.retryCount + 1 >= 3) {
          sendAdminAlert({
            type: "fulfillment_failure",
            subject: `Order ${order.orderNumber} failed fulfillment after ${order.retryCount + 1} retries`,
            details: {
              orderId: order.id,
              orderNumber: order.orderNumber,
              retryCount: order.retryCount + 1,
              error: result.error || "Unknown error",
              maxRetries: MAX_RETRIES,
            },
          }).catch((err) =>
            log.errorWithException("Failed to send admin alert", err),
          );
        }
      } catch (error) {
        results.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const succeeded = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    // Auto-refund orders that exhausted all retries
    const exhaustedOrders = await db.order.findMany({
      where: {
        status: { in: ["FAILED", "PARTIALLY_FULFILLED"] },
        paymentStatus: "PAID",
        retryCount: { gte: MAX_RETRIES },
        paymentReference: { not: null },
      },
      select: { id: true, orderNumber: true, paymentReference: true, email: true, total: true },
      take: 5,
    });

    let refunded = 0;
    for (const order of exhaustedOrders) {
      try {
        // Find the Stripe payment intent from the checkout session
        const session = await stripe.checkout.sessions.retrieve(order.paymentReference!);
        if (session.payment_intent && typeof session.payment_intent === "string") {
          // Idempotency: check Stripe for existing refunds on this payment intent
          // before creating a new one. Prevents double-refund if prior cron run
          // succeeded at refund but failed at DB update.
          const existingRefunds = await stripe.refunds.list({
            payment_intent: session.payment_intent,
            limit: 1,
          });
          if (existingRefunds.data.length === 0) {
            await stripe.refunds.create(
              { payment_intent: session.payment_intent },
              { idempotencyKey: `auto-refund:${order.id}` },
            );
          }

          await db.order.update({
            where: { id: order.id },
            data: { status: "REFUNDED", paymentStatus: "REFUNDED" },
          });

          if (order.email) {
            sendOrderFailed(order.email, order.orderNumber).catch(() => {});
          }

          await logAudit({
            action: "order_refund",
            entity: "order",
            entityId: order.id,
            newValues: {
              source: "auto_refund_cron",
              orderNumber: order.orderNumber,
              reason: "max_retries_exhausted",
            },
          });

          refunded++;
        }
      } catch (err) {
        log.errorWithException(`Auto-refund failed for ${order.orderNumber}`, err);
        sendAdminAlert({
          type: "refund_failure",
          subject: `Auto-refund failed for order ${order.orderNumber}`,
          details: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            error: err instanceof Error ? err.message : "Unknown error",
          },
        }).catch(() => {});
      }
    }

    // Cancel zombie PENDING orders older than 2 hours with no payment
    const zombies = await db.order.updateMany({
      where: {
        status: "PENDING",
        paymentStatus: "PENDING",
        paymentReference: null,
        createdAt: { lt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
      },
      data: { status: "CANCELLED" },
    });

    if (zombies.count > 0) {
      log.info(`Cancelled ${zombies.count} zombie PENDING orders`);
    }

    await logAudit({
      action: "security_alert",
      entity: "order",
      newValues: {
        source: "retry_fulfillment_cron",
        attempted: results.length,
        succeeded,
        failed,
        refunded,
        zombiesCancelled: zombies.count,
      },
    });

    return Response.json({
      success: true,
      retried: results.length,
      succeeded,
      failed,
      refunded,
      zombiesCancelled: zombies.count,
      details: results,
    });
  } catch (error) {
    log.errorWithException("Retry fulfillment cron failed", error);
    return Response.json(
      { success: false, error: "Retry cron failed" },
      { status: 500 },
    );
  }
}
