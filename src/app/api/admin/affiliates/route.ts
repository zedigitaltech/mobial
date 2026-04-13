import { NextRequest } from 'next/server';
import {
  requireAdmin,
  successResponse,
  errorResponse,
  AuthError,
} from '@/lib/auth-helpers';
import { getAllAffiliates } from '@/services/affiliate-service';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;

    const affiliates = await getAllAffiliates({ status, search });

    return successResponse({
      affiliates,
      total: affiliates.length,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return errorResponse(error.message, error.statusCode);
    }
    logger.errorWithException('Get affiliates error', error);
    return errorResponse('Failed to fetch affiliates', 500);
  }
}
