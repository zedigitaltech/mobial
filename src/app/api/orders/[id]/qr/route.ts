import { NextRequest } from 'next/server';
import QRCode from 'qrcode';
import { getAuthUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { decryptEsimField } from '@/lib/esim-encryption';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const user = await getAuthUser(request);
  const guestEmail = request.nextUrl.searchParams.get('email')?.toLowerCase() ?? null;

  // Guests must provide email
  if (!user && !guestEmail) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Look up by id first, then orderNumber
  let order = await db.order.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      email: true,
      esimQrCode: true,
      esimActivationCode: true,
      esimSmdpAddress: true,
      status: true,
    },
  });

  if (!order) {
    order = await db.order.findUnique({
      where: { orderNumber: id },
      select: {
        id: true,
        userId: true,
        email: true,
        esimQrCode: true,
        esimActivationCode: true,
        esimSmdpAddress: true,
        status: true,
      },
    });
  }

  if (!order) {
    return new Response('Not found', { status: 404 });
  }

  // Authorization
  if (user) {
    if (user.role !== 'ADMIN' && order.userId !== user.id && order.email !== user.email) {
      return new Response('Forbidden', { status: 403 });
    }
  } else {
    // Guest: verify email matches
    if (!order.email || order.email.toLowerCase() !== guestEmail) {
      return new Response('Forbidden', { status: 403 });
    }
  }

  if (order.status !== 'COMPLETED') {
    return new Response('Order not completed', { status: 400 });
  }

  const qrData = decryptEsimField(order.esimQrCode)
    || (decryptEsimField(order.esimSmdpAddress) && decryptEsimField(order.esimActivationCode)
      ? `LPA:1$${decryptEsimField(order.esimSmdpAddress)}$${decryptEsimField(order.esimActivationCode)}`
      : null);

  if (!qrData) {
    return new Response('No eSIM data available', { status: 404 });
  }

  const size = Math.min(Math.max(Number(request.nextUrl.searchParams.get('size')) || 400, 100), 1000);

  const pngBuffer = await QRCode.toBuffer(qrData, {
    type: 'png',
    width: size,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: { dark: '#000000', light: '#FFFFFF' },
  });

  return new Response(new Uint8Array(pngBuffer), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'private, no-store',
    },
  });
}
