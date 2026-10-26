# BACKEND FOUNDATION & DATABASE SETUP GUIDE
## M/S Fruits & Nuts — Enterprise E-Commerce Platform
**Document Version:** 1.0.0 (Phase 9A Developer Architecture Guide)  
**Status:** COMPLETE & VERIFIED  
**Domain:** `https://www.fruitsandnuts.co.in/`  
**Author:** Senior Freelance Product Consultant, Lead Business Analyst & Principal Systems Architect  

---

## 1. BACKEND FOUNDATION ARCHITECTURE OVERVIEW

Phase 9A implements the foundational core for the **M/S Fruits & Nuts** backend, establishing clean separation of concerns, strict type-safety, centralized environment validation, singleton database connectivity, transaction management with pessimistic row-locking, structured logging with secret redaction, and standardized API response envelopes.

```
src/
├── config/
│   ├── env.ts                   # Centralized Zod schema environment validator
│   └── index.ts
├── database/
│   ├── db.ts                    # Singleton PrismaClient connection manager
│   ├── transactions.ts          # Managed transactions & pessimistic row locks
│   ├── seed.ts                  # Idempotent seed script (Roles & 10 Root Categories)
│   └── index.ts
├── lib/
│   ├── errors/
│   │   ├── error-codes.ts       # Centralized ErrorCode enum & HTTP status map
│   │   ├── app-error.ts         # AppError class with static factory constructors
│   │   └── index.ts
│   ├── api-response.ts          # Standardized JSON response envelopes (apiSuccess, apiError)
│   ├── request-context.ts       # Correlation ID & x-request-id header extraction
│   ├── validation.ts            # Centralized Zod validation & Indian e-commerce schemas
│   └── logger.ts                # Structured JSON logger with auto-redaction
├── app/
│   └── api/
│       └── health/
│           └── route.ts         # Minimal Liveness & Readiness probe (GET /api/health)
└── test/
    └── health-check.test.ts     # Automated unit test suite for foundation modules
```

---

## 2. DATABASE & ORM CONFIGURATION

### Database Engine: PostgreSQL 16+
- **Prisma Schema (`prisma/schema.prisma`):** Implements all 26 relational entities defined in Phase 8 across 7 core operational domains:
  1. **Identity & Access:** `Role`, `User`, `Profile`, `Address`
  2. **Product Catalog:** `Category`, `Subcategory`, `Product`, `ProductVariant`, `ProductImage`
  3. **Inventory Control:** `Inventory`, `InventoryTransaction`
  4. **Commerce & Orders:** `Cart`, `CartItem`, `Wishlist`, `Order`, `OrderItem`, `OrderStatusHistory`
  5. **Payments & Logistics:** `Payment`, `Refund`, `Shipment`
  6. **Discovery & Marketing:** `Coupon`, `CouponUsage`, `Review`, `TasteMapRegion`, `TasteMapAssociation`, `StoreLocation`
  7. **CMS & Governance:** `CMSSection`, `Notification`, `AuditLog`

---

## 3. ENVIRONMENT CONFIGURATION

### `.env.example` vs `.env.local`
- Secrets are **never** committed to version control.
- Configuration variables are validated at runtime via `src/config/env.ts` using **Zod**.

```bash
# PostgreSQL Connection Strings
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fruits_and_nuts?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/fruits_and_nuts?schema=public"

# Auth Secrets
AUTH_SECRET="your-32-byte-hex-encoded-secret"
JWT_EXPIRY_SECONDS=604800

# Provider Placeholders
PAYMENT_PROVIDER="GENERIC_ADAPTER"
LOGISTICS_PROVIDER="GENERIC_ADAPTER"
```

---

## 4. DATABASE TRANSACTIONS & CONCURRENCY FOUNDATION

### Transaction Runner (`src/database/transactions.ts`)
```typescript
import { runTransaction, acquireVariantRowLocks } from "@/database";

// Managed transaction execution with Repeatable Read isolation
await runTransaction(async (tx) => {
  // 1. Acquire exclusive row-level lock (SELECT ... FOR UPDATE)
  await acquireVariantRowLocks(tx, [variantId1, variantId2]);

  // 2. Perform atomic inventory deduction and order creation
  // ...
});
```

---

## 5. ERROR HANDLING & STANDARDIZED API RESPONSES

### Error Model (`src/lib/errors/`)
- All operational errors throw instances of `AppError` mapped to standard HTTP codes:
  - `ErrorCode.VALIDATION_ERROR` (400)
  - `ErrorCode.AUTHENTICATION_ERROR` (401)
  - `ErrorCode.AUTHORIZATION_ERROR` (403)
  - `ErrorCode.NOT_FOUND` (404)
  - `ErrorCode.CONFLICT` (409)
  - `ErrorCode.INSUFFICIENT_STOCK` (409)
  - `ErrorCode.RATE_LIMITED` (429)
  - `ErrorCode.INTERNAL_ERROR` (500)

### Response Envelopes (`src/lib/api-response.ts`)
```typescript
// Success Response (HTTP 200)
{
  "success": true,
  "data": { ... },
  "meta": { "requestId": "req_1728240000_abc123" }
}

// Error Response (HTTP 4xx / 5xx)
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Product with identifier 'ALM-001' was not found",
    "requestId": "req_1728240000_abc123"
  }
}
```

---

## 6. STRUCTURED LOGGING & DATA REDACTION

- Logs are emitted in structured JSON format with automatic masking of sensitive keys (`password`, `token`, `secret`, `cvv`, `otp`, `twoFactorSecret`).

```json
{
  "timestamp": "2026-10-07T00:25:00.000Z",
  "level": "INFO",
  "message": "Database query completed",
  "environment": "development",
  "context": { "requestId": "req_123" }
}
```

---

## 7. MINIMAL HEALTH CHECK ENDPOINT

### `GET /api/health`
- **Liveness Probe:** `GET /api/health?type=liveness` $\longrightarrow$ Returns uptime and process status.
- **Readiness Probe:** `GET /api/health?type=readiness` $\longrightarrow$ Executes `SELECT 1;` against PostgreSQL to verify connectivity without leaking database connection strings.

---

## 8. SEEDING PROTOCOL (IDEMPOTENT & ZERO INVENTED DATA)

```bash
# Execute idempotent seed
npm run prisma:seed
```
- **Seeded Data:**
  - 5 System RBAC Roles: `SUPER_ADMIN`, `INVENTORY_MGR`, `ORDER_MGR`, `CONTENT_MGR`, `CUSTOMER`.
  - 10 Root Category Taxonomy Nodes: `Dry Fruits`, `Dates / Khajoor`, `Artisan Tea`, `Super Seeds`, `Gourmet Chocolates`, `Royal Mouth Fresheners`, `Value Combos`, `Luxury Gifting`, `Fruits & Nuts`, `Specialty Products`.
- **Zero Inventions:** No prices, SKUs, product descriptions, store hours, or Taste Map regional claims are fabricated.

---

## 9. DEVELOPER CLI COMMANDS

| Command | Action |
| :--- | :--- |
| `npm run type-check` | Executes TypeScript strict type verification across all modules. |
| `npm run prisma:generate` | Compiles Prisma Client from `prisma/schema.prisma`. |
| `npm run prisma:seed` | Runs idempotent seed script (`src/database/seed.ts`). |
| `npm run test:health` | Runs unit test suite for AppError, Validation, and Environment modules. |
| `npm run dev` | Boots local Next.js development server at `http://localhost:3000`. |

---
*Phase 9A Complete. Awaiting Phase 9B instructions.*
