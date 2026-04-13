import { NextRequest } from 'next/server';
import { requireAdmin, successResponse, errorResponse } from '@/lib/auth-helpers';
import { getWalletBalance } from '@/lib/mobimatter';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const wallet = await getWalletBalance();

    return successResponse({
      balance: wallet.balance,
      currency: wallet.currency,
    });
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      const authError = error as { statusCode: number; message: string };
      return errorResponse(authError.message, authError.statusCode);
    }
    logger.errorWithException('Error fetching wallet balance', error);
    return errorResponse('Failed to fetch wallet balance', 500);
  }
}
