# Mobial Codebase Comprehensive Summary

## Project Overview
**Mobial** is a Next.js 16 + React 19 B2C eSIM marketplace that resells MobiMatter products. Built with TypeScript, Tailwind CSS 4, and Prisma ORM with SQLite database.

**Location:** `/Users/ezekaj/Desktop/Projects/mobial`

**Project Structure:**
- Framework: Next.js 16 with app directory routing
- Database: Prisma ORM + SQLite
- Styling: Tailwind CSS 4
- Validation: Zod schemas
- Authentication: Custom JWT-based with access + refresh tokens
- Payment Processing: Stripe checkout (card-only)
- B2B Integration: MobiMatter API client for product sync and order management

---

## 1. STRIPE CHECKOUT IMPLEMENTATION

### 1.1 Configuration and Initialization
**File:** `/Users/ezekaj/Desktop/Projects/mobial/src/lib/stripe.ts` (69 lines)

**Key Details:**
- Stripe API version: `'2026-02-25.clover'`
- Environment variable required: `STRIPE_SECRET_KEY`
- App info: `{ name: 'Mobial eSIM Store', version: '0.1.0' }`

### 1.2 Checkout Session Creation
**Function:** `createCheckoutSession(params)`

**Parameters:**
```typescript
{
  orderId: string;
  orderNumber: string;
  email: string;
  amount: number;
  currency?: string; // defaults to 'usd'
  isTopUp?: boolean;
  parentMobimatterOrderId?: string;
  items: Array<{
    name: string;
    description?: string;
    amount: number;
    quantity: number;
  }>;
}
```

**Process:**
1. Maps items to Stripe line_items with `unit_amount: Math.round(item.amount * 100)` (converts to cents)
2. Sets payment_method_types to `['card']` (card-only checkout)
3. Sets mode to `'payment'` (not subscription)
4. Uses Stripe-hosted checkout (redirect flow)
5. Stores metadata: `{ orderId, orderNumber, isTopUp?, parentMobimatterOrderId? }`
6. Success URL: `${NEXT_PUBLIC_BASE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`
7. Cancel URL: `${NEXT_PUBLIC_BASE_URL}/checkout/cancel?order_id=${orderId}`

**Returns:** Stripe session object with `id` and `url` properties

### 1.3 Webhook Verification
**Function:** `verifyWebhookSignature(payload, signature)`
- Uses `STRIPE_WEBHOOK_SECRET` environment variable
- Returns verified event object via `stripe.webhooks.constructEvent()`

### 1.4 Integration Endpoint
**File:** `/Users/ezekaj/Desktop/Projects/mobial/src/app/api/checkout/session/route.ts` (70 lines)

**Route:** `POST /api/checkout/session`

**Validation Schema:**
```typescript
{
  orderId: z.string().min(1, 'Order ID is required'),
  isTopUp: z.boolean().optional(),
  parentMobimatterOrderId: z.string().optional()
}
```

**Process:**
1. Rate limiting: `checkRateLimit(ip, 'order:create')`
2. Fetch order via `getOrderById(orderId)`
3. Validate order status === 'PENDING'
4. Map order items with conditional "Top-Up: " prefix
5. Call `createCheckoutSession()` with order data
6. Return `{ sessionId: session.id, url: session.url }`

**Error Handling:**
- 429: Too many checkout attempts
- 400: Validation or order status errors
- 404: Order not found
- 500: Stripe session creation failure

**Dependencies:**
- Order service: `getOrderById(orderId)`
- Stripe service: `createCheckoutSession()`
- Rate limiting: `checkRateLimit(ip, action)`
- Helper functions: `parseJsonBody()`, `successResponse()`, `errorResponse()`

---

## 2. AUTHENTICATION SYSTEM

### 2.1 Core Architecture
**Type:** Custom JWT-based authentication with access + refresh token pair

**Token Structure:**
- **Access Token:** Short-lived JWT for API requests (expired time varies)
- **Refresh Token:** 7-day expiry, stored in database sessions table
- **Session Storage:** `db.session` table with userId, token, userAgent, ipAddress, expiresAt

**Key Security Features:**
- Password hashing (bcrypt-like via `hashPassword()`)
- Password strength validation (minimum requirements enforced)
- Account lockout: 30-minute lockout after 5 failed login attempts
- Rate limiting on auth endpoints (per IP address)
- Audit logging for all auth actions
- Soft delete pattern (never hard delete user records)
- Email verification workflow (24-hour token expiry)
- Two-factor authentication (2FA) with TOTP and backup codes
- Session invalidation on password reset
- User status tracking (PENDING_VERIFICATION, ACTIVE, DELETED)

### 2.2 Registration Endpoint
**File:** `/Users/ezekaj/Desktop/Projects/mobial/src/app/api/auth/register/route.ts` (145 lines)

**Route:** `POST /api/auth/register`

**Validation Schema:**
```typescript
{
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().optional()
}
```

**Process:**
1. Password strength check via `checkPasswordStrength(password)` returns `{ isStrong, feedback[] }`
2. Check duplicate email (returns 409 if exists)
3. Hash password via `hashPassword(password)`
4. Create user with:
   - `role: 'CUSTOMER'`
   - `status: 'PENDING_VERIFICATION'`
   - `emailVerified: null`
5. Generate token pair via `generateTokenPair(userId, email, role)`
6. Create session with 7-day expiry
7. Generate email verification token with 24-hour expiry
8. Store verification token in `systemConfig` with key `verify_token:${userId}` and JSON value `{ token, expiresAt }`
9. Send verification email synchronously
10. Send welcome email asynchronously (fire-and-forget)
11. Log audit event `account_create`

**Response:**
```typescript
{
  user: { id, email, name, role, avatar, ... }, // excludes passwordHash
  tokens: { accessToken, refreshToken, expiresIn }
}
```

**Status Code:** 201 (or implicit 200)

### 2.3 Login Endpoint
**File:** `/Users/ezekaj/Desktop/Projects/mobial/src/app/api/auth/login/route.ts` (247 lines)

**Route:** `POST /api/auth/login`

**Validation Schema:**
```typescript
{
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  totpCode: z.string().optional()
}
```

**Process:**
1. Rate limiting: `checkRateLimit(clientIP, 'auth:login')` returns headers and retryAfter
2. User lookup by email (case-insensitive)
3. Account status checks:
   - User must exist
   - Account must not be locked (lockedUntil > now)
   - Account must not be deleted (deletedAt null, status !== 'DELETED')
4. Password verification via `verifyPassword(password, user.passwordHash)`
5. Failed attempt handling:
   - Increment `failedLoginAttempts`
   - Lock account for 30 minutes after 5 failed attempts
   - Set `lockedUntil` to 30 minutes in future
6. 2FA verification (if enabled):
   - Try TOTP verification first via `verifyTOTPCode(secret, totpCode)`
   - Fall back to backup code verification if TOTP fails
   - Backup code verification updates remaining backup codes
7. On success:
   - Generate token pair
   - Update user: `lastLoginAt`, `lastLoginIp`, reset `failedLoginAttempts` to 0, clear `lockedUntil`
   - Create new session (7-day expiry)
   - Log audit event `login`
8. Return user (excluding sensitive fields) + tokens

**Sensitive Fields Excluded:**
- `passwordHash`
- `twoFactorSecret`
- `twoFactorBackupCodes`

**Error Handling:**
- 429: Rate limited (with Retry-After header)
- 401: Invalid credentials or 2FA required
- 423: Account locked

### 2.4 Email Verification Endpoint
**File:** `/Users/ezekaj/Desktop/Projects/mobial/src/app/api/auth/verify-email/route.ts` (99 lines)

**Route:** `GET /api/auth/verify-email?token={token}`

**Process:**
1. Get token from query parameter
2. Search `systemConfig` for entries with key pattern `verify_token:*`
3. Parse stored JSON: `{ token, expiresAt }`
4. Find matching token (data.token === query token)
5. Validate token not expired (compare expiresAt to now)
6. Extract userId from key: `verify_token:${userId}`
7. Fetch user and validate not DELETED
8. Update user: `status: 'ACTIVE'`, set `emailVerified` to current date
9. Delete verification token from systemConfig
10. Log audit event

**Error Handling:**
- 400: Invalid or expired token
- 404: User not found
- 500: Processing error

### 2.5 Refresh Token Endpoint
**File:** `/Users/ezekaj/Desktop/Projects/mobial/src/app/api/auth/refresh/route.ts` (107 lines)

**Route:** `POST /api/auth/refresh`

**Validation Schema:**
```typescript
{
  refreshToken: z.string().min(1, 'Refresh token is required')
}
```

**Process:**
1. Verify token via `verifyToken(refreshToken)` checking `type === 'refresh'`
2. Extract userId from token claims (token.sub)
3. Look up session: match userId, refreshToken string, expiresAt > now
4. Fetch user and validate not DELETED and status !== 'DELETED'
5. Generate new token pair
6. Update session: new refreshToken, new 7-day expiresAt
7. Return new tokens

**Error Handling:**
- 401: Invalid or expired token, user not found
- 500: Processing error

### 2.6 Logout Endpoint
**File:** `/Users/ezekaj/Desktop/Projects/mobial/src/app/api/auth/logout/route.ts` (85 lines)

**Route:** `POST /api/auth/logout`

**Authentication:** Optional (success even if unauthenticated)

**Validation Schema:**
```typescript
{
  refreshToken: z.string().optional(),
  allDevices: z.boolean().optional()
}
```

**Logout Modes:**
1. **allDevices: true** → Delete all sessions for authenticated user
2. **refreshToken provided** → Delete specific session matching that refreshToken
3. Neither → Delete session associated with Authorization header access token

**Error Handling:**
- Always returns success (no error if unauthenticated)

### 2.7 Two-Factor Authentication (2FA)

#### 2.7.1 Enable 2FA Endpoint
**File:** `/Users/ezekaj/Desktop/Projects/mobial/src/app/api/auth/2fa/enable/route.ts` (62 lines)

**Route:** `POST /api/auth/2fa/enable`

**Authentication:** Required

**Process:**
1. Verify 2FA not already enabled
2. Generate TOTP secret via `generateTOTPSecret()`
3. Generate OTP auth URL via `generateOTPAuthURL(secret, user.email)` for QR code
4. Store temporary setup in systemConfig: key `2fa_setup_${userId}`, value `{ secret, createdAt }`
5. Return `{ secret, otpAuthUrl, qrCodeData }`

**Response Includes:**
- `secret`: Raw TOTP secret for manual entry
- `otpAuthUrl`: Full OTP auth URL (for QR code generation)
- `qrCodeData`: Encoded QR code data

#### 2.7.2 Verify 2FA Endpoint
**File:** `/Users/ezekaj/Desktop/Projects/mobial/src/app/api/auth/2fa/verify/route.ts` (112 lines)

**Route:** `POST /api/auth/2fa/verify`

**Authentication:** Required

**Validation Schema:**
```typescript
{
  totpCode: z.string().length(6, 'Code must be 6 digits')
}
```

**Process:**
1. Verify 2FA not already enabled
2. Retrieve temporary setup config from systemConfig with key `2fa_setup_${userId}`
3. Parse setup data: `{ secret, createdAt }`
4. Validate setup not expired (10-minute window from createdAt)
5. Delete setup config if expired
6. Verify TOTP code via `verifyTOTPCode(secret, totpCode)`
7. Generate 10 backup codes via `generateBackupCodes(10)`
8. Hash backup codes via `hashBackupCodes(backupCodes)`
9. Enable 2FA on user:
   - Set `twoFactorEnabled: true`
   - Store secret in `twoFactorSecret`
   - Store hashed backup codes in `twoFactorBackupCodes` (JSON array)
10. Delete temporary setup config
11. Return `{ backupCodes, message }`

**Backup Codes:** 10 codes, hashed for storage, returned in plaintext only at setup time

#### 2.7.3 Disable 2FA Endpoint
**File:** `/Users/ezekaj/Desktop/Projects/mobial/src/app/api/auth/2fa/disable/route.ts` (129 lines)

**Route:** `POST /api/auth/2fa/disable`

**Authentication:** Required

**Validation Schema:**
```typescript
{
  password: z.string().optional(),
  totpCode: z.string().optional(),
  backupCode: z.string().optional()
}
```

**Refined Validation:** At least one of password, totpCode, or backupCode must be provided

**Verification Flow (Tries in Order):**
1. Password verification: `verifyPassword(password, user.passwordHash)`
2. TOTP verification: `verifyTOTPCode(user.twoFactorSecret, totpCode)`
3. Backup code verification: `verifyBackupCode(backupCode, backupCodes)` returns `{ valid, remainingCodes }`

**Process:**
1. Verify 2FA is enabled
2. Try verification methods in order until one succeeds
3. If backup code used: update user's backup codes with remainingCodes
4. Disable 2FA on user:
   - Set `twoFactorEnabled: false`
   - Clear `twoFactorSecret`
   - Clear `twoFactorBackupCodes`
5. Log audit event

**Error Handling:**
- 400: 2FA not enabled, no verification method provided
- 401: Verification failed for all provided methods

### 2.8 Password Management

#### 2.8.1 Request Password Reset
**File:** `/Users/ezekaj/Desktop/Projects/mobial/src/app/api/auth/password/reset/route.ts` (129 lines)

**Route:** `POST /api/auth/password/reset`

**Validation Schema:**
```typescript
{
  email: z.string().email('Invalid email address')
}
```

**Process:**
1. Rate limiting: `checkRateLimit(clientIP, 'auth:password-reset')`
2. Look up user by email
3. Check 2-minute cooldown: look for existing token in systemConfig key `reset_token:${userId}`
4. If within cooldown: return generic success message (security: don't reveal user exists)
5. Generate reset token via `generatePasswordResetToken()`
6. Set expiry to 1 hour
7. Store in systemConfig via upsert:
   - Key: `reset_token:${userId}`
   - Value: JSON `{ token, expiresAt, requestedAt }`
8. Send reset email: `sendPasswordReset(email, resetToken)`
9. Return generic success message (don't reveal if user exists)

**Security Pattern:**
```typescript
const resetToken = generatePasswordResetToken();
const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
const tokenValue = JSON.stringify({
  token: resetToken,
  expiresAt: expiresAt.toISOString(),
  requestedAt: new Date().toISOString(),
});
await db.systemConfig.upsert({
  where: { key: `reset_token:${user.id}` },
  update: { value: tokenValue },
  create: { key: `reset_token:${user.id}`, value: tokenValue }
});
```

#### 2.8.2 Confirm Password Reset
**File:** `/Users/ezekaj/Desktop/Projects/mobial/src/app/api/auth/password/confirm/route.ts` (125 lines)

**Route:** `POST /api/auth/password/confirm`

**Validation Schema:**
```typescript
{
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters')
}
```

**Process:**
1. Password strength check: `checkPasswordStrength(password)` validates requirements
2. Search all reset tokens via `db.systemConfig.findMany()` with key pattern `reset_token:*`
3. Iterate to find matching token:
   - Parse JSON: `{ token, expiresAt }`
   - Match: `data.token === token` parameter
   - Extract userId from key: `reset_token:${userId}`
4. Validate token not expired (expiresAt > now)
5. If expired: delete token, return 400
6. Fetch user and validate not DELETED
7. Hash new password via `hashPassword(password)`
8. Update user:
   - Set new `passwordHash`
   - Reset `failedLoginAttempts` to 0
   - Clear `lockedUntil`
9. Invalidate all user sessions: `db.session.deleteMany({where: {userId}})`
10. Delete reset token from systemConfig
11. Log audit event `password_change` with method: 'reset'

**Error Handling:**
- 400: Invalid, expired, or not found token; weak password
- 404: User not found
- 500: Processing error

### 2.9 Authentication Provider (Frontend)
**File:** `/Users/ezekaj/Desktop/Projects/mobial/src/components/providers/auth-provider.tsx` (169 lines)

**Context Type:**
```typescript
interface AuthContextType {
  user: { id, email, name, role: "ADMIN"|"CUSTOMER", avatar } | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}
```

**Token Storage:**
- localStorage keys: `"token"` (access token), `"refreshToken"` (refresh token)

**Initial Auth Flow:**
1. On mount: GET `/api/user/me` with `Authorization: Bearer {accessToken}`
2. If 401: attempt refresh via POST `/api/auth/refresh`
3. On token refresh: POST `/api/auth/refresh` with `{ refreshToken }`
4. Update localStorage with new tokens

**Session Management:**
- Tokens persisted in localStorage
- Auto-refresh on 401 responses
- Logout clears localStorage

---

## 3. PRODUCT SYNC & CATALOG MANAGEMENT

### 3.1 MobiMatter API Client
**File:** `/Users/ezekaj/Desktop/Projects/mobial/src/lib/mobimatter.ts` (769 lines)

**Authentication:**
- Headers: `merchantId`, `api-key` from environment variables
- Base URL: Configured from environment

**Core Functions:**

#### 3.1.1 Wallet & Account
- `getWalletBalance()` → `{ balance, currency }`

#### 3.1.2 Product Endpoints
- `fetchProducts()` → Array of products
- `getProduct(productId)` → Single product details
- `getProductNetworks(productId)` → Available networks

**Transform Function:**
- `transformProduct()` parses MobiMatter data to typed Product interface
- Extracts productDetails array with { name, value } pairs
- Maps custom fields: PLAN_DATA_LIMIT, PLAN_VALIDITY, PLAN_DETAILS, TAGS, ACTIVATION_POLICY, TOPUP, KYC_REQUIRED

#### 3.1.3 Order Management
- `createOrder(params)` → Order creation
- `completeOrder(orderId)` → Complete order
- `getOrderInfo(orderId)` → Order details
- `getOrderByIccid(iccid)` → Lookup by ICCID
- `cancelMobimatterOrder(orderId)` → Cancel order
- `checkRefundEligibility(orderId)` → Refund eligibility
- `refundOrder(orderId)` → Process refund

**Order Response Structure:**
- lineItemDetails: QR_CODE, ACTIVATION_CODE, ICCID, SMDP_ADDRESS, LPA, PHONE_NUMBER, APN

#### 3.1.4 Usage & Status
- `checkOrderUsage(orderId)` → Usage data
- `getStructuredUsage(orderId)` → StructuredESIMInfo with:
  - status
  - installationDate
  - location
  - kycStatus
  - iccid
  - packages array

#### 3.1.5 Composite Flows
- `topupOrder()` → Recharge eSIM
- `requestReplacement()` → Request replacement
- `purchaseEsim()` → Multi-step purchase flow

**Generic Request Handler:**
- `makeRequest<T>(method, endpoint, body?)` for all API calls
- Type-safe responses

### 3.2 Product Sync Script
**File:** `/Users/ezekaj/Desktop/Projects/mobial/scripts/sync-products.js` (94 lines)

**Execution:** `npm run sync:products`

**Process:**
1. Authenticate with `MOBIMATTER_MERCHANT_ID` and `MOBIMATTER_API_KEY` headers
2. Fetch `GET /api/v2/products` (limit: 200 products per sync)
3. Purge database: `prisma.product.deleteMany({})`
4. Parse productDetails array for each product:
   - Extract: PLAN_DATA_LIMIT, PLAN_VALIDITY, PLAN_DETAILS, TAGS, ACTIVATION_POLICY, TOPUP, KYC_REQUIRED
5. Filter test products:
   - Exclude if name includes 'test' OR price < 1 OR dataAmount < 0.05
6. Create Prisma records with fields:
   - mobimatterId, name, provider, category, price, dataAmount, dataUnit, validityDays, networks, bestFitReason, activationPolicy, topUpAvailable, requiresKyc, countries, regions, slug, syncedAt

**bestFitReason Logic:**
- ≥20GB = "Power User"
- ≤5GB = "Casual Travel"
- Else = "Best Seller"

### 3.3 Products List Endpoint
**File:** `/Users/ezekaj/Desktop/Projects/mobial/src/app/api/products/route.ts` (~155 lines)

**Route:** `GET /api/products`

**Rate Limiting:** `checkRateLimit(clientIP, 'api:products', {windowMs: 60000, maxRequests: 100})`

**Query Parameters:**
```typescript
{
  country?: string;          // Filter by country
  region?: string;           // Filter by region
  provider?: string;         // Filter by provider
  search?: string;           // Search in name, provider, countries
  minPrice?: number;         // Price range filter
  maxPrice?: number;         // Price range filter
  category?: string;         // Category filter (defaults to 'esim_realtime')
  productFamilyId?: string;  // Exact match on productFamilyId
  sortBy?: string;           // Options: price_asc (default), price_desc, name, createdAt, rank
  limit?: number;            // Max 50, default varies
  offset?: number;           // Pagination offset
}
```

**Filtering Logic (Prisma where clause):**
```typescript
{
  isActive: true,
  externallyShown: true,
  category: category || 'esim_realtime',
  ...(productFamilyId && { productFamilyId }),
  ...(country && { countries: { contains: country } }),
  ...(region && { regions: { contains: region, mode: 'insensitive' } }),
  ...(provider && { provider }),
  ...(search && {
    OR: [
      { name: { contains: search, mode: 'insensitive' } },
      { provider: { contains: search, mode: 'insensitive' } },
      { countries: { contains: search } }
    ]
  }),
  ...(minPrice && { price: { gte: minPrice } }),
  ...(maxPrice && { price: { lte: maxPrice } })
}
```

**Sort Options:**
- `price_asc` (default)
- `price_desc`
- `name`
- `createdAt`
- `rank` (penalizedRank field)

**Response Fields Selected:**
- id, name, slug, provider, price, originalPrice, dataAmount, dataUnit, isUnlimited, validityDays, countries, regions, networks, providerLogo, speedInfo, networkType, activationPolicy, isActive, topUpAvailable, penalizedRank, category

**Response Structure:**
```typescript
{
  success: true,
  data: {
    products: formattedProducts,
    pagination: {
      total: number,
      limit: number,
      offset: number,
      hasMore: boolean
    }
  }
}
```

**Parallel Queries:** Products and count fetched concurrently via Promise.all

**Formatting:** Parses JSON strings for countries and regions arrays

**Cache Control:** `'public, s-maxage=300, stale-while-revalidate=600'` (5-min cache, 10-min stale)

### 3.4 Product Sync (Admin) Endpoint
**File:** `/Users/ezekaj/Desktop/Projects/mobial/src/app/api/products/sync/route.ts` (~95 lines)

**Route:** `POST /api/products/sync`

**Authentication:** Admin-only via `requireAdmin(request)`

**Rate Limiting:** `checkRateLimit(user.id, 'admin:product-sync', {windowMs: 3600000, maxRequests: 3})`
- Maximum 3 syncs per hour per admin user

**Process:**
1. Call `syncProductsFromMobimatter()` service function
2. Log audit events for sync start and completion
3. Update systemConfig with key `'last_product_sync'` storing ISO timestamp
4. Return statistics structure

**Response:**
```typescript
{
  message: 'Products synced successfully',
  stats: {
    created: number,
    updated: number,
    skipped: number,
    totalProcessed: number,
    errors?: string[] // if any
  }
}
```

**Error Handling:**
- 500 if sync failed with result.success === false

### 3.5 Countries List Endpoint
**File:** `/Users/ezekaj/Desktop/Projects/mobial/src/app/api/products/countries/route.ts` (~30 lines)

**Route:** `GET /api/products/countries`

**Authentication:** Not required

**Rate Limiting:** None specified

**Process:**
- Calls `getAvailableCountries()` service function

**Response Structure:**
```typescript
{
  countries: Array<{
    code: string,
    name: string,
    productCount: number
  }>
}
```

**Cache Control:** `'public, s-maxage=3600, stale-while-revalidate=7200'` (1-hour cache, 2-hour stale)

### 3.6 Product Detail Endpoint
**File:** `/Users/ezekaj/Desktop/Projects/mobial/src/app/api/products/[id]/route.ts` (~45 lines)

**Route:** `GET /api/products/[id]`

**Parameter:** id (Product ID, slug, or MobiMatter ID)

**Authentication:** Not required

**Process:**
- Calls `getProductById(id)` service function
- Supports multiple lookup methods (ID, slug, MobiMatter ID)

**Response Structure:**
```typescript
{
  success: true,
  data: {
    product: ProductDetails
  }
}
```

**Error Handling:**
- 404 if product not found

**Cache Control:** `'public, s-maxage=3600, stale-while-revalidate=7200'` (1-hour cache)

---

## Key Architectural Patterns

### Soft Delete Pattern
- Used across all user/order records
- Marked with `deletedAt` timestamp and status flags
- Queries always exclude soft-deleted records
- Never perform hard deletes on data

### Token Storage Strategy
- **Temporary tokens** (email verification, password reset, 2FA setup):
  - Stored in `systemConfig` table
  - Key format: `{type}_token:{userId}` or generic identifier
  - Value: JSON with token, expiresAt, and optional metadata
  - Automatic cleanup after verification
  - Timestamp-based expiry (24h for email, 1h for password, 10m for 2FA setup)

- **Session tokens** (refresh tokens):
  - Stored in `sessions` table
  - 7-day expiry
  - Associated with userAgent and ipAddress
  - Multiple sessions per user (one per device)

### Validation Strategy
- All endpoints use Zod schemas
- Input validation on all POST/PATCH requests
- Type-safe responses

### Rate Limiting
- Per IP address for public endpoints (auth, checkout)
- Per user ID for authenticated actions
- Per user ID with hourly window for admin functions

### Audit Logging
- All authentication actions logged
- Includes: userId, action, entity, entityId, oldValues, newValues
- Supports historical tracking of password changes, account modifications, login attempts

### Security Measures
- Password strength validation on registration and reset
- Account lockout after failed attempts
- 2FA with TOTP and backup codes
- Backup code hashing (never stored in plaintext)
- All sessions invalidated on password reset
- Email verification for new accounts
- Rate limiting on sensitive endpoints

---

## Dependencies Summary

**Runtime:**
- `stripe` ^20.4.1 - Payment processing
- `@prisma/client` ^6.11.1 - Database ORM
- Radix UI components - UI primitives
- React Hook Form + Zod - Form validation
- Next.js ^16.1.1 - Framework

**Development:**
- TypeScript ^5
- Vitest - Testing framework
- Tailwind CSS ^4
- ESLint - Code linting

---

## Environment Variables Required

- `STRIPE_SECRET_KEY` - Stripe API key
- `STRIPE_WEBHOOK_SECRET` - For webhook signature verification
- `NEXT_PUBLIC_BASE_URL` - Frontend URL for redirects
- `MOBIMATTER_MERCHANT_ID` - B2B API merchant ID
- `MOBIMATTER_API_KEY` - B2B API key
- Database connection string (SQLite)
- Email service credentials (for sending verification/reset/welcome emails)

---

## Testing Approach

- Vitest configured for unit testing
- Run with: `npm run test` (once) or `npm run test:watch` (watch mode)
- Coverage available: `npm run test:coverage`

---

## Deployment & Build

**Scripts:**
- `npm run dev` - Local development (port 3000)
- `npm run build` - Production build with static file optimization
- `npm run start` - Run production server
- `npm run db:push` - Apply schema changes
- `npm run db:migrate` - Create new migration
- `npm run seed:admin` - Seed admin account
- `npm run sync:products` - Sync products from MobiMatter API

**Build Process:**
- Next.js standalone output
- Static files copied to `.next/standalone`
- Runs on Bun runtime
