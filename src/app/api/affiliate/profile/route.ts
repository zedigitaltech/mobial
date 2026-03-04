/**
 * GET /api/affiliate/profile
 * Get current user's affiliate profile
 *
 * PATCH /api/affiliate/profile
 * Update affiliate profile
 */

import { NextRequest } from 'next/server';
import { requireAuth, errorResponse, successResponse, getClientIP, getUserAgent, parseJsonBody } from '@/lib/auth-helpers';
import { getAffiliateProfile, updateAffiliateProfile, getAffiliateStats } from '@/services/affiliate-service';
import { logAudit } from '@/lib/audit';

interface UpdateProfileRequest {
  companyName?: string;
  website?: string;
  paymentMethod?: string;
  paymentDetails?: string;
  taxId?: string;
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const profile = await getAffiliateProfile(user.id);

    if (!profile) {
      return errorResponse('Affiliate profile not found', 404);
    }

    // Get stats
    const stats = await getAffiliateStats(user.id);

    return successResponse({
      profile: {
        id: profile.id,
        affiliateCode: profile.affiliateCode,
        companyName: profile.companyName,
        website: profile.website,
        status: profile.status,
        commissionRate: profile.commissionRate,
        paymentMethod: profile.paymentMethod,
        createdAt: profile.createdAt,
        approvedAt: profile.approvedAt,
      },
      stats,
    });
  } catch (error) {
    console.error('Get affiliate profile error:', error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return errorResponse(error.message, 401);
    }
    return errorResponse('Failed to get affiliate profile', 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await parseJsonBody<UpdateProfileRequest>(request);

    if (!body) {
      return errorResponse('Request body is required', 400);
    }

    // Check if there's anything to update
    if (!body.companyName && !body.website && !body.paymentMethod && !body.paymentDetails && !body.taxId) {
      return errorResponse('No fields to update', 400);
    }

    // Validate payment method if provided
    if (body.paymentMethod) {
      const validPaymentMethods = ['bank', 'paypal', 'crypto', 'wise'];
      if (!validPaymentMethods.includes(body.paymentMethod.toLowerCase())) {
        return errorResponse('Invalid payment method. Valid options: bank, paypal, crypto, wise', 400);
      }
    }

    // Validate website URL if provided
    if (body.website) {
      try {
        new URL(body.website);
      } catch {
        return errorResponse('Invalid website URL', 400);
      }
    }

    // Get current profile for audit log
    const currentProfile = await getAffiliateProfile(user.id);
    if (!currentProfile) {
      return errorResponse('Affiliate profile not found', 404);
    }

    // Build update data
    const updateData: UpdateProfileRequest = {};
    if (body.companyName !== undefined) updateData.companyName = body.companyName;
    if (body.website !== undefined) updateData.website = body.website;
    if (body.paymentMethod) updateData.paymentMethod = body.paymentMethod.toLowerCase();
    if (body.paymentDetails) updateData.paymentDetails = body.paymentDetails;
    if (body.taxId !== undefined) updateData.taxId = body.taxId;

    // Update profile
    const updatedProfile = await updateAffiliateProfile(user.id, updateData);

    // Log audit event
    await logAudit({
      userId: user.id,
      action: 'profile_update',
      entity: 'AffiliateProfile',
      entityId: updatedProfile.id,
      oldValues: {
        companyName: currentProfile.companyName,
        website: currentProfile.website,
        paymentMethod: currentProfile.paymentMethod,
      },
      newValues: updateData,
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request),
    });

    return successResponse({
      profile: {
        id: updatedProfile.id,
        affiliateCode: updatedProfile.affiliateCode,
        companyName: updatedProfile.companyName,
        website: updatedProfile.website,
        status: updatedProfile.status,
        commissionRate: updatedProfile.commissionRate,
        paymentMethod: updatedProfile.paymentMethod,
        updatedAt: updatedProfile.updatedAt,
      },
    }, 'Profile updated successfully');
  } catch (error) {
    console.error('Update affiliate profile error:', error);
    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return errorResponse(error.message, 401);
      }
      return errorResponse(error.message, 400);
    }
    return errorResponse('Failed to update affiliate profile', 500);
  }
}
