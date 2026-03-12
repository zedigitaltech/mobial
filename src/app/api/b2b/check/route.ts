/**
 * GET /api/b2b/check
 * Simple check if MobiMatter credentials are configured
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
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
    merchantId: merchantId,
    apiKeyPrefix: apiKey.substring(0, 8) + '...',
    note: 'To test API connection, ensure your wallet is funded and you have API access enabled in the partner portal.',
  });
}
