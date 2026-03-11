import Stripe from 'stripe';

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

export async function createCheckoutSession(params: {
  orderId: string;
  orderNumber: string;
  email: string;
  amount: number;
  currency?: string;
  isTopUp?: boolean;
  parentMobimatterOrderId?: string;
  items: Array<{
    name: string;
    description?: string;
    amount: number;
    quantity: number;
  }>;
}) {
  const { orderId, orderNumber, email, amount, currency = 'usd', isTopUp, parentMobimatterOrderId, items } = params;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    customer_email: email,
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
        unit_amount: Math.round(item.amount * 100), // Convert to cents
      },
      quantity: item.quantity,
    })),
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/cancel?order_id=${orderId}`,
  });

  return session;
}

export async function verifyWebhookSignature(payload: string, signature: string) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not set');
  }

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}
