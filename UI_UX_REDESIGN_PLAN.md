# UI/UX REDESIGN MASTER PLAN — M/S FRUITS & NUTS PLATFORM

**Brand:** M/S Fruits & Nuts ("Nutrition with an Emotion")  
**Design Objective:** Transform the current storefront into a world-class, luxury gourmet e-commerce destination reminiscent of royal heritage houses (Fortnum & Mason, Bateel, TWG Tea) combined with contemporary e-commerce precision.  
**Mandate:** Mandatory full UI/UX redesign and functionality fixes. No cheap AI gimmicks, no floating widgets, no fake urgency.

---

## 1. Visual Identity & Design System Specifications

### 1.1 Color Palette Architecture
The palette is grounded in authentic natural terroirs, imperial botanicals, and hand-finished metallics.

| Token Name | Hex Code | Semantic Role | Usage Application |
|---|---|---|---|
| **Imperial Forest** | `#173D2C` | Primary Brand Color | Primary buttons, active states, header accents, high-contrast badges |
| **Deep Canopy** | `#102C21` | Deep Surface / Footer | Footers, dark hero stages, high-contrast modal headers |
| **Artisan Gold** | `#C3A15D` | Accent / Luxury Metallic | Primary button outlines, active tab borders, rating stars, price highlights |
| **Champagne Lustre**| `#D4B776` | Metallic Highlight | Badges, subtle dividers, dark-surface typography accents |
| **Parchment Warm** | `#FAF7F0` | Primary Surface Ground | Primary background across all pages, card surfaces, clean canvas |
| **Pure Alabaster** | `#FFFFFF` | Elevated Card Surface | Product cards, checkout form containers, dropdown menus, modals |
| **Terroir Stone** | `#E5DEC9` | Subtle Border Token | 1px clean architectural card borders, table dividers, input borders |
| **Charcoal Bark** | `#242824` | Primary Typography | Headers, primary titles, prices, critical data points |
| **Muted Sage** | `#5F6D65` | Secondary Typography | Subtitles, product weights, SKU labels, secondary descriptions |

### 1.2 Typography Hierarchy
- **Primary Serif Display Font:** `Playfair Display` (Headings, hero titles, product names, price numerals)
  - Scale: H1 (36px–52px), H2 (28px–36px), H3 (20px–24px), H4 (16px–18px)
- **Primary Sans-Serif Body Font:** `Plus Jakarta Sans` (Body text, UI labels, buttons, navigation, metadata)
  - Scale: Body Large (16px), Body Regular (14px), Caption / Meta (12px), Micro (10px–11px uppercase tracking)
- **Rules:** Strict elimination of chaotic fonts. Consistent letter-spacing (`tracking-tight` on large headings, `tracking-[0.16em]` on micro-eyebrows).

### 1.3 Layout & Structural Consistency
- **Container Max Width:** `max-w-7xl` (1280px) centered with responsive padding (`px-4 sm:px-6 lg:px-8`).
- **Border Radii:** Refined and architectural (`rounded-lg` / 8px for cards and buttons; `rounded-xl` / 12px for modal dialogues). **Eliminated:** excessive bubble radii (`rounded-3xl` and `rounded-full` everywhere).
- **Shadows:** Soft, natural elevation (`shadow-xs` / `shadow-sm`, subtle hover lift `hover:shadow-md`). **Eliminated:** neon-colored glow effects and excessive gradient overlays.

---

## 2. Elements To Remove (Anti-Patterns Eradication)

1. **Floating Intrusive Widgets:** Completely remove the floating "Ask Sommelier" action button from `RootLayout`. Replace with an intentional header concierge link.
2. **Duplicated Homepage Shelves:** Remove the redundant "Shop by Everyday Need" (6 giant cards) which duplicated the 8-category catalogue, creating choice fatigue.
3. **Gratuitous Animations:** Remove bouncing, pulsing badges, and infinite spinning gradients. Replace with crisp 200ms ease-out hover transitions.
4. **Artificial Trust Elements:** Remove fake timers, fake urgency indicators ("Only 2 left in stock" when inventory is high), and synthetic testimonials.
5. **Bloated Filter Sliders:** Remove confusing multiple sliders and granular tags. Consolidate into 4 clean, essential filter dimensions.

---

## 3. Page-by-Page Transformation Blueprint

### 3.1 Homepage
- **Hero Stage:** Premium editorial showcase featuring authentic product photography of Kashmiri Mamra Almonds, W180 Goan Cashews, and Jordan Medjool Dates on rich `#173D2C` background with subtle gold borders. Clear value proposition: "Everyday Indulgence, Naturally. Handpicked, sealed fresh, and delivered across India."
- **Curated Category Grid:** 8 elegant tiles (`#FFFFFF` on `#FAF7F0`) with genuine photography, high-grade tags, and direct collection routing.
- **Customer Bestsellers Shelf:** Single responsive tabbed grid (Nuts, Dates, Teas, Chocolates) displaying real product cards with authentic prices, pack weights, and quick-add actions.
- **Estate Tea Atelier Showcase:** Dedicated luxury panel highlighting orthodox tea varieties, Kashmiri Kahwa, and authentic CTC blends.
- **Royal Box Builder (BYOB) Feature:** Streamlined 4-step interactive gift curation callout.
- **Physical Boutiques Strip:** Clean, verified address directory for Gurgaon and Ludhiana stores.

### 3.2 Header & Navigation
- **Top Utility Strip:** Clean brand message ("Free Express Delivery across India over ₹999 • 100% Genuine Terroirs").
- **Main Bar:** Crisp logo presentation, streamlined search bar trigger (Cmd+K), verified account icon, wishlist count badge, and reactive cart summary trigger.
- **Category Navigation Bar:** Clean horizontal navigation strip with clear active indicators (`border-b-2 border-[#C3A15D]`).
- **Mobile Navigation Drawer:** Full-height slide-over drawer with 48px touch targets, direct category links, customer login, and store locator.

### 3.3 Product Listing & Consolidated Filtering (`/shop` & `/category/[slug]`)
- **Consolidated 4-Filter System:**
  1. *Category:* Clean radio list with active count indicators.
  2. *Price Range:* Intuitive range buttons (Under ₹500, ₹500–₹1,000, ₹1,000–₹2,000, Above ₹2,000).
  3. *Availability:* Clean toggle for "In Stock Only".
  4. *Sorting:* Dropdown (Featured, Price: Low to High, Price: High to Low, Customer Rating).
- **Active Filter Bar:** Visual chips showing active filters with a single "Clear All" action.
- **Product Card Architecture:** Consistent aspect ratio (1:1), crisp primary image with smooth hover zoom, verified terroir badge, clear pack weight selector, MRP struck-through with savings percent, and prominent "Add to Bag" button.

### 3.4 Product Detail Page (PDP)
- **Imagery Stage:** Large primary photograph container with thumbnail carousel below.
- **Product Info:** Refined serif headline, origin terroir pill, FSSAI compliance stamp.
- **Variant Selector:** Interactive weight buttons (250g, 500g, 1kg) with dynamic price calculation, unit economics (e.g. "₹260/100g"), and stock indicator.
- **Action Zone:** Quantity selector stepper, primary "Add to Bag" button, secondary "Buy with COD" button, and WhatsApp inquiry option.
- **Structured Accordions:**
  - *Terroir & Sourcing:* Origin story, processing method.
  - *Nutritional Profile:* Energy, Protein, Dietary Fiber, Healthy Fats table.
  - *Storage & Freshness:* Airtight container guidance, shelf-life months.

### 3.5 Cart & Mini-Drawer
- **Header:** Item count, free shipping progress bar (`₹X away from Free Delivery`).
- **Line Items:** High-res thumbnail, title, selected weight variant, quantity incrementer/decrementer, line total, and 1-click removal.
- **Gift Wrap Addon:** Elegant toggle for royal gift packaging (+₹150) with gift message input.
- **Summary:** Subtotal, Delivery Fee (₹0 if > ₹999), Gift Packaging, Grand Total.
- **CTAs:** High-contrast "Proceed to Checkout" button and "Continue Shopping" link.

### 3.6 Checkout Experience
- **Two-Column Layout:** Left column for Shipping & Contact information; Right column for Sticky Order Summary.
- **Form Design:** Clean floating labels, auto-complete attributes, postal code validation, optional GSTIN invoice fields.
- **Payment Method:** Dedicated Cash on Delivery (COD) card with explicit delivery notes.
- **Order Security:** Double-submission lock, rate-limiting notice, clear refund/replacement guarantee.

### 3.7 Customer Account & Order History
- **Dashboard Overview:** Member profile card, quick navigation links (Orders, Wishlist, Addresses, Profile).
- **Order History Cards:** Real database orders with date, order number (`FN-2026-XXXXX`), status pill, item thumbnails, total amount, and direct "Track Order" button.
- **Empty States:** Tastefully designed empty state with "Start Shopping" button linking to Bestsellers.

### 3.8 Wishlist Page (`/wishlist`)
- **Grid Layout:** 3-4 column responsive grid matching product cards.
- **Actions:** Instant "Move to Bag" action, "Remove from Wishlist", and stock availability badges.
- **Zero-State:** Clean luxury illustration with "Explore Royal Harvests" CTA.

### 3.9 Order Tracking (`/account/orders/[id]/track`)
- **Chronological Stepper:** 6-stage vertical or horizontal milestone timeline:
  1. Order Placed
  2. Confirmed & Scheduled
  3. Graded & Packed
  4. Shipped (with Courier AWB if manifested)
  5. Out for Delivery
  6. Delivered
- **Live Status:** Displays real database timestamps and fulfillment notes.

### 3.10 Admin Console Polish
- **Product Creator & Editor:** Category dropdown that loads reliably on mount with instant subcategory filtering, clear error handling, variant inventory inputs, and image preview.
- **Order Management:** Clear tabular list with status update modals for order managers.
