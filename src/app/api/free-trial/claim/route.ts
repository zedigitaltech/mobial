import { NextRequest } from "next/server"
import { claimTrial, hasClaimedTrial } from "@/services/trial-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, destination } = body

    if (!email || typeof email !== "string") {
      return Response.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return Response.json(
        { success: false, error: "Invalid email address" },
        { status: 400 }
      )
    }

    if (!destination || typeof destination !== "string") {
      return Response.json(
        { success: false, error: "Destination is required" },
        { status: 400 }
      )
    }

    const result = await claimTrial({ email, destination })

    if (!result.success) {
      return Response.json(
        { success: false, error: result.error },
        { status: 409 }
      )
    }

    return Response.json({ success: true, data: result.trial })
  } catch (error) {
    console.error("Free trial claim error:", error)
    return Response.json(
      { success: false, error: "Failed to process trial claim" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email")

  if (!email) {
    return Response.json(
      { success: false, error: "Email parameter required" },
      { status: 400 }
    )
  }

  const claimed = await hasClaimedTrial(email)
  return Response.json({ success: true, data: { claimed } })
}
