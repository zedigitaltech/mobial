import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  checkRateLimit,
  createRateLimitHeaders,
  withRateLimit,
} from './rate-limit'

const setNodeEnv = (val: string) => {
  Object.defineProperty(process.env, 'NODE_ENV', { value: val, writable: true, configurable: true })
}

describe('rate-limit', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
    setNodeEnv('test') // uses memory store
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('checkRateLimit (memory store)', () => {
    it('should allow requests under the limit', async () => {
      const result = await checkRateLimit('test-user-1', 'test:allow', {
        windowMs: 60000,
        maxRequests: 10,
      })

      expect(result.success).toBe(true)
      expect(result.remaining).toBe(9)
      expect(result.limit).toBe(10)
    })

    it('should block requests over the limit', async () => {
      const config = { windowMs: 60000, maxRequests: 3 }
      const endpoint = 'test:block'
      const id = 'test-user-block'

      await checkRateLimit(id, endpoint, config)
      await checkRateLimit(id, endpoint, config)
      await checkRateLimit(id, endpoint, config)

      const result = await checkRateLimit(id, endpoint, config)

      expect(result.success).toBe(false)
      expect(result.remaining).toBe(0)
      expect(result.retryAfter).toBeDefined()
      expect(result.retryAfter).toBeGreaterThan(0)
    })

    it('should decrement remaining count correctly', async () => {
      const config = { windowMs: 60000, maxRequests: 5 }
      const endpoint = 'test:decrement'
      const id = 'test-user-dec'

      const r1 = await checkRateLimit(id, endpoint, config)
      expect(r1.remaining).toBe(4)

      const r2 = await checkRateLimit(id, endpoint, config)
      expect(r2.remaining).toBe(3)

      const r3 = await checkRateLimit(id, endpoint, config)
      expect(r3.remaining).toBe(2)
    })

    it('should track different identifiers separately', async () => {
      const config = { windowMs: 60000, maxRequests: 2 }
      const endpoint = 'test:separate'

      await checkRateLimit('user-A', endpoint, config)
      await checkRateLimit('user-A', endpoint, config)

      const userAResult = await checkRateLimit('user-A', endpoint, config)
      const userBResult = await checkRateLimit('user-B', endpoint, config)

      expect(userAResult.success).toBe(false)
      expect(userBResult.success).toBe(true)
    })

    it('should reset after window expires', async () => {
      const config = { windowMs: 100, maxRequests: 1 }
      const endpoint = 'test:reset'
      const id = 'test-user-reset'

      await checkRateLimit(id, endpoint, config)
      const blocked = await checkRateLimit(id, endpoint, config)
      expect(blocked.success).toBe(false)

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 150))

      const afterReset = await checkRateLimit(id, endpoint, config)
      expect(afterReset.success).toBe(true)
      expect(afterReset.remaining).toBe(0)
    })

    it('should use default config for known endpoints', async () => {
      // 'api:general' default is 60 requests per minute
      const result = await checkRateLimit('test-default', 'api:general')
      expect(result.success).toBe(true)
      expect(result.limit).toBe(60)
    })
  })

  describe('createRateLimitHeaders', () => {
    it('should set standard rate limit headers', () => {
      const resetAt = new Date(Date.now() + 60000)
      const headers = createRateLimitHeaders({
        success: true,
        limit: 100,
        remaining: 95,
        resetAt,
      })

      expect(headers.get('X-RateLimit-Limit')).toBe('100')
      expect(headers.get('X-RateLimit-Remaining')).toBe('95')
      expect(headers.get('X-RateLimit-Reset')).toBeTruthy()
    })

    it('should include Retry-After when present', () => {
      const headers = createRateLimitHeaders({
        success: false,
        limit: 5,
        remaining: 0,
        resetAt: new Date(Date.now() + 30000),
        retryAfter: 30,
      })

      expect(headers.get('Retry-After')).toBe('30')
    })

    it('should not include Retry-After when not present', () => {
      const headers = createRateLimitHeaders({
        success: true,
        limit: 10,
        remaining: 9,
        resetAt: new Date(),
      })

      expect(headers.get('Retry-After')).toBeNull()
    })
  })

  describe('withRateLimit', () => {
    it('should execute handler when under limit', async () => {
      const handler = vi.fn().mockResolvedValue({ data: 'ok' })
      const result = await withRateLimit('wrl-user', 'api:general', handler)

      expect(handler).toHaveBeenCalled()
      expect(result).toEqual({ data: 'ok' })
    })

    it('should return error when rate limited', async () => {
      // 'auth:register' has maxRequests: 3 per hour
      const endpoint = 'auth:register'
      const id = 'wrl-block-user-unique'

      // Exhaust the limit
      await checkRateLimit(id, endpoint)
      await checkRateLimit(id, endpoint)
      await checkRateLimit(id, endpoint)

      const handler = vi.fn().mockResolvedValue({ data: 'ok' })
      const result = await withRateLimit(id, endpoint, handler)

      expect(handler).not.toHaveBeenCalled()
      expect(result).toHaveProperty('error')
      expect(result).toHaveProperty('status', 429)
    })
  })
})
