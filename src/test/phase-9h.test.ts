import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CreateReviewSchema, UpdateReviewStatusSchema, ReviewQuerySchema } from "../lib/validation/review.schema";
import { CreateTasteMapRegionSchema, PinCoordinatesSchema, SyncTasteMapProductsSchema } from "../lib/validation/taste-map.schema";
import { CreateStoreSchema, StoreQuerySchema } from "../lib/validation/store.schema";
import { CreateCMSSectionSchema, SectionKeySchema, UpdatePublishStatusSchema } from "../lib/validation/cms.schema";
import { StoreService } from "../services/store.service";
import { hasPermission, RolePermissions } from "../lib/auth/rbac";
import { RoleType, ModerationStatus, StoreStatus } from "@prisma/client";

console.log("🧪 Running Phase 9H (Reviews, Taste Map, Stores, CMS) Test Suite...\n");

// ==============================================================================
// 1. REVIEWS & RATINGS TESTS
// ==============================================================================
console.log("▶️ Test 1: Customer Review Schema & Constraint Validation...");

// Valid review
const validReview = CreateReviewSchema.parse({
  productId: "11111111-1111-1111-1111-111111111111",
  rating: 5,
  title: "Exquisite Quality Mamra Almonds",
  reviewText: "The crunch, oil content and freshness of these Kashmiri Mamra almonds are unmatched.",
  photos: ["https://cdn.fruitsandnuts.co.in/reviews/almond-pack.jpg"],
});
assert.equal(validReview.rating, 5);
assert.equal(validReview.photos?.length, 1);

// Bounded rating (must be 1..5)
assert.throws(
  () => {
    CreateReviewSchema.parse({
      productId: "11111111-1111-1111-1111-111111111111",
      rating: 6, // Invalid
      reviewText: "Too high rating test case.",
    });
  },
  /Rating cannot exceed 5 stars/,
  "Should reject rating > 5"
);

assert.throws(
  () => {
    CreateReviewSchema.parse({
      productId: "11111111-1111-1111-1111-111111111111",
      rating: 0, // Invalid
      reviewText: "Too low rating test case.",
    });
  },
  /Rating must be at least 1 star/,
  "Should reject rating < 1"
);

// Review text length constraints (< 10 chars rejected)
assert.throws(
  () => {
    CreateReviewSchema.parse({
      productId: "11111111-1111-1111-1111-111111111111",
      rating: 4,
      reviewText: "Good", // Too short
    });
  },
  /Review must contain at least 10 characters/,
  "Should reject review text shorter than 10 characters"
);

console.log("✅ Test 1 Passed: Review schema bounds and string lengths verified.");

console.log("▶️ Test 2: Review Moderation Status Schema & RBAC Gating...");

const validModeration = UpdateReviewStatusSchema.parse({
  status: ModerationStatus.APPROVED,
  moderationNotes: "Verified authentic customer feedback.",
});
assert.equal(validModeration.status, ModerationStatus.APPROVED);

// Moderation RBAC check
assert.equal(hasPermission(RoleType.SUPER_ADMIN, "reviews:moderate"), true);
assert.equal(hasPermission(RoleType.CONTENT_MGR, "reviews:moderate"), true);
assert.equal(hasPermission(RoleType.CUSTOMER, "reviews:moderate"), false);
assert.equal(hasPermission(RoleType.CUSTOMER, "customer:reviews:write"), true);

console.log("✅ Test 2 Passed: Review moderation workflow and RBAC rules verified.");

// ==============================================================================
// 2. INTERACTIVE INDIA TASTE MAP TESTS
// ==============================================================================
console.log("▶️ Test 3: Taste Map Pin Coordinates & Terroir Schema Validation...");

const validCoords = PinCoordinatesSchema.parse({
  xPct: 34.2,
  yPct: 18.5,
  lat: 34.0837,
  lng: 74.7973,
});
assert.equal(validCoords.xPct, 34.2);
assert.equal(validCoords.yPct, 18.5);

// Invalid coordinate percentages (> 100 or < 0)
assert.throws(
  () => {
    PinCoordinatesSchema.parse({
      xPct: 105.0, // Invalid percentage
      yPct: 20.0,
    });
  },
  /X coordinate percentage cannot exceed 100/,
  "Should reject xPct > 100"
);

const validRegion = CreateTasteMapRegionSchema.parse({
  name: "Kashmir Valley Terroir",
  slug: "kashmir-valley",
  state: "Jammu & Kashmir",
  pinCoordinates: { xPct: 34.2, yPct: 18.5 },
  culturalStory: "High altitude glacial valley renowned for royal Mamra almonds and snow-white walnuts.",
  verificationSource: "GI Tag Certified Origin",
  isPublished: true,
  displayOrder: 1,
});
assert.equal(validRegion.slug, "kashmir-valley");

// Slug format regex validation (must be URL safe)
assert.throws(
  () => {
    CreateTasteMapRegionSchema.parse({
      name: "Kashmir Valley",
      slug: "Kashmir Valley!", // Invalid slug
      state: "Jammu & Kashmir",
      pinCoordinates: { xPct: 34.2, yPct: 18.5 },
      culturalStory: "High altitude glacial valley...",
    });
  },
  /Slug must be lowercase alphanumeric with hyphens/,
  "Should reject malformed slug"
);

// RBAC Taste Map check
assert.equal(hasPermission(RoleType.SUPER_ADMIN, "taste_map:write"), true);
assert.equal(hasPermission(RoleType.CONTENT_MGR, "taste_map:write"), true);
assert.equal(hasPermission(RoleType.INVENTORY_MGR, "taste_map:write"), false);
assert.equal(hasPermission(RoleType.CUSTOMER, "taste_map:write"), false);

console.log("✅ Test 3 Passed: Taste Map coordinates, slug format, and RBAC verified.");

// ==============================================================================
// 3. STORE LOCATOR & HAVERSINE PROXIMITY TESTS
// ==============================================================================
console.log("▶️ Test 4: Store Locator Schema & PIN Code Validation...");

const validStore = CreateStoreSchema.parse({
  name: "M/S Fruits & Nuts Flagship Outlet",
  addressStreet: "Plot 42, Connaught Place, Inner Circle",
  city: "New Delhi",
  state: "Delhi",
  postalCode: "110001",
  phone: "9876543210",
  email: "store.delhi@fruitsandnuts.co.in",
  latitude: 28.6315,
  longitude: 77.2167,
  googleMapsUrl: "https://maps.google.com/?q=28.6315,77.2167",
  operatingHours: {
    monday_saturday: "10:00 AM - 9:30 PM",
    sunday: "11:00 AM - 8:00 PM",
  },
  outletStatus: StoreStatus.OPEN,
  displayOrder: 1,
});
assert.equal(validStore.postalCode, "110001");
assert.equal(validStore.outletStatus, StoreStatus.OPEN);

// Invalid Indian PIN code (< 6 digits or non-Indian prefix)
assert.throws(
  () => {
    CreateStoreSchema.parse({
      name: "Store",
      addressStreet: "Street 1",
      city: "Delhi",
      state: "Delhi",
      postalCode: "01001", // Invalid 5 digits
      phone: "9876543210",
    });
  },
  /Postal code must be a valid 6-digit Indian PIN code/,
  "Should reject invalid postal code"
);

console.log("✅ Test 4 Passed: Store schema and Indian postal PIN code rules verified.");

console.log("▶️ Test 5: Haversine Geolocation Distance Computation...");

// Distance between New Delhi (Connaught Place: 28.6315, 77.2167) and Mumbai (Bandra: 19.0596, 72.8295)
const delhiLat = 28.6315;
const delhiLon = 77.2167;
const mumbaiLat = 19.0596;
const mumbaiLon = 72.8295;

const distance = StoreService.haversineDistanceKm(delhiLat, delhiLon, mumbaiLat, mumbaiLon);
// Great circle distance between Delhi and Mumbai is ~1148 km (+/- 10 km)
assert.ok(
  distance >= 1140 && distance <= 1160,
  `Expected Delhi-Mumbai distance ~1148 km, got ${distance} km`
);

// Distance to same point must be 0
const zeroDistance = StoreService.haversineDistanceKm(delhiLat, delhiLon, delhiLat, delhiLon);
assert.equal(zeroDistance, 0);

console.log(`✅ Test 5 Passed: Haversine distance arithmetic verified (${distance} km calculated accurately).`);

// ==============================================================================
// 4. CMS & SECTION BUILDER TESTS
// ==============================================================================
console.log("▶️ Test 6: CMS Section Key, Layout JSON, and Publishing Schema...");

// Section Key format (Uppercase alphanumeric + underscores)
assert.equal(SectionKeySchema.parse("HOMEPAGE_HERO"), "HOMEPAGE_HERO");
assert.equal(SectionKeySchema.parse("ANNOUNCEMENT_BAR"), "ANNOUNCEMENT_BAR");

assert.throws(
  () => {
    SectionKeySchema.parse("homepage-hero"); // Invalid lowercase and hyphen
  },
  /Section key must be uppercase alphanumeric with underscores/,
  "Should reject lowercase section key"
);

// Valid CMS Section creation
const validCMS = CreateCMSSectionSchema.parse({
  sectionKey: "HOMEPAGE_HERO",
  title: "Flagship Luxury Harvest Slider",
  contentJson: {
    slides: [
      {
        id: "slide-1",
        headline: "Pure Harvests. Regal Terroirs.",
        subheadline: "Direct from the orchards of Kashmir and California.",
        ctaLabel: "Shop Royal Collection",
        ctaUrl: "/category/fruits-and-nuts",
        desktopImage: "https://cdn.fruitsandnuts.co.in/banners/hero-1.webp",
      },
    ],
  },
  isPublished: true,
  displayOrder: 1,
});
assert.equal(validCMS.sectionKey, "HOMEPAGE_HERO");
assert.equal(validCMS.isPublished, true);

// Publish status toggle
const publishToggle = UpdatePublishStatusSchema.parse({ isPublished: false });
assert.equal(publishToggle.isPublished, false);

// RBAC CMS check
assert.equal(hasPermission(RoleType.SUPER_ADMIN, "cms:write"), true);
assert.equal(hasPermission(RoleType.CONTENT_MGR, "cms:write"), true);
assert.equal(hasPermission(RoleType.CUSTOMER, "cms:write"), false);
assert.equal(hasPermission(RoleType.CUSTOMER, "cms:read"), true);

console.log("✅ Test 6 Passed: CMS section validation, JSON layout parsing, and RBAC permissions verified.");

console.log("\n🎉 All Phase 9H (Reviews, Taste Map, Store Locator, CMS) Tests passed successfully!\n");
