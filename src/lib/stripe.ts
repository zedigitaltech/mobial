import Stripe from 'stripe';
import { db } from '@/lib/db';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-02-25.clover',
  appInfo: {
    name: 'Mobial eSIM Store',
    version: '0.1.0',
  },
});

/**
 * Get or create a Stripe customer for a user.
 * Returns the Stripe customer ID, or null if userId is not provided.
 */
export async function getOrCreateStripeCustomer(
  userId: string | undefined,
  email: string,
): Promise<string | null> {
  if (!userId) return null;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true, name: true },
  });

  if (user?.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email,
    name: user?.name ?? undefined,
    metadata: { userId },
  });

  await db.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

export async function createCheckoutSession(params: {
  orderId: string;
  orderNumber: string;
  email: string;
  amount: number;
  currency?: string;
  isTopUp?: boolean;
  parentMobimatterOrderId?: string;
  userId?: string;
  items: Array<{
    name: string;
    description?: string;
    amount: number;
    quantity: number;
  }>;
}) {
  const {
    orderId,
    orderNumber,
    email,
    amount: _amount,
    currency = 'usd',
    isTopUp,
    parentMobimatterOrderId,
    userId,
    items,
  } = params;

  const stripeCustomerId = await getOrCreateStripeCustomer(userId, email);

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    client_reference_id: orderId,
    metadata: {
      orderId,
      orderNumber,
      ...(isTopUp && { isTopUp: 'true' }),
      ...(parentMobimatterOrderId && { parentMobimatterOrderId }),
    },
    line_items: items.map((item) => ({
      price_data: {
        currency,
        product_data: {
          name: item.name,
          description: item.description,
        },
        unit_amount: Math.round(item.amount * 100),
      },
      quantity: item.quantity,
    })),
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/cancel?order_id=${orderId}`,
  };

  if (stripeCustomerId) {
    sessionParams.customer = stripeCustomerId;
    sessionParams.payment_intent_data = {
      setup_future_usage: 'on_session',
    };
  } else {
    sessionParams.customer_email = email;
  }

  const session = await stripe.checkout.sessions.create(sessionParams);

  return session;
}

export async function verifyWebhookSignature(payload: string, signature: string) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not set');
  }

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}
