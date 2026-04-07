/**
 * Products API Routes
 * GET /api/products - List all active products with filtering and pagination
 * Uses local database for production-ready, filtered data.
 *
 * Performance: No rate limiting on this read-only endpoint — it's protected
 * by CDN caching (s-maxage=600) and Vercel's built-in DDoS protection.
 * Removing the rate limit DB call saves ~500ms on cold starts.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/auth-helpers";
import { Prisma } from "@prisma/client";
import { countries } from "@/lib/countries";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse parameters
    const country = searchParams.get("country");
    const region = searchParams.get("region");
    const provider = searchParams.get("provider");
    const search = searchParams.get("search");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const category = searchParams.get("category");
    const productFamilyId = searchParams.get("productFamilyId");
    const minData = searchParams.get("minData");
    const maxData = searchParams.get("maxData");
    const is5G = searchParams.get("is5G");
    const supportsCalls = searchParams.get("supportsCalls");
    const supportsHotspot = searchParams.get("supportsHotspot");
    const isUnlimited = searchParams.get("isUnlimited");
    const sortBy = searchParams.get("sortBy") || "price_asc";
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build Where Clause
    const where: Prisma.ProductWhereInput = {
      isActive: true,
      externallyShown: true,
    };

    if (category && category !== "all") {
      where.category = category;
    } else if (!category) {
      where.category = "esim_realtime";
    }

    if (productFamilyId) {
      where.productFamilyId = parseInt(productFamilyId);
    }

    if (country) {
      where.countries = { contains: country, mode: "insensitive" };
    }
    if (region) {
      where.regions = { contains: region, mode: "insensitive" };
    }
    if (provider) {
      where.provider = provider;
    }
    if (search) {
      // Resolve country names (e.g. "germany") to ISO codes (e.g. "DE")
      const searchLower = search.toLowerCase();
      const matchedCountry = Object.entries(countries).find(
        ([slug, data]) =>
          slug.includes(searchLower) ||
          data.name.toLowerCase().includes(searchLower) ||
          data.code.toLowerCase() === searchLower,
      );
      const countryCode = matchedCountry?.[1].code;

      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { provider: { contains: search, mode: "insensitive" } },
        ...(countryCode ? [{ countries: { contains: countryCode } }] : []),
      ];
    }
    if (minPrice || maxPrice) {
      where.price = {
        gte: minPrice ? parseFloat(minPrice) : undefined,
        lte: maxPrice ? parseFloat(maxPrice) : undefined,
      };
    }
    if (minData || maxData) {
      where.dataAmount = {
        ...(minData ? { gt: parseFloat(minData) } : {}),
        ...(maxData ? { lte: parseFloat(maxData) } : {}),
      };
      if (maxData) {
        where.isUnlimited = false;
      }
    }
    if (is5G === "true") {
      where.is5G = true;
    }
    if (supportsCalls === "true") {
      where.supportsCalls = true;
    }
    if (supportsHotspot === "true") {
      where.supportsHotspot = true;
    }
    if (isUnlimited === "true") {
      where.isUnlimited = true;
    }

    // Build Order Clause
    let orderBy: Prisma.ProductOrderByWithRelationInput = { price: "asc" };
    if (sortBy === "price_desc") orderBy = { price: "desc" };
    if (sortBy === "name") orderBy = { name: "asc" };
    if (sortBy === "createdAt") orderBy = { createdAt: "desc" };
    if (sortBy === "rank") orderBy = { penalizedRank: "desc" };

    // Execute Queries — select only fields needed for list views
    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        orderBy,
        take: limit,
        skip: offset,
        select: {
          id: true,
          name: true,
          slug: true,
          provider: true,
          price: true,
          originalPrice: true,
          dataAmount: true,
          dataUnit: true,
          isUnlimited: true,
          validityDays: true,
          countries: true,
          regions: true,
          networks: true,
          providerLogo: true,
          speedInfo: true,
          networkType: true,
          activationPolicy: true,
          isActive: true,
          topUpAvailable: true,
          penalizedRank: true,
          category: true,
          is5G: true,
          supportsCalls: true,
          supportsSms: true,
          supportsHotspot: true,
          bestFitReason: true,
        },
      }),
      db.product.count({ where }),
    ]);

    // Format products (parse JSON strings)
    const formattedProducts = products.map((p) => ({
      ...p,
      countries: p.countries ? JSON.parse(p.countries) : [],
      regions: p.regions ? JSON.parse(p.regions) : [],
    }));

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          products: formattedProducts,
          pagination: {
            total,
            limit,
            offset,
            hasMore: offset + limit < total,
          },
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200",
        },
      },
    );
  } catch (error) {
    console.error("Error fetching products from DB:", error);
    return errorResponse("Failed to fetch products", 500);
  }
}
