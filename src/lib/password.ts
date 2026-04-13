/**
 * Password hashing utilities using bcrypt
 * Supports transparent migration from legacy PBKDF2 hashes
 */

import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const BCRYPT_COST_FACTOR = 12;

/** Legacy PBKDF2 constants (for verifying old hashes during migration) */
const LEGACY_KEY_LENGTH = 64;

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST_FACTOR);
}

/**
 * Verify a password against a stored hash.
 * Auto-detects bcrypt vs legacy PBKDF2 format.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!storedHash) {
    return false;
  }

  if (isBcryptHash(storedHash)) {
    return bcrypt.compare(password, storedHash);
  }

  // Legacy PBKDF2 format: salt:iterations:hash
  return verifyLegacyPassword(password, storedHash);
}

/**
 * Check whether a stored hash is bcrypt (starts with $2a$ or $2b$)
 */
export function isBcryptHash(hash: string): boolean {
  return hash.startsWith('$2a$') || hash.startsWith('$2b$');
}

/**
 * Verify a password against a legacy PBKDF2 hash (salt:iterations:hash format)
 */
function verifyLegacyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, iterationsStr, hash] = storedHash.split(':');

  if (!salt || !iterationsStr || !hash) {
    return Promise.resolve(false);
  }

  const iterations = parseInt(iterationsStr, 10);

  if (isNaN(iterations) || iterations <= 0) {
    return Promise.resolve(false);
  }

  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, iterations, LEGACY_KEY_LENGTH, 'sha512', (err, derivedKey) => {
      if (err) {
        reject(err);
        return;
      }
      try {
        resolve(crypto.timingSafeEqual(
          Buffer.from(hash, 'hex'),
          derivedKey
        ));
      } catch {
        // timingSafeEqual throws if buffers differ in length
        resolve(false);
      }
    });
  });
}

/**
 * Generate a secure password
 */
export function generateSecurePassword(length: number = 16): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  const randomBytes = crypto.randomBytes(length);

  for (let i = 0; i < length; i++) {
    password += chars[randomBytes[i] % chars.length];
  }

  return password;
}

/**
 * Check password strength
 */
export function checkPasswordStrength(password: string): {
  score: number;
  feedback: string[];
  isStrong: boolean;
} {
  const feedback: string[] = [];
  let score = 0;

  // Length check
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (password.length < 8) feedback.push('Password should be at least 8 characters');

  // Character variety
  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Add lowercase letters');

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Add uppercase letters');

  if (/[0-9]/.test(password)) score += 1;
  else feedback.push('Add numbers');

  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  else feedback.push('Add special characters');

  // Common patterns
  if (/(.)\1{2,}/.test(password)) {
    score -= 1;
    feedback.push('Avoid repeated characters');
  }

  if (/^[a-z]+$/.test(password.toLowerCase())) {
    score -= 1;
    feedback.push('Avoid dictionary words');
  }

  // Normalize score
  score = Math.max(0, Math.min(5, score));

  return {
    score,
    feedback,
    isStrong: score >= 4,
  };
}
