/**
 * Audit logging for security and compliance
 */

import { db } from './db';
import { headers } from 'next/headers';

export type AuditAction =
  | 'login'
  | 'logout'
  | 'login_failed'
  | 'password_change'
  | 'password_reset'
  | 'email_verify'
  | 'two_factor_enable'
  | 'two_factor_disable'
  | 'profile_update'
  | 'account_create'
  | 'account_delete'
  | 'account_suspend'
  | 'order_create'
  | 'order_complete'
  | 'order_cancel'
  | 'order_refund'
  | 'payment_process'
  | 'commission_earn'
  | 'payout_request'
  | 'affiliate_register'
  | 'affiliate_approve'
  | 'api_key_create'
  | 'api_key_revoke'
  | 'data_export'
  | 'data_delete'
  | 'gdpr_consent'
  | 'settings_change'
  | 'product_sync'
  | 'security_alert'
  | 'usage_lookup'
  | 'topup_payment_success'
  | 'topup_payment_failed'
  | 'stripe_payment_success'
  | 'wallet_topup'
  | 'wallet_deduct'
  | 'reward_created'
  | 'referral_code_created'
  | 'gdpr_permanent_delete';

interface AuditLogData {
  userId?: string;
  action: AuditAction;
  entity?: string;
  entityId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an audit event
 */
export async function logAudit(data: AuditLogData): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        oldValues: data.oldValues ? JSON.stringify(data.oldValues) : null,
        newValues: data.newValues ? JSON.stringify(data.newValues) : null,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw - audit logging should not break the main flow
  }
}

/**
 * Log an audit event with request context
 */
export async function logAuditWithContext(
  data: Omit<AuditLogData, 'ipAddress' | 'userAgent'>
): Promise<void> {
  try {
    const headersList = await headers();
    const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() 
      || headersList.get('x-real-ip') 
      || 'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';
    
    await logAudit({
      ...data,
      ipAddress,
      userAgent,
    });
  } catch (error) {
    console.error('Failed to create audit log with context:', error);
  }
}

/**
 * Get audit logs for a user
 */
export async function getUserAuditLogs(
  userId: string,
  options: {
    limit?: number;
    offset?: number;
    action?: AuditAction;
  } = {}
) {
  const { limit = 50, offset = 0, action } = options;
  
  return db.auditLog.findMany({
    where: {
      userId,
      ...(action && { action }),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  });
}

/**
 * Get audit logs for an entity
 */
export async function getEntityAuditLogs(
  entity: string,
  entityId: string,
  options: { limit?: number; offset?: number } = {}
) {
  const { limit = 50, offset = 0 } = options;
  
  return db.auditLog.findMany({
    where: { entity, entityId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });
}

/**
 * Get recent security events
 */
export async function getRecentSecurityEvents(
  options: { limit?: number; hours?: number } = {}
) {
  const { limit = 100, hours = 24 } = options;
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  const securityActions: AuditAction[] = [
    'login',
    'login_failed',
    'password_change',
    'two_factor_enable',
    'two_factor_disable',
    'account_suspend',
    'api_key_create',
    'api_key_revoke',
    'security_alert',
  ];
  
  return db.auditLog.findMany({
    where: {
      action: { in: securityActions },
      createdAt: { gte: since },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });
}
