import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  generateToken,
  generateTokenPair,
  verifyToken,
  extractToken,
  generatePasswordResetToken,
  generateEmailVerificationToken,
} from './jwt'

// Helper to set NODE_ENV without TS readonly error
const setNodeEnv = (val: string) => {
  Object.defineProperty(process.env, 'NODE_ENV', { value: val, writable: true, configurable: true })
}

describe('jwt', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
    process.env.JWT_SECRET = 'test-secret-key-for-jwt-testing'
    setNodeEnv('test')
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('generateToken / verifyToken roundtrip', () => {
    it('should sign and verify a token successfully', () => {
      const token = generateToken('user-123', 'test@example.com', 'user')
      const payload = verifyToken(token)

      expect(payload).not.toBeNull()
      expect(payload!.sub).toBe('user-123')
      expect(payload!.email).toBe('test@example.com')
      expect(payload!.role).toBe('user')
      expect(payload!.type).toBe('access')
    })

    it('should generate refresh token with correct type', () => {
      const token = generateToken('user-456', 'admin@example.com', 'admin', 'refresh')
      const payload = verifyToken(token)

      expect(payload).not.toBeNull()
      expect(payload!.type).toBe('refresh')
      expect(payload!.sub).toBe('user-456')
    })

    it('should include iat, exp, and jti claims', () => {
      const token = generateToken('user-1', 'a@b.com', 'user')
      const payload = verifyToken(token)

      expect(payload).not.toBeNull()
      expect(typeof payload!.iat).toBe('number')
      expect(typeof payload!.exp).toBe('number')
      expect(typeof payload!.jti).toBe('string')
      expect(payload!.jti.length).toBe(32) // 16 bytes hex
    })

    it('should set access token expiry to 15 minutes', () => {
      const token = generateToken('user-1', 'a@b.com', 'user', 'access')
      const payload = verifyToken(token)

      expect(payload).not.toBeNull()
      expect(payload!.exp - payload!.iat).toBe(15 * 60)
    })

    it('should set refresh token expiry to 7 days', () => {
      const token = generateToken('user-1', 'a@b.com', 'user', 'refresh')
      const payload = verifyToken(token)

      expect(payload).not.toBeNull()
      expect(payload!.exp - payload!.iat).toBe(7 * 24 * 60 * 60)
    })
  })

  describe('expired token rejection', () => {
    it('should return null for an expired token', () => {
      const realDateNow = Date.now
      const pastTime = Date.now() - 20 * 60 * 1000 // 20 minutes ago
      Date.now = vi.fn().mockReturnValue(pastTime)

      const token = generateToken('user-1', 'a@b.com', 'user', 'access')

      Date.now = realDateNow

      const payload = verifyToken(token)
      expect(payload).toBeNull()
    })
  })

  describe('tampered token rejection', () => {
    it('should return null when token signature is tampered', () => {
      const token = generateToken('user-1', 'a@b.com', 'user')
      const parts = token.split('.')
      const tamperedSig = parts[2].slice(0, -1) + (parts[2].slice(-1) === 'A' ? 'B' : 'A')
      const tamperedToken = `${parts[0]}.${parts[1]}.${tamperedSig}`

      const payload = verifyToken(tamperedToken)
      expect(payload).toBeNull()
    })

    it('should return null when payload is tampered', () => {
      const token = generateToken('user-1', 'a@b.com', 'user')
      const parts = token.split('.')
      const fakePayload = Buffer.from(JSON.stringify({ sub: 'hacker' }))
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')
      const tamperedToken = `${parts[0]}.${fakePayload}.${parts[2]}`

      const payload = verifyToken(tamperedToken)
      expect(payload).toBeNull()
    })

    it('should return null for malformed token', () => {
      expect(verifyToken('not.a.valid.token')).toBeNull()
      expect(verifyToken('onlyonepart')).toBeNull()
      expect(verifyToken('')).toBeNull()
    })
  })

  describe('missing secret handling', () => {
    it('should use default secret in non-production when JWT_SECRET is not set', () => {
      delete process.env.JWT_SECRET
      setNodeEnv('development')

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const token = generateToken('user-1', 'a@b.com', 'user')
      const payload = verifyToken(token)

      expect(payload).not.toBeNull()
      expect(payload!.sub).toBe('user-1')
      expect(warnSpy).toHaveBeenCalled()

      warnSpy.mockRestore()
    })

    it('should throw in production when JWT_SECRET is not set', () => {
      delete process.env.JWT_SECRET
      setNodeEnv('production')

      expect(() => generateToken('user-1', 'a@b.com', 'user')).toThrow(
        'JWT_SECRET environment variable is required in production'
      )
    })
  })

  describe('extractToken', () => {
    it('should extract token from valid Bearer header', () => {
      const token = 'my-token-value'
      expect(extractToken(`Bearer ${token}`)).toBe(token)
    })

    it('should return null for non-Bearer header', () => {
      expect(extractToken('Basic abc123')).toBeNull()
    })

    it('should return null for null header', () => {
      expect(extractToken(null)).toBeNull()
    })

    it('should return null for empty string', () => {
      expect(extractToken('')).toBeNull()
    })

    it('should handle Bearer with complex token', () => {
      const token = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.signature'
      expect(extractToken(`Bearer ${token}`)).toBe(token)
    })
  })

  describe('generateTokenPair', () => {
    it('should return access token, refresh token, and expiresIn', () => {
      const pair = generateTokenPair('user-1', 'a@b.com', 'user')

      expect(pair.accessToken).toBeTruthy()
      expect(pair.refreshToken).toBeTruthy()
      expect(pair.expiresIn).toBe(15 * 60)

      const accessPayload = verifyToken(pair.accessToken)
      const refreshPayload = verifyToken(pair.refreshToken)

      expect(accessPayload!.type).toBe('access')
      expect(refreshPayload!.type).toBe('refresh')
    })
  })

  describe('generatePasswordResetToken', () => {
    it('should generate a base64url token', () => {
      const token = generatePasswordResetToken()
      expect(typeof token).toBe('string')
      expect(token.length).toBeGreaterThan(0)
      expect(token).not.toMatch(/[+/=]/)
    })
  })

  describe('generateEmailVerificationToken', () => {
    it('should generate a unique token each call', () => {
      const token1 = generateEmailVerificationToken()
      const token2 = generateEmailVerificationToken()
      expect(token1).not.toBe(token2)
    })
  })
})
