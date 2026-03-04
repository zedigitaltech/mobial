/**
 * PATCH /api/admin/affiliates/[id]/approve
 * Approve affiliate application (admin only)
 */

import { NextRequest } from 'next/server';
import { requireAdmin, errorResponse, successResponse, getClientIP, getUserAgent } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await params;

    // Get affiliate profile
    const profile = await db.affiliateProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!profile) {
      return errorResponse('Affiliate profile not found', 404);
    }

    // Check if already approved
    if (profile.status === 'ACTIVE') {
      return errorResponse('Affiliate is already approved', 400);
    }

    // Update profile status
    const updatedProfile = await db.affiliateProfile.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        approvedAt: new Date(),
      },
    });

    // Log audit event
    await logAudit({
      userId: admin.id,
      action: 'affiliate_approve',
      entity: 'AffiliateProfile',
      entityId: profile.id,
      oldValues: {
        status: profile.status,
      },
      newValues: {
        status: 'ACTIVE',
        approvedAt: new Date(),
      },
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request),
    });

    return successResponse({
      profile: {
        id: updatedProfile.id,
        affiliateCode: updatedProfile.affiliateCode,
        status: updatedProfile.status,
        approvedAt: updatedProfile.approvedAt,
      },
    }, 'Affiliate approved successfully');
  } catch (error) {
    console.error('Approve affiliate error:', error);
    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return errorResponse(error.message, 401);
      }
      if (error.message === 'Admin access required') {
        return errorResponse(error.message, 403);
      }
    }
    return errorResponse('Failed to approve affiliate', 500);
  }
}
