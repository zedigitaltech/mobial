/**
 * Single Product API Route
 * GET /api/products/[id] - Get single product by ID or slug
 */

import { NextRequest } from 'next/server';
import { getProductById } from '@/services/product-service';
import { successResponse, errorResponse } from '@/lib/auth-helpers';

/**
 * GET /api/products/[id]
 * Get a single product by ID, slug, or MobiMatter ID
 * 
 * Parameters:
 * - id: Product ID, slug, or MobiMatter ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return errorResponse('Product ID is required', 400);
    }

    const product = await getProductById(id);

    if (!product) {
      return errorResponse('Product not found', 404);
    }

    return successResponse({ product });
  } catch (error) {
    console.error('Error fetching product:', error);
    return errorResponse('Failed to fetch product', 500);
  }
}
