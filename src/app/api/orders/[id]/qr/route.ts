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
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const order = await db.order.findUnique({
    where: { id },
    select: {
      userId: true,
      email: true,
      esimQrCode: true,
      esimActivationCode: true,
      esimSmdpAddress: true,
      status: true,
    },
  });

  if (!order) {
    return new Response('Not found', { status: 404 });
  }

  // Check ownership or admin
  if (user.role !== 'ADMIN' && order.userId !== user.id && order.email !== user.email) {
    return new Response('Forbidden', { status: 403 });
  }

  if (order.status !== 'COMPLETED') {
    return new Response('Order not completed', { status: 400 });
  }

  // Build the QR string: prefer the stored QR code (LPA string), fall back to constructing from parts
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
