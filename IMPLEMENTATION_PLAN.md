# IMPLEMENTATION PLAN — M/S FRUITS & NUTS PRODUCTION TRANSFORMATION

**Document Version:** 1.0.0  
**Target Completion:** Production Ready & Verified  
**Execution Sequence:** Strict 12-Phase Execution Roadmap  

---

## Phase Execution Sequence & Deliverables

### Phase 1: Full Codebase and UI/UX Audit (COMPLETED)
- Inspect entire codebase, architecture, and technology dependencies.
- Verify live Neon PostgreSQL database tables, relationships, and record counts.
- Generate mandatory audit deliverables:
  - `PRODUCTION_AUDIT.md`
  - `BUG_REGISTER.md`
  - `UI_UX_REDESIGN_PLAN.md`
  - `IMPLEMENTATION_PLAN.md`
  - `QA_TEST_PLAN.md`
- **Output Status:** Baseline verified with 0 guesses.

---

### Phase 2: Authentication Fixes & Edge Route Protection
- Implement root `src/middleware.ts` using `jose` to verify JWT session cookies on Edge runtime.
- Secure protected customer routes (`/account/*`, `/checkout`) with server-side redirection to `/login`.
- Secure administrative routes (`/admin/*` except `/admin/login`) requiring active admin role (`SUPER_ADMIN`, `INVENTORY_MGR`, etc.).
- Audit `AuthService` login, registration, logout, and password reset workflows.
- Prevent unauthenticated visual flashes during page navigation.

---

### Phase 3: Order History & Wishlist Synchronization
- Confirm customer order isolation in `src/app/account/orders/page.tsx` and `src/services/order.service.ts`.
- Ensure wishlist state synchronization between `/api/v1/wishlist/items`, `/wishlist`, and Header badge.
- Validate non-UUID storefront identifier mapping (`var-mamra-250` -> `FN-ALM-250`).
- Test multiple concurrent customer accounts to ensure zero data bleeding.

---

### Phase 4: Cart and Checkout Modernization
- Streamline cart recalculations and guarantee server-authoritative pricing on checkout submission.
- Ensure GST rates (5% on nuts/dates, 12% on teas/chocolates) and shipping rules (Free over ₹999, else ₹75) compute accurately on the server.
- Prevent client price tampering and validate real-time stock availability.
- Provide fluid Add to Bag, quantity adjustment, and item removal flows.

---

### Phase 5: COD Order Protection & Idempotency
- Implement client-side in-flight button locking with spinner feedback.
- Add unique `idempotencyKey` parameter to `POST /api/v1/checkout/create-order`.
- Implement server-side check in `OrderService.createOrder` to reject duplicate submissions for the same user/phone within 30 seconds.
- Enforce strict server-side rate limits (max 5 orders per phone/IP per hour).

---

### Phase 6: Order Tracking Reliability
- Align `/account/orders/[id]/track/page.tsx` directly with `OrderStatusHistory` database records.
- Support standard lifecycle: `ORDER_PLACED` -> `CONFIRMED` -> `PACKED` -> `SHIPPED` -> `OUT_FOR_DELIVERY` -> `DELIVERED`.
- Show real timestamps from the database; eliminate synthetic courier tracking info.
- Handle cancelled orders gracefully, showing cancellation reason and timestamp.

---

### Phase 7: Product & Category Management Fixes
- Fix Admin Product Add (`/admin/products/new`) and Edit (`/admin/products/[id]`):
  - Ensure Primary Category dropdown never stays stuck on "Loading categories...".
  - Add resilient retry button and error recovery for slow network/database connections.
  - Dynamically populate Subcategory dropdown based on chosen Category.
  - Test product creation, editing, and status toggling (`isActive`).
- Verify published products synchronize with storefront and unpublished products remain hidden.

---

### Phase 8: Transactional Email Notifications
- Audit `NotificationService` SMTP configuration for Hostinger / external SMTP.
- Ensure customer order confirmation emails include order number, itemized product list, amounts, shipping address, and tracking link.
- Ensure admin new order notification emails dispatch to `ADMIN_EMAIL`.
- Guarantee email failures are caught in `Promise.allSettled` and do not fail successful orders.

---

### Phase 9: Consolidated Filters & Chatbot Streamlining
- Refactor storefront filters into 4 clean dimensions: Category, Price Range, In-Stock, and Sorting.
- Add active filter chips with single "Clear All" action.
- Remove intrusive floating "Ask Sommelier" button from `RootLayout`; preserve grounding in header navigation or dedicated section.

---

### Phase 10: Complete Premium UI/UX Redesign
- Redesign Homepage with editorial luxury hero, authentic product photography, and clean category grid.
- Redesign Header and Mobile Navigation Drawer with smooth 48px touch targets.
- Redesign Product Listing, Product Card, and Product Detail Pages.
- Redesign Cart Drawer, Checkout, Account Dashboard, and Order History.
- Standardize typography (`Playfair Display` + `Plus Jakarta Sans`), colors (`#173D2C`, `#FAF7F0`, `#C3A15D`), and clean 8px/12px border radii.

---

### Phase 11: Performance, Security & Code Quality
- Optimize image loading with `next/image` and appropriate `sizes` / `priority` attributes.
- Ensure zero secrets or credentials are leaked in frontend bundles or logs.
- Verify security headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options) in `next.config.ts`.
- Eliminate console errors and redundant network calls.

---

### Phase 12: Full Regression Testing & Verification
- Execute complete automated test suite (`npm test`, 84 tests).
- Run TypeScript static type verification (`npm run type-check`).
- Run production build (`npm run build`).
- Verify end-to-end customer and admin workflows.
- Produce final sign-off matrix.
