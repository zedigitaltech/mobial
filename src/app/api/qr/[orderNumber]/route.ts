import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { db } from "@/lib/db";
import { decryptEsimField } from "@/lib/esim-encryption";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> },
) {
  const { orderNumber } = await params;

  const order = await db.order.findUnique({
    where: { orderNumber },
    select: { esimQrCode: true, status: true },
  });

  if (!order || order.status === "PENDING") {
    return new NextResponse("Not found", { status: 404 });
  }

  const raw = decryptEsimField(order.esimQrCode);
  if (!raw) {
    return new NextResponse("QR code not available", { status: 404 });
  }

  const png = await QRCode.toBuffer(raw, {
    errorCorrectionLevel: "M",
    width: 300,
    margin: 2,
  });

  return new NextResponse(png as unknown as BodyInit, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
