/**
 * PATCH /api/admin/affiliates/[id]/suspend
 * Suspend affiliate (admin only)
 */

import { NextRequest } from 'next/server';
import { requireAdmin, errorResponse, successResponse, getClientIP, getUserAgent, parseJsonBody } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface SuspendRequest {
  reason?: string;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await params;
    const body = await parseJsonBody<SuspendRequest>(request);

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

    // Check if already suspended
    if (profile.status === 'SUSPENDED') {
      return errorResponse('Affiliate is already suspended', 400);
    }

    // Update profile status
    const updatedProfile = await db.affiliateProfile.update({
      where: { id },
      data: {
        status: 'SUSPENDED',
      },
    });

    // Log audit event
    await logAudit({
      userId: admin.id,
      action: 'account_suspend',
      entity: 'AffiliateProfile',
      entityId: profile.id,
      oldValues: {
        status: profile.status,
      },
      newValues: {
        status: 'SUSPENDED',
        reason: body?.reason,
      },
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request),
    });

    return successResponse({
      profile: {
        id: updatedProfile.id,
        affiliateCode: updatedProfile.affiliateCode,
        status: updatedProfile.status,
      },
    }, 'Affiliate suspended successfully');
  } catch (error) {
    console.error('Suspend affiliate error:', error);
    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return errorResponse(error.message, 401);
      }
      if (error.message === 'Admin access required') {
        return errorResponse(error.message, 403);
      }
    }
    return errorResponse('Failed to suspend affiliate', 500);
  }
}
