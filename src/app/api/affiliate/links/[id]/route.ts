/**
 * DELETE /api/affiliate/links/[id]
 * Delete an affiliate link
 */

import { NextRequest } from 'next/server';
import { requireAuth, errorResponse, successResponse } from '@/lib/auth-helpers';
import { db } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;

    // Find the link and verify ownership
    const link = await db.affiliateLink.findUnique({
      where: { id },
      select: {
        id: true,
        affiliateId: true,
        name: true,
        code: true,
      },
    });

    if (!link) {
      return errorResponse('Affiliate link not found', 404);
    }

    // Verify ownership
    if (link.affiliateId !== user.id) {
      return errorResponse('You do not have permission to delete this link', 403);
    }

    // Delete the link
    await db.affiliateLink.delete({
      where: { id },
    });

    return successResponse({
      deletedLink: {
        id: link.id,
        name: link.name,
        code: link.code,
      },
    }, 'Affiliate link deleted successfully');
  } catch (error) {
    console.error('Delete affiliate link error:', error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return errorResponse(error.message, 401);
    }
    return errorResponse('Failed to delete affiliate link', 500);
  }
}
