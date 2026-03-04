/**
 * POST /api/affiliate/register
 * Apply to become an affiliate
 */

import { NextRequest } from 'next/server';
import { requireAuth, errorResponse, successResponse, getClientIP, getUserAgent, parseJsonBody } from '@/lib/auth-helpers';
import { registerAffiliate } from '@/services/affiliate-service';
import { logAudit } from '@/lib/audit';

interface RegisterRequest {
  companyName?: string;
  website?: string;
  paymentMethod: string;
  paymentDetails: string;
  taxId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await parseJsonBody<RegisterRequest>(request);

    if (!body) {
      return errorResponse('Request body is required', 400);
    }

    // Validate required fields
    if (!body.paymentMethod) {
      return errorResponse('Payment method is required', 400);
    }

    if (!body.paymentDetails) {
      return errorResponse('Payment details are required', 400);
    }

    // Validate payment method
    const validPaymentMethods = ['bank', 'paypal', 'crypto', 'wise'];
    if (!validPaymentMethods.includes(body.paymentMethod.toLowerCase())) {
      return errorResponse('Invalid payment method. Valid options: bank, paypal, crypto, wise', 400);
    }

    // Validate website URL if provided
    if (body.website) {
      try {
        new URL(body.website);
      } catch {
        return errorResponse('Invalid website URL', 400);
      }
    }

    // Register affiliate
    const profile = await registerAffiliate(user.id, {
      companyName: body.companyName,
      website: body.website,
      paymentMethod: body.paymentMethod.toLowerCase(),
      paymentDetails: body.paymentDetails,
      taxId: body.taxId,
    });

    // Log audit event
    await logAudit({
      userId: user.id,
      action: 'affiliate_register',
      entity: 'AffiliateProfile',
      entityId: profile.id,
      newValues: {
        affiliateCode: profile.affiliateCode,
        companyName: profile.companyName,
        status: profile.status,
      },
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request),
    });

    return successResponse({
      profile: {
        id: profile.id,
        affiliateCode: profile.affiliateCode,
        companyName: profile.companyName,
        website: profile.website,
        status: profile.status,
        commissionRate: profile.commissionRate,
        createdAt: profile.createdAt,
      },
    }, 'Affiliate application submitted successfully');
  } catch (error) {
    console.error('Affiliate registration error:', error);
    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return errorResponse(error.message, 401);
      }
      return errorResponse(error.message, 400);
    }
    return errorResponse('Failed to register as affiliate', 500);
  }
}
