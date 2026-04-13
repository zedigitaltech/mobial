/**
 * GET /api/b2b/wallet
 * Get MobiMatter wallet balance
 */

import { NextRequest } from 'next/server';
import { getWalletBalance } from '@/lib/mobimatter';
import { successResponse, errorResponse, requireAdmin } from '@/lib/auth-helpers';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const balance = await getWalletBalance();

    return successResponse({ balance });
  } catch (error) {
    if (error instanceof Error && error.message.includes('denied')) {
      return errorResponse('Access denied', 403);
    }
    logger.errorWithException('Wallet balance error', error);
    return errorResponse('Failed to fetch wallet balance', 500);
  }
}
