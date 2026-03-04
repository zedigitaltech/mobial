/**
 * User profile routes
 * GET /api/user/me - Get current user info
 * PATCH /api/user/me - Update user profile
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { 
  requireAuth, 
  successResponse, 
  errorResponse, 
  parseJsonBody 
} from '@/lib/auth-helpers';
import { logAuditWithContext } from '@/lib/audit';
import { db } from '@/lib/db';

// Validation schema for profile update
const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  phone: z.string().optional(),
  avatar: z.string().url('Invalid avatar URL').optional().nullable(),
});

/**
 * GET /api/user/me
 * Get current user info
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const authUser = await requireAuth(request);
    
    // Get full user data
    const user = await db.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        name: true,
        phone: true,
        phoneVerified: true,
        avatar: true,
        role: true,
        status: true,
        twoFactorEnabled: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            orders: true,
            notifications: { where: { isRead: false } },
          },
        },
        affiliateProfile: {
          select: {
            id: true,
            affiliateCode: true,
            status: true,
            totalEarnings: true,
            totalPaidOut: true,
          },
        },
      },
    });
    
    if (!user) {
      return errorResponse('User not found', 404);
    }
    
    return successResponse({
      ...user,
      unreadNotifications: user._count.notifications,
      orderCount: user._count.orders,
      _count: undefined,
    });
    
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') {
      return errorResponse(error.message, (error as { statusCode: number }).statusCode);
    }
    console.error('Get user error:', error);
    return errorResponse('An error occurred', 500);
  }
}

/**
 * PATCH /api/user/me
 * Update user profile
 */
export async function PATCH(request: NextRequest) {
  try {
    // Require authentication
    const authUser = await requireAuth(request);
    
    // Parse and validate input
    const body = await parseJsonBody(request);
    
    if (!body) {
      return errorResponse('Invalid request body', 400);
    }
    
    const validationResult = updateProfileSchema.safeParse(body);
    
    if (!validationResult.success) {
      return errorResponse(validationResult.error.errors[0]?.message || 'Invalid input', 400);
    }
    
    const { name, phone, avatar } = validationResult.data;
    
    // Get current user data for audit
    const currentUser = await db.user.findUnique({
      where: { id: authUser.id },
      select: { name: true, phone: true, avatar: true },
    });
    
    // Update user
    const updatedUser = await db.user.update({
      where: { id: authUser.id },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(avatar !== undefined && { avatar }),
      },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        name: true,
        phone: true,
        phoneVerified: true,
        avatar: true,
        role: true,
        status: true,
        twoFactorEnabled: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    // Log audit event
    await logAuditWithContext({
      userId: authUser.id,
      action: 'profile_update',
      entity: 'user',
      entityId: authUser.id,
      oldValues: currentUser,
      newValues: { name, phone, avatar },
    });
    
    return successResponse(updatedUser, 'Profile updated successfully');
    
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') {
      return errorResponse(error.message, (error as { statusCode: number }).statusCode);
    }
    console.error('Update user error:', error);
    return errorResponse('An error occurred', 500);
  }
}
