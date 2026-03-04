/**
 * Authentication helper utilities for API routes
 */

import { NextRequest } from 'next/server';
import { verifyToken, extractToken } from './jwt';
import { db } from './db';
import { User, UserRole } from '@prisma/client';

// Types
export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  twoFactorEnabled: boolean;
}

export interface AuthenticatedRequest extends NextRequest {
  user: AuthUser;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Extract and verify user from request headers
 */
export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  try {
    const authHeader = request.headers.get('authorization');
    const token = extractToken(authHeader);
    
    if (!token) {
      return null;
    }
    
    const payload = verifyToken(token);
    
    if (!payload || payload.type !== 'access') {
      return null;
    }
    
    // Get user from database to ensure they still exist and are active
    const user = await db.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        twoFactorEnabled: true,
        status: true,
        deletedAt: true,
      },
    });
    
    if (!user || user.status === 'DELETED' || user.deletedAt) {
      return null;
    }
    
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      twoFactorEnabled: user.twoFactorEnabled,
    };
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

/**
 * Middleware that throws if not authenticated
 * Returns the authenticated user or throws an error
 */
export async function requireAuth(request: NextRequest): Promise<AuthUser> {
  const user = await getAuthUser(request);
  
  if (!user) {
    throw new AuthError('Authentication required', 401);
  }
  
  return user;
}

/**
 * Middleware that throws if not admin
 * Returns the authenticated admin user or throws an error
 */
export async function requireAdmin(request: NextRequest): Promise<AuthUser> {
  const user = await requireAuth(request);
  
  if (user.role !== 'ADMIN') {
    throw new AuthError('Admin access required', 403);
  }
  
  return user;
}

/**
 * Custom error class for authentication errors
 */
export class AuthError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number = 401) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}

/**
 * Create a standardized JSON response
 */
export function jsonResponse<T>(data: ApiResponse<T>, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Create an error response
 */
export function errorResponse(message: string, status: number = 400): Response {
  return jsonResponse({
    success: false,
    error: message,
  }, status);
}

/**
 * Create a success response
 */
export function successResponse<T>(data?: T, message?: string): Response {
  return jsonResponse({
    success: true,
    data,
    message,
  });
}

/**
 * Get client IP address from request
 */
export function getClientIP(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
}

/**
 * Get user agent from request
 */
export function getUserAgent(request: NextRequest): string {
  return request.headers.get('user-agent') || 'unknown';
}

/**
 * Parse JSON body from request with error handling
 */
export async function parseJsonBody<T>(request: NextRequest): Promise<T | null> {
  try {
    const text = await request.text();
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitize user data for response (remove sensitive fields)
 */
export function sanitizeUser(user: User): Omit<User, 'passwordHash' | 'twoFactorSecret' | 'twoFactorBackupCodes'> {
  const { passwordHash, twoFactorSecret, twoFactorBackupCodes, ...safeUser } = user;
  return safeUser;
}

/**
 * Check if user has permission for an action
 */
export function hasPermission(user: AuthUser, permission: string): boolean {
  const permissions: Record<UserRole, string[]> = {
    ADMIN: ['*'], // Admin has all permissions
    AFFILIATE: [
      'view_products',
      'create_links',
      'view_commissions',
      'request_payout',
      'view_analytics',
    ],
    CUSTOMER: [
      'view_products',
      'create_order',
      'view_orders',
      'manage_profile',
    ],
  };
  
  const userPermissions = permissions[user.role] || [];
  return userPermissions.includes('*') || userPermissions.includes(permission);
}
