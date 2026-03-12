/**
 * GET /api/b2b/wallet
 * Get MobiMatter wallet balance
 */

import { NextRequest, NextResponse } from 'next/server';
import { getWalletBalance } from '@/lib/mobimatter';

export async function GET(_request: NextRequest) {
  try {
    const balance = await getWalletBalance();
    
    return NextResponse.json({
      success: true,
      data: balance,
    });
    
  } catch (error) {
    console.error('Wallet balance error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch wallet balance',
    }, { status: 500 });
  }
}
