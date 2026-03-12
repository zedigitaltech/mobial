import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from './route'
import { db } from '@/lib/db'
import { verifyPassword } from '@/lib/password'
import { checkRateLimit } from '@/lib/rate-limit'
import { verifyTOTPCode } from '@/lib/two-factor'

// Mock password verification
vi.mock('@/lib/password', () => ({
  verifyPassword: vi.fn().mockResolvedValue(true),
}))

// Mock JWT token generation
vi.mock('@/lib/jwt', () => ({
  generateTokenPair: vi.fn().mockReturnValue({
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresIn: 3600,
  }),
}))

// Mock audit logging
vi.mock('@/lib/audit', () => ({
  logAuditWithContext: vi.fn().mockResolvedValue(undefined),
}))

// Mock rate limiting
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({
    success: true,
    limit: 5,
    remaining: 4,
    resetAt: new Date(Date.now() + 900000),
  }),
  createRateLimitHeaders: vi.fn().mockReturnValue(new Headers()),
}))

// Mock two-factor
vi.mock('@/lib/two-factor', () => ({
  verifyTOTPCode: vi.fn().mockReturnValue(true),
  verifyBackupCode: vi.fn().mockReturnValue({ valid: true, remainingCodes: [] }),
}))

const mockVerifyPassword = vi.mocked(verifyPassword)
const mockCheckRateLimit = vi.mocked(checkRateLimit)
const mockVerifyTOTPCode = vi.mocked(verifyTOTPCode)

function createLoginRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    email: 'user@example.com',
    name: 'John Doe',
    passwordHash: 'hashed-password',
    role: 'CUSTOMER',
    status: 'ACTIVE',
    twoFactorEnabled: false,
    twoFactorSecret: null,
    twoFactorBackupCodes: null,
    failedLoginAttempts: 0,
    lockedUntil: null,
    deletedAt: null,
    lastLoginAt: null,
    lastLoginIp: null,
    emailVerified: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  }
}

async function parseResponse(response: Response) {
  const text = await response.text()
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Reset rate limit to allow requests
    mockCheckRateLimit.mockResolvedValue({
      success: true,
      limit: 5,
      remaining: 4,
      resetAt: new Date(Date.now() + 900000),
    })

    // Reset password verification to succeed
    mockVerifyPassword.mockResolvedValue(true)
  })

  it('should return validation error when email is missing', async () => {
    const req = createLoginRequest({ password: 'password123' })
    const response = await POST(req)
    const json = await parseResponse(response)

    expect(response.status).toBe(400)
    expect(json.success).toBe(false)
  })

  it('should return validation error when password is missing', async () => {
    const req = createLoginRequest({ email: 'user@example.com' })
    const response = await POST(req)
    const json = await parseResponse(response)

    expect(response.status).toBe(400)
    expect(json.success).toBe(false)
  })

  it('should return validation error for invalid email format', async () => {
    const req = createLoginRequest({ email: 'not-an-email', password: 'password123' })
    const response = await POST(req)
    const json = await parseResponse(response)

    expect(response.status).toBe(400)
    expect(json.success).toBe(false)
    expect(json.error).toContain('email')
  })

  it('should return generic error when user does not exist', async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue(null)

    const req = createLoginRequest({ email: 'nonexistent@example.com', password: 'password123' })
    const response = await POST(req)
    const json = await parseResponse(response)

    expect(response.status).toBe(401)
    expect(json.error).toBe('Invalid email or password')
    // Should not reveal that user doesn't exist
    expect(json.error).not.toContain('not found')
    expect(json.error).not.toContain('does not exist')
  })

  it('should return tokens on successful login', async () => {
    const user = makeUser()
    vi.mocked(db.user.findUnique).mockResolvedValue(user as never)
    vi.mocked(db.user.update).mockResolvedValue(user as never)
    vi.mocked(db.session.create).mockResolvedValue({} as never)

    const req = createLoginRequest({ email: 'user@example.com', password: 'correctpassword' })
    const response = await POST(req)
    const json = await parseResponse(response)

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.tokens.accessToken).toBe('mock-access-token')
    expect(json.data.tokens.refreshToken).toBe('mock-refresh-token')
    expect(json.data.user).toBeDefined()
    // Should not contain sensitive fields
    expect(json.data.user.passwordHash).toBeUndefined()
    expect(json.data.user.twoFactorSecret).toBeUndefined()
  })

  it('should return error for wrong password', async () => {
    const user = makeUser()
    vi.mocked(db.user.findUnique).mockResolvedValue(user as never)
    vi.mocked(db.user.update).mockResolvedValue(user as never)
    mockVerifyPassword.mockResolvedValue(false)

    const req = createLoginRequest({ email: 'user@example.com', password: 'wrongpassword' })
    const response = await POST(req)
    const json = await parseResponse(response)

    expect(response.status).toBe(401)
    expect(json.error).toBe('Invalid email or password')
  })

  it('should return error for locked account', async () => {
    const user = makeUser({ lockedUntil: new Date(Date.now() + 60000) })
    vi.mocked(db.user.findUnique).mockResolvedValue(user as never)

    const req = createLoginRequest({ email: 'user@example.com', password: 'password123' })
    const response = await POST(req)
    const json = await parseResponse(response)

    expect(response.status).toBe(423)
    expect(json.error).toContain('locked')
  })

  it('should return error for deleted account', async () => {
    const user = makeUser({ deletedAt: new Date(), status: 'DELETED' })
    vi.mocked(db.user.findUnique).mockResolvedValue(user as never)

    const req = createLoginRequest({ email: 'user@example.com', password: 'password123' })
    const response = await POST(req)

    expect(response.status).toBe(404)
  })

  it('should require 2FA code when 2FA is enabled', async () => {
    const user = makeUser({
      twoFactorEnabled: true,
      twoFactorSecret: 'totp-secret',
    })
    vi.mocked(db.user.findUnique).mockResolvedValue(user as never)

    const req = createLoginRequest({ email: 'user@example.com', password: 'password123' })
    const response = await POST(req)
    const json = await parseResponse(response)

    expect(response.status).toBe(401)
    expect(json.error).toContain('Two-factor')
  })

  it('should accept valid TOTP code for 2FA-enabled user', async () => {
    const user = makeUser({
      twoFactorEnabled: true,
      twoFactorSecret: 'totp-secret',
    })
    vi.mocked(db.user.findUnique).mockResolvedValue(user as never)
    vi.mocked(db.user.update).mockResolvedValue(user as never)
    vi.mocked(db.session.create).mockResolvedValue({} as never)

    const req = createLoginRequest({
      email: 'user@example.com',
      password: 'password123',
      totpCode: '123456',
    })
    const response = await POST(req)
    const json = await parseResponse(response)

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
  })

  it('should reject invalid TOTP code for 2FA-enabled user', async () => {
    const user = makeUser({
      twoFactorEnabled: true,
      twoFactorSecret: 'totp-secret',
      twoFactorBackupCodes: '[]',
    })
    vi.mocked(db.user.findUnique).mockResolvedValue(user as never)
    mockVerifyTOTPCode.mockReturnValue(false)

    const { verifyBackupCode } = await import('@/lib/two-factor')
    vi.mocked(verifyBackupCode).mockReturnValue({ valid: false, remainingCodes: [] })

    const req = createLoginRequest({
      email: 'user@example.com',
      password: 'password123',
      totpCode: '000000',
    })
    const response = await POST(req)
    const json = await parseResponse(response)

    expect(response.status).toBe(401)
    expect(json.error).toContain('Invalid two-factor')
  })

  it('should return 429 when rate limited', async () => {
    mockCheckRateLimit.mockResolvedValue({
      success: false,
      limit: 5,
      remaining: 0,
      resetAt: new Date(Date.now() + 900000),
      retryAfter: 900,
    })

    const req = createLoginRequest({ email: 'user@example.com', password: 'password123' })
    const response = await POST(req)
    const json = await parseResponse(response)

    expect(response.status).toBe(429)
    expect(json.error).toContain('Too many')
  })

  it('should increment failed login attempts on wrong password', async () => {
    const user = makeUser({ failedLoginAttempts: 2 })
    vi.mocked(db.user.findUnique).mockResolvedValue(user as never)
    vi.mocked(db.user.update).mockResolvedValue(user as never)
    mockVerifyPassword.mockResolvedValue(false)

    const req = createLoginRequest({ email: 'user@example.com', password: 'wrong' })
    await POST(req)

    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          failedLoginAttempts: 3,
        }),
      })
    )
  })

  it('should lock account after 5 failed attempts', async () => {
    const user = makeUser({ failedLoginAttempts: 4 })
    vi.mocked(db.user.findUnique).mockResolvedValue(user as never)
    vi.mocked(db.user.update).mockResolvedValue(user as never)
    mockVerifyPassword.mockResolvedValue(false)

    const req = createLoginRequest({ email: 'user@example.com', password: 'wrong' })
    await POST(req)

    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          failedLoginAttempts: 5,
          lockedUntil: expect.any(Date),
        }),
      })
    )
  })

  it('should reset failed attempts on successful login', async () => {
    const user = makeUser({ failedLoginAttempts: 3 })
    vi.mocked(db.user.findUnique).mockResolvedValue(user as never)
    vi.mocked(db.user.update).mockResolvedValue(user as never)
    vi.mocked(db.session.create).mockResolvedValue({} as never)

    const req = createLoginRequest({ email: 'user@example.com', password: 'correct' })
    await POST(req)

    // The second update call resets failed attempts
    const updateCalls = vi.mocked(db.user.update).mock.calls
    const lastCall = updateCalls[updateCalls.length - 1][0]
    expect((lastCall.data as Record<string, unknown>).failedLoginAttempts).toBe(0)
    expect((lastCall.data as Record<string, unknown>).lockedUntil).toBeNull()
  })

  it('should return 400 for empty request body', async () => {
    const req = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '',
    })

    const response = await POST(req)
    expect(response.status).toBe(400)
  })
})
