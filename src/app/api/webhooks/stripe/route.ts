import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { processOrderWithMobimatter } from '@/services/order-service';
import { topupOrder } from '@/lib/mobimatter';
import type { OrderResponse } from '@/lib/mobimatter';
import { logAudit } from '@/lib/audit';
import { sendOrderConfirmation } from '@/services/email-service';
import { encryptEsimField } from '@/lib/esim-encryption';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = (await headers()).get('stripe-signature');

  if (!signature) {
    return new NextResponse('Missing signature', { status: 400 });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new NextResponse('Webhook processing failed', { status: 400 });
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const orderId = session.client_reference_id;
        const isTopUp = session.metadata?.isTopUp === 'true';
        const parentMobimatterOrderId = session.metadata?.parentMobimatterOrderId;

        if (!orderId) {
          console.error('No orderId found in session metadata');
          break;
        }

        // 1. Update Payment Status
        await db.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: 'PAID',
            paymentReference: session.id,
            paidAt: new Date(),
            status: 'PROCESSING'
          },
        });

        if (isTopUp && parentMobimatterOrderId) {
          // TOP-UP FLOW: Call MobiMatter's topup endpoint
          try {
            const order = await db.order.findUnique({
              where: { id: orderId },
              include: { items: { include: { product: { select: { mobimatterId: true } } } } },
            });

            if (!order || !order.items[0]?.product?.mobimatterId) {
              throw new Error('Top-up order missing product data');
            }

            const topupResult: OrderResponse = await topupOrder({
              originalOrderId: parentMobimatterOrderId,
              topupProductId: order.items[0].product.mobimatterId,
              label: order.orderNumber,
            });

            await db.order.update({
              where: { id: orderId },
              data: {
                status: 'COMPLETED',
                mobimatterOrderId: topupResult.orderId,
                mobimatterStatus: topupResult.orderState,
                esimQrCode: encryptEsimField(topupResult.lineItem?.qrCode),
                esimActivationCode: encryptEsimField(topupResult.lineItem?.activationCode),
                esimSmdpAddress: encryptEsimField(topupResult.lineItem?.smdpAddress),
                completedAt: new Date(),
              },
            });

            if (order) {
              await sendOrderConfirmation(
                order.email,
                order.orderNumber,
                order.items.map(item => ({
                  productName: `Top-Up: ${item.productName}`,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  totalPrice: item.totalPrice,
                })),
                order.total
              );
            }

            await logAudit({
              action: 'topup_payment_success',
              entity: 'order',
              entityId: orderId,
              newValues: { sessionId: session.id, parentMobimatterOrderId, success: true }
            });
          } catch (error) {
            console.error(`Top-up fulfillment failed for order ${orderId}:`, error);

            await db.order.update({
              where: { id: orderId },
              data: { status: 'FAILED', mobimatterStatus: 'FAILED' },
            });

            await logAudit({
              action: 'topup_payment_failed',
              entity: 'order',
              entityId: orderId,
              newValues: { sessionId: session.id, error: error instanceof Error ? error.message : 'Unknown' }
            });
          }
        } else {
          // STANDARD FLOW: Create + Complete order via MobiMatter
          const fulfillment = await processOrderWithMobimatter(orderId, 'SYSTEM_WEBHOOK');

          if (!fulfillment.success) {
            console.error(`Fulfillment failed for order ${orderId}:`, fulfillment.error);
          }

          // Send order confirmation email
          const order = await db.order.findUnique({
            where: { id: orderId },
            include: { items: true },
          });

          if (order) {
            await sendOrderConfirmation(
              order.email,
              order.orderNumber,
              order.items.map(item => ({
                productName: item.productName,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
              })),
              order.total
            );
          }

          await logAudit({
            action: 'stripe_payment_success',
            entity: 'order',
            entityId: orderId,
            newValues: { sessionId: session.id, fulfillment: fulfillment.success }
          });
        }

        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object;
        const orderId = session.client_reference_id;

        if (orderId) {
          const order = await db.order.findUnique({
            where: { id: orderId },
            select: { status: true, orderNumber: true },
          });

          if (order && order.status === 'PENDING') {
            await db.order.update({
              where: { id: orderId },
              data: {
                status: 'CANCELLED',
                paymentStatus: 'FAILED',
              },
            });

            await logAudit({
              action: 'order_cancel',
              entity: 'order',
              entityId: orderId,
              newValues: {
                source: 'stripe_webhook',
                reason: 'checkout_session_expired',
                sessionId: session.id,
                orderNumber: order.orderNumber,
              },
            });
          }
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        const orderId = paymentIntent.metadata.orderId;

        if (orderId) {
          await db.order.update({
            where: { id: orderId },
            data: {
              paymentStatus: 'FAILED',
              status: 'FAILED'
            },
          });
        }
        break;
      }
    }

    return new NextResponse(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

