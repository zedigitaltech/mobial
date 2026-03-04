/**
 * POST /api/affiliate/payouts/request
 * Request a payout
 */

import { NextRequest } from 'next/server';
import { requireAuth, errorResponse, successResponse, getClientIP, getUserAgent, parseJsonBody } from '@/lib/auth-helpers';
import { requestPayout, getAffiliateProfile, getCommissionStats } from '@/services/affiliate-service';
import { logAudit } from '@/lib/audit';

interface PayoutRequestRequest {
  amount: number;
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await parseJsonBody<PayoutRequestRequest>(request);

    if (!body) {
      return errorResponse('Request body is required', 400);
    }

    if (!body.amount || typeof body.amount !== 'number') {
      return errorResponse('Amount is required and must be a number', 400);
    }

    if (body.amount <= 0) {
      return errorResponse('Amount must be greater than 0', 400);
    }

    // Check affiliate profile
    const profile = await getAffiliateProfile(user.id);
    if (!profile) {
      return errorResponse('Affiliate profile not found', 404);
    }

    if (profile.status !== 'ACTIVE') {
      return errorResponse('Affiliate account is not active', 403);
    }

    // Get commission stats to check available balance
    const commissionStats = await getCommissionStats(user.id);
    const availableBalance = commissionStats.totalApproved - profile.totalPaidOut;

    if (body.amount > availableBalance) {
      return errorResponse(`Insufficient balance. Available: $${availableBalance.toFixed(2)}`, 400);
    }

    // Request payout
    const payout = await requestPayout(user.id, body.amount);

    // Log audit event
    await logAudit({
      userId: user.id,
      action: 'payout_request',
      entity: 'Payout',
      entityId: payout.id,
      newValues: {
        amount: payout.amount,
        currency: payout.currency,
        paymentMethod: payout.paymentMethod,
      },
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request),
    });

    return successResponse({
      payout: {
        id: payout.id,
        amount: payout.amount,
        currency: payout.currency,
        status: payout.status,
        paymentMethod: payout.paymentMethod,
        createdAt: payout.createdAt,
      },
    }, 'Payout request submitted successfully');
  } catch (error) {
    console.error('Payout request error:', error);
    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return errorResponse(error.message, 401);
      }
      return errorResponse(error.message, 400);
    }
    return errorResponse('Failed to request payout', 500);
  }
}
