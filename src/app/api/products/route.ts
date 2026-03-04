/**
 * Products API Routes
 * GET /api/products - List all active products with filtering and pagination
 */

import { NextRequest } from 'next/server';
import { getProducts, searchProducts, ProductFilters } from '@/services/product-service';
import { successResponse, errorResponse } from '@/lib/auth-helpers';

/**
 * GET /api/products
 * List all active products with filtering and pagination
 * 
 * Query Parameters:
 * - country: Filter by country code
 * - region: Filter by region name
 * - provider: Filter by provider name
 * - minPrice: Minimum price filter
 * - maxPrice: Maximum price filter
 * - sortBy: Sort order (price_asc, price_desc, name, validity, data, createdAt)
 * - limit: Number of results (default 20, max 100)
 * - offset: Offset for pagination
 * - search: Search query for name/description
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const country = searchParams.get('country') || undefined;
    const region = searchParams.get('region') || undefined;
    const provider = searchParams.get('provider') || undefined;
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const sortBy = searchParams.get('sortBy') as ProductFilters['sortBy'] || undefined;
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    const search = searchParams.get('search') || undefined;

    // Parse numeric values
    const limit = Math.min(Math.max(parseInt(limitParam || '20') || 20, 1), 100);
    const offset = Math.max(parseInt(offsetParam || '0') || 0, 0);
    const minPriceNum = minPrice ? parseFloat(minPrice) : undefined;
    const maxPriceNum = maxPrice ? parseFloat(maxPrice) : undefined;

    // Validate numeric values
    if (minPrice !== null && isNaN(minPriceNum!)) {
      return errorResponse('Invalid minPrice value', 400);
    }
    if (maxPrice !== null && isNaN(maxPriceNum!)) {
      return errorResponse('Invalid maxPrice value', 400);
    }

    // Validate sortBy
    const validSortOptions = ['price_asc', 'price_desc', 'name', 'validity', 'data', 'createdAt'];
    if (sortBy && !validSortOptions.includes(sortBy)) {
      return errorResponse(`Invalid sortBy value. Valid options: ${validSortOptions.join(', ')}`, 400);
    }

    // Build filters
    const filters: ProductFilters = {
      country,
      region,
      provider,
      minPrice: minPriceNum,
      maxPrice: maxPriceNum,
      sortBy,
      limit,
      offset,
    };

    // Search or filter products
    let result;
    if (search) {
      result = await searchProducts(search, { limit, offset });
    } else {
      result = await getProducts(filters);
    }

    return successResponse({
      products: result.products,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
        hasMore: result.hasMore,
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return errorResponse('Failed to fetch products', 500);
  }
}
