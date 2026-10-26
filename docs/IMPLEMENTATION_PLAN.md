# IMPLEMENTATION BACKLOG & PRIORITIZED ROADMAP
**Document:** `docs/IMPLEMENTATION_PLAN.md`  
**Reference Document:** `docs/PROPOSAL_REQUIREMENTS_AUDIT.md`  
**Project:** M/S Fruits & Nuts E-Commerce Platform

---

## Priority Ordering & Engineering Rules

1. **Strict Change Control:** Preserve all existing pages, components, photography, and test suites.
2. **One Feature at a Time:** Complete implementation, verify with tests, compile with `npx tsc --noEmit`, confirm in browser, and commit before advancing.
3. **Developer-Owned Progress:** Proceed independently on developer tasks without blocking on client inputs.

---

## Track 1: Runtime Errors & Critical Defects (Highest Priority)

- [x] **TASK-01: Fix App Router Error Component Refresh Loop**
  - **Status:** `COMPLETED & VERIFIED`
  - **Resolution:** Added `src/app/global-error.tsx`, `src/app/error.tsx`, and `src/app/not-found.tsx`. Added database connection resilience fallback in `src/services/cms.service.ts`. Verified 0 reload loops in headless Chrome across all routes.

---

## Track 2: Security, Payment, Order & Inventory Systems

- [x] **TASK-02: Server-Side Financial & GST Arithmetic Enforcement**
  - **Status:** `COMPLETED & VERIFIED`
  - **Test Suite:** `src/test/cart.test.ts` & `src/test/order.test.ts` (All passed).
- [x] **TASK-03: Razorpay Payment Signature Verification & Idempotent Webhooks**
  - **Status:** `COMPLETED & VERIFIED`
  - **Test Suite:** `src/test/payment.test.ts` (10/10 passed).
- [x] **TASK-04: Automated Order Expiry Worker / Cron Route Security**
  - **Status:** `COMPLETED & VERIFIED`
  - **Evidence:** Enforced CRON_SECRET token authorization via Bearer header or x-cron-secret, added production environment configuration check in `src/app/api/v1/cron/cleanup-orders/route.ts`, added database resilience fallback in `src/services/order.service.ts`, and verified 30-minute stock hold release timeout logic via unit test suite (`src/test/order.test.ts` Test 9 & Test 10).

---

## Track 3: Missing Proposal Storefront Features

- [x] **TASK-05: Missing Informational Pages (`/about`, `/contact`, `/faq`)**
  - **Status:** `COMPLETED & VERIFIED`
  - **Evidence:** Created `src/app/about/page.tsx`, `src/app/contact/page.tsx`, `src/app/faq/page.tsx`, and updated `src/components/layout/footer.tsx`. All verified in Chrome with HTTP 200.
- [x] **TASK-06: "Shop by Need" Curated Discovery Section**
  - **Status:** `COMPLETED & VERIFIED`
  - **Evidence:** Created homepage Section B.5 "Shop by Everyday Need" and full catalog filter support in `src/components/catalog/product-listing-view.tsx`. Mapped 30 authoritative products in `src/lib/catalog/storefront-catalog.ts` across 6 curated needs (`wellness`, `fitness`, `family`, `office`, `tea`, `gifting`). Verified via automated Puppeteer tests and Next.js production build (82 routes).
- [x] **TASK-06B: Gift Box Customization & Occasion-Based Gifting Hub (`/build-your-own-box`, `/gifting`)**
  - **Status:** `COMPLETED & VERIFIED`
  - **Evidence:** Added authoritative bespoke box packaging variants to catalog (`prod-box-duo-02`, `prod-box-pine-04`, `prod-box-trunk-06`), interactive client-side occasion filtering grid with deep links, sleeve selection, wax-sealed calligraphy greeting note, cart drawer gift wrap badge, and checkout summary sync. Verified via Puppeteer screenshots and build.


---

## Track 4: Admin Functionality

- [x] **TASK-07: Customer Management Admin Module**
  - **Status:** `COMPLETED & VERIFIED`
  - **Evidence:** Created `src/services/customer.service.ts`, `src/app/api/v1/admin/customers/route.ts` (GET & PATCH), and back-office management UI `src/app/admin/customers/page.tsx`. Added sidebar navigation link in `src/app/admin/layout.tsx`. Supports KPI metrics (total registered, verified accounts, CLV, average spend), search by name/email/phone/city, status filtering, account suspension toggling, and delivery address drawer. Verified via headless Chrome Puppeteer testing (`verified_admin_customers_list.png`, `verified_admin_customers_modal.png`, `verified_admin_customers_search.png`) and Next.js production build (84 routes).
- [x] **TASK-08: Category & Subcategory Management Admin UI**
  - **Status:** `COMPLETED & VERIFIED`
  - **Evidence:** Added database resilience fallback categories in `src/services/category.service.ts`, enhanced `src/app/api/v1/admin/categories/route.ts` with development guard handling, built `src/app/admin/categories/page.tsx` with hierarchical accordion, expandable nested subcategories, KPI tiles (root categories, subcategories, cataloged SKUs, active status), create/edit modals with slug auto-generation, and real-time search filtering. Added sidebar navigation link in `src/app/admin/layout.tsx`. Verified via headless Chrome testing (`verified_admin_categories_list.png`, `verified_admin_categories_modal.png`, `verified_admin_categories_search.png`).
- [x] **TASK-09: Admin Settings & Role-Based Access UI**
  - **Status:** `COMPLETED & VERIFIED`
  - **Evidence:** Built `src/app/admin/settings/page.tsx` displaying store operating status (active/maintenance/holiday), announcement banner editor, financial thresholds (free delivery minimum cart value ₹1,999, standard air delivery flat fee ₹150, COD convenience surcharge ₹50, maximum allowable COD limit ₹5,000), administrative RBAC access matrix directory with 4 verified officers, company legal & GSTIN credentials (01AABCM1234F1Z5, FSSAI 11026001000892), and live payment gateway indicators. Added sidebar navigation link in `src/app/admin/layout.tsx`. Verified via headless Chrome testing (`verified_admin_settings.png`, `verified_admin_settings_saved.png`) and Next.js production build (86 routes).

---

## Track 5: UI/UX & Responsive Refinements

- [x] **TASK-10: Editorial Homepage Redesign & Authentic Photography**
  - **Status:** `COMPLETED & VERIFIED`
- [x] **TASK-11: India Taste Map Geographical Accuracy & Pin Alignment**
  - **Status:** `COMPLETED & VERIFIED`
- [x] **TASK-12: Free Delivery Progress Bar in Cart Drawer**
  - **Status:** `COMPLETED & VERIFIED`

---

## Track 6: SEO & Performance

- [x] **TASK-13: Schema.org / JSON-LD Structured Data Implementation**
  - **Status:** `COMPLETED & VERIFIED`
  - **Evidence:** Added `Organization` & `WebSite` JSON-LD to `src/app/layout.tsx`, `Product`, `Offer`, `Brand`, and `BreadcrumbList` to `src/app/product/[slug]/page.tsx`, and `BreadcrumbList` to `src/app/category/[slug]/page.tsx`. Verified with automated DOM script parser in Chrome.
- [x] **TASK-14: Dynamic Sitemap & Robots.txt Generation**
  - **Status:** `COMPLETED & VERIFIED`
  - **Evidence:** Created `src/app/sitemap.ts` and `src/app/robots.ts`. Both verified with live HTTP status 200, proper XML urlset schema, and disallowed private paths.

---

## Track 7: QA, Production Deployment & Client Handover

- [x] **TASK-15: Automated Unit & Integration Test Suites**
  - **Status:** `COMPLETED (25/25 Test Suites Passing)`
  - **Evidence:** 25 comprehensive test suites covering admin acceptance, admin auth & 2FA, admin insights, customer auth & password reset lifecycle, cart arithmetic, catalog & variants, CMS banners, coupons, database architecture, gifting finder, health check, inventory ledgers, order finite state machine, payments, phase-9h, customer profile, recently viewed products, smart recommendations, review moderation, smart search, sommelier AI assistant, store locator, and India Taste Map. Run via unified test runner `npm run test:all`.
- [x] **TASK-16: Admin Store Operations Guide (`docs/ADMIN_HANDOVER_GUIDE.md`)**
  - **Status:** `COMPLETED & VERIFIED`
  - **Evidence:** Published comprehensive 9-section back-office handbook detailing catalog variant management, category taxonomy display orders, cold-chain inventory buffer thresholds, 7-stage order state machine, Blue Dart AWB shipment tracking, customer relationship management, luxury gift-box packaging, coupon rules, and terroir map maintenance in `docs/ADMIN_HANDOVER_GUIDE.md`.
- [x] **TASK-17: Production Deployment Guide (`docs/DEPLOYMENT_GUIDE.md`)**
  - **Status:** `COMPLETED & VERIFIED`
  - **Evidence:** Published production deployment and infrastructure handbook covering Vercel Edge/Serverless setup, Supabase PostgreSQL connection pooling, Redis rate limiting, Razorpay webhook signature verification, S3 media bucket storage, automated 15-minute background cron configuration, and Google Search Console dynamic sitemap submission in `docs/DEPLOYMENT_GUIDE.md`.

---

## Track 8: AI & Advanced E-Commerce Features (Phase 14)

- [x] **TASK-18: Feature A — Smart Product Recommendations & 1-Click Bundling**
  - **Status:** `COMPLETED & VERIFIED`
  - **Evidence:** Created `src/services/recommendation.service.ts` with pairing knowledge graph and frequently-bought-together combo logic, `/api/v1/recommendations` endpoint, and `src/components/catalog/frequently-bought-together.tsx` mounted in PDP (`pdp-client-view.tsx`). Verified with `src/test/recommendations.test.ts` (5/5 passed).
- [x] **TASK-19: Feature B — AI Shopping Assistant ("Royal Gourmet Sommelier")**
  - **Status:** `COMPLETED & VERIFIED`
  - **Evidence:** Created `src/services/sommelier.service.ts` with grounded catalog Q&A and deterministic rule-based natural language intent classifier, `/api/v1/ai/sommelier` endpoint, and floating concierge widget `src/components/ai/sommelier-concierge.tsx` mounted in `src/app/layout.tsx`. Verified with `src/test/sommelier.test.ts` (7/7 passed).
- [x] **TASK-20: Feature C — Smart Search & Vernacular Synonyms**
  - **Status:** `COMPLETED & VERIFIED`
  - **Evidence:** Created `src/services/smart-search.service.ts` with Indian vernacular food synonyms (badam, kaju, akhrot, khajoor, bilona, haldi, mukhwas), Levenshtein typo tolerance with token stem normalization, and NeedTag mapping. Integrated into `search-modal.tsx` and `product-listing-view.tsx`. Verified with `src/test/smart-search.test.ts` (6/6 passed).
- [x] **TASK-21: Feature D — Intelligent Gift Finder Wizard**
  - **Status:** `COMPLETED & VERIFIED`
  - **Evidence:** Created `src/components/gifting/intelligent-gift-finder.tsx` 3-step guided wizard (Occasion, Budget, Palate), real box catalog variants, inclusions breakdown, 1-click cart add, and deep-linking to `/build-your-own-box`. Mounted in `src/app/gifting/page.tsx`. Verified with `src/test/gifting-finder.test.ts` (5/5 passed).
- [x] **TASK-22: Feature E — Advanced Admin Insights**
  - **Status:** `COMPLETED & VERIFIED`
  - **Evidence:** Created `src/services/inventory-insights.service.ts` calculating daily sales velocity, 30-day burn rate, days-to-runout estimates, 45-day buffer restock suggestions, and explicit `INSUFFICIENT_DATA` handling. Created `/api/v1/admin/inventory/insights` guarded by `requirePermission("inventory:read")` and `src/components/admin/inventory-insights-view.tsx` mounted as 3rd tab in `/admin/inventory`. Verified with `src/test/admin-insights.test.ts` (5/5 passed).
- [x] **TASK-23: Feature F — Recently Viewed Products**
  - **Status:** `COMPLETED & VERIFIED`
  - **Evidence:** Created `src/hooks/use-recently-viewed.ts` with privacy-first client-side `localStorage`, MRU deduplication, max 8 items, and clear history action. Created `src/components/catalog/recently-viewed.tsx` mounted in PDP (`pdp-client-view.tsx`). Verified with `src/test/recently-viewed.test.ts` (4/4 passed).

