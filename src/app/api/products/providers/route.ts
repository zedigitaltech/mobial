/**
 * Providers API Route
 * GET /api/products/providers - Get list of all providers with product counts
 */

import { NextRequest } from 'next/server';
import { getAvailableProviders } from '@/services/product-service';
import { successResponse, errorResponse } from '@/lib/auth-helpers';
import { logger } from '@/lib/logger';

/**
 * GET /api/products/providers
 * Get list of all providers with product counts
 * 
 * Returns an array of providers with:
 * - name: Provider name
 * - productCount: Number of products from this provider
 */
export async function GET(_request: NextRequest) {
  try {
    const providers = await getAvailableProviders();

    return successResponse({
      providers,
      total: providers.length,
    });
  } catch (error) {
    logger.errorWithException('Error fetching providers', error);
    return errorResponse('Failed to fetch providers', 500);
  }
}
