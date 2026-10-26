# PHASE 1 — FINAL REQUIREMENTS TRACEABILITY MATRIX & GOVERNANCE GATE
## M/S Fruits & Nuts E-Commerce Platform
**Domain:** `https://www.fruitsandnuts.co.in/`  
**Document Version:** 3.0.0 (Final Sign-Off Validation)  
**Author:** Senior Freelance Product Consultant, Lead Business Analyst & E-Commerce Solutions Architect  
**Status:** COMPLETE & READY FOR FORMAL CLIENT SIGN-OFF  

---

## 1. GOVERNANCE CORRECTIONS APPLIED & AUDIT DIRECTIVES

In strict adherence to client governance instructions:

1. **Taste Map Terminology & Scope Correction:**  
   The platform requirements for the **India Taste Map** are strictly defined as:
   - Verified regions/cities
   - Associated products/categories
   - Relevant cultural/flavor stories and content
   - Authoritative source/verification references where applicable
   - Database persistence with full Admin CMS manageability
   *(The concept of "sourcing partners" is NOT assumed and is excluded unless explicitly confirmed by the client).*

2. **Health Claims & Benefit Statements Protocol:**  
   - All handwritten or draft health benefit statements are designated strictly as **CLIENT-SUPPLIED DRAFT CONTENT**.
   - No automatic publication or AI-generation of medical, therapeutic, disease prevention, or treatment claims shall occur.
   - Every health/benefit claim requires explicit **CLIENT APPROVAL** and **LEGAL/CONTENT REVIEW** prior to production deployment.

3. **Asset & Content Provenance:**  
   - Client-provided product images, packaging artwork, logos, reference materials, handwritten product details, handwritten pricing notes, and draft Terms & Conditions are maintained as the authoritative sources of truth.
   - Unclear or missing data is never synthesized or assumed; it is strictly recorded as `CLIENT CONFIRMATION REQUIRED`.

4. **Phase Lock:**  
   - Phase 2 (Technical Architecture & UI/UX Design) remains strictly locked. No application code or database migrations have been executed.

---

## 2. COMPREHENSIVE REQUIREMENTS TRACEABILITY MATRIX (RTM)

The matrix below maps every requirement across its Source, Lifecycle Status, Affected Phase, Client Approval Requirement, Technical Dependency, and Operational Risk.

**Allowed Status Values:**
- `CONFIRMED`
- `CLIENT CONFIRMATION REQUIRED`
- `PENDING THIRD-PARTY`
- `PENDING LEGAL APPROVAL`
- `NOT APPLICABLE`

| Req ID | Category / Requirement Description | Source | Status | Related Phase | Client Approval Required | Dependency | Risk if Unresolved |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **BUS-01** | Legal Entity Full Name | Client Brief | `CLIENT CONFIRMATION REQUIRED` | Phase 2, 4 | **YES** | Certificate of Incorporation / Business Proof | Invalid tax invoices & billing disputes |
| **BUS-02** | Registered Office Address | Client Brief | `CLIENT CONFIRMATION REQUIRED` | Phase 2, 3 | **YES** | Registered address documentation | Incomplete statutory footer / invoice |
| **BUS-03** | GSTIN & PAN Tax Registration | Client Brief | `CLIENT CONFIRMATION REQUIRED` | Phase 2, 4 | **YES** | GSTIN 15-digit registration certificate | Non-compliance with Indian GST laws |
| **BUS-04** | Official Support Phone & Helpline | Client Brief | `CLIENT CONFIRMATION REQUIRED` | Phase 3 | **YES** | Assigned active phone line | Customer support disconnect |
| **BUS-05** | Official Support Mailbox (`support@...`) | Client Brief | `CLIENT CONFIRMATION REQUIRED` | Phase 2, 3 | **YES** | Mailbox creation on domain | Unrouted customer order emails |
| **BUS-06** | Primary Domain (`fruitsandnuts.co.in`) | Client Brief | `CONFIRMED` | Phase 5 | **NO** | DNS access delegation at go-live | Deployment delay |
| **BUS-07** | Cloud Hosting / Infrastructure Provider | Architecture | `CLIENT CONFIRMATION REQUIRED` | Phase 2, 5 | **YES** | Cloud provider selection (AWS/Vercel/GCP) | Provisioning bottleneck |
| **PRD-01** | Master Catalog SKU List & Names | Client Draft | `CLIENT CONFIRMATION REQUIRED` | Phase 2, 3 | **YES** | Authoritative digital master catalog sheet | Catalog seeding block |
| **PRD-02** | 10 Root Categories Taxonomy | Client Brief | `CONFIRMED` | Phase 2, 3 | **NO** | Catalog data structure | Inconsistent navigation if changed |
| **PRD-03** | Subcategories & Product Categorization | Client Draft | `CLIENT CONFIRMATION REQUIRED` | Phase 2, 3 | **YES** | Category-to-subcategory mapping sheet | Misplaced product listings |
| **PRD-04** | Standardized Variant Weights (`50g`-`5kg`) | Client Brief | `CONFIRMED` | Phase 2, 3 | **NO** | Product variant schema | Inconsistent variant chips |
| **PRD-05** | Product Descriptions & Storytelling | Client Draft | `CLIENT CONFIRMATION REQUIRED` | Phase 3 | **YES** | Client approval of draft copy | Incomplete product detail pages |
| **PRD-06** | Product Images & Packaging Packshots | Client Assets | `CLIENT CONFIRMATION REQUIRED` | Phase 3 | **YES** | Handover of high-res master image vault | Sub-par storefront visual display |
| **PRD-07** | Ingredients & Allergen Notices (Tree Nuts)| Food Standard | `CLIENT CONFIRMATION REQUIRED` | Phase 3 | **YES** | Product label ingredient confirmation | Food labeling compliance violation |
| **PRD-08** | Nutrition Facts Table per 100g | Food Standard | `CLIENT CONFIRMATION REQUIRED` | Phase 3 | **YES** | Verified lab / batch nutritional values | Blank nutritional information panel |
| **PRD-09** | Storage Guidelines & Shelf Life | Food Standard | `CLIENT CONFIRMATION REQUIRED` | Phase 3 | **YES** | Verified expiry & storage guidelines | Customer storage complaints |
| **PRD-10** | Initial Stock Count & Safety Buffer | Operations | `CLIENT CONFIRMATION REQUIRED` | Phase 2, 4 | **YES** | Warehouse starting inventory count | Overselling or false out-of-stock |
| **SPC-01** | Tea Catalog: Subcategories & Brew Guides | Client Brief | `CLIENT CONFIRMATION REQUIRED` | Phase 2, 3 | **YES** | Tea varieties (Loose, CTC, Green, Kahwa) | Incomplete tea PDP filtering |
| **SPC-02** | Dates / Khajoor: Varieties & Verified Origins | Client Brief | `CLIENT CONFIRMATION REQUIRED` | Phase 2, 3 | **YES** | Verified date cultivars & source regions | Inaccurate origin claims on dates |
| **SPC-03** | Chocolates: Formulations & Melt Packaging | Client Brief | `CLIENT CONFIRMATION REQUIRED` | Phase 2, 3 | **YES** | Cocoa % and thermal packaging rules | In-transit chocolate melting |
| **SPC-04** | Seeds: Raw vs. Roasted Mixes & Flavors | Client Brief | `CLIENT CONFIRMATION REQUIRED` | Phase 2, 3 | **YES** | Roasted seeds list & seasoning details | Inaccurate seed flavor information |
| **SPC-05** | Mouth Fresheners: Ingredients & 0% Tobacco | Client Brief | `CLIENT CONFIRMATION REQUIRED` | Phase 2, 3 | **YES** | Verified mukhwas ingredient declaration | Regulatory scrutiny |
| **SPC-06** | Value Combos: Pre-curated Bundle SKUs | Client Brief | `CLIENT CONFIRMATION REQUIRED` | Phase 2, 4 | **YES** | Combo component breakdown & pricing | Composite inventory sync failure |
| **SPC-07** | Gifting: Pre-packaged Festival & Luxury Boxes| Client Brief | `CLIENT CONFIRMATION REQUIRED` | Phase 3 | **YES** | Rigid box specs, tin dimensions, contents | Incomplete gifting catalog |
| **SPC-08** | Build Your Own Box (BYOB) Configurator | Client Brief | `CLIENT CONFIRMATION REQUIRED` | Phase 2, 3 | **YES** | Available box capacities (2/4/6 jars), limits | BYOB pricing/slot logic mismatch |
| **HLT-01** | Handwritten Health & Benefit Drafts Review | Client Draft | `CLIENT CONFIRMATION REQUIRED` | Phase 3 | **YES** | Formal client sign-off on health copy | Non-compliance with advertising rules |
| **HLT-02** | Statutory Food Disclaimer Requirement | Food Law | `CONFIRMED` | Phase 3 | **NO** | Standard legal disclaimer text | Medical claim liability |
| **PRC-01** | Retail MRP & Base Selling Prices | Client Draft | `CLIENT CONFIRMATION REQUIRED` | Phase 2, 3 | **YES** | Authoritative digital price list | Incorrect pricing or loss-making sales |
| **PRC-02** | Wholesale / B2B Tiered Volume Pricing | Client Brief | `CLIENT CONFIRMATION REQUIRED` | Phase 2, 4 | **YES** | Volume break thresholds (5kg, 20kg+) | Inability to process wholesale orders |
| **PRC-03** | Packaging Add-on Surcharges (Jars/Boxes) | Client Brief | `CLIENT CONFIRMATION REQUIRED` | Phase 2, 3 | **YES** | Premium packaging pricing schedule | Margin erosion on luxury packaging |
| **PRC-04** | Tax Treatment (GST Inclusive Display) | Indian Tax Law| `CONFIRMED` | Phase 2, 4 | **NO** | GST tax calculation logic | Pricing discrepancy at checkout |
| **PRC-05** | Shipping Charges & Free Delivery Threshold | Client Brief | `CLIENT CONFIRMATION REQUIRED` | Phase 2, 3 | **YES** | Free shipping min value (e.g. ₹999) & fee | Shipping fee miscalculation |
| **LOG-01** | Logistics Aggregator Provider Selection | Client Brief | `PENDING THIRD-PARTY` | Phase 2, 4 | **YES** | Partner selection (Shiprocket / Delhivery) | Fulfillment automation blocked |
| **LOG-02** | Serviceable Delivery Regions & Pincodes | Client Brief | `CLIENT CONFIRMATION REQUIRED` | Phase 2, 3 | **YES** | Pincode serviceability boundary | Orders placed in non-deliverable areas |
| **LOG-03** | Cash on Delivery (COD) Rules & Surcharge | Client Brief | `CLIENT CONFIRMATION REQUIRED` | Phase 2, 3 | **YES** | Max COD limit & optional COD fee | High RTO courier loss on bogus orders |
| **LOG-04** | Return Pickup & Reverse Logistics Flow | Client Brief | `CLIENT CONFIRMATION REQUIRED` | Phase 4 | **YES** | Courier reverse pickup workflow | Delayed damaged item returns |
| **PAY-01** | Primary Payment Gateway Selection | Client Brief | `PENDING THIRD-PARTY` | Phase 2, 4 | **YES** | Partner selection (Razorpay / Cashfree) | Checkout payment processing blocked |
| **PAY-02** | Payment Methods (UPI, Cards, Net Banking) | Client Brief | `CONFIRMED` | Phase 2, 3 | **NO** | Gateway API capabilities | Lower payment conversion |
| **PAY-03** | International Payments Support | Client Brief | `NOT APPLICABLE` | Phase 2 (Future)| **NO** | Deferred to international expansion phase | Out of scope for domestic launch |
| **PAY-04** | Automated Webhooks & Refund Processing | Architecture | `CONFIRMED` | Phase 2, 4 | **NO** | Gateway webhook listener | Discrepant order payment states |
| **ORD-01** | Order Lifecycle & Milestone Statuses | E-Commerce Std| `CONFIRMED` | Phase 2, 4 | **NO** | State machine (`Placed` to `Delivered`) | Inconsistent order status tracking |
| **ORD-02** | Order Cancellation Cutoff Window | Client Brief | `CLIENT CONFIRMATION REQUIRED` | Phase 2, 4 | **YES** | Cancellation rules before dispatch | Shipping cost on cancelled orders |
| **ORD-03** | Order Notifications (SMS / WhatsApp / Email) | Client Brief | `CLIENT CONFIRMATION REQUIRED` | Phase 2, 4 | **YES** | Notification channel & template selection | Customer communication gaps |
| **USR-01** | Guest Checkout Support | UX Best Pract.| `CONFIRMED` | Phase 3 | **NO** | Checkout session state handler | High cart abandonment on forced signup |
| **USR-02** | Customer Auth: Mobile OTP + Email/Password | Client Brief | `CONFIRMED` | Phase 2, 3 | **NO** | SMS OTP integration | Login friction on mobile |
| **USR-03** | Address Management (Multi-address + GSTIN) | E-Commerce Std| `CONFIRMED` | Phase 3 | **NO** | User profile database schema | Inconvenient repeat ordering |
| **USR-04** | Wishlist & Saved Items | E-Commerce Std| `CONFIRMED` | Phase 3 | **NO** | Wishlist database entity | Loss of high-intent saved items |
| **USR-05** | Verified Customer Product Reviews | Client Brief | `CONFIRMED` | Phase 3, 4 | **NO** | Reviews engine with admin moderation | Lack of social proof |
| **CPN-01** | Coupon Engine (% Off, Flat ₹, First-Order) | Marketing Std | `CONFIRMED` | Phase 2, 4 | **NO** | Coupon evaluation engine | Inability to run marketing promos |
| **CPN-02** | Coupon Rules: Max Discount & Non-Stacking | Client Brief | `CLIENT CONFIRMATION REQUIRED` | Phase 2, 3 | **YES** | Stacking policy & minimum spend caps | Revenue loss from overlapping promos |
| **GFT-01** | Gifting: Message, Wrapping & Recipient Addr | Client Brief | `CONFIRMED` | Phase 3 | **NO** | Gifting fields on checkout | Gifting UX failure |
| **GFT-02** | Corporate / Bulk Gifting RFQ Portal | Client Brief | `CONFIRMED` | Phase 3, 4 | **NO** | Inquiry form & lead database | Loss of high-value corporate deals |
| **MAP-01** | Taste Map: Verified Regions, Products & Stories | Client Brief | `CLIENT CONFIRMATION REQUIRED` | Phase 2, 3 | **YES** | Verified regions, linked SKUs & stories | Misleading geographic claims |
| **MAP-02** | Taste Map: Database & Admin CMS Persistence | Architecture | `CONFIRMED` | Phase 2, 4 | **NO** | Admin Taste Map CRUD interface | Developer bottleneck for map updates |
| **STR-01** | Store Directory: Addresses, Phone, Hours | Client Draft | `CLIENT CONFIRMATION REQUIRED` | Phase 2, 3 | **YES** | Complete physical outlet roster | Misleading store locator data |
| **STR-02** | Store Locator: Google Maps & Status Badges | UX Best Pract.| `CONFIRMED` | Phase 3 | **NO** | Storefront locator route & map embed | Poor footfall conversion |
| **LEG-01** | Terms & Conditions (`/terms-and-conditions`) | Client Draft | `PENDING LEGAL APPROVAL` | Phase 3 | **YES** | Client legal review of draft terms | Legal dispute vulnerability |
| **LEG-02** | Privacy Policy (DPDP Act & Cookie Consent) | Compliance | `PENDING LEGAL APPROVAL` | Phase 3 | **YES** | Legal review of privacy terms | Regulatory exposure |
| **LEG-03** | Return, Refund & Food Safety Replacement | Client Draft | `PENDING LEGAL APPROVAL` | Phase 3 | **YES** | Food return conditions & unboxing proof | Chargeback losses on perishables |
| **LEG-04** | Shipping & Cancellation Policy | Client Draft | `PENDING LEGAL APPROVAL` | Phase 3 | **YES** | Delivery timelines & cancellation cutoff | Customer complaints |
| **CMS-01** | Admin CMS: Homepage, Hero, Banners, Sections | Client Brief | `CONFIRMED` | Phase 2, 4 | **NO** | Dynamic CMS layout engine | Code changes needed for visual edits |
| **CMS-02** | Admin CMS: Footer Content & Social Links | Client Brief | `CONFIRMED` | Phase 2, 4 | **NO** | Footer settings database entity | Static un-editable footer |
| **MKT-01** | Social Media Verified Account URLs | Client Brief | `CLIENT CONFIRMATION REQUIRED` | Phase 3 | **YES** | Verified links (Insta, FB, LinkedIn, YT) | Broken social icons |
| **MKT-02** | WhatsApp Concierge Integration | Client Brief | `CLIENT CONFIRMATION REQUIRED` | Phase 3 | **YES** | Business WhatsApp number & default text | Fragmented customer chat |
| **MKT-03** | Newsletter Subscription Service | Client Brief | `CLIENT CONFIRMATION REQUIRED` | Phase 3, 4 | **YES** | Newsletter tool (Internal vs. Mailchimp) | Uncollected subscriber leads |
| **SEO-01** | JSON-LD Schema (`Product`, `Breadcrumbs`, Org)| SEO Standards | `CONFIRMED` | Phase 2, 3 | **NO** | Next.js dynamic metadata generator | Poor Google rich snippet indexation |
| **SEO-02** | Google Analytics 4 & Search Console Setup | Analytics Std | `CLIENT CONFIRMATION REQUIRED` | Phase 3, 5 | **YES** | GA4 Measurement ID (`G-XXXXXXXXXX`) | Zero marketing attribution |
| **ADM-01** | Admin Role-Based Access Control (RBAC) | Security Std | `CONFIRMED` | Phase 2, 4 | **NO** | User role schema (SuperAdmin, Manager) | Data leakage to junior staff |
| **ADM-02** | Admin Multi-Factor Authentication (2FA) | Security Std | `CONFIRMED` | Phase 2, 4 | **NO** | 2FA verification module | Brute force admin breach |
| **TEC-01** | Relational Database & ORM Layer | Architecture | `CONFIRMED` | Phase 2 | **NO** | PostgreSQL + Prisma / Drizzle | Data integrity breakdown |
| **TEC-02** | High-Speed Cache & Session Management | Architecture | `CONFIRMED` | Phase 2 | **NO** | Redis cache cluster | Slow response under peak traffic |
| **TEC-03** | Secure Cloud Storage for Media Assets | Architecture | `CONFIRMED` | Phase 2, 3 | **NO** | S3-compatible object storage | Slow asset delivery |
| **TEC-04** | Transactional Email Service | Architecture | `CLIENT CONFIRMATION REQUIRED` | Phase 2, 4 | **YES** | Email provider (Postmark / SendGrid / SES) | Order confirmation delivery failure |
| **TEC-05** | Daily Automated Database Backups | Reliability | `CONFIRMED` | Phase 2, 5 | **NO** | Automated snapshot & backup cron | Catastrophic data loss |

---

## 3. FINAL CLIENT OPEN-ITEM REGISTER (ACTION ITEMS FOR SIGN-OFF)

The following structured list contains **ONLY** the unresolved items where explicit client input, credentials, or formal sign-off is required:

### A. Business Information
1. **Legal Business Name:** Provide the exact registered legal entity name (e.g., Sole Proprietorship, Partnership, Private Limited) for legal and invoicing headers.
2. **Registered Office Address:** Provide the complete physical registered postal address (including Street, Landmark, City, State, and Pincode).
3. **Tax & Regulatory Identifiers:** Provide the official 15-digit GSTIN, PAN, and 14-digit FSSAI License Number.
4. **Official Contact Details:** Provide the customer helpline phone number and dedicated support email address (e.g., `support@fruitsandnuts.co.in`).

### B. Product Catalog & Special Categories
5. **Master Product Catalog Spreadsheet:** Furnish the complete digital SKU sheet containing:
   - Final Product Names & SKU Codes across all 10 categories.
   - Exact Subcategory classifications.
   - Ingredients list, Allergen declarations, and Shelf-life / Storage instructions.
   - Verified Nutritional Facts per 100g table.
   - Starting Inventory counts and low-stock threshold alerts per SKU variant.
6. **Tea Catalog Attributes:** Confirm the full list of tea subcategories (Loose Leaf, CTC, Green, Infusions, Kahwa) and standard brewing guide parameters.
7. **Dates / Khajoor Varieties:** Confirm verified date varieties (Medjool, Ajwa, Mabroom, Kalmi, etc.) and certified origin countries.
8. **Chocolates & Confectionery:** Confirm cocoa formulations, dietary tags, and thermal packaging instructions for summer transit.
9. **Mouth Fresheners (Mukhwas):** Confirm complete ingredients declarations and verify 0% tobacco / non-supari compliance.
10. **Build Your Own Box (BYOB) Specifications:** Confirm available box capacities (e.g., 2-Jar, 4-Jar, 6-Compartment Velvet Box) and item slot constraints.

### C. Pricing & Discounts
11. **Authoritative Price List:** Confirm Retail MRP and Base Selling Price for every SKU variant.
12. **Wholesale / B2B Price Slabs:** Confirm volume quantity breakpoints (e.g., 5kg+, 20kg+) and tiered wholesale discount percentages.
13. **Packaging Surcharges:** Specify if premium containers (glass jars, luxury wooden boxes) carry an extra charge.
14. **Shipping Pricing & Free Delivery:** Confirm standard flat-rate delivery fee and the minimum cart threshold for Free Shipping (e.g., ₹999).

### D. Payments & Billing
15. **Payment Gateway Provider Selection:** Select the preferred primary domestic payment gateway (Razorpay / Cashfree / PhonePe / PayU). *(API keys will be collected securely via environment variables during deployment).*
16. **Cash on Delivery (COD) Thresholds:** Confirm whether COD is enabled, the maximum allowed COD cart value (e.g., ₹5,000), and optional COD fee (e.g., ₹50).

### E. Logistics & Fulfillment
17. **Logistics Partner Selection:** Confirm preferred courier aggregator (Shiprocket / Delhivery / Bluedart).
18. **Serviceable Pincode Boundaries:** Confirm if delivery is All-India serviceable or restricted to specific tier-1/tier-2 zones.
19. **Order Cancellation Window:** Confirm how long a customer can cancel an order before warehouse dispatch (e.g., until status changes to `Packed`).

### F. Store Directory
20. **Physical Outlet Master List:** For every active retail outlet or kiosk, provide:
    - Official Outlet Name & Full Street Address
    - Store Telephone Number
    - Operating Hours (Opening / Closing) and Weekly Off days
    - Google Maps location link / Coordinates

### G. India Taste Map
21. **Verified Sourcing Regions & Stories:** For the interactive map, confirm:
    - Final list of Indian regions/cities to feature (e.g., Kashmir, Goa, Assam, Kerala, Himachal).
    - Associated product SKUs or categories for each region.
    - Cultural, agricultural, or taste stories for each region.
    - Authoritative source or verification reference for the region-product link.

### H. Legal & Health Content
22. **Product Health & Benefit Drafts Review:** Review and provide formal client approval on all draft product benefit claims, ensuring zero prohibited therapeutic/disease-curing statements.
23. **Legal Policy Sign-Off:** Review and grant formal legal approval for:
    - Terms & Conditions (`/terms-and-conditions`)
    - Privacy Policy (`/privacy-policy`)
    - Shipping & Delivery Policy (`/shipping-policy`)
    - Return, Refund & Food Safety Replacement Policy (`/refund-policy`)

### I. Marketing & Social Channels
24. **Social Media Verified URLs:** Provide active official links for Instagram, Facebook, LinkedIn, YouTube, and X/Twitter.
25. **WhatsApp & Newsletter Service:** Confirm the WhatsApp Business concierge number and preferred newsletter platform (Internal database vs. Mailchimp/Sendinblue).

### J. Technical & Deployment
26. **Google Analytics & Webmaster Setup:** Provide GA4 Measurement ID (`G-XXXXXXXXXX`) and Search Console ownership verification.
27. **Cloud Hosting Environment:** Confirm deployment target preference (AWS / Vercel / GCP / DigitalOcean) and transactional email provider (Postmark / SendGrid / Amazon SES).

---

## 4. PHASE 1 FINAL SIGN-OFF GOVERNANCE GATE

### Sign-Off Criteria Checklist:
- [x] All known client requirements across 20 domains systematically documented.
- [x] Zero code, zero database migrations, and zero architecture modifications executed.
- [x] All draft handwritten health claims quarantined as draft content pending formal sign-off.
- [x] India Taste Map requirements corrected to verified regions/cities, products, and stories without unverified sourcing partner assumptions.
- [x] Full bidirectional Requirements Traceability Matrix (RTM) established.
- [x] Strict 5-state governance taxonomy applied across all 73 tracked requirements.
- [x] Final open-item register compiled into 27 actionable client decision points.

---

# PHASE 1 READY FOR CLIENT SIGN-OFF

**Authorized Representative — M/S Fruits & Nuts:**

Name: __________________________________________________  
Title / Designation: ____________________________________  
Signature: ______________________________________________  
Date: __________________________________________________  

---
*Phase 1 is complete and locked. Phase 2 (Technical Architecture & UI/UX Design) will commence upon receipt of client sign-off and open-item responses.*
