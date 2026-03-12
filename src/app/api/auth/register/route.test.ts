import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from './route'
import { db } from '@/lib/db'
import { checkPasswordStrength } from '@/lib/password'
import { sendEmailVerification, sendWelcome } from '@/services/email-service'

// Mock password utilities
vi.mock('@/lib/password', () => ({
  hashPassword: vi.fn().mockResolvedValue('hashed-password-123'),
  checkPasswordStrength: vi.fn().mockReturnValue({ isStrong: true, score: 4, feedback: [] }),
}))

// Mock JWT token generation
vi.mock('@/lib/jwt', () => ({
  generateTokenPair: vi.fn().mockReturnValue({
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresIn: 3600,
  }),
  generateEmailVerificationToken: vi.fn().mockReturnValue('mock-verification-token'),
}))

// Mock audit logging
vi.mock('@/lib/audit', () => ({
  logAuditWithContext: vi.fn().mockResolvedValue(undefined),
}))

// Mock email service
vi.mock('@/services/email-service', () => ({
  sendEmailVerification: vi.fn().mockResolvedValue(undefined),
  sendWelcome: vi.fn().mockResolvedValue(undefined),
}))

const mockCheckPasswordStrength = vi.mocked(checkPasswordStrength)
const mockSendEmailVerification = vi.mocked(sendEmailVerification)
const mockSendWelcome = vi.mocked(sendWelcome)

function createRegisterRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/auth/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeCreatedUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-new-1',
    email: 'newuser@example.com',
    name: 'Jane Doe',
    passwordHash: 'hashed-password-123',
    phone: null,
    role: 'CUSTOMER',
    status: 'PENDING_VERIFICATION',
    twoFactorEnabled: false,
    twoFactorSecret: null,
    twoFactorBackupCodes: null,
    failedLoginAttempts: 0,
    lockedUntil: null,
    deletedAt: null,
    lastLoginAt: null,
    lastLoginIp: null,
    emailVerified: false,
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

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default: no existing user
    vi.mocked(db.user.findUnique).mockResolvedValue(null)

    // Default: password is strong
    mockCheckPasswordStrength.mockReturnValue({ isStrong: true, score: 4, feedback: [] })
  })

  it('should return validation error when email is missing', async () => {
    const req = createRegisterRequest({ password: 'StrongP@ss1', name: 'Jane Doe' })
    const response = await POST(req)
    const json = await parseResponse(response)

    expect(response.status).toBe(400)
    expect(json.success).toBe(false)
  })

  it('should return validation error when name is too short', async () => {
    const req = createRegisterRequest({
      email: 'user@example.com',
      password: 'StrongP@ss1',
      name: 'J',
    })
    const response = await POST(req)
    const json = await parseResponse(response)

    expect(response.status).toBe(400)
    expect(json.success).toBe(false)
    expect(json.error).toContain('Name')
  })

  it('should return validation error for invalid email format', async () => {
    const req = createRegisterRequest({
      email: 'not-an-email',
      password: 'StrongP@ss1',
      name: 'Jane Doe',
    })
    const response = await POST(req)
    const json = await parseResponse(response)

    expect(response.status).toBe(400)
    expect(json.success).toBe(false)
    expect(json.error).toContain('email')
  })

  it('should return error when password is too weak', async () => {
    mockCheckPasswordStrength.mockReturnValue({
      isStrong: false,
      score: 1,
      feedback: ['Must contain uppercase letter', 'Must contain special character'],
    })

    const req = createRegisterRequest({
      email: 'user@example.com',
      password: 'weakpass',
      name: 'Jane Doe',
    })
    const response = await POST(req)
    const json = await parseResponse(response)

    expect(response.status).toBe(400)
    expect(json.error).toContain('too weak')
  })

  it('should return 409 when email already exists', async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue(makeCreatedUser() as never)

    const req = createRegisterRequest({
      email: 'existing@example.com',
      password: 'StrongP@ss1',
      name: 'Jane Doe',
    })
    const response = await POST(req)
    const json = await parseResponse(response)

    expect(response.status).toBe(409)
    expect(json.error).toContain('already exists')
  })

  it('should register successfully and return tokens', async () => {
    const createdUser = makeCreatedUser()
    vi.mocked(db.user.create).mockResolvedValue(createdUser as never)
    vi.mocked(db.session.create).mockResolvedValue({} as never)
    vi.mocked(db.systemConfig.create).mockResolvedValue({} as never)

    const req = createRegisterRequest({
      email: 'newuser@example.com',
      password: 'StrongP@ss1',
      name: 'Jane Doe',
    })
    const response = await POST(req)
    const json = await parseResponse(response)

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.tokens.accessToken).toBe('mock-access-token')
    expect(json.data.tokens.refreshToken).toBe('mock-refresh-token')
    expect(json.data.user).toBeDefined()
    expect(json.data.user.passwordHash).toBeUndefined()
  })

  it('should send email verification on successful registration', async () => {
    const createdUser = makeCreatedUser()
    vi.mocked(db.user.create).mockResolvedValue(createdUser as never)
    vi.mocked(db.session.create).mockResolvedValue({} as never)
    vi.mocked(db.systemConfig.create).mockResolvedValue({} as never)

    const req = createRegisterRequest({
      email: 'newuser@example.com',
      password: 'StrongP@ss1',
      name: 'Jane Doe',
    })
    await POST(req)

    expect(mockSendEmailVerification).toHaveBeenCalledWith(
      'newuser@example.com',
      'mock-verification-token'
    )
  })

  it('should send welcome email fire-and-forget on successful registration', async () => {
    const createdUser = makeCreatedUser()
    vi.mocked(db.user.create).mockResolvedValue(createdUser as never)
    vi.mocked(db.session.create).mockResolvedValue({} as never)
    vi.mocked(db.systemConfig.create).mockResolvedValue({} as never)

    const req = createRegisterRequest({
      email: 'newuser@example.com',
      password: 'StrongP@ss1',
      name: 'Jane Doe',
    })
    await POST(req)

    expect(mockSendWelcome).toHaveBeenCalledWith('newuser@example.com', 'Jane Doe')
  })
})
