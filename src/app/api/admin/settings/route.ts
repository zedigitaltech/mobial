import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin, successResponse, errorResponse } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';

// Per-key validation: each setting is typed and bounded.
// All values are stored as strings in SystemConfig but must match
// the correct shape before being coerced to String(value).
const SETTING_SCHEMAS: Record<string, z.ZodTypeAny> = {
  'setting:store_name': z.string().min(1).max(100),
  'setting:support_email': z.string().email().max(200),
  'setting:from_email': z.string().email().max(200),
  'setting:currency': z.string().length(3).regex(/^[A-Z]{3}$/),
  'setting:markup_rate': z.coerce.number().finite().min(0).max(10),
  'setting:tax_rate': z.coerce.number().finite().min(0).max(1),
  'last_product_sync': z.string().datetime().or(z.string().min(1)),
};


export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const settings = await db.systemConfig.findMany({
      where: {
        key: { startsWith: 'setting:' },
      },
    });

    const lastSync = await db.systemConfig.findUnique({
      where: { key: 'last_product_sync' },
    });

    const settingsMap: Record<string, string> = {};
    for (const s of settings) {
      settingsMap[s.key] = s.value;
    }

    if (lastSync) {
      settingsMap['last_product_sync'] = lastSync.value;
    }

    return successResponse(settingsMap);
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      const authError = error as { statusCode: number; message: string };
      return errorResponse(authError.message, authError.statusCode);
    }
    logger.errorWithException('Error fetching settings', error);
    return errorResponse('Failed to fetch settings', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin(request);
    const body = await request.json();

    if (!body || typeof body !== 'object') {
      return errorResponse('Invalid request body', 400);
    }

    const updates: Record<string, string> = {};
    const rejected: { key: string; reason: string }[] = [];

    for (const [key, value] of Object.entries(body)) {
      const schema = SETTING_SCHEMAS[key];
      if (!schema) {
        rejected.push({ key, reason: 'unknown setting key' });
        continue;
      }
      const parsed = schema.safeParse(value);
      if (!parsed.success) {
        rejected.push({
          key,
          reason: parsed.error.issues[0]?.message ?? 'invalid value',
        });
        continue;
      }
      updates[key] = String(parsed.data);
    }

    if (rejected.length > 0) {
      logger.warn('Admin settings rejected invalid values', { metadata: { rejected } });
    }

    if (Object.keys(updates).length === 0) {
      return errorResponse(
        rejected.length > 0
          ? `No valid settings to update. Rejected: ${rejected.map((r) => `${r.key} (${r.reason})`).join(', ')}`
          : 'No valid settings to update',
        400
      );
    }

    for (const [key, value] of Object.entries(updates)) {
      await db.systemConfig.upsert({
        where: { key },
        update: { value },
        create: {
          key,
          value,
          description: `Admin setting: ${key}`,
        },
      });
    }

    await logAudit({
      userId: user.id,
      action: 'settings_change',
      entity: 'system_config',
      newValues: updates,
    });

    return successResponse(
      { updated: updates, rejected },
      rejected.length > 0
        ? `Saved ${Object.keys(updates).length} setting(s); rejected ${rejected.length}`
        : 'Settings saved successfully'
    );
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      const authError = error as { statusCode: number; message: string };
      return errorResponse(authError.message, authError.statusCode);
    }
    logger.errorWithException('Error saving settings', error);
    return errorResponse('Failed to save settings', 500);
  }
}
