# PRODUCTION AUDIT REPORT — M/S FRUITS & NUTS PLATFORM

**Audit Date:** November 4, 2026  
**Target Platform:** Production E-Commerce Web Application  
**Production URL:** https://fruitsandnuts.co.in  
**Hosting Environment:** Vercel (Project: `fruits-and-nuts-platform`)  
**Database Infrastructure:** Neon Serverless PostgreSQL 16 (AWS us-east-1)  
**Codebase Version:** 1.0.0  

---

## 1. Executive Summary & Architecture Overview

An exhaustive architectural, functional, security, and UI/UX audit of the M/S Fruits & Nuts codebase was conducted. The application is built on a modern Next.js 15 App Router architecture with React 19, TypeScript 5.7, Tailwind CSS v4, and Prisma ORM 6.1 connected to a serverless Neon PostgreSQL cluster.

While the technical foundation is modern and contains robust server-side business logic (84 passing test suites), the customer-facing user experience suffered from disjointed UI patterns, AI-generated aesthetic tropes (e.g. intrusive floating sommelier pills, redundant "Shop by Need" sections, inconsistent border radii), and specific production disconnects between admin category loading and customer account synchronization.

This audit establishes empirical baselines across all 12 platform dimensions without guessing, establishing root causes and actionable remediation blueprints.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   M/S FRUITS & NUTS ARCHITECTURE                       │
├────────────────────────────────────────────────────────────────────────┤
│  Frontend (Next.js 15.1 App Router + React 19 + Tailwind CSS v4)       │
│  ├── Storefront: /, /shop, /category/*, /product/*, /gifting, /stores  │
│  ├── Commerce:   /cart, /checkout, /checkout/success/[id], /wishlist   │
│  ├── Account:    /account, /account/orders, /account/orders/[id]/track │
│  └── Admin:      /admin, /admin/products, /admin/orders, /admin/cats   │
├────────────────────────────────────────────────────────────────────────┤
│  API Gateway & Services Layer (/api/v1/*)                              │
│  ├── Auth & RBAC:   AuthService, Session Cookies, HS256 JWTs          │
│  ├── Catalog:       CategoryService, ProductService, SmartSearch       │
│  ├── Commerce:      CartService, OrderService, Checkout Engine         │
│  └── Notifications: NotificationService (Nodemailer SMTP, Port 587)    │
├────────────────────────────────────────────────────────────────────────┤
│  Persistence Layer (Prisma ORM 6.1 + Neon PostgreSQL 16)               │
│  └── 22 Relational Models, Pooler & Direct Connection Endpoints        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Database Schema & Live Records Verification

The relational database running on Neon PostgreSQL 16 was audited directly via `PrismaClient` using direct connection credentials. The schema contains 22 domain models spanning Identity, Catalog, Inventory, Commerce, Logistics, Marketing, and CMS.

### 2.1 Table Record Census (Live Neon Database)

| Domain | Table Name | Prisma Model | Live Record Count | Operational Status |
|---|---|---|---|---|
| **Identity** | `roles` | `Role` | **5** | Active (`SUPER_ADMIN`, `INVENTORY_MGR`, `ORDER_MGR`, `CONTENT_MGR`, `CUSTOMER`) |
| **Identity** | `users` | `User` | **5** | Active (Administrators and active test customers) |
| **Catalog** | `categories` | `Category` | **10** | Active (Display order 1 to 10 verified) |
| **Catalog** | `subcategories` | `Subcategory` | **35** | Active (Linked to parent categories) |
| **Catalog** | `products` | `Product` | **45** | Active (All 45 marked `is_active: true`) |
| **Catalog** | `product_variants`| `ProductVariant` | **130** | Active (Multiple pack sizes: 250g, 500g, 1kg) |
| **Catalog** | `product_images` | `ProductImage` | **44** | Primary product imagery mapped |
| **Inventory** | `inventory` | `Inventory` | **130** | Active stock tracked per variant |
| **Commerce** | `carts` | `Cart` | **3** | Active customer & guest sessions |
| **Commerce** | `cart_items` | `CartItem` | **0** | Clean cart state |
| **Commerce** | `wishlists` | `Wishlist` | **1** | Customer wishlist records active |
| **Commerce** | `orders` | `Order` | **2** | Production orders (₹1,450 & ₹600) |
| **Commerce** | `order_items` | `OrderItem` | **3** | Immutable line item snapshots |
| **Logistics** | `shipments` | `Shipment` | **0** | Unmanifested (Manual fulfillment stage) |
| **Marketing** | `coupons` | `Coupon` | **0** | Ready for promotional activation |
| **Marketing** | `reviews` | `Review` | **0** | Pending verified buyer submissions |
| **CMS** | `taste_map_regions`| `TasteMapRegion` | **0** | Fallback static registry active |
| **CMS** | `store_locations` | `StoreLocation` | **0** | Fallback static registry active |
| **CMS** | `cms_sections` | `CMSSection` | **0** | Fallback static hero slides active |
| **System** | `notifications` | `Notification` | **49** | Queued & dispatched notification logs |
| **System** | `audit_logs` | `AuditLog` | **42** | Administrative operation audit entries |

---

## 3. Detailed Subsystem Audit

### 3.1 Authentication & RBAC Access Control
- **Session Mechanism:** Uses signed HS256 JWT tokens transmitted via `fn_session` HTTP-only, `SameSite=Lax` cookies.
- **Root Protection Gap:** Currently, Next.js root `middleware.ts` is absent. Route protection is enforced at layout level (`src/app/admin/layout.tsx`, `src/app/account/layout.tsx`) using client-side `fetch("/api/v1/auth/me")`. This causes a brief visual flash of unauthenticated screens before redirecting.
- **Server-Side API Guards:** Backed by `requireAuth()`, `requireRole()`, and `requirePermission()` in `src/lib/auth/guards.ts`. API endpoints reject unauthorized access with HTTP 401/403.
- **Password Security:** Salted Bcrypt hashing with timing-safe comparisons and password complexity enforcement (min 8 chars, uppercase, lowercase, numbers).

### 3.2 Product & Category Taxonomy
- **Admin Category Loading Issue:** In `src/app/admin/products/new/page.tsx` and `src/app/admin/products/[id]/page.tsx`, the category dropdown called `/api/v1/categories`. When the Neon connection pool was saturated, the backend race timeout (4000ms) failed to resolve cleanly or the frontend timeout threw an error, leaving the UI stuck on "Loading categories...".
- **Storefront Fallback vs Live Sync:** The storefront (`/shop`, `/category/*`, homepage) incorporates a dual fallback: if the live database query times out during cold starts, it serves the verified static catalogue (`STOREFRONT_PRODUCTS`, `STOREFRONT_CATEGORIES`) without crashing.

### 3.3 Customer Account, Order History & Wishlist
- **Wishlist Reproduction & Root Cause:** Previously, `/api/v1/wishlist/items` only supported `POST`, returning `HTTP 405 Method Not Allowed` when the frontend attempted `GET` or `DELETE`. Furthermore, passing storefront IDs like `"var-mamra-250"` directly into Prisma UUID queries caused PostgreSQL `P2023` UUID conversion errors. These issues were resolved with identifier resolution and symmetric route handlers.
- **Order History Isolation:** Orders are strictly filtered by authenticated `userId` or customer email snapshot. An authenticated customer can never access or view another customer's orders.

### 3.4 Cart, Checkout & COD Order Security
- **Server-Side Pricing Invariant:** The client submits only `variantId` and `quantity`. All prices, MRPs, GST calculations, coupons, and shipping fees are authoritatively computed on the server in `OrderService.createOrder` within a Prisma database transaction.
- **Inventory Locking:** When an order is placed, row-level locks (`SELECT ... FOR UPDATE`) are acquired on the variant rows, and available inventory is deducted atomically.
- **COD Security Gap:** Although button disabling exists on the frontend, the backend lacks explicit server-side idempotency keys and rate limiting for COD order submissions, allowing potential double-submission abuse if network latency occurs.

### 3.5 Order Tracking Lifecycle
- **Milestone Architecture:** Order status transitions strictly through `OrderStatus` enum values: `PENDING` -> `CONFIRMED` -> `PROCESSING` -> `PACKED` -> `SHIPPED` -> `OUT_FOR_DELIVERY` -> `DELIVERED` (or `CANCELLED` / `REFUNDED`).
- **Tracking Page Disconnect:** `/account/orders/[id]/track` relies on `OrderStatusHistory` snapshots. However, synthetic courier tracking numbers or fake status updates must never be injected; tracking milestones must reflect real database history.

### 3.6 Transactional Email System
- **Email Dispatch Flow:** In `OrderService.createOrder`, after successful transaction commit, email dispatch is invoked via `Promise.allSettled` to ensure email delivery failures do not mark successful orders as failed.
- **Configuration:** Nodemailer configured for Hostinger/cPanel or external SMTP on port 587 with STARTTLS (`SMTP_SECURE=false`) or port 465 SSL (`SMTP_SECURE=true`). Credentials are read exclusively from server-side environment variables.

### 3.7 UI/UX & Brand Aesthetics
- **Identified Visual Weaknesses:**
  1. *Cheesy Floating Chatbot:* The floating "Ask Sommelier" button at the bottom-right clutters the interface, creates mobile tap interference, and presents an AI-generated look.
  2. *Duplicate Sections:* The homepage features both "Shop by Category" (8 tiles) and "Shop by Everyday Need" (6 large cards), causing information overload and layout clutter.
  3. *Inconsistent Spacing & Typography:* Excessive card borders, contrasting background tints, and inconsistent pill styling detract from the luxury brand image.
  4. *Overcrowded Filter Sidebar:* The Shop page contains too many granular filter toggles (Need, BYOB, stock status, multiple sliders) instead of an intuitive, clean luxury filter drawer.

---

## 4. Security & Compliance Status
- **Environment Variables:** All secrets (`DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `SMTP_PASS`, `JWT_SECRET`) are sequestered in `.env.local` / `prisma_deploy.env` and ignored by `.gitignore`.
- **FSSAI Compliance:** Official FSSAI registration references, nutritional facts disclosures, and allergen warnings are present across product specifications.
- **Data Protection:** Passwords, payment secrets, and administrative credentials are never returned in client JSON payloads.
