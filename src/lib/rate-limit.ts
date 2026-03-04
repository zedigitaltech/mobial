/**
 * Rate limiting utilities
 */

import { db } from './db';
import { headers } from 'next/headers';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: () => Promise<string>;
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
  retryAfter?: number;
}

const DEFAULT_CONFIGS: Record<string, RateLimitConfig> = {
  // Authentication endpoints
  'auth:login': { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 per 15 min
  'auth:register': { windowMs: 60 * 60 * 1000, maxRequests: 3 }, // 3 per hour
  'auth:password-reset': { windowMs: 60 * 60 * 1000, maxRequests: 3 }, // 3 per hour
  'auth:verify': { windowMs: 60 * 60 * 1000, maxRequests: 10 }, // 10 per hour
  
  // API endpoints
  'api:general': { windowMs: 60 * 1000, maxRequests: 60 }, // 60 per minute
  'api:write': { windowMs: 60 * 1000, maxRequests: 20 }, // 20 per minute
  
  // Affiliate endpoints
  'affiliate:link': { windowMs: 60 * 1000, maxRequests: 10 }, // 10 per minute
  
  // Orders
  'order:create': { windowMs: 60 * 1000, maxRequests: 5 }, // 5 per minute
};

// In-memory cache for rate limiting (for development)
const memoryCache = new Map<string, { count: number; resetAt: number }>();

/**
 * Get client IP address
 */
async function getClientIP(): Promise<string> {
  try {
    const headersList = await headers();
    return headersList.get('x-forwarded-for')?.split(',')[0]?.trim() 
      || headersList.get('x-real-ip') 
      || 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Generate rate limit key
 */
async function generateKey(identifier: string, endpoint: string): Promise<string> {
  const ip = await getClientIP();
  return `${identifier}:${ip}:${endpoint}`;
}

/**
 * Check rate limit using database (persistent)
 */
async function checkRateLimitDB(
  identifier: string,
  endpoint: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const key = await generateKey(identifier, endpoint);
  const now = new Date();
  const windowStart = new Date(now.getTime() - config.windowMs);
  
  // Clean up old entries
  await db.rateLimitLog.deleteMany({
    where: {
      windowStart: { lt: windowStart },
    },
  });
  
  // Get or create log entry
  let log = await db.rateLimitLog.findFirst({
    where: {
      identifier: key,
      endpoint,
      windowStart: { gte: windowStart },
    },
  });
  
  if (!log) {
    log = await db.rateLimitLog.create({
      data: {
        identifier: key,
        endpoint,
        requestCount: 1,
        windowStart: now,
      },
    });
    
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      resetAt: new Date(log.windowStart.getTime() + config.windowMs),
    };
  }
  
  if (log.requestCount >= config.maxRequests) {
    const resetAt = new Date(log.windowStart.getTime() + config.windowMs);
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      resetAt,
      retryAfter: Math.ceil((resetAt.getTime() - now.getTime()) / 1000),
    };
  }
  
  // Increment count
  await db.rateLimitLog.update({
    where: { id: log.id },
    data: { requestCount: { increment: 1 } },
  });
  
  return {
    success: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - log.requestCount - 1,
    resetAt: new Date(log.windowStart.getTime() + config.windowMs),
  };
}

/**
 * Check rate limit using memory (faster, but not persistent)
 */
function checkRateLimitMemory(
  identifier: string,
  endpoint: string,
  config: RateLimitConfig
): RateLimitResult {
  const key = `${identifier}:${endpoint}`;
  const now = Date.now();
  
  const cached = memoryCache.get(key);
  
  if (!cached || now > cached.resetAt) {
    memoryCache.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      resetAt: new Date(now + config.windowMs),
    };
  }
  
  if (cached.count >= config.maxRequests) {
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      resetAt: new Date(cached.resetAt),
      retryAfter: Math.ceil((cached.resetAt - now) / 1000),
    };
  }
  
  cached.count++;
  
  return {
    success: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - cached.count,
    resetAt: new Date(cached.resetAt),
  };
}

/**
 * Check rate limit
 */
export async function checkRateLimit(
  identifier: string,
  endpoint: string,
  customConfig?: Partial<RateLimitConfig>
): Promise<RateLimitResult> {
  const config = {
    ...DEFAULT_CONFIGS[endpoint],
    ...customConfig,
  } as RateLimitConfig;
  
  // Use memory cache in development for speed
  if (process.env.NODE_ENV !== 'production') {
    return checkRateLimitMemory(identifier, endpoint, config);
  }
  
  // Use database in production for persistence
  return checkRateLimitDB(identifier, endpoint, config);
}

/**
 * Create rate limit headers
 */
export function createRateLimitHeaders(result: RateLimitResult): Headers {
  const headers = new Headers();
  headers.set('X-RateLimit-Limit', result.limit.toString());
  headers.set('X-RateLimit-Remaining', result.remaining.toString());
  headers.set('X-RateLimit-Reset', Math.floor(result.resetAt.getTime() / 1000).toString());
  
  if (result.retryAfter) {
    headers.set('Retry-After', result.retryAfter.toString());
  }
  
  return headers;
}

/**
 * Rate limit middleware helper
 */
export async function withRateLimit<T>(
  identifier: string,
  endpoint: string,
  handler: () => Promise<T>
): Promise<T | { error: string; status: number; headers: Headers }> {
  const result = await checkRateLimit(identifier, endpoint);
  
  if (!result.success) {
    return {
      error: 'Too many requests. Please try again later.',
      status: 429,
      headers: createRateLimitHeaders(result),
    };
  }
  
  return handler();
}
