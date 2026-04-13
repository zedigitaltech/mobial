import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { secureCompare } from '@/lib/encryption';
import { encryptEsimField } from '@/lib/esim-encryption';
import { sendActivationDetected } from '@/services/email-service';
import { logger } from '@/lib/logger';

// Max age of a MobiMatter webhook timestamp before it's rejected as a replay.
const WEBHOOK_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

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
    logger.warn('[MobiMatter Webhook] MOBIMATTER_WEBHOOK_SECRET is not configured — rejecting all requests');
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

  // Replay protection: reject stale timestamps
  if (payload.timestamp) {
    const ts = new Date(payload.timestamp).getTime();
    if (!Number.isFinite(ts) || Math.abs(Date.now() - ts) > WEBHOOK_MAX_AGE_MS) {
      logger.warn(`[MobiMatter Webhook] Rejecting stale webhook (timestamp=${payload.timestamp})`);
      return new NextResponse('Stale webhook', { status: 400 });
    }
  }

  // Replay protection: dedup by payload hash using SystemConfig as short-term store.
  // Successful processing writes the hash; duplicate delivery within 10 minutes is rejected.
  const payloadHash = createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  const dedupKey = `mobimatter_webhook:${payloadHash}`;
  const existing = await db.systemConfig.findUnique({ where: { key: dedupKey } }).catch(() => null);
  if (existing) {
    logger.info(`[MobiMatter Webhook] Duplicate webhook detected, skipping (hash=${payloadHash.slice(0, 12)})`);
    return new NextResponse('Duplicate', { status: 200 });
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
        logger.info(`[MobiMatter Webhook] Unhandled event type: ${eventType}`);
      }
    }
  } catch (error) {
    logger.errorWithException(`[MobiMatter Webhook] Error handling ${eventType}`, error);

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

    // Do not write dedup marker on handler failure — retry is expected
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // Mark this webhook as processed to block replays within the TTL window
  await db.systemConfig.upsert({
    where: { key: dedupKey },
    update: { value: new Date().toISOString() },
    create: {
      key: dedupKey,
      value: new Date().toISOString(),
      description: 'MobiMatter webhook dedup marker',
    },
  }).catch(() => {});

  return NextResponse.json({ received: true }, { status: 200 });
}

async function handleOrderCompleted(payload: MobiMatterWebhookPayload) {
  if (!payload.orderId) return;

  const order = await db.order.findFirst({
    where: { mobimatterOrderId: payload.orderId },
    include: { items: true },
  });

  if (!order) {
    logger.warn(`[MobiMatter Webhook] Order not found for mobimatterOrderId: ${payload.orderId}`);
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
    logger.warn(`[MobiMatter Webhook] Order not found for mobimatterOrderId: ${payload.orderId}`);
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
    logger.warn(`[MobiMatter Webhook] OrderItem not found for ICCID: ${payload.iccid}`);
    return;
  }

  // Fire-and-forget activation notification
  // countries is a JSON string like '["US","CA"]', not an array — parse it safely
  let destination = 'your destination';
  try {
    const parsedCountries = JSON.parse(orderItem.product?.countries || '[]');
    if (Array.isArray(parsedCountries) && parsedCountries.length > 0) {
      destination = parsedCountries[0];
    }
  } catch {
    // keep default
  }
  sendActivationDetected(
    orderItem.order.email,
    orderItem.order.orderNumber,
    destination
  ).catch((err) =>
    logger.errorWithException('[MobiMatter Webhook] Failed to send activation email', err)
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
    logger.warn(`[MobiMatter Webhook] OrderItem not found for ICCID: ${payload.iccid}`);
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
