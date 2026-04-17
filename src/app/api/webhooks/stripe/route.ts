import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { processOrderWithMobimatter } from "@/services/order-service";
import { topupOrder } from "@/lib/mobimatter";
import type { OrderResponse } from "@/lib/mobimatter";
import { logAudit } from "@/lib/audit";
import {
  sendOrderConfirmation,
  sendOrderFailed,
} from "@/services/email-service";
import { encryptEsimField, decryptEsimField } from "@/lib/esim-encryption";
import { getPostHogClient } from "@/lib/posthog-server";
import { sendPushNotification } from "@/lib/push-notifications";
import { logger } from "@/lib/logger";
import { CASHBACK_PERCENT } from "@/lib/env";

const log = logger.child("webhook:stripe");

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return new NextResponse("Missing signature", { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    log.error("STRIPE_WEBHOOK_SECRET is not configured");
    return new NextResponse("Webhook not configured", { status: 503 });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    log.errorWithException("Webhook signature verification failed", err);
    return new NextResponse("Webhook processing failed", { status: 400 });
  }

  // Handle the event
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const orderId = session.client_reference_id;
        const isTopUp = session.metadata?.isTopUp === "true";
        const isWalletTopup = session.metadata?.isWalletTopup === "true";
        const parentMobimatterOrderId =
          session.metadata?.parentMobimatterOrderId;

        // ── Wallet top-up flow ──
        if (isWalletTopup) {
          const walletUserId = session.metadata?.userId;
          // Use Stripe-verified payment amount, not client-supplied metadata
          const walletAmount = (session.amount_total ?? 0) / 100;

          if (walletUserId && walletAmount > 0 && walletAmount < 10000) {
            await db.$transaction(async (tx) => {
              // Idempotency: check if this Stripe session was already processed.
              // Look for an existing audit log with action stripe_payment_success
              // and entity wallet where entityId is the userId AND newValues
              // contains the session ID. This is more reliable than a string
              // contains check on a non-indexed field.
              const existingTopup = await tx.auditLog.findFirst({
                where: {
                  action: "stripe_payment_success",
                  entity: "wallet",
                  entityId: walletUserId,
                  newValues: { contains: session.id },
                },
              });

              if (existingTopup) {
                log.info(`Wallet top-up already processed, skipping duplicate: ${session.id}`);
                return;
              }

              const wallet = await tx.wallet.upsert({
                where: { userId: walletUserId },
                create: {
                  userId: walletUserId,
                  balance: walletAmount,
                },
                update: {
                  balance: { increment: walletAmount },
                },
              });

              // Ledger entry mirrors the balance change.
              await tx.walletTransaction.create({
                data: {
                  walletId: wallet.id,
                  userId: walletUserId,
                  type: "credit",
                  amount: walletAmount,
                  description: `Stripe top-up ${session.id}`,
                },
              });

              // Inline audit log so it participates in the same transaction
              await tx.auditLog.create({
                data: {
                  action: "stripe_payment_success",
                  entity: "wallet",
                  entityId: walletUserId,
                  newValues: JSON.stringify({
                    sessionId: session.id,
                    walletAmount,
                    type: "topup",
                  }),
                },
              });
            });
          }
          break;
        }

        if (!orderId) {
          log.error("No orderId found in session metadata");
          break;
        }

        // ── Save Stripe customer ID to user if available ──
        if (session.customer) {
          const orderForCustomer = await db.order.findUnique({
            where: { id: orderId },
            select: { userId: true },
          });
          if (orderForCustomer?.userId) {
            await db.user
              .update({
                where: { id: orderForCustomer.userId },
                data: {
                  stripeCustomerId: session.customer as string,
                },
              })
              .catch(() => {
                // Ignore if already set (unique constraint)
              });
          }
        }

        // Idempotency: skip if this session was already processed
        const alreadyProcessed = await db.order.findFirst({
          where: { paymentReference: session.id, paymentStatus: "PAID" },
          select: { id: true },
        });
        if (alreadyProcessed) {
          log.warn("Duplicate event, skipping", {
            metadata: { sessionId: session.id },
          });
          break;
        }

        // Guard: only process PENDING orders — don't resurrect cancelled orders
        const currentOrder = await db.order.findUnique({
          where: { id: orderId },
          select: { status: true },
        });
        if (!currentOrder || (currentOrder.status !== "PENDING" && currentOrder.status !== "PROCESSING")) {
          log.warn("Order not in processable status, skipping payment update", {
            metadata: { orderId, status: currentOrder?.status },
          });
          break;
        }

        // 1. Update Payment Status
        await db.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: "PAID",
            paymentReference: session.id,
            paidAt: new Date(),
            status: "PROCESSING",
          },
        });

        if (isTopUp && parentMobimatterOrderId) {
          // TOP-UP FLOW: Call MobiMatter's topup endpoint
          try {
            const order = await db.order.findUnique({
              where: { id: orderId },
              include: {
                items: {
                  include: { product: { select: { mobimatterId: true } } },
                },
              },
            });

            if (!order || !order.items[0]?.product?.mobimatterId) {
              throw new Error("Top-up order missing product data");
            }

            const topupResult: OrderResponse = await topupOrder({
              originalOrderId: parentMobimatterOrderId,
              topupProductId: order.items[0].product.mobimatterId,
              label: order.orderNumber,
            });

            await db.order.update({
              where: { id: orderId },
              data: {
                status: "COMPLETED",
                mobimatterOrderId: topupResult.orderId,
                mobimatterStatus: topupResult.orderState,
                esimQrCode: encryptEsimField(topupResult.lineItem?.qrCode),
                esimActivationCode: encryptEsimField(
                  topupResult.lineItem?.activationCode,
                ),
                esimSmdpAddress: encryptEsimField(
                  topupResult.lineItem?.smdpAddress,
                ),
                completedAt: new Date(),
              },
            });

            if (order) {
              try {
                const lpaString = decryptEsimField(order.esimQrCode);
                const activationCode = decryptEsimField(order.esimActivationCode);
                const smdpAddress = decryptEsimField(order.esimSmdpAddress);

                await sendOrderConfirmation(
                  order.email,
                  order.orderNumber,
                  order.items.map((item) => ({
                    productName: `Top-Up: ${item.productName}`,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    totalPrice: item.totalPrice,
                  })),
                  order.total,
                  lpaString ? { lpaString, activationCode, smdpAddress } : undefined,
                );
              } catch (emailErr) {
                log.errorWithException('Failed to send top-up confirmation email', emailErr, {
                  metadata: { orderId, orderNumber: order.orderNumber },
                });
              }

              if (order.userId) {
                sendPushNotification(
                  order.userId,
                  "Top-Up Complete!",
                  `Your ${order.items[0]?.productName ?? "eSIM"} top-up is active.`,
                  { orderNumber: order.orderNumber },
                ).catch(() => {});
              }
            }

            await logAudit({
              action: "topup_payment_success",
              entity: "order",
              entityId: orderId,
              newValues: {
                sessionId: session.id,
                parentMobimatterOrderId,
                success: true,
              },
            });
          } catch (error) {
            log.errorWithException("Top-up fulfillment failed", error, {
              metadata: { orderId },
            });

            await db.order.update({
              where: { id: orderId },
              data: { status: "FAILED", mobimatterStatus: "FAILED" },
            });

            // Auto-refund: user paid but top-up was not delivered
            if (session.payment_intent) {
              try {
                await stripe.refunds.create({
                  payment_intent: session.payment_intent as string,
                  reason: 'fraudulent', // closest Stripe reason for "service not delivered"
                });
                log.info('Auto-refund issued for failed top-up', { metadata: { orderId } });
                await db.order.update({
                  where: { id: orderId },
                  data: { status: 'REFUNDED' },
                });
              } catch (refundErr) {
                log.errorWithException('Auto-refund failed for top-up — manual intervention required', refundErr, {
                  metadata: { orderId, paymentIntent: session.payment_intent as string },
                });
              }
            }

            await logAudit({
              action: "topup_payment_failed",
              entity: "order",
              entityId: orderId,
              newValues: {
                sessionId: session.id,
                error: error instanceof Error ? error.message : "Unknown",
              },
            });
          }
        } else {
          // STANDARD FLOW: Create + Complete order via MobiMatter
          const fulfillment = await processOrderWithMobimatter(
            orderId,
            "SYSTEM_WEBHOOK",
          );

          const order = await db.order.findUnique({
            where: { id: orderId },
            include: { items: true },
          });

          if (!fulfillment.success) {
            log.error("Fulfillment failed", {
              metadata: { orderId, error: fulfillment.error },
            });
            if (order) {
              try {
                await sendOrderFailed(order.email, order.orderNumber);
              } catch (emailErr) {
                log.errorWithException("Failed to send failure email", emailErr, {
                  metadata: { orderId, orderNumber: order.orderNumber },
                });
              }
            }
            // Auto-refund: user paid but eSIM was not delivered
            if (order && session.payment_intent) {
              try {
                await stripe.refunds.create({
                  payment_intent: session.payment_intent as string,
                  reason: 'fraudulent', // closest Stripe reason for "service not delivered"
                });
                log.info('Auto-refund issued for failed fulfillment', { metadata: { orderId } });
                await db.order.update({
                  where: { id: orderId },
                  data: { status: 'REFUNDED' },
                });
              } catch (refundErr) {
                log.errorWithException('Auto-refund failed — manual intervention required', refundErr, {
                  metadata: { orderId, paymentIntent: session.payment_intent as string },
                });
              }
            }
          } else if (order) {
            try {
              // Decrypt eSIM fields to include QR code in the email
              const lpaString = decryptEsimField(order.esimQrCode);
              const activationCode = decryptEsimField(order.esimActivationCode);
              const smdpAddress = decryptEsimField(order.esimSmdpAddress);

              await sendOrderConfirmation(
                order.email,
                order.orderNumber,
                order.items.map((item) => ({
                  productName: item.productName,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  totalPrice: item.totalPrice,
                })),
                order.total,
                lpaString ? { lpaString, activationCode, smdpAddress } : undefined,
              );
            } catch (emailErr) {
              log.errorWithException('Failed to send order confirmation email', emailErr, {
                metadata: { orderId, orderNumber: order.orderNumber },
              });
            }

            if (order.userId) {
              sendPushNotification(
                order.userId,
                "eSIM Ready!",
                `Your ${order.items[0]?.productName ?? "eSIM"} is ready to activate.`,
                { orderNumber: order.orderNumber },
              ).catch(() => {});
            }
          }

          await logAudit({
            action: "stripe_payment_success",
            entity: "order",
            entityId: orderId,
            newValues: {
              sessionId: session.id,
              fulfillment: fulfillment.success,
            },
          });

          if (order) {
            const posthog = getPostHogClient();
            if (posthog) {
              const userId = order.userId ?? orderId;
              posthog.capture({
                distinctId: userId,
                event: "payment_succeeded",
                properties: {
                  order_id: order.id,
                  order_number: order.orderNumber,
                  total: order.total,
                  currency: order.currency,
                  items_count: order.items.length,
                },
              });
              if (fulfillment.success) {
                posthog.capture({
                  distinctId: userId,
                  event: "esim_fulfilled",
                  properties: {
                    order_id: order.id,
                    order_number: order.orderNumber,
                  },
                });
              }
            }
          }

          // ── Cashback reward (10% of order total) ──
          if (fulfillment.success && order?.userId) {
            const cashbackAmount = Math.round(order.total * CASHBACK_PERCENT * 100) / 100;
            if (cashbackAmount > 0) {
              try {
                await db.$transaction(async (tx) => {
                  // Idempotency: skip if cashback already exists for this order
                  const existingReward = await tx.reward.findFirst({
                    where: { orderId: order.id, type: "cashback" },
                  });
                  if (existingReward) {
                    log.info(`Cashback already issued for order ${order.id}, skipping duplicate`);
                    return;
                  }

                  await tx.reward.create({
                    data: {
                      userId: order.userId!,
                      type: "cashback",
                      amount: cashbackAmount,
                      orderId: order.id,
                      description: `${Math.round(CASHBACK_PERCENT * 100)}% cashback on order ${order.orderNumber}`,
                    },
                  });

                  // Credit wallet + ledger entry atomically with reward creation
                  const wallet = await tx.wallet.upsert({
                    where: { userId: order.userId! },
                    create: {
                      userId: order.userId!,
                      balance: cashbackAmount,
                    },
                    update: {
                      balance: { increment: cashbackAmount },
                    },
                  });
                  await tx.walletTransaction.create({
                    data: {
                      walletId: wallet.id,
                      userId: order.userId!,
                      type: "credit",
                      amount: cashbackAmount,
                      orderId: order.id,
                      description: `Cashback on order ${order.orderNumber}`,
                    },
                  });
                });
              } catch (err: unknown) {
                log.errorWithException("Failed to create cashback reward and credit wallet", err, {
                  metadata: { orderId: order.id },
                });
              }
            }
          }
        }

        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object;
        const orderId = session.client_reference_id;

        if (orderId) {
          const order = await db.order.findUnique({
            where: { id: orderId },
            select: { status: true, orderNumber: true },
          });

          if (order && order.status === "PENDING") {
            await db.order.update({
              where: { id: orderId },
              data: {
                status: "CANCELLED",
                paymentStatus: "FAILED",
              },
            });

            await logAudit({
              action: "order_cancel",
              entity: "order",
              entityId: orderId,
              newValues: {
                source: "stripe_webhook",
                reason: "checkout_session_expired",
                sessionId: session.id,
                orderNumber: order.orderNumber,
              },
            });
          }
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;
        const orderId = paymentIntent.metadata.orderId;

        if (orderId) {
          await db.order.update({
            where: { id: orderId },
            data: {
              paymentStatus: "FAILED",
              status: "FAILED",
            },
          });

          const posthog = getPostHogClient();
          if (posthog) {
            posthog.capture({
              distinctId: orderId,
              event: "payment_failed",
              properties: {
                order_id: orderId,
                failure_reason: paymentIntent.last_payment_error?.message,
              },
            });
          }
        }
        break;
      }
    }

    return new NextResponse(JSON.stringify({ received: true }), {
      status: 200,
    });
  } catch (error) {
    log.errorWithException("Webhook handler error", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
