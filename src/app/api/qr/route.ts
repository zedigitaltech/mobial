/**
 * GET /api/qr?data=<string>&size=<number>
 *
 * Generates a QR code PNG from any data string.
 * Used by EsimCard to render eSIM activation QR codes.
 * The data (LPA string) is not secret — it is shown on-screen already.
 */

import { NextRequest } from "next/server"
import QRCode from "qrcode"

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const data = searchParams.get("data")

  if (!data) {
    return new Response("data parameter is required", { status: 400 })
  }

  const size = Math.min(
    Math.max(Number(searchParams.get("size")) || 300, 100),
    1000,
  )

  const pngBuffer = await QRCode.toBuffer(data, {
    type: "png",
    width: size,
    margin: 2,
    errorCorrectionLevel: "M",
    color: { dark: "#000000", light: "#FFFFFF" },
  })

  return new Response(new Uint8Array(pngBuffer), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600, immutable",
    },
  })
}
