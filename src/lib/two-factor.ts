/**
 * Two-Factor Authentication utilities
 * Implements TOTP (Time-based One-Time Password) per RFC 6238
 */

import crypto from 'crypto';

const TOTP_INTERVAL = 30; // 30 seconds
const TOTP_DIGITS = 6;

/**
 * Generate a TOTP secret
 */
export function generateTOTPSecret(): string {
  return crypto.randomBytes(20).toString('base64url');
}

/**
 * Generate TOTP code
 */
export function generateTOTPCode(secret: string, time: number = Date.now()): string {
  const counter = Math.floor(time / 1000 / TOTP_INTERVAL);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));
  
  const secretBuffer = Buffer.from(secret, 'base64url');
  const hmac = crypto.createHmac('sha1', secretBuffer);
  hmac.update(counterBuffer);
  const hmacResult = hmac.digest();
  
  const offset = hmacResult[hmacResult.length - 1] & 0x0f;
  const code = hmacResult.readUInt32BE(offset) & 0x7fffffff;
  
  return code.toString().padStart(TOTP_DIGITS, '0').slice(-TOTP_DIGITS);
}

/**
 * Verify TOTP code
 * Allows for time drift by checking previous and next intervals
 */
export function verifyTOTPCode(
  secret: string,
  code: string,
  time: number = Date.now(),
  window: number = 1
): boolean {
  const cleanCode = code.replace(/\s/g, '');
  
  for (let i = -window; i <= window; i++) {
    const testTime = time + i * TOTP_INTERVAL * 1000;
    const expectedCode = generateTOTPCode(secret, testTime);
    
    if (crypto.timingSafeEqual(
      Buffer.from(cleanCode),
      Buffer.from(expectedCode)
    )) {
      return true;
    }
  }
  
  return false;
}

/**
 * Generate backup codes
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }
  
  return codes;
}

/**
 * Hash backup codes for storage
 */
export function hashBackupCodes(codes: string[]): string[] {
  return codes.map(code => 
    crypto.createHash('sha256').update(code).digest('hex')
  );
}

/**
 * Verify a backup code
 */
export function verifyBackupCode(code: string, hashedCodes: string[]): { valid: boolean; remainingCodes: string[] } {
  const codeHash = crypto.createHash('sha256').update(code).digest('hex');
  const remainingCodes = hashedCodes.filter(h => h !== codeHash);
  
  return {
    valid: remainingCodes.length < hashedCodes.length,
    remainingCodes,
  };
}

/**
 * Generate OTPauth URL for QR code
 */
export function generateOTPAuthURL(
  secret: string,
  email: string,
  issuer: string = 'MobiaL'
): string {
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: 'SHA1',
    digits: TOTP_DIGITS.toString(),
    period: TOTP_INTERVAL.toString(),
  });
  
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?${params.toString()}`;
}

/**
 * Generate QR code data URL (simple implementation)
 * Returns the otpauth URL that can be used with a QR code library
 */
export function getQRCodeData(secret: string, email: string): string {
  return generateOTPAuthURL(secret, email);
}
