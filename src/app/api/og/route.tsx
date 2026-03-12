import { ImageResponse } from "next/og"
import { NextRequest } from "next/server"

export const runtime = "edge"

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const title = searchParams.get("title") || "MobiaL eSIM"
  const subtitle = searchParams.get("subtitle") || "Stay connected worldwide"
  const flag = searchParams.get("flag") || ""

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg, #0a0f1a 0%, #111827 50%, #0a1628 100%)",
          padding: "60px",
        }}
      >
        {/* Decorative accent */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-100px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(56,140,210,0.15) 0%, transparent 70%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-80px",
            left: "-80px",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(56,140,210,0.1) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Flag */}
        {flag && (
          <div
            style={{
              fontSize: "96px",
              marginBottom: "24px",
              display: "flex",
            }}
          >
            {flag}
          </div>
        )}

        {/* Title */}
        <div
          style={{
            fontSize: "56px",
            fontWeight: 900,
            color: "#ffffff",
            textAlign: "center",
            lineHeight: 1.15,
            letterSpacing: "-1px",
            display: "flex",
            maxWidth: "900px",
          }}
        >
          {title}
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: "26px",
            color: "#94a3b8",
            textAlign: "center",
            marginTop: "20px",
            display: "flex",
            maxWidth: "700px",
          }}
        >
          {subtitle}
        </div>

        {/* Brand */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #2563eb, #3b82f6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontSize: "18px",
              fontWeight: 900,
            }}
          >
            M
          </div>
          <div
            style={{
              fontSize: "24px",
              fontWeight: 800,
              color: "#e2e8f0",
              letterSpacing: "-0.5px",
              display: "flex",
            }}
          >
            MobiaL
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
