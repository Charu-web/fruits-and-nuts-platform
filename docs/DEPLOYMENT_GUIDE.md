# M/S Fruits & Nuts — Production Deployment & Infrastructure Guide
**Document:** `docs/DEPLOYMENT_GUIDE.md`  
**Version:** 1.0 (Production Ready)  
**Target Environments:** Vercel (Edge & Serverless), AWS ECS/Amplify, Supabase PostgreSQL, Redis.

---

## 1. System Architecture Overview

```
                                  [ Internet / CDN ]
                                          │
                                 (Cloudflare / Vercel Edge)
                                          │
                        ┌─────────────────┴─────────────────┐
                        │                                   │
              [ Next.js 15 App Router ]           [ S3 Media Storage ]
             (Storefront + Admin Portal)        (CDN Cached Product Images)
                        │
       ┌────────────────┼────────────────┐
       │                │                │
[ Supabase / RDS ]  [ Redis Cache ] [ Razorpay Gateway ]
 (PostgreSQL 15)  (Rate Limiting)   (Signature Verified Webhooks)
```

---

## 2. Environment Variables (.env.production)

Configure the following environment variables in your production environment settings (Vercel Project Settings or AWS Parameter Store):

```env
# Application Runtime
NODE_ENV="production"
PORT=3000
NEXT_PUBLIC_APP_URL="https://fruitsandnuts.in"

# Database (PostgreSQL Connection Pooling)
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:6543/postgres?pgbouncer=true&sslmode=require"
DIRECT_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?sslmode=require"

# Redis Cache
REDIS_URL="rediss://default:[PASSWORD]@[HOST]:6379"

# Authentication & Security (Generate: openssl rand -hex 32)
AUTH_SECRET="your_high_entropy_32_byte_hex_key_here"
JWT_EXPIRY_SECONDS=604800
CRON_SECRET="your_cron_worker_authorization_bearer_token"

# Razorpay Payment Gateway (Live Keys)
PAYMENT_PROVIDER="RAZORPAY"
RAZORPAY_KEY_ID="rzp_live_xxxxxxxxxxxxxxxx"
RAZORPAY_KEY_SECRET="xxxxxxxxxxxxxxxxxxxxxxxx"
RAZORPAY_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxxxxxxxxx"
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_live_xxxxxxxxxxxxxxxx"

# Logistics Provider
LOGISTICS_PROVIDER="BLUEDART" # BLUEDART | DELHIVERY | SHIPROCKET
LOGISTICS_API_TOKEN="your_production_courier_api_token"

# S3-Compatible Media Storage
STORAGE_PROVIDER="S3_COMPATIBLE"
STORAGE_ENDPOINT="https://s3.ap-south-1.amazonaws.com"
STORAGE_BUCKET_NAME="fruits-and-nuts-production-media"
STORAGE_ACCESS_KEY="AKIAXXXXXXXXXXXXXXXX"
STORAGE_SECRET_KEY="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Analytics
NEXT_PUBLIC_GA4_MEASUREMENT_ID="G-XXXXXXXXXX"
```

---

## 3. Database Migration & Provisioning

### A. Managed PostgreSQL Provisioning (Supabase / AWS RDS / Neon)
1. **Engine Version:** PostgreSQL 15 or 16+ with SSL enabled (`sslmode=require`).
2. **Connection Pooling vs. Direct URL:**
   - **`DATABASE_URL` (Runtime Application Traffic):** Point to the transactional connection pooler (e.g. Supabase PgBouncer on port `6543` with `?pgbouncer=true&sslmode=require`). This prevents serverless connection exhaustion across Next.js API routes.
   - **`DIRECT_URL` (Prisma CLI Migrations):** Point directly to the PostgreSQL database instance (port `5432` with `?sslmode=require`). Direct connections are required for advisory locks and DDL schema migrations.
3. **Dashboard Configuration (e.g. Vercel Project Settings > Environment Variables):**
   - Add `DATABASE_URL` and `DIRECT_URL` for `Production` and `Preview` environments.
   - **Security Rule:** Never commit real database connection URIs to Git, pull requests, logs, or screenshots.

### B. Applying Migrations

Execute the following commands against your live PostgreSQL database:

```bash
# 1. Verify connection and current migration status
npx prisma migrate status

# 2. Case A: Fresh Production Database
# Applies the non-destructive baseline migration (30 models, 10 enums, foreign keys, indexes)
npx prisma migrate deploy

# 2. Case B: Existing Database (If tables were previously pushed without migrations)
# Mark the baseline migration as already applied without attempting to recreate existing tables:
npx prisma migrate resolve --applied 20261007000000_init

# 3. Seed initial RBAC roles and official 10-category taxonomy (Safe & Idempotent)
npm run prisma:seed
# Or alternatively:
npx prisma db seed
```

### C. Seed Safety & Idempotency Guarantee
The foundation seeder (`src/database/seed.ts`) uses strict `upsert` operations:
- It creates or updates the 5 core system roles (`SUPER_ADMIN`, `INVENTORY_MGR`, `ORDER_MGR`, `CONTENT_MGR`, `CUSTOMER`).
- It provisions the 10 official root category taxonomy nodes and subcategories.
- It will **never** duplicate records, delete customer data, alter order histories, or modify existing product prices.

---

## 4. Build & Production Verification Pipeline

Run the automated verification suite before triggering production deployment:

```bash
# 1. Static TypeScript Typecheck
npx tsc --noEmit

# 2. Automated Test Suites (Financial, Orders, Payments, Coupons)
npm run test:all

# 3. Next.js Production Build
npm run build
```

---

## 5. Background Cron Job Configuration

To automatically release abandoned 30-minute stock holds, configure a scheduled job to trigger:

- **Endpoint:** `POST https://fruitsandnuts.in/api/v1/cron/cleanup-orders`
- **Schedule:** Every 15 minutes (`*/15 * * * *`)
- **Headers:**
  ```http
  Authorization: Bearer <CRON_SECRET>
  Content-Type: application/json
  ```

### Vercel Cron (`vercel.json`) Configuration:
```json
{
  "crons": [
    {
      "path": "/api/v1/cron/cleanup-orders",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

---

## 6. SSL & Custom Domain Verification

1. **DNS Records (Cloudflare / Namecheap / GoDaddy):**
   - Type: `CNAME` | Name: `www` | Content: `cname.vercel-dns.com`
   - Type: `A` | Name: `@` | Content: `76.76.21.21`
2. **Dynamic Sitemap:**
   - Submit `https://fruitsandnuts.in/sitemap.xml` directly to Google Search Console.
   - Dynamic sitemap automatically indexes all categories, subcategories, products, and informational pages.
3. **Robots.txt:**
   - Automatically accessible at `https://fruitsandnuts.in/robots.txt` with disallowed `/admin` and private checkout paths.
