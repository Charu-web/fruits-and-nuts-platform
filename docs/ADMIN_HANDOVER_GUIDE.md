# M/S Fruits & Nuts — Administrator & Store Operations Guide
**Document:** `docs/ADMIN_HANDOVER_GUIDE.md`  
**Version:** 1.0 (Production Ready)  
**Target Audience:** Store Managers, Fulfillment Leads, Inventory Operators, and Executive Leadership.

---

## 1. Executive Operations Overview

The **M/S Fruits & Nuts Operations Console** (`/admin`) provides centralized back-office control over the entire e-commerce lifecycle — from orchards to packaging, logistics, financial reconciliation, and customer relationship management.

### Access & Role Hierarchy (RBAC)
Access to administrative capabilities is governed by four role-based access levels:
1. **Super Admin (`SUPER_ADMIN`):** Unrestricted root control over all modules, staff accounts, tax rates, and settings.
2. **Inventory Manager (`INVENTORY_MGR`):** Stock monitoring, cold-chain adjustments, reorder alerts, and supplier receipts.
3. **Order Manager (`ORDER_MGR`):** Order state transitions, Blue Dart/Delhivery shipment manifests, AWB tracking, and customer contact.
4. **Content & Merchandising Specialist (`CONTENT_MGR`):** Editorial storytelling, product photography, category taxonomy, taste map markers, and review moderation.

---

## 2. Catalog & Variant Management (`/admin/products`)

### Adding & Updating Products
- **Authoritative Catalog:** Every product is defined with authoritative server-side prices, MRPs, tax rates, and origin terroir attributes.
- **Product Details:**
  - **Title & Slug:** Title must reflect the heritage naming convention (e.g., *Royal Kashmiri Mamra Almonds*). The slug is auto-generated as lowercase alphanumeric with hyphens.
  - **Category & Subcategory:** Assign each product to its respective parent category and subcategory.
  - **Origin Region:** Tag products to their authentic harvesting zone (e.g., *Pampore Valley, Kashmir*, *Kandahar, Afghanistan*, *Giri, Ratnagiri*).
  - **Taste & Terroir Notes:** Highlight harvest season, grade certification (e.g., *ISO 3632 Grade-1* for saffron), aroma, and flavor profiles.

### Multi-Pack Variants & Packaging Types
- Products support multiple weight variants (e.g., `250g`, `500g`, `1kg`).
- **Safety Rule:** The system strictly rejects any variant where `sellingPrice > mrp`.
- **Packaging Formats:** Select from `STAND_UP_POUCH`, `GLASS_JAR`, `TIN_CANISTER`, or `WOODEN_BOX`.

---

## 3. Category & Taxonomy Architecture (`/admin/categories`)

- **Root Categories:** Manage root groupings (*Dry Fruits & Nuts*, *Kashmiri Specialties*, *Berries, Figs & Dates*, *Festive Gifting*).
- **Nested Subcategories:** Subcategories inherit parent tax mappings and display order sequences.
- **Display Sequencing:** Control storefront ordering via integer display order ranks (`1`, `2`, `3`).

---

## 4. Inventory Control & Cold-Chain Warehouse (`/admin/inventory`)

- **Real-Time Stock Depletion:** Stock is temporarily held upon checkout order placement and permanently decremented upon payment confirmation.
- **Safety Buffer Threshold:** When available stock falls below the safety buffer threshold (default: 10 units), the storefront automatically displays an *“Only X left in stock”* urgency badge.
- **Stock Adjustments & Audit Trails:** Every manual stock adjustment requires selecting a transaction type (`RECEIPT_FROM_SUPPLIER`, `DAMAGE_EXPIRY`, `INTERNAL_USE`, `AUDIT_CORRECTION`) and enters an immutable audit record with user ID and timestamp.

---

## 5. Order Management & Fulfillment Pipeline (`/admin/orders`)

### State Machine Lifecycle
```
PENDING (Payment Authorization Hold)
   │
   ├── (Payment Confirmed) ──► CONFIRMED
   │                              │
   │                              ▼
   ├── (Payment Failed/Timeout)   PROCESSING (Pack & Cold-Chain Prep)
   │         │                    │
   │         ▼                    ▼
   └──► CANCELLED             SHIPPED (AWB Assigned, Blue Dart In-Transit)
                                  │
                                  ▼
                              DELIVERED (Delivered & Verified)
```

### Shipment Creation & AWB Tracking
1. Open the order in `/admin/orders/[id]`.
2. When packages are sealed in vacuum pouches, click **Create Shipment**.
3. Select logistics provider (`BLUEDART`, `DELHIVERY`, or `SHIPROCKET`).
4. Enter the courier-generated **Air Waybill (AWB) Tracking Number**.
5. The customer's order tracking page (`/order-tracking/[orderNumber]`) immediately reflects live delivery progress.

### 30-Minute Abandoned Order Hold Expiry
- Online payment orders remain in `PENDING` status for 30 minutes.
- If the customer abandons the Razorpay payment window, the automated background worker (`/api/v1/cron/cleanup-orders`) automatically cancels the order and restores held inventory.

---

## 6. Customer Relationship Management (`/admin/customers`)

- **Client Directory:** Searchable table of registered clientele with contact verification badges (Phone OTP / Email).
- **Customer Lifetime Value (CLV):** View cumulative spend and total completed orders for each customer.
- **Account Actions:**
  - View registered delivery destinations and shipping addresses.
  - Suspend or reactivate accounts in case of fraudulent activity or duplicate claims.
  - Export CSV customer directory for marketing or CRM analysis.

---

## 7. Gifting & Build Your Own Box Operations (`/build-your-own-box`)

- **Luxury Packaging Options:**
  - Duo Petite Gift Box (2 Jars) — ₹350
  - Royal Pine Chest (4 Jars) — ₹650
  - Sovereign Heritage Trunk (6 Jars) — ₹950
- **Fulfillment Requirements:**
  - Match each filled jar with vacuum-sealed safety liners.
  - Affix the selected festive sleeve (Wedding, Diwali, Executive).
  - Print the customer's personalized greeting note onto the gold-crested stationery card with wax seal.

---

## 8. Coupons, Discounts & Promotions (`/admin/coupons`)

- **Coupon Types:** Percentage discount (with optional maximum cap) or Flat amount.
- **Guardrails:**
  - `minOrderAmount`: Cart must exceed this threshold before coupon applies.
  - `usageLimitPerUser`: Enforces single-use or limited customer redemptions.
  - Automatic expiration based on start and end dates.

---

## 9. India Taste Map & Terroir Directory (`/admin/taste-map`)

- Maintain coordinates, harvesting seasons, and farmer cooperative highlights for regional origins.
- Ensures customer transparency from orchard to table.
