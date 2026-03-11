# 🚀 MobiaL eSIM Platform - Deployment Guide

## ⚡ Quick Start (Development)

```bash
# 1. Install dependencies
bun install

# 2. Set up environment
cp .env.example .env.local

# 3. Initialize database
export DATABASE_URL="file:./dev.db"
bun run db:push
bun run db:generate

# 4. Create admin user
bun run seed:admin

# 5. Start development server
bun run dev
```

Access:
- **Homepage:** http://localhost:3000
- **Admin Panel:** http://localhost:3000/admin
- **Login:** admin@mobialo.eu / Admin123!

---

## 📦 Production Deployment

### Prerequisites

1. **Database** - PostgreSQL recommended (SQLite for small deployments)
2. **Domain** - Configure DNS for your domain
3. **SSL Certificate** - Required for production
4. **MobiMatter Account** - Get API credentials from https://mobimatter.com

### Step 1: Environment Setup

```bash
# Copy production template
cp .env.production.template .env.production

# Edit with your values
nano .env.production
```

**Required Variables:**
```env
DATABASE_URL="postgresql://user:pass@host:5432/dbname"
JWT_SECRET="generate-with-openssl-rand-hex-32"
ENCRYPTION_KEY="generate-with-openssl-rand-hex-32"
MOBIMATTER_MERCHANT_ID="your-id"
MOBIMATTER_API_KEY="your-key"
NEXT_PUBLIC_BASE_URL="https://yourdomain.com"
```

### Step 2: Database Setup

```bash
# For PostgreSQL
export DATABASE_URL="postgresql://..."
bun run db:push
bun run db:generate

# Create admin user
bun run seed:admin
```

### Step 3: Build Application

```bash
bun run build
```

### Step 4: Sync Products

```bash
export MOBIMATTER_MERCHANT_ID="your-id"
export MOBIMATTER_API_KEY="your-key"
bun run sync:products
```

### Step 5: Start Production Server

```bash
bun run start
```

---

## 🔧 Platform Configuration

### MobiMatter Integration

1. Sign up at https://mobimatter.com
2. Get your Merchant ID and API Key
3. Add to `.env.production`:
   ```env
   MOBIMATTER_MERCHANT_ID="your-merchant-id"
   MOBIMATTER_API_KEY="your-api-key"
   ```
4. Sync products: `bun run sync:products`

### Payment Processing

**Stripe Setup:**
1. Create account at https://stripe.com
2. Get API keys from Dashboard
3. Add to `.env.production`:
   ```env
   STRIPE_SECRET_KEY="sk_live_..."
   STRIPE_PUBLISHABLE_KEY="pk_live_..."
   STRIPE_WEBHOOK_SECRET="whsec_..."
   ```

**Note:** Payment integration needs to be implemented. Currently orders are created but not processed.

### Email Configuration

**Resend (Recommended):**
1. Sign up at https://resend.com
2. Get API key
3. Add to `.env.production`:
   ```env
   RESEND_API_KEY="re_..."
   EMAIL_FROM="noreply@yourdomain.com"
   ```

**Note:** Email system needs to be implemented for:
- Order confirmations
- Password resets
- Email verification

---

## 📊 Admin Operations

### Create Admin User
```bash
bun run seed:admin
```

### Sync Products
```bash
bun run sync:products
```

### View Database
```bash
bunx prisma studio
```

---

## 🔒 Security Checklist

Before going live:

- [ ] Change default admin password
- [ ] Generate secure JWT_SECRET (32+ chars)
- [ ] Generate secure ENCRYPTION_KEY (64 hex chars)
- [ ] Enable HTTPS/SSL
- [ ] Set up firewall rules
- [ ] Configure rate limiting
- [ ] Enable database backups
- [ ] Set up error monitoring (Sentry)
- [ ] Configure logging
- [ ] Test payment flow
- [ ] Test email delivery
- [ ] Review CORS settings
- [ ] Enable security headers

---

## 📈 Monitoring & Maintenance

### Logs
- Dev logs: `dev.log`
- Server logs: `server.log`

### Database Backups
```bash
# SQLite
cp dev.db dev.db.backup.$(date +%Y%m%d)

# PostgreSQL
pg_dump dbname > backup.sql
```

### Health Check
```bash
curl https://yourdomain.com/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "checks": {
    "database": { "status": "up" },
    "environment": { "status": "configured" }
  }
}
```

---

## 🆘 Troubleshooting

### No Products Showing
```bash
# Check MobiMatter credentials
echo $MOBIMATTER_MERCHANT_ID
echo $MOBIMATTER_API_KEY

# Re-sync products
bun run sync:products
```

### Can't Login to Admin
```bash
# Re-create admin user
bun run seed:admin
```

### Database Errors
```bash
# Reset database (WARNING: deletes all data!)
bun run db:reset
bun run seed:admin
bun run sync:products
```

---

## 📞 Support

- **Documentation:** `/README.md`
- **API Docs:** `/mobimatter_api_intro.json`
- **Issues:** Check server logs

---

**Last Updated:** March 2026
**Version:** 0.2.0
