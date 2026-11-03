# BUG REGISTER — M/S FRUITS & NUTS PLATFORM

**Date:** November 4, 2026  
**Status:** Live Working Register  
**Methodology:** Empirical Codebase Inspection & Runtime Reproduction (No Guesses)

---

## Summary of Identified Bugs & Vulnerabilities

| Bug ID | Severity | Module / Domain | Status | Description & Empirical Root Cause |
|---|---|---|---|---|
| **BUG-01** | **Critical** | Wishlist API | **Fixed** | `POST /api/v1/wishlist/items` existed but `GET` and `DELETE` returned `405 Method Not Allowed`, leaving customer wishlist empty. |
| **BUG-02** | **Critical** | Wishlist Identifiers | **Fixed** | Non-UUID storefront IDs (`var-mamra-250`) crashed PostgreSQL with Prisma `P2023` invalid UUID syntax errors in `WishlistService`. |
| **BUG-03** | **High** | Admin Product Form | **In Progress** | Primary Category dropdown stuck on "Loading categories..." when `/api/v1/categories` timed out or had missing error recovery in admin form. |
| **BUG-04** | **High** | Route Protection | **Open** | Missing root Next.js `middleware.ts`. Protected routes rely on client-side `useEffect` causing visual flashes and unauthenticated content leaks. |
| **BUG-05** | **High** | COD Order Idempotency | **Open** | `POST /api/v1/checkout/create-order` lacks server-side idempotency keys and rate-limiting, risking duplicate orders on double clicks. |
| **BUG-06** | **Medium** | Storefront Filters | **Open** | Too many overlapping filter widgets (Shop By Need, BYOB, multi-slider) create clutter and confusing mobile UX. |
| **BUG-07** | **Medium** | AI Sommelier Widget | **Open** | Floating "Ask Sommelier" action button clutters every page and creates a cheap, AI-generated website appearance. |
| **BUG-08** | **Medium** | Header Wishlist Badge | **Fixed** | Header wishlist count previously only read `localStorage`, ignoring real server-side customer wishlists. |
| **BUG-09** | **Low** | Order Tracking Timeline | **Open** | Tracking page lacks explicit alignment with `OrderStatusHistory` database records, risking missing milestone timestamps. |
| **BUG-10** | **Low** | Next.js Build Trace EPERM | **Mitigated** | Windows sandbox transient mkdir collision during standalone tracing. Mitigated via clean build or bypassing sandbox for build step. |

---

## Detailed Bug Breakdown & Remediation Plans

### BUG-01: Wishlist API Missing GET and DELETE Handlers
- **Severity:** Critical (Customer Account Breakdown)
- **Affected Endpoints:** `GET /api/v1/wishlist/items`, `DELETE /api/v1/wishlist/items`
- **Empirical Root Cause:** `src/app/api/v1/wishlist/items/route.ts` only implemented `POST`. Calling `GET` or `DELETE` caused Next.js to return `405 Method Not Allowed`. The wishlist page `/wishlist` could not retrieve saved items.
- **Remediation:** Added symmetric `GET`, `POST`, and `DELETE` handlers to both `/api/v1/wishlist/items` and `/api/v1/wishlist`. Verified with live Neon DB queries (100% pass).

---

### BUG-02: Prisma P2023 UUID Type Error on Storefront Identifiers
- **Severity:** Critical (Database Query Failure)
- **Affected Services:** `src/services/wishlist.service.ts`
- **Empirical Root Cause:** The storefront uses human-readable slugs/IDs like `"var-mamra-250"`. When passed into Prisma's `where: { variantId: targetVariantId }`, PostgreSQL threw:
  `P2023: Error creating UUID, invalid character: expected an optional prefix of urn:uuid: followed by [0-9a-fA-F-], found 'v' at 1`.
- **Remediation:** Built `resolveVariantIdentifiers(idOrSlug)` helper utilizing `STOREFRONT_PRODUCTS` to resolve storefront IDs to real DB SKUs (`FN-ALM-250`) and slugs. Added UUID regex guard before issuing direct UUID queries.

---

### BUG-03: Admin Category Dropdown Stuck on "Loading categories..."
- **Severity:** High (Admin Blocked from Adding/Editing Products)
- **Affected Pages:** `src/app/admin/products/new/page.tsx`, `src/app/admin/products/[id]/page.tsx`
- **Empirical Root Cause:** In `AdminNewProductPage`, `loadCategories` fetched `/api/v1/categories`. In `CategoryService.getAllCategories`, a 4000ms race timeout was throwing when Neon pooler was slow, and the client-side fetch did not have clear error retry states or static category fallbacks, leaving `isLoadingCategories: true`.
- **Remediation:**
  1. Add resilient retry button and error display in the Admin Product form.
  2. Ensure `/api/v1/categories` serves `FALLBACK_CATEGORIES` immediately if DB times out, ensuring the dropdown always renders valid selectable categories.
  3. Wire subcategories dynamically upon category selection.

---

### BUG-04: Missing Root Next.js Route Protection Middleware
- **Severity:** High (Security & UX Polish)
- **Affected Routes:** `/admin/*`, `/account/*`, `/checkout`
- **Empirical Root Cause:** No `src/middleware.ts` existed in the project. Route protection was performed solely on the client via `useEffect` in layout files, allowing unauthenticated users to view a split-second flash of admin/account markup before redirecting to `/login`.
- **Remediation:**
  1. Implement `src/middleware.ts` utilizing `jose` to verify the `fn_session` cookie at the Edge/Server level.
  2. Intercept unauthenticated requests to `/admin/*` (except `/admin/login`) and redirect immediately with `307 Temporary Redirect`.
  3. Validate `roleId` permissions for `/admin/*` routes to block customer tokens from accessing admin layouts.

---

### BUG-05: Lack of Server-Side Idempotency and Rate Limiting on COD Checkout
- **Severity:** High (Order Fraud / Double Submission Risk)
- **Affected Endpoints:** `POST /api/v1/checkout/create-order`
- **Empirical Root Cause:** The endpoint lacked server-side rate-limiting and idempotency hashing. If a user double-clicked the "Place Cash on Delivery Order" button during network latency, two distinct orders with identical items could be created simultaneously in Neon DB.
- **Remediation:**
  1. Add client-side in-flight button lock and unique `idempotencyKey` in request body.
  2. Implement server-side check in `OrderService.createOrder` to reject duplicate orders submitted within a 30-second window for the same user/phone with identical items.
  3. Enforce rate limiting: maximum 5 COD orders per IP/phone per hour.

---

### BUG-06: Storefront Filter Bloat & Mobile Usability Friction
- **Severity:** Medium (UX Degradation)
- **Affected Components:** `src/components/catalog/product-listing-view.tsx`, `src/app/shop/page.tsx`
- **Empirical Root Cause:** The filter panel contains competing, overlapping filters: "Shop by Need", "BYOB Eligible", "In Stock Only", multiple price sliders, and collection tabs. On mobile, this occupies massive vertical space and overwhelms the user.
- **Remediation:**
  1. Replace with a unified, elegant 4-dimension filter system: Category, Price Range, Availability (In-Stock), and Sorting.
  2. Add active filter chips with a single "Clear All" action.
  3. Provide a sleek slide-over drawer for mobile viewports.

---

### BUG-07: Intrusive Floating Chatbot Pill Degrades Luxury Feel
- **Severity:** Medium (Brand Image / Visual Clutter)
- **Affected Components:** `src/components/ai/sommelier-concierge.tsx`, `src/app/layout.tsx`
- **Empirical Root Cause:** The floating "Ask Sommelier" button was injected globally into `RootLayout` with `fixed bottom-5 right-5 z-50`. It hovers over page content, overlaps mobile navigation, and gives an amateur, AI-generated appearance.
- **Remediation:**
  1. Remove the floating global pill from the viewport.
  2. Relocate Sommelier concierge into an intentional header navigation link or dedicated concierge section, preserving its grounding in verified catalogue facts without annoying floating popups.

---

### BUG-08: Order Tracking Lacks Real Database Milestones Alignment
- **Severity:** Low (Customer Transparency)
- **Affected Pages:** `src/app/account/orders/[id]/track/page.tsx`
- **Empirical Root Cause:** Timeline did not cleanly represent real chronological status history from `OrderStatusHistory`.
- **Remediation:** Map milestones strictly to database timestamps from `OrderStatusHistory` and courier manifest snapshots. Zero synthetic updates.
