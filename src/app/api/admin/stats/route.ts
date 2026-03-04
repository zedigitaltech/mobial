import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin, jsonResponse } from "@/lib/auth-helpers"

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request)

    // Get all stats in parallel
    const [
      totalAffiliates,
      pendingAffiliates,
      activeAffiliates,
      totalOrders,
      pendingOrders,
      completedOrders,
      totalRevenue,
      pendingCommissions,
      totalClicks,
      totalConversions,
    ] = await Promise.all([
      // Total affiliates
      db.affiliateProfile.count(),
      
      // Pending affiliates
      db.affiliateProfile.count({
        where: { status: "PENDING" },
      }),
      
      // Active affiliates
      db.affiliateProfile.count({
        where: { status: "ACTIVE" },
      }),
      
      // Total orders
      db.order.count(),
      
      // Pending orders
      db.order.count({
        where: { status: "PENDING" },
      }),
      
      // Completed orders
      db.order.count({
        where: { status: "COMPLETED" },
      }),
      
      // Total revenue (sum of completed order totals)
      db.order.aggregate({
        where: { status: "COMPLETED" },
        _sum: { total: true },
      }),
      
      // Pending commissions
      db.commission.aggregate({
        where: { status: "PENDING" },
        _sum: { amount: true },
      }),
      
      // Total clicks
      db.affiliateClick.count(),
      
      // Total conversions
      db.affiliateClick.count({
        where: { converted: true },
      }),
    ])

    const conversionRate = totalClicks > 0 
      ? (totalConversions / totalClicks) * 100 
      : 0

    return jsonResponse({
      success: true,
      totalAffiliates,
      pendingAffiliates,
      activeAffiliates,
      totalOrders,
      pendingOrders,
      completedOrders,
      totalRevenue: totalRevenue._sum.total || 0,
      pendingCommissions: pendingCommissions._sum.amount || 0,
      totalClicks,
      totalConversions,
      conversionRate,
    })
  } catch (error) {
    console.error("Failed to fetch admin stats:", error)
    return jsonResponse(
      { success: false, error: "Failed to fetch stats" },
      500
    )
  }
}
