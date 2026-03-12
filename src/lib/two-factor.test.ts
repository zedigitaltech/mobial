import { describe, it, expect } from 'vitest'
import {
  generateTOTPSecret,
  generateTOTPCode,
  verifyTOTPCode,
  generateBackupCodes,
  hashBackupCodes,
  verifyBackupCode,
  generateOTPAuthURL,
  getQRCodeData,
} from './two-factor'

describe('two-factor', () => {
  describe('generateTOTPSecret', () => {
    it('should return a base64url encoded string', () => {
      const secret = generateTOTPSecret()
      expect(secret).toBeTruthy()
      expect(secret).toMatch(/^[A-Za-z0-9_-]+$/)
    })

    it('should return unique secrets on each call', () => {
      const secrets = new Set(Array.from({ length: 20 }, () => generateTOTPSecret()))
      expect(secrets.size).toBe(20)
    })

    it('should produce a secret decodable back to 20 bytes', () => {
      const secret = generateTOTPSecret()
      const buf = Buffer.from(secret, 'base64url')
      expect(buf.length).toBe(20)
    })
  })

  describe('generateTOTPCode', () => {
    it('should produce a 6-digit string', () => {
      const secret = generateTOTPSecret()
      const code = generateTOTPCode(secret)
      expect(code).toMatch(/^\d{6}$/)
    })

    it('should produce deterministic codes for the same secret and time', () => {
      const secret = generateTOTPSecret()
      const time = Date.now()
      const code1 = generateTOTPCode(secret, time)
      const code2 = generateTOTPCode(secret, time)
      expect(code1).toBe(code2)
    })

    it('should produce different codes for different secrets at the same time', () => {
      const secret1 = generateTOTPSecret()
      const secret2 = generateTOTPSecret()
      const time = Date.now()
      const code1 = generateTOTPCode(secret1, time)
      const code2 = generateTOTPCode(secret2, time)
      // Extremely unlikely to collide
      expect(code1).not.toBe(code2)
    })

    it('should produce a different code after a full 30-second interval', () => {
      const secret = generateTOTPSecret()
      const time = 1700000000000 // Fixed time
      const code1 = generateTOTPCode(secret, time)
      const code2 = generateTOTPCode(secret, time + 30000) // +30s
      expect(code1).not.toBe(code2)
    })

    it('should pad codes shorter than 6 digits with leading zeros', () => {
      const secret = generateTOTPSecret()
      // Run a batch and verify format
      for (let i = 0; i < 50; i++) {
        const code = generateTOTPCode(secret, 1700000000000 + i * 30000)
        expect(code.length).toBe(6)
        expect(code).toMatch(/^\d{6}$/)
      }
    })
  })

  describe('verifyTOTPCode', () => {
    it('should accept a valid code for the current time', () => {
      const secret = generateTOTPSecret()
      const time = Date.now()
      const code = generateTOTPCode(secret, time)
      expect(verifyTOTPCode(secret, code, time)).toBe(true)
    })

    it('should reject a wrong code', () => {
      const secret = generateTOTPSecret()
      const time = Date.now()
      const code = generateTOTPCode(secret, time)
      // Create an invalid code by inverting digits
      const invalidCode = code.split('').map(d => ((parseInt(d) + 5) % 10).toString()).join('')
      expect(verifyTOTPCode(secret, invalidCode, time)).toBe(false)
    })

    it('should accept a code from the previous 30-second interval (window=1)', () => {
      const secret = generateTOTPSecret()
      const time = 1700000060000
      const prevCode = generateTOTPCode(secret, time - 30000)
      expect(verifyTOTPCode(secret, prevCode, time, 1)).toBe(true)
    })

    it('should accept a code from the next 30-second interval (window=1)', () => {
      const secret = generateTOTPSecret()
      const time = 1700000060000
      const nextCode = generateTOTPCode(secret, time + 30000)
      expect(verifyTOTPCode(secret, nextCode, time, 1)).toBe(true)
    })

    it('should reject a code from two intervals ago with window=1', () => {
      const secret = generateTOTPSecret()
      const time = 1700000060000
      const oldCode = generateTOTPCode(secret, time - 60000)
      expect(verifyTOTPCode(secret, oldCode, time, 1)).toBe(false)
    })

    it('should accept wider drift with larger window', () => {
      const secret = generateTOTPSecret()
      const time = 1700000060000
      const oldCode = generateTOTPCode(secret, time - 60000)
      expect(verifyTOTPCode(secret, oldCode, time, 2)).toBe(true)
    })

    it('should strip whitespace from the code', () => {
      const secret = generateTOTPSecret()
      const time = Date.now()
      const code = generateTOTPCode(secret, time)
      const spacedCode = code.slice(0, 3) + ' ' + code.slice(3)
      expect(verifyTOTPCode(secret, spacedCode, time)).toBe(true)
    })

    it('should reject with window=0 for adjacent intervals', () => {
      const secret = generateTOTPSecret()
      const time = 1700000060000
      const prevCode = generateTOTPCode(secret, time - 30000)
      expect(verifyTOTPCode(secret, prevCode, time, 0)).toBe(false)
    })
  })

  describe('generateBackupCodes', () => {
    it('should return the default count of 10 codes', () => {
      const codes = generateBackupCodes()
      expect(codes).toHaveLength(10)
    })

    it('should return a custom count of codes', () => {
      const codes = generateBackupCodes(5)
      expect(codes).toHaveLength(5)
    })

    it('should format codes as XXXX-XXXX (hex uppercase)', () => {
      const codes = generateBackupCodes()
      for (const code of codes) {
        expect(code).toMatch(/^[0-9A-F]{4}-[0-9A-F]{4}$/)
      }
    })

    it('should produce unique codes within a single batch', () => {
      const codes = generateBackupCodes(20)
      const unique = new Set(codes)
      expect(unique.size).toBe(20)
    })

    it('should produce different sets on each call', () => {
      const set1 = generateBackupCodes()
      const set2 = generateBackupCodes()
      // At least some codes should differ
      const overlap = set1.filter(c => set2.includes(c))
      expect(overlap.length).toBeLessThan(set1.length)
    })
  })

  describe('hashBackupCodes', () => {
    it('should return an array of SHA-256 hex hashes', () => {
      const codes = generateBackupCodes(3)
      const hashed = hashBackupCodes(codes)
      expect(hashed).toHaveLength(3)
      for (const h of hashed) {
        expect(h).toMatch(/^[0-9a-f]{64}$/)
      }
    })

    it('should produce deterministic hashes', () => {
      const codes = ['ABCD-1234']
      const h1 = hashBackupCodes(codes)
      const h2 = hashBackupCodes(codes)
      expect(h1[0]).toBe(h2[0])
    })
  })

  describe('verifyBackupCode', () => {
    it('should accept a valid backup code', () => {
      const codes = generateBackupCodes(3)
      const hashed = hashBackupCodes(codes)
      const result = verifyBackupCode(codes[0], hashed)
      expect(result.valid).toBe(true)
      expect(result.remainingCodes).toHaveLength(2)
    })

    it('should reject an invalid backup code', () => {
      const codes = generateBackupCodes(3)
      const hashed = hashBackupCodes(codes)
      const result = verifyBackupCode('ZZZZ-ZZZZ', hashed)
      expect(result.valid).toBe(false)
      expect(result.remainingCodes).toHaveLength(3)
    })

    it('should remove the used code from remaining codes', () => {
      const codes = generateBackupCodes(5)
      const hashed = hashBackupCodes(codes)
      const codeToUse = codes[2]
      const codeHash = hashBackupCodes([codeToUse])[0]

      const result = verifyBackupCode(codeToUse, hashed)
      expect(result.valid).toBe(true)
      expect(result.remainingCodes).not.toContain(codeHash)
      expect(result.remainingCodes).toHaveLength(4)
    })

    it('should return empty remaining when last code is used', () => {
      const codes = ['AAAA-BBBB']
      const hashed = hashBackupCodes(codes)
      const result = verifyBackupCode(codes[0], hashed)
      expect(result.valid).toBe(true)
      expect(result.remainingCodes).toHaveLength(0)
    })
  })

  describe('generateOTPAuthURL', () => {
    it('should return a well-formed otpauth URL', () => {
      const secret = 'TEST_SECRET'
      const email = 'user@example.com'
      const url = generateOTPAuthURL(secret, email)

      expect(url).toContain('otpauth://totp/')
      expect(url).toContain(encodeURIComponent('MobiaL'))
      expect(url).toContain(encodeURIComponent('user@example.com'))
      expect(url).toContain('secret=TEST_SECRET')
      expect(url).toContain('algorithm=SHA1')
      expect(url).toContain('digits=6')
      expect(url).toContain('period=30')
    })

    it('should use custom issuer when provided', () => {
      const url = generateOTPAuthURL('SEC', 'a@b.com', 'MyApp')
      expect(url).toContain(encodeURIComponent('MyApp'))
    })
  })

  describe('getQRCodeData', () => {
    it('should return the same string as generateOTPAuthURL', () => {
      const secret = 'QR_SECRET'
      const email = 'qr@test.com'
      expect(getQRCodeData(secret, email)).toBe(generateOTPAuthURL(secret, email))
    })
  })
})
