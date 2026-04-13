/**
 * GET /api/b2b/check
 * Simple check if MobiMatter credentials are configured
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/auth-helpers';

export async function GET(_request: NextRequest) {
  try {
    await requireAdmin(_request);

    const merchantId = process.env.MOBIMATTER_MERCHANT_ID;
    const apiKey = process.env.MOBIMATTER_API_KEY;

    if (!merchantId || !apiKey) {
      return NextResponse.json({
        success: false,
        error: 'Credentials not configured',
        configured: false,
        merchantId: merchantId ? '✓ Set' : '✗ Missing',
        apiKey: apiKey ? '✓ Set' : '✗ Missing',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Credentials are configured',
      configured: true,
      note: 'To test API connection, ensure your wallet is funded and you have API access enabled in the partner portal.',
    });
  } catch (error: unknown) {
    const err = error as { name?: string; message?: string; statusCode?: number };
    if (err?.name === 'AuthError') {
      return errorResponse(err.message || 'Unauthorized', err.statusCode || 401);
    }
    return errorResponse('Internal server error', 500);
  }
}
