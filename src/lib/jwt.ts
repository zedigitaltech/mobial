/**
 * JWT Utilities for authentication
 * Uses RS256 for secure signing
 */

import crypto from 'crypto';

const JWT_ALGORITHM = 'HS256';
const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days

interface JWTPayload {
  sub: string;
  email: string;
  role: string;
  type: 'access' | 'refresh';
  iat: number;
  exp: number;
  jti: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.warn('WARNING: Using default JWT secret. Set JWT_SECRET in production!');
    return 'mobial-default-jwt-secret-do-not-use-in-production';
  }
  return secret;
}

/**
 * Base64URL encode
 */
function base64URLEncode(data: string | Buffer): string {
  return Buffer.from(data)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Base64URL decode
 */
function base64URLDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64').toString();
}

/**
 * Create JWT signature
 */
function sign(payload: string, secret: string): string {
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('base64');
  return base64URLEncode(signature);
}

/**
 * Generate a JWT token
 */
export function generateToken(
  userId: string,
  email: string,
  role: string,
  type: 'access' | 'refresh' = 'access'
): string {
  const secret = getJWTSecret();
  const now = Math.floor(Date.now() / 1000);
  
  const expiry = type === 'access' 
    ? now + 15 * 60 // 15 minutes
    : now + 7 * 24 * 60 * 60; // 7 days
  
  const payload: JWTPayload = {
    sub: userId,
    email,
    role,
    type,
    iat: now,
    exp: expiry,
    jti: crypto.randomBytes(16).toString('hex'),
  };
  
  const header = base64URLEncode(JSON.stringify({ alg: JWT_ALGORITHM, typ: 'JWT' }));
  const payloadEncoded = base64URLEncode(JSON.stringify(payload));
  const signature = sign(`${header}.${payloadEncoded}`, secret);
  
  return `${header}.${payloadEncoded}.${signature}`;
}

/**
 * Generate access and refresh token pair
 */
export function generateTokenPair(userId: string, email: string, role: string): TokenPair {
  return {
    accessToken: generateToken(userId, email, role, 'access'),
    refreshToken: generateToken(userId, email, role, 'refresh'),
    expiresIn: 15 * 60, // 15 minutes in seconds
  };
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  const secret = getJWTSecret();
  
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }
  
  const [header, payloadEncoded, signature] = parts;
  const expectedSignature = sign(`${header}.${payloadEncoded}`, secret);
  
  if (!crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )) {
    return null;
  }
  
  try {
    const payload: JWTPayload = JSON.parse(base64URLDecode(payloadEncoded));
    
    // Check expiration
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    
    return payload;
  } catch {
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Generate password reset token
 */
export function generatePasswordResetToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Generate email verification token
 */
export function generateEmailVerificationToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}
