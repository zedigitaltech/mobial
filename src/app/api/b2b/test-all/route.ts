/**
 * GET /api/b2b/test-all
 * Test all MobiMatter B2B API endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getWalletBalance,
  fetchProducts,
  createOrder,
  completeOrder,
  notifyUser,
} from '@/lib/mobimatter';

export async function GET(_request: NextRequest) {
  const results: Record<string, { success: boolean; data?: unknown; error?: string }> = {};

  try {
    // Test 1: Wallet Balance
    console.log('Testing wallet balance...');
    try {
      const balance = await getWalletBalance();
      results.walletBalance = { success: true, data: balance };
    } catch (error) {
      results.walletBalance = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    // Test 2: Get Products
    console.log('Testing get products...');
    try {
      const products = await fetchProducts({ country: 'US' });
      results.products = {
        success: true,
        data: {
          count: products.length,
          sample: products.slice(0, 2).map((p) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            provider: p.provider,
            rank: p.rank,
            productCategory: p.productCategory,
          })),
        },
      };
    } catch (error) {
      results.products = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    // Test 3: Create Test Order (using test product if available)
    console.log('Testing create order...');
    try {
      const testProductId = '75b98dc7-c026-48c1-9fee-465681382d39';

      const order = await createOrder({
        productId: testProductId,
        productCategory: 'esim_realtime',
        label: 'test-order',
      });

      results.createOrder = {
        success: true,
        data: {
          orderId: order.orderId,
        },
      };

      // Test 4: Complete Order
      console.log('Testing complete order...');
      try {
        const completedOrder = await completeOrder(order.orderId);
        results.completeOrder = {
          success: true,
          data: {
            orderId: completedOrder.orderId,
            orderState: completedOrder.orderState,
            hasQrCode: !!completedOrder.lineItem?.qrCode,
            hasIccid: !!completedOrder.lineItem?.iccid,
          },
        };

        // Test 5: Notify User
        console.log('Testing notify user...');
        try {
          await notifyUser(
            completedOrder.orderId,
            'Test User',
            'test@example.com'
          );
          results.notifyUser = {
            success: true,
            data: { sent: true },
          };
        } catch (error) {
          results.notifyUser = {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      } catch (error) {
        results.completeOrder = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    } catch (error) {
      results.createOrder = {
        success: false,
        error: error instanceof Error ? error.message : 'Order creation failed (this is expected if wallet has insufficient funds)',
      };
    }

    return NextResponse.json({
      success: true,
      message: 'API tests completed',
      results,
      timestamp: new Date().toISOString(),
      summary: {
        passed: Object.values(results).filter((r) => r.success).length,
        total: Object.values(results).length,
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
