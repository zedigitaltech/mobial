/**
 * POST /api/user/export-data
 * Request a data export (GDPR compliance)
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth, successResponse, errorResponse, parseJsonBody } from '@/lib/auth-helpers';
import { logAuditWithContext } from '@/lib/audit';
import { db } from '@/lib/db';

// Validation schema
const exportRequestSchema = z.object({
  format: z.enum(['JSON', 'CSV']).default('JSON'),
});

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth(request);
    
    // Parse and validate input
    const body = await parseJsonBody(request) || {};
    const validationResult = exportRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return errorResponse(validationResult.error.errors[0]?.message || 'Invalid input', 400);
    }
    
    const { format } = validationResult.data;
    
    // Check if there's already a pending export request
    const existingRequest = await db.dataExportRequest.findFirst({
      where: {
        userId: user.id,
        status: { in: ['PENDING', 'PROCESSING'] },
      },
    });
    
    if (existingRequest) {
      return errorResponse('A data export request is already in progress. Please wait for it to complete.', 400);
    }
    
    // Create export request
    const exportRequest = await db.dataExportRequest.create({
      data: {
        userId: user.id,
        status: 'PENDING',
        format,
      },
    });
    
    // Log audit event
    await logAuditWithContext({
      userId: user.id,
      action: 'data_export',
      entity: 'data_export_request',
      entityId: exportRequest.id,
      newValues: { format },
    });
    
    // In a real application, this would trigger a background job
    // For now, we'll process it synchronously
    try {
      // Update status to processing
      await db.dataExportRequest.update({
        where: { id: exportRequest.id },
        data: { status: 'PROCESSING' },
      });
      
      // Gather all user data
      const userData = await gatherUserData(user.id);
      
      // Generate export data
      let exportContent: string;
      let contentType: string;
      
      if (format === 'JSON') {
        exportContent = JSON.stringify(userData, null, 2);
        contentType = 'application/json';
      } else {
        // Simple CSV conversion
        exportContent = convertToCSV(userData);
        contentType = 'text/csv';
      }
      
      // In production, you'd upload this to a secure storage (S3, etc.)
      // and provide a download URL
      // For now, we'll store it in SystemConfig
      const downloadUrl = `data:${contentType};base64,${Buffer.from(exportContent).toString('base64')}`;
      
      // Update request as completed
      const completedRequest = await db.dataExportRequest.update({
        where: { id: exportRequest.id },
        data: {
          status: 'COMPLETED',
          downloadUrl,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          completedAt: new Date(),
        },
      });
      
      // Log completion
      await logAuditWithContext({
        userId: user.id,
        action: 'data_export',
        entity: 'data_export_request',
        entityId: exportRequest.id,
        newValues: { status: 'COMPLETED' },
      });
      
      return successResponse({
        requestId: exportRequest.id,
        status: 'COMPLETED',
        downloadUrl: completedRequest.downloadUrl,
        expiresAt: completedRequest.expiresAt,
        format,
      }, 'Data export completed');
      
    } catch (exportError) {
      // Update status to failed
      await db.dataExportRequest.update({
        where: { id: exportRequest.id },
        data: { status: 'EXPIRED' },
      });
      throw exportError;
    }
    
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') {
      return errorResponse(error.message, (error as { statusCode: number }).statusCode);
    }
    console.error('Data export error:', error);
    return errorResponse('An error occurred during data export', 500);
  }
}

/**
 * Gather all user data for export
 */
async function gatherUserData(userId: string) {
  const [
    user,
    sessions,
    orders,
    affiliateProfile,
    affiliateLinks,
    commissions,
    gdprConsents,
    notifications,
    auditLogs,
  ] = await Promise.all([
    // User data
    db.user.findUnique({
      where: { id: userId },
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
    }),
    // Sessions
    db.session.findMany({
      where: { userId },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        createdAt: true,
        expiresAt: true,
      },
    }),
    // Orders
    db.order.findMany({
      where: { userId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        subtotal: true,
        total: true,
        currency: true,
        createdAt: true,
        completedAt: true,
        items: {
          select: {
            productName: true,
            quantity: true,
            unitPrice: true,
            totalPrice: true,
          },
        },
      },
    }),
    // Affiliate profile
    db.affiliateProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        affiliateCode: true,
        companyName: true,
        website: true,
        commissionRate: true,
        totalClicks: true,
        totalConversions: true,
        totalEarnings: true,
        totalPaidOut: true,
        createdAt: true,
        approvedAt: true,
      },
    }),
    // Affiliate links
    db.affiliateLink.findMany({
      where: { affiliateId: userId },
      select: {
        id: true,
        code: true,
        name: true,
        clicks: true,
        conversions: true,
        createdAt: true,
      },
    }),
    // Commissions
    db.commission.findMany({
      where: { affiliateId: userId },
      select: {
        id: true,
        type: true,
        status: true,
        amount: true,
        currency: true,
        baseAmount: true,
        createdAt: true,
        paidAt: true,
      },
    }),
    // GDPR consents
    db.gDPRConsent.findMany({
      where: { userId },
    }),
    // Notifications
    db.notification.findMany({
      where: { userId },
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        isRead: true,
        createdAt: true,
      },
    }),
    // Audit logs
    db.auditLog.findMany({
      where: { userId },
      select: {
        id: true,
        action: true,
        entity: true,
        entityId: true,
        ipAddress: true,
        createdAt: true,
      },
    }),
  ]);
  
  return {
    exportedAt: new Date().toISOString(),
    user,
    sessions,
    orders,
    affiliateProfile,
    affiliateLinks,
    commissions,
    gdprConsents,
    notifications,
    auditLogs,
  };
}

/**
 * Convert user data to CSV format (simplified)
 */
function convertToCSV(data: Record<string, unknown>): string {
  // For simplicity, just convert the main user data to CSV
  const user = data.user as Record<string, unknown>;
  if (!user) return 'No user data';
  
  const headers = Object.keys(user).join(',');
  const values = Object.values(user)
    .map(v => typeof v === 'string' ? `"${v}"` : v)
    .join(',');
  
  return `${headers}\n${values}`;
}
