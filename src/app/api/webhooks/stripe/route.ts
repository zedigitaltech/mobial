import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { processOrderWithMobimatter } from '@/services/order-service';
import { logAudit } from '@/lib/audit';
import { sendOrderConfirmation } from '@/services/email-service';

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
    return new NextResponse(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown Error'}`, { status: 400 });
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const orderId = session.client_reference_id;

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

        // 2. Trigger MobiMatter Fulfillment (Little Bro in action)
        // This is where the magic happens - it calls the two-step API we fixed earlier
        const fulfillment = await processOrderWithMobimatter(orderId, 'SYSTEM_WEBHOOK');

        if (!fulfillment.success) {
          console.error(`Fulfillment failed for order ${orderId}:`, fulfillment.error);
        }

        // 3. Send order confirmation email
        const order = await db.order.findUnique({
          where: { id: orderId },
          include: { items: true },
        });

        if (order) {
          await sendOrderConfirmation(
            order.email,
            order.orderNumber,
            order.items.map(item => ({
              name: item.productName,
              quantity: item.quantity,
              price: item.unitPrice,
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

