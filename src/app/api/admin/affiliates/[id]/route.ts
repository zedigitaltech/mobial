import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import {
  requireAdmin,
  successResponse,
  errorResponse,
  parseJsonBody,
  AuthError,
} from '@/lib/auth-helpers';
import { logger } from '@/lib/logger';
import {
  updateAffiliateStatus,
  updateAffiliateCommissionRate,
} from '@/services/affiliate-service';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await params;

    const body = await parseJsonBody<{
      status?: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
      commissionRate?: number;
    }>(request);

    if (!body) {
      return errorResponse('Request body is required', 400);
    }

    const config = await db.systemConfig.findUnique({
      where: { id },
    });

    if (!config || !config.key.startsWith('affiliate:')) {
      return errorResponse('Affiliate not found', 404);
    }

    const code = config.key.replace('affiliate:', '');
    let updatedProfile: { userId: string; status: string; commissionRate: number; createdAt: string } | null = null;

    if (body.status) {
      const validStatuses = ['ACTIVE', 'PENDING', 'SUSPENDED'];
      if (!validStatuses.includes(body.status)) {
        return errorResponse('Invalid status', 400);
      }
      updatedProfile = await updateAffiliateStatus(code, body.status);
    }

    if (body.commissionRate !== undefined) {
      if (body.commissionRate < 0 || body.commissionRate > 100) {
        return errorResponse('Commission rate must be between 0 and 100', 400);
      }
      updatedProfile = await updateAffiliateCommissionRate(code, body.commissionRate);
    }

    if (!updatedProfile) {
      return errorResponse('No valid updates provided', 400);
    }

    await db.auditLog.create({
      data: {
        userId: admin.id,
        action: 'affiliate_updated',
        entity: 'affiliate',
        entityId: code,
        newValues: JSON.stringify({
          status: body.status,
          commissionRate: body.commissionRate,
          updatedBy: admin.id,
        }),
      },
    });

    return successResponse(
      { code, userId: updatedProfile.userId, status: updatedProfile.status, commissionRate: updatedProfile.commissionRate, createdAt: updatedProfile.createdAt },
      'Affiliate updated'
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return errorResponse(error.message, error.statusCode);
    }
    logger.errorWithException('Update affiliate error', error);
    return errorResponse('Failed to update affiliate', 500);
  }
}
