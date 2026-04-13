/**
 * Countries API Route
 * GET /api/products/countries - Get list of all available countries from products
 */

import { NextRequest } from 'next/server';
import { getAvailableCountries } from '@/services/product-service';
import { errorResponse } from '@/lib/auth-helpers';
import { logger } from '@/lib/logger';

/**
 * GET /api/products/countries
 * Get list of all available countries from products
 * 
 * Returns an array of countries with:
 * - code: Country code (e.g., "US", "GB")
 * - name: Full country name
 * - productCount: Number of products available for this country
 */
export async function GET(_request: NextRequest) {
  try {
    const countries = await getAvailableCountries();

    return new Response(
      JSON.stringify({
        success: true,
        data: { countries, total: countries.length },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
      }
    );
  } catch (error) {
    logger.errorWithException('Error fetching countries', error);
    return errorResponse('Failed to fetch countries', 500);
  }
}
