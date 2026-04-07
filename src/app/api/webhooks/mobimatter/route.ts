import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { secureCompare } from '@/lib/encryption';
import { encryptEsimField } from '@/lib/esim-encryption';
import { sendActivationDetected } from '@/services/email-service';

interface MobiMatterWebhookPayload {
  eventType: string;
  orderId?: string;
  status?: string;
  iccid?: string;
  qrCode?: string;
  activationCode?: string;
  smdpAddress?: string;
  errorMessage?: string;
  timestamp?: string;
  [key: string]: unknown;
}

function validateWebhookRequest(request: NextRequest): boolean {
  const secret = process.env.MOBIMATTER_WEBHOOK_SECRET;
  if (!secret) {
    console.warn('[MobiMatter Webhook] MOBIMATTER_WEBHOOK_SECRET is not configured — rejecting all requests');
    return false;
  }

  const signature = request.headers.get('x-webhook-secret')
    || request.headers.get('x-mobimatter-signature')
    || request.headers.get('authorization');

  if (!signature) {
    return false;
  }

  const rawSignature = signature.startsWith('Bearer ') ? signature.slice(7) : signature;
  return secureCompare(rawSignature, secret);
}

export async function POST(request: NextRequest) {
  if (!validateWebhookRequest(request)) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  let payload: MobiMatterWebhookPayload;

  try {
    payload = await request.json();
  } catch {
    return new NextResponse('Invalid JSON', { status: 400 });
  }

  const eventType = payload.eventType;

  if (!eventType) {
    return new NextResponse('Missing eventType', { status: 400 });
  }

  await logAudit({
    action: 'security_alert',
    entity: 'webhook',
    entityId: payload.orderId || undefined,
    newValues: {
      source: 'mobimatter',
      eventType,
      orderId: payload.orderId,
      timestamp: payload.timestamp || new Date().toISOString(),
    },
    ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
    userAgent: request.headers.get('user-agent') || 'mobimatter-webhook',
  });

  try {
    switch (eventType) {
      case 'order.completed': {
        await handleOrderCompleted(payload);
        break;
      }
      case 'order.failed': {
        await handleOrderFailed(payload);
        break;
      }
      case 'esim.activated': {
        await handleEsimActivated(payload);
        break;
      }
      case 'esim.expired': {
        await handleEsimExpired(payload);
        break;
      }
      default: {
        console.log(`[MobiMatter Webhook] Unhandled event type: ${eventType}`);
      }
    }
  } catch (error) {
    console.error(`[MobiMatter Webhook] Error handling ${eventType}:`, error);

    await logAudit({
      action: 'security_alert',
      entity: 'webhook',
      entityId: payload.orderId || undefined,
      newValues: {
        source: 'mobimatter',
        eventType,
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 'handler_error',
      },
    });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

async function handleOrderCompleted(payload: MobiMatterWebhookPayload) {
  if (!payload.orderId) return;

  const order = await db.order.findFirst({
    where: { mobimatterOrderId: payload.orderId },
    include: { items: true },
  });

  if (!order) {
    console.warn(`[MobiMatter Webhook] Order not found for mobimatterOrderId: ${payload.orderId}`);
    return;
  }

  await db.order.update({
    where: { id: order.id },
    data: {
      status: 'COMPLETED',
      mobimatterStatus: 'COMPLETED',
      esimQrCode: payload.qrCode ? encryptEsimField(payload.qrCode) : order.esimQrCode,
      esimActivationCode: payload.activationCode ? encryptEsimField(payload.activationCode) : order.esimActivationCode,
      esimSmdpAddress: payload.smdpAddress ? encryptEsimField(payload.smdpAddress) : order.esimSmdpAddress,
      completedAt: new Date(),
    },
  });

  if (payload.iccid && order.items.length > 0) {
    await db.orderItem.update({
      where: { id: order.items[0].id },
      data: {
        esimIccid: payload.iccid,
        esimQrCode: encryptEsimField(payload.qrCode),
      },
    });
  }

  await logAudit({
    action: 'order_complete',
    entity: 'order',
    entityId: order.id,
    newValues: {
      source: 'mobimatter_webhook',
      mobimatterOrderId: payload.orderId,
      orderNumber: order.orderNumber,
    },
  });
}

async function handleOrderFailed(payload: MobiMatterWebhookPayload) {
  if (!payload.orderId) return;

  const order = await db.order.findFirst({
    where: { mobimatterOrderId: payload.orderId },
  });

  if (!order) {
    console.warn(`[MobiMatter Webhook] Order not found for mobimatterOrderId: ${payload.orderId}`);
    return;
  }

  await db.order.update({
    where: { id: order.id },
    data: {
      status: 'FAILED',
      mobimatterStatus: 'FAILED',
    },
  });

  await logAudit({
    action: 'security_alert',
    entity: 'order',
    entityId: order.id,
    newValues: {
      source: 'mobimatter_webhook',
      eventType: 'order.failed',
      error: payload.errorMessage || 'Order failed',
      mobimatterOrderId: payload.orderId,
      orderNumber: order.orderNumber,
    },
  });
}

async function handleEsimActivated(payload: MobiMatterWebhookPayload) {
  if (!payload.iccid) return;

  const orderItem = await db.orderItem.findFirst({
    where: { esimIccid: payload.iccid },
    include: {
      order: true,
      product: { select: { countries: true } },
    },
  });

  if (!orderItem) {
    console.warn(`[MobiMatter Webhook] OrderItem not found for ICCID: ${payload.iccid}`);
    return;
  }

  // Fire-and-forget activation notification
  const destination = orderItem.product?.countries?.[0] || 'your destination';
  sendActivationDetected(
    orderItem.order.email,
    orderItem.order.orderNumber,
    destination
  ).catch((err) =>
    console.error('[MobiMatter Webhook] Failed to send activation email:', err)
  );

  await logAudit({
    action: 'order_complete',
    entity: 'order_item',
    entityId: orderItem.id,
    newValues: {
      source: 'mobimatter_webhook',
      eventType: 'esim.activated',
      iccid: payload.iccid,
      activatedAt: new Date().toISOString(),
      orderNumber: orderItem.order.orderNumber,
    },
  });
}

async function handleEsimExpired(payload: MobiMatterWebhookPayload) {
  if (!payload.iccid) return;

  const orderItem = await db.orderItem.findFirst({
    where: { esimIccid: payload.iccid },
    include: { order: true },
  });

  if (!orderItem) {
    console.warn(`[MobiMatter Webhook] OrderItem not found for ICCID: ${payload.iccid}`);
    return;
  }

  await logAudit({
    action: 'security_alert',
    entity: 'order_item',
    entityId: orderItem.id,
    newValues: {
      source: 'mobimatter_webhook',
      eventType: 'esim.expired',
      iccid: payload.iccid,
      expiredAt: new Date().toISOString(),
      orderNumber: orderItem.order.orderNumber,
    },
  });
}
