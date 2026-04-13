import { describe, it, expect } from 'vitest'
import crypto from 'crypto'
import {
  hashPassword,
  verifyPassword,
  isBcryptHash,
  generateSecurePassword,
  checkPasswordStrength,
} from './password'

/** Helper: create a legacy PBKDF2 hash (salt:iterations:hash) for migration tests */
function createLegacyHash(password: string): Promise<string> {
  const salt = crypto.randomBytes(32).toString('hex')
  const iterations = 100000
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, iterations, 64, 'sha512', (err, key) => {
      if (err) return reject(err)
      resolve(`${salt}:${iterations}:${key.toString('hex')}`)
    })
  })
}

describe('password', () => {
  describe('hashPassword / verifyPassword roundtrip', () => {
    it('should hash and verify a password successfully', async () => {
      const password = 'MySecureP@ss123'
      const hashed = await hashPassword(password)
      const isValid = await verifyPassword(password, hashed)

      expect(isValid).toBe(true)
    })

    it('should produce a bcrypt hash', async () => {
      const hashed = await hashPassword('test')

      expect(isBcryptHash(hashed)).toBe(true)
      expect(hashed).toMatch(/^\$2[ab]\$12\$/)
    })
  })

  describe('wrong password fails', () => {
    it('should reject incorrect password', async () => {
      const hashed = await hashPassword('correctPassword')
      const isValid = await verifyPassword('wrongPassword', hashed)

      expect(isValid).toBe(false)
    })

    it('should reject similar password (off by one char)', async () => {
      const hashed = await hashPassword('Password1!')
      const isValid = await verifyPassword('Password1@', hashed)

      expect(isValid).toBe(false)
    })
  })

  describe('different passwords produce different hashes', () => {
    it('should generate unique hashes for different passwords', async () => {
      const hash1 = await hashPassword('password1')
      const hash2 = await hashPassword('password2')

      expect(hash1).not.toBe(hash2)
    })

    it('should generate unique hashes even for the same password (due to random salt)', async () => {
      const hash1 = await hashPassword('samePassword')
      const hash2 = await hashPassword('samePassword')

      expect(hash1).not.toBe(hash2)
      // But both should verify correctly
      expect(await verifyPassword('samePassword', hash1)).toBe(true)
      expect(await verifyPassword('samePassword', hash2)).toBe(true)
    })
  })

  describe('legacy PBKDF2 backward compatibility', () => {
    it('should verify a legacy PBKDF2 hash', async () => {
      const password = 'LegacyPassword123!'
      const legacyHash = await createLegacyHash(password)

      expect(isBcryptHash(legacyHash)).toBe(false)
      expect(await verifyPassword(password, legacyHash)).toBe(true)
    })

    it('should reject wrong password against legacy hash', async () => {
      const legacyHash = await createLegacyHash('correctPassword')

      expect(await verifyPassword('wrongPassword', legacyHash)).toBe(false)
    })

    it('should detect bcrypt vs legacy hashes correctly', () => {
      expect(isBcryptHash('$2a$12$someHashContent')).toBe(true)
      expect(isBcryptHash('$2b$12$someHashContent')).toBe(true)
      expect(isBcryptHash('abcdef123456:100000:deadbeef')).toBe(false)
      expect(isBcryptHash('')).toBe(false)
    })
  })

  describe('invalid stored hash handling', () => {
    it('should return false for malformed stored hash', async () => {
      const isValid = await verifyPassword('test', 'not-a-valid-hash')
      expect(isValid).toBe(false)
    })

    it('should return false for empty stored hash', async () => {
      const isValid = await verifyPassword('test', '')
      expect(isValid).toBe(false)
    })
  })

  describe('checkPasswordStrength', () => {
    it('should rate a weak password (short, lowercase only)', () => {
      const result = checkPasswordStrength('abc')
      expect(result.isStrong).toBe(false)
      expect(result.score).toBeLessThan(4)
      expect(result.feedback.length).toBeGreaterThan(0)
    })

    it('should rate a medium password', () => {
      const result = checkPasswordStrength('Abcdefgh1')
      expect(result.score).toBeGreaterThanOrEqual(3)
    })

    it('should rate a strong password', () => {
      const result = checkPasswordStrength('MyStr0ng!P@ssw0rd')
      expect(result.isStrong).toBe(true)
      expect(result.score).toBeGreaterThanOrEqual(4)
    })

    it('should penalize repeated characters', () => {
      const withRepeats = checkPasswordStrength('aaaaAAAA1111!!!!')
      expect(withRepeats.feedback).toContain('Avoid repeated characters')
    })

    it('should suggest adding uppercase when missing', () => {
      const result = checkPasswordStrength('alllowercase123!')
      expect(result.feedback).toContain('Add uppercase letters')
    })

    it('should suggest adding special characters when missing', () => {
      const result = checkPasswordStrength('NoSpecial123')
      expect(result.feedback).toContain('Add special characters')
    })

    it('should suggest adding numbers when missing', () => {
      const result = checkPasswordStrength('NoNumbers!')
      expect(result.feedback).toContain('Add numbers')
    })

    it('should clamp score between 0 and 5', () => {
      const weak = checkPasswordStrength('a')
      const strong = checkPasswordStrength('V3ry$tr0ng!P@ss##Long')
      expect(weak.score).toBeGreaterThanOrEqual(0)
      expect(strong.score).toBeLessThanOrEqual(5)
    })
  })

  describe('generateSecurePassword', () => {
    it('should generate a password of default length', () => {
      const pwd = generateSecurePassword()
      expect(pwd.length).toBe(16)
    })

    it('should generate a password of custom length', () => {
      const pwd = generateSecurePassword(24)
      expect(pwd.length).toBe(24)
    })

    it('should generate unique passwords each call', () => {
      const pwd1 = generateSecurePassword()
      const pwd2 = generateSecurePassword()
      expect(pwd1).not.toBe(pwd2)
    })
  })
})
