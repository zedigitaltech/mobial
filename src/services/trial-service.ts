import { db } from "@/lib/db"

const TRIAL_DESTINATIONS = [
  { country: "TR", name: "Turkey", label: "Popular" },
  { country: "TH", name: "Thailand", label: "Popular" },
  { country: "ES", name: "Spain", label: "Europe" },
  { country: "JP", name: "Japan", label: "Asia" },
  { country: "US", name: "United States", label: "Americas" },
  { country: "IT", name: "Italy", label: "Europe" },
  { country: "GB", name: "United Kingdom", label: "Europe" },
  { country: "DE", name: "Germany", label: "Europe" },
] as const

export function getTrialDestinations() {
  return TRIAL_DESTINATIONS.map((d) => ({
    country: d.country,
    name: d.name,
    label: d.label,
  }))
}

export async function hasClaimedTrial(email: string): Promise<boolean> {
  const existing = await db.freeTrial.findUnique({
    where: { email: email.toLowerCase() },
  })
  return !!existing
}

export async function claimTrial(params: {
  email: string
  destination: string
  userId?: string
}): Promise<{
  success: boolean
  error?: string
  trial?: { id: string; destination: string; email: string }
}> {
  const email = params.email.toLowerCase()

  const alreadyClaimed = await hasClaimedTrial(email)
  if (alreadyClaimed) {
    return { success: false, error: "You have already claimed a free trial eSIM." }
  }

  const validDestination = TRIAL_DESTINATIONS.find(
    (d) => d.country === params.destination
  )
  if (!validDestination) {
    return { success: false, error: "Invalid destination selected." }
  }

  // Find the cheapest active product for this destination
  const product = await db.product.findFirst({
    where: {
      isActive: true,
      countries: { contains: params.destination },
      dataAmount: { gte: 0.5 },
    },
    orderBy: { price: "asc" },
    select: { id: true, name: true, price: true, validityDays: true },
  })

  if (!product) {
    return {
      success: false,
      error: "No trial plans available for this destination right now.",
    }
  }

  const trial = await db.freeTrial.create({
    data: {
      email,
      userId: params.userId,
      destination: params.destination,
      productId: product.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days to activate
    },
  })

  return {
    success: true,
    trial: {
      id: trial.id,
      destination: trial.destination,
      email: trial.email,
    },
  }
}

export async function getTrialStats(): Promise<{
  totalClaimed: number
  totalConverted: number
  conversionRate: number
  byDestination: Array<{ destination: string; count: number }>
}> {
  const [totalClaimed, totalConverted, byDestination] = await Promise.all([
    db.freeTrial.count(),
    db.freeTrial.count({ where: { status: "CONVERTED" } }),
    db.freeTrial.groupBy({
      by: ["destination"],
      _count: { destination: true },
      orderBy: { _count: { destination: "desc" } },
    }),
  ])

  return {
    totalClaimed,
    totalConverted,
    conversionRate: totalClaimed > 0 ? (totalConverted / totalClaimed) * 100 : 0,
    byDestination: byDestination.map((d) => ({
      destination: d.destination,
      count: d._count.destination,
    })),
  }
}
