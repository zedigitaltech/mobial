import { z } from 'zod';

const isProduction = process.env.NODE_ENV === 'production';

// Base schema — always validated
const baseSchema = z.object({
  DATABASE_URL: z.string()
    .min(1, 'DATABASE_URL is required')
    .refine(
      (v) => v.startsWith('postgresql://') || v.startsWith('postgres://'),
      'DATABASE_URL must be a PostgreSQL connection string'
    ),
  MOBIMATTER_MERCHANT_ID: z.string().min(1, 'MOBIMATTER_MERCHANT_ID is required'),
  MOBIMATTER_API_KEY: z.string().min(1, 'MOBIMATTER_API_KEY is required'),
});

// Production-only schema — stricter validation
const productionSchema = baseSchema.extend({
  JWT_SECRET: z.string()
    .min(32, 'JWT_SECRET must be at least 32 characters')
    .refine(
      (v) => !v.includes('dev-secret') && !v.includes('default') && !v.includes('change-this'),
      'JWT_SECRET contains an insecure placeholder value'
    ),
  ENCRYPTION_KEY: z.string()
    .length(64, 'ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes)')
    .regex(/^[0-9a-fA-F]+$/, 'ENCRYPTION_KEY must contain only hex characters'),
  STRIPE_SECRET_KEY: z.string()
    .min(1, 'STRIPE_SECRET_KEY is required')
    .refine(
      (v) => v.startsWith('sk_live_') || v.startsWith('sk_test_'),
      'STRIPE_SECRET_KEY must start with sk_live_ or sk_test_'
    ),
  STRIPE_WEBHOOK_SECRET: z.string()
    .min(1, 'STRIPE_WEBHOOK_SECRET is required')
    .refine(
      (v) => v.startsWith('whsec_'),
      'STRIPE_WEBHOOK_SECRET must start with whsec_'
    ),
  NEXT_PUBLIC_BASE_URL: z.string()
    .url('NEXT_PUBLIC_BASE_URL must be a valid URL')
    .refine(
      (v) => v.startsWith('https://'),
      'NEXT_PUBLIC_BASE_URL must use HTTPS in production'
    ),
});

// Development schema — relaxed
const developmentSchema = baseSchema.extend({
  JWT_SECRET: z.string().min(1).optional(),
  ENCRYPTION_KEY: z.string().min(1).optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  NEXT_PUBLIC_BASE_URL: z.string().optional(),
});

// Optional vars — warn if missing, don't fail
const OPTIONAL_VARS = [
  'RESEND_API_KEY',
  'CRON_SECRET',
  'CONTACT_EMAIL',
  'MOBIMATTER_WEBHOOK_SECRET',
  'NEXT_PUBLIC_VAPID_PUBLIC_KEY',
  'STRIPE_PUBLISHABLE_KEY',
  'NEXT_PUBLIC_AFFILIATE_CODE',
] as const;

// Centralized runtime constants — import these instead of inlining process.env
export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://mobialo.eu';
export const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@mobialo.eu';
export const REFERRAL_CREDIT_USD = Number(process.env.REFERRAL_CREDIT_USD) || 3;
export const CASHBACK_PERCENT = Number(process.env.CASHBACK_PERCENT) || 0.1;

// Domain used for anonymized email addresses on soft-delete. Internal only —
// never delivered. Configurable so self-hosting deployments can set their own.
export const DELETED_USER_EMAIL_DOMAIN = process.env.DELETED_USER_EMAIL_DOMAIN || 'deleted.invalid';

export function validateEnv(): void {
  const schema = isProduction ? productionSchema : developmentSchema;

  const result = schema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    MOBIMATTER_MERCHANT_ID: process.env.MOBIMATTER_MERCHANT_ID,
    MOBIMATTER_API_KEY: process.env.MOBIMATTER_API_KEY,
    JWT_SECRET: process.env.JWT_SECRET,
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  });

  if (!result.success) {
    const errors = result.error.issues.map(
      (issue) => `  ${issue.path.join('.')}: ${issue.message}`
    );
    throw new Error(
      `Environment validation failed:\n${errors.join('\n')}`
    );
  }

  // Warn about missing optional vars
  for (const name of OPTIONAL_VARS) {
    if (!process.env[name]) {
      console.warn(`[env] Optional var ${name} is not set`);
    }
  }
}

export function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
