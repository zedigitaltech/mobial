/**
 * Countries API Route
 * GET /api/products/countries - Get list of all available countries from products
 */

import { NextRequest } from 'next/server';
import { getAvailableCountries } from '@/services/product-service';
import { successResponse, errorResponse } from '@/lib/auth-helpers';

/**
 * GET /api/products/countries
 * Get list of all available countries from products
 * 
 * Returns an array of countries with:
 * - code: Country code (e.g., "US", "GB")
 * - name: Full country name
 * - productCount: Number of products available for this country
 */
export async function GET(request: NextRequest) {
  try {
    const countries = await getAvailableCountries();

    return successResponse({
      countries,
      total: countries.length,
    });
  } catch (error) {
    console.error('Error fetching countries:', error);
    return errorResponse('Failed to fetch countries', 500);
  }
}
