import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import {
  requireAuth,
  successResponse,
  errorResponse,
  AuthError,
} from '@/lib/auth-helpers';

function generateReferralCode(_userId: string): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const config = await db.systemConfig.findUnique({
      where: { key: `referral:${user.id}` },
    });

    if (!config) {
      return successResponse({
        code: null,
        totalReferrals: 0,
        totalEarnings: 0,
        pendingEarnings: 0,
      });
    }

    const [code, totalReferrals, totalEarnings] = config.value.split(':');

    const pendingConfig = await db.systemConfig.findUnique({
      where: { key: `referral_pending:${user.id}` },
    });
    const pendingEarnings = pendingConfig ? parseFloat(pendingConfig.value) : 0;

    return successResponse({
      code,
      totalReferrals: parseInt(totalReferrals) || 0,
      totalEarnings: parseFloat(totalEarnings) || 0,
      pendingEarnings,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return errorResponse(error.message, error.statusCode);
    }
    console.error('Get referral stats error:', error);
    return errorResponse('Failed to get referral stats', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const existing = await db.systemConfig.findUnique({
      where: { key: `referral:${user.id}` },
    });

    if (existing) {
      const [code] = existing.value.split(':');
      return successResponse({ code }, 'Referral code already exists');
    }

    let code = generateReferralCode(user.id);
    let attempts = 0;
    while (attempts < 10) {
      const codeExists = await db.systemConfig.findUnique({
        where: { key: `referral_code:${code}` },
      });
      if (!codeExists) break;
      code = generateReferralCode(user.id);
      attempts++;
    }

    await db.systemConfig.create({
      data: {
        key: `referral:${user.id}`,
        value: `${code}:0:0`,
        description: `Referral data for user ${user.id}`,
      },
    });

    await db.systemConfig.create({
      data: {
        key: `referral_code:${code}`,
        value: user.id,
        description: `Reverse lookup for referral code ${code}`,
      },
    });

    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'referral_code_created',
        entity: 'referral',
        entityId: code,
        newValues: JSON.stringify({ code }),
      },
    });

    return successResponse({ code }, 'Referral code generated');
  } catch (error) {
    if (error instanceof AuthError) {
      return errorResponse(error.message, error.statusCode);
    }
    console.error('Create referral error:', error);
    return errorResponse('Failed to generate referral code', 500);
  }
}
