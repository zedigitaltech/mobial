/**
 * POST /api/auth/logout
 * Logout user and invalidate session
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { logAuditWithContext } from '@/lib/audit';
import { db } from '@/lib/db';
import { 
  successResponse, 
  errorResponse, 
  parseJsonBody, 
  getAuthUser 
} from '@/lib/auth-helpers';

// Validation schema
const logoutSchema = z.object({
  refreshToken: z.string().optional(),
  allDevices: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getAuthUser(request);
    
    // Parse body
    const body = await parseJsonBody(request) || {};
    const validationResult = logoutSchema.safeParse(body);
    
    if (!validationResult.success) {
      return errorResponse('Invalid request body', 400);
    }
    
    const { refreshToken, allDevices } = validationResult.data;
    
    if (!user) {
      // Still return success for unauthenticated users
      return successResponse(null, 'Logged out successfully');
    }
    
    if (allDevices) {
      // Delete all sessions for the user
      await db.session.deleteMany({
        where: { userId: user.id },
      });
    } else if (refreshToken) {
      // Delete specific session
      await db.session.deleteMany({
        where: {
          userId: user.id,
          token: refreshToken,
        },
      });
    } else {
      // Delete session by access token (get from Authorization header)
      const authHeader = request.headers.get('authorization');
      const accessToken = authHeader?.replace('Bearer ', '');
      
      if (accessToken) {
        // Find and delete sessions associated with this user
        await db.session.deleteMany({
          where: { userId: user.id },
        });
      }
    }
    
    // Log audit event
    await logAuditWithContext({
      userId: user.id,
      action: 'logout',
      entity: 'user',
      entityId: user.id,
      newValues: { allDevices: allDevices || false },
    });
    
    return successResponse(null, 'Logged out successfully');
    
  } catch (error) {
    console.error('Logout error:', error);
    return errorResponse('An error occurred during logout', 500);
  }
}
