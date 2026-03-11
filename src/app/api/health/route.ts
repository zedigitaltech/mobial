/**
 * Health Check Endpoint
 * GET /api/health - Check application and database health
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface HealthResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  checks: {
    database: {
      status: 'up' | 'down';
      responseTime?: number;
      error?: string;
    };
    mobimatter: {
      status: 'up' | 'down' | 'not_configured';
      responseTime?: number;
      error?: string;
    };
    environment: {
      status: 'configured' | 'missing_vars';
      missingVars?: string[];
    };
  };
}

export async function GET(): Promise<NextResponse<HealthResponse>> {
  const startTime = Date.now();
  const checks: HealthResponse['checks'] = {
    database: { status: 'down' },
    mobimatter: { status: 'down' },
    environment: { status: 'configured' },
  };

  const missingVars: string[] = [];

  // Check required environment variables
  const requiredVars = ['DATABASE_URL', 'JWT_SECRET', 'ENCRYPTION_KEY', 'MOBIMATTER_MERCHANT_ID', 'MOBIMATTER_API_KEY'];
  for (const envVar of requiredVars) {
    if (!process.env[envVar]) {
      missingVars.push(envVar);
    }
  }

  if (missingVars.length > 0) {
    checks.environment = {
      status: 'missing_vars',
      ...(process.env.NODE_ENV !== 'production' && { missingVars }),
    };
  }

  // Check database connection
  try {
    await db.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - startTime;
    checks.database = {
      status: 'up',
      responseTime,
    };
  } catch (error) {
    checks.database = {
      status: 'down',
      ...(process.env.NODE_ENV !== 'production' && { error: error instanceof Error ? error.message : 'Unknown error' }),
    };
  }

  // Check MobiMatter API connectivity
  const merchantId = process.env.MOBIMATTER_MERCHANT_ID;
  const apiKey = process.env.MOBIMATTER_API_KEY;

  if (!merchantId || !apiKey) {
    checks.mobimatter = { status: 'not_configured' };
  } else {
    try {
      const mmStart = Date.now();
      const mmResponse = await fetch(
        'https://api.mobimatter.com/mobimatter/api/v2/products?limit=1',
        {
          headers: {
            'merchantId': merchantId,
            'api-key': apiKey,
          },
          signal: AbortSignal.timeout(5000),
        }
      );
      const mmResponseTime = Date.now() - mmStart;

      if (mmResponse.ok) {
        checks.mobimatter = { status: 'up', responseTime: mmResponseTime };
      } else {
        checks.mobimatter = {
          status: 'down',
          responseTime: mmResponseTime,
          error: `HTTP ${mmResponse.status}`,
        };
      }
    } catch (error) {
      checks.mobimatter = {
        status: 'down',
        ...(process.env.NODE_ENV !== 'production' && { error: error instanceof Error ? error.message : 'Unknown error' }),
      };
    }
  }

  // Determine overall health status
  let status: HealthResponse['status'] = 'healthy';
  
  if (checks.database.status === 'down' || checks.environment.status === 'missing_vars') {
    status = 'unhealthy';
  } else if (checks.mobimatter.status === 'down') {
    status = 'degraded';
  } else if (checks.database.responseTime && checks.database.responseTime > 1000) {
    status = 'degraded';
  }

  return NextResponse.json({
    status,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.2.0',
    checks,
  });
}
