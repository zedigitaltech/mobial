/**
 * PATCH /api/admin/affiliates/[id]/commission-rate
 * Update affiliate's commission rate (admin only)
 */

import { NextRequest } from 'next/server';
import { requireAdmin, errorResponse, successResponse, getClientIP, getUserAgent, parseJsonBody } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface UpdateRateRequest {
  commissionRate: number;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await params;
    const body = await parseJsonBody<UpdateRateRequest>(request);

    if (!body || typeof body.commissionRate !== 'number') {
      return errorResponse('Commission rate is required and must be a number', 400);
    }

    // Validate commission rate (0% to 50%)
    if (body.commissionRate < 0 || body.commissionRate > 0.5) {
      return errorResponse('Commission rate must be between 0 and 0.5 (0% to 50%)', 400);
    }

    // Get affiliate profile
    const profile = await db.affiliateProfile.findUnique({
      where: { id },
    });

    if (!profile) {
      return errorResponse('Affiliate profile not found', 404);
    }

    const oldRate = profile.commissionRate;

    // Update commission rate
    const updatedProfile = await db.affiliateProfile.update({
      where: { id },
      data: {
        commissionRate: body.commissionRate,
      },
    });

    // Log audit event
    await logAudit({
      userId: admin.id,
      action: 'settings_change',
      entity: 'AffiliateProfile',
      entityId: profile.id,
      oldValues: {
        commissionRate: oldRate,
      },
      newValues: {
        commissionRate: body.commissionRate,
      },
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request),
    });

    return successResponse({
      profile: {
        id: updatedProfile.id,
        affiliateCode: updatedProfile.affiliateCode,
        commissionRate: updatedProfile.commissionRate,
      },
    }, 'Commission rate updated successfully');
  } catch (error) {
    console.error('Update commission rate error:', error);
    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return errorResponse(error.message, 401);
      }
      if (error.message === 'Admin access required') {
        return errorResponse(error.message, 403);
      }
    }
    return errorResponse('Failed to update commission rate', 500);
  }
}
