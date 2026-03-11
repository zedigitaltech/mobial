/**
 * Products API Routes
 * GET /api/products - List all active products with filtering and pagination
 * Uses local database for production-ready, filtered data
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { successResponse, errorResponse, getClientIP } from '@/lib/auth-helpers';
import { checkRateLimit, createRateLimitHeaders } from '@/lib/rate-limit';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    const rateLimitResult = await checkRateLimit(clientIP, 'api:products', {
      windowMs: 60000,
      maxRequests: 100,
    });

    if (!rateLimitResult.success) {
      const headers = createRateLimitHeaders(rateLimitResult);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Too many requests. Please try again later.',
          retryAfter: rateLimitResult.retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...Object.fromEntries(headers.entries()),
          },
        }
      );
    }

    const { searchParams } = new URL(request.url);

    // Parse parameters
    const country = searchParams.get('country');
    const region = searchParams.get('region');
    const provider = searchParams.get('provider');
    const search = searchParams.get('search');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const category = searchParams.get('category');
    const productFamilyId = searchParams.get('productFamilyId');
    const sortBy = searchParams.get('sortBy') || 'price_asc';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build Where Clause
    const where: Prisma.ProductWhereInput = {
      isActive: true,
      externallyShown: true,
    };

    if (category && category !== 'all') {
      where.category = category;
    } else if (!category) {
      where.category = 'esim_realtime';
    }

    if (productFamilyId) {
      where.productFamilyId = parseInt(productFamilyId);
    }

    if (country) {
      where.countries = { contains: country };
    }
    if (region) {
      where.regions = { contains: region };
    }
    if (provider) {
      where.provider = provider;
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { provider: { contains: search } },
        { countries: { contains: search } }
      ];
    }
    if (minPrice || maxPrice) {
      where.price = {
        gte: minPrice ? parseFloat(minPrice) : undefined,
        lte: maxPrice ? parseFloat(maxPrice) : undefined,
      };
    }

    // Build Order Clause
    let orderBy: Prisma.ProductOrderByWithRelationInput = { price: 'asc' };
    if (sortBy === 'price_desc') orderBy = { price: 'desc' };
    if (sortBy === 'name') orderBy = { name: 'asc' };
    if (sortBy === 'createdAt') orderBy = { createdAt: 'desc' };
    if (sortBy === 'rank') orderBy = { penalizedRank: 'desc' };

    // Execute Queries
    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        orderBy,
        take: limit,
        skip: offset,
      }),
      db.product.count({ where })
    ]);

    // Format products (parse JSON strings)
    const formattedProducts = products.map(p => ({
      ...p,
      countries: p.countries ? JSON.parse(p.countries) : [],
      regions: p.regions ? JSON.parse(p.regions) : [],
      features: p.features ? JSON.parse(p.features) : [],
      tags: p.tags ? JSON.parse(p.tags) : [],
    }));

    return successResponse({
      products: formattedProducts,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching products from DB:', error);
    return errorResponse('Failed to fetch products', 500);
  }
}
