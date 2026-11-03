# QA TEST PLAN — M/S FRUITS & NUTS PRODUCTION PLATFORM

**Target Application:** M/S Fruits & Nuts E-Commerce Platform  
**Target Domain:** https://fruitsandnuts.co.in  
**Test Suite:** Unit Tests, Integration Tests, E2E Workflows, Cross-Device Viewports  

---

## 1. Test Scope & Acceptance Criteria

Every critical customer journey and administrative workflow must be systematically verified. A feature is declared complete only after passing functional, visual, security, and automated verification checks.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        QA VERIFICATION MATRIX                          │
├────────────────────────────────┬───────────────────────────────────────┤
│ Customer Journeys (14 Scenarios)│ Admin Workflows (9 Scenarios)         │
│ • Registration & Validation    │ • Admin Login & TOTP Gating           │
│ • Login & Session Persistence  │ • Dashboard Metrics & Status          │
│ • Catalogue & Search           │ • Category Dropdown in Add/Edit Form  │
│ • Consolidated 4-Filter System │ • Add Product with Variants & Image   │
│ • Product Detail & Packaging   │ • Edit Product & Toggle Publish       │
│ • Cart Add, Edit & Remove      │ • Manage Orders & View Invoices       │
│ • Free Shipping Thresholds     │ • Update Order Status (Milestones)    │
│ • Checkout Address Form        │ • Customer Directory Access           │
│ • COD Order Placement          │ • Inventory Adjustments & Ledger      │
│ • Double-Click Lock & Idempot. ├───────────────────────────────────────┤
│ • Order History Display        │ Cross-Device & Performance Verification│
│ • Live Order Tracking Timeline │ • Mobile Viewports (360px - 414px)    │
│ • Customer Wishlist Isolation  │ • Tablet Viewports (768px - 1024px)   │
│ • Order Confirmation Email     │ • Desktop Viewports (1280px - 1920px) │
└────────────────────────────────┴───────────────────────────────────────┘
```

---

## 2. Customer Journeys Test Specifications

### CJ-01: Customer Registration & Validation
- **Steps:** Navigate to `/register`. Fill Name, Phone (10-digit Indian), Email, Password (8+ characters). Submit form.
- **Expected Result:** Account created in Neon DB; session token issued in `fn_session` cookie; user redirected to `/account`. Duplicate emails or phones produce friendly inline validation errors without crashing.

### CJ-02: Customer Login & Session Persistence
- **Steps:** Navigate to `/login`. Sign in with valid credentials. Refresh page. Navigate across pages. Close and reopen browser tab.
- **Expected Result:** Session remains active; user name appears in account layout; no premature logout occurs.

### CJ-03: Product Catalog & Consolidated Search
- **Steps:** Navigate to `/shop`. Search for "Mamra" using header search (Cmd+K) and shop search.
- **Expected Result:** Instant matching products returned ("Kashmiri Imperial Mamra Almonds"). No broken image frames.

### CJ-04: Consolidated Filters
- **Steps:** On `/shop`, select Category "Dry Fruits", select Price Range "₹500 - ₹1,000", toggle "In Stock Only".
- **Expected Result:** Products filter dynamically. Active filter chips appear above grid. Clicking "Clear All" restores full catalogue.

### CJ-05: Product Detail Page (PDP) & Variant Switching
- **Steps:** Open `/product/kashmiri-mamra-almonds`. Click 250g, 500g, and 1kg pack buttons.
- **Expected Result:** Price updates smoothly (₹650 -> ₹1,250 -> ₹2,400). Selected SKU updates. Stock badge displays available inventory.

### CJ-06: Cart Add, Edit & Drawer Interactions
- **Steps:** Click "Add to Bag" on PDP. Cart drawer opens. Increment quantity to 2. Add gift packaging with note.
- **Expected Result:** Subtotal doubles. Gift wrap fee (+₹150) added. Cart summary badge updates across header in real-time.

### CJ-07: Free Shipping Calculation
- **Steps:** Add item worth ₹650. Check delivery fee (₹75). Add another item to cross ₹999.
- **Expected Result:** Delivery fee drops to ₹0. Free delivery progress bar displays "You have qualified for Free Delivery!".

### CJ-08: Checkout Form Validation
- **Steps:** Proceed to `/checkout`. Attempt submission with missing postal code or invalid phone.
- **Expected Result:** Clear inline error messages highlighting missing mandatory fields. Submission is blocked until valid.

### CJ-09: Cash on Delivery (COD) Order Placement
- **Steps:** Fill valid shipping address. Select Cash on Delivery. Click "Place Cash on Delivery Order".
- **Expected Result:** Order created with `orderStatus: CONFIRMED`, `paymentMethod: COD`. Redirects to `/checkout/success/[id]` showing unique order ID (`FN-2026-XXXXX`).

### CJ-10: COD Double-Click & Idempotency Lock
- **Steps:** Rapidly click "Place Cash on Delivery Order" multiple times during submission.
- **Expected Result:** Button disables immediately on first click with spinner; server-side idempotency prevents duplicate order records in Neon DB.

### CJ-11: Customer Account & Order History
- **Steps:** Log in. Open `/account/orders`.
- **Expected Result:** Recently placed order appears at top with order ID, date, status, items snapshot, and total amount. Zero leakage of other customers' orders.

### CJ-12: Live Order Tracking Timeline
- **Steps:** On `/account/orders`, click "Track Order".
- **Expected Result:** Chronological milestone timeline displays Order Placed and Confirmed with actual timestamps from Neon DB `order_status_history`.

### CJ-13: Customer Wishlist & Isolation
- **Steps:** Click Heart icon on product. Open `/wishlist`. Log out and log into another customer account.
- **Expected Result:** Wishlist shows saved product for Customer 1. Customer 2 sees only their own wishlist. Clicking "Move to Bag" adds to cart and removes from wishlist.

### CJ-14: Order Confirmation Email Flow
- **Steps:** Place test order with valid test email.
- **Expected Result:** `NotificationService` formats order confirmation email containing order ID, product list, amounts, and address. Email failure (if SMTP down) does not destroy or fail the created order.

---

## 3. Administrative Workflows Test Specifications

### AD-01: Admin Login & Role Gating
- **Steps:** Navigate to `/admin/login`. Attempt login with non-admin customer account. Then log in with `SUPER_ADMIN` credentials.
- **Expected Result:** Customer account rejected with `403 Forbidden`. Super admin successfully gains access to `/admin` dashboard.

### AD-02: Category Dropdown in Product Add/Edit
- **Steps:** Open `/admin/products/new`.
- **Expected Result:** Primary Category dropdown loads actual categories within 1-2 seconds without being stuck on "Loading categories...". Subcategories update immediately when primary category changes.

### AD-03: Product Creation, Publishing & Storefront Sync
- **Steps:** In `/admin/products/new`, create test product "Royal Afghan Sun-Dried Figs". Set active and save.
- **Expected Result:** Product saved in Neon DB `products` table. Product immediately visible on `/shop` and its `/product/[slug]` page works.

### AD-04: Order Status Management
- **Steps:** Open `/admin/orders`. Select order. Change status from `CONFIRMED` to `PACKED` with status note.
- **Expected Result:** Order status updates in Neon DB; milestone recorded in `order_status_history`; customer tracking page reflects "Packed".

---

## 4. Automated Testing Gates

| Test Phase | Execution Command | Criteria for Pass |
|---|---|---|
| **TypeScript Static Check** | `npm run type-check` | **0 errors** across all components and routes |
| **Automated Unit Test Suite**| `npm test` | **84/84 tests pass** (0 failures, 0 skipped) |
| **Next.js Production Build** | `npm run build` | **All 92 routes compile successfully** with standalone bundle |
| **Live Database Verification**| `tsx scratch/audit_live_database.ts` | All Neon DB tables and record counts verify cleanly |
