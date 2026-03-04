/**
 * Password hashing utilities using bcrypt-like approach
 * Uses PBKDF2 for password hashing (Node.js built-in)
 */

import crypto from 'crypto';

const ITERATIONS = 100000;
const KEY_LENGTH = 64;
const SALT_LENGTH = 32;

/**
 * Hash a password
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
  
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, ITERATIONS, KEY_LENGTH, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${ITERATIONS}:${derivedKey.toString('hex')}`);
    });
  });
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, iterationsStr, hash] = storedHash.split(':');
  
  if (!salt || !iterationsStr || !hash) {
    return false;
  }
  
  const iterations = parseInt(iterationsStr, 10);
  
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, iterations, KEY_LENGTH, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      resolve(crypto.timingSafeEqual(
        Buffer.from(hash, 'hex'),
        derivedKey
      ));
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
