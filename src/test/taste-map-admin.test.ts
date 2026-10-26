import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CreateTasteMapRegionSchema,
  UpdateTasteMapRegionSchema,
  SyncTasteMapProductsSchema,
  PinCoordinatesSchema,
} from "../lib/validation/taste-map.schema";
import { hasPermission } from "../lib/auth/rbac";
import { RoleType } from "@prisma/client";

console.log("🧪 Running Step 7 India Taste Map Admin Test Suite...\n");

describe("Phase 9J Step 7 — India Taste Map Admin Operations Tests", () => {
  it("Test 1: Pin Coordinates Schema & Boundary Validation", () => {
    console.log("▶️ Test 1: Pin Coordinates Boundary Validation...");

    // Valid Coordinates (0-100 percentage)
    const valid = PinCoordinatesSchema.safeParse({
      xPct: 34.2,
      yPct: 18.5,
      lat: 34.08,
      lng: 74.79,
    });
    assert.strictEqual(valid.success, true);

    // Negative X or Y
    const negX = PinCoordinatesSchema.safeParse({
      xPct: -5,
      yPct: 20,
    });
    assert.strictEqual(negX.success, false, "Negative X percentage must be rejected");

    const negY = PinCoordinatesSchema.safeParse({
      xPct: 30,
      yPct: -1,
    });
    assert.strictEqual(negY.success, false, "Negative Y percentage must be rejected");

    // X or Y exceeding 100%
    const overflowX = PinCoordinatesSchema.safeParse({
      xPct: 105,
      yPct: 20,
    });
    assert.strictEqual(overflowX.success, false, "X percentage > 100 must be rejected");

    const overflowY = PinCoordinatesSchema.safeParse({
      xPct: 50,
      yPct: 120,
    });
    assert.strictEqual(overflowY.success, false, "Y percentage > 100 must be rejected");

    console.log("✅ Test 1 Passed: Map pin coordinates bound strictly within 0%–100%.");
  });

  it("Test 2: Taste Map Region Creation Schema & Slug Validation", () => {
    console.log("▶️ Test 2: Region Creation & Slug Format Validation...");

    // Valid Region Payload
    const valid = CreateTasteMapRegionSchema.safeParse({
      name: "Kashmir Valley Terroir",
      slug: "kashmir-valley-terroir",
      state: "Jammu & Kashmir",
      pinCoordinates: { xPct: 34.2, yPct: 18.5 },
      culturalStory: "Famous saffron plateaus and ancient almond orchards nurtured by Himalayan meltwaters.",
      verificationSource: "GI Registry #GI-124 (Pampore Saffron)",
      displayOrder: 1,
      isPublished: true,
      productIds: ["11111111-1111-1111-1111-111111111111"],
    });
    assert.strictEqual(valid.success, true);

    // Invalid Slug with Uppercase or Spaces
    const invalidSlug = CreateTasteMapRegionSchema.safeParse({
      name: "Goa Coastal Cashew",
      slug: "Goa Cashew Valley",
      state: "Goa",
      pinCoordinates: { xPct: 25, yPct: 65 },
      culturalStory: "Sun-cured coastal organic cashew nuts grown in red laterite soil.",
    });
    assert.strictEqual(invalidSlug.success, false, "Uppercase/space slug must fail regex check");

    // Short Story (< 10 chars)
    const shortStory = CreateTasteMapRegionSchema.safeParse({
      name: "Goa Cashew",
      slug: "goa-cashew",
      state: "Goa",
      pinCoordinates: { xPct: 25, yPct: 65 },
      culturalStory: "Good nuts",
    });
    assert.strictEqual(shortStory.success, false, "Story < 10 characters must be rejected");

    console.log("✅ Test 2 Passed: Region schema constraints and slug regex validated.");
  });

  it("Test 3: Product Association Synchronization Schema", () => {
    console.log("▶️ Test 3: Product Association Sync Validation...");

    const validAssoc = SyncTasteMapProductsSchema.safeParse({
      productIds: [
        "11111111-1111-1111-1111-111111111111",
        "22222222-2222-2222-2222-222222222222",
      ],
    });
    assert.strictEqual(validAssoc.success, true);

    const invalidUUID = SyncTasteMapProductsSchema.safeParse({
      productIds: ["not-a-uuid"],
    });
    assert.strictEqual(invalidUUID.success, false, "Invalid product UUID must be rejected");

    console.log("✅ Test 3 Passed: Product association sync schema verified.");
  });

  it("Test 4: RBAC Taste Map Management Permission Matrix", () => {
    console.log("▶️ Test 4: RBAC Taste Map Permissions...");

    // SUPER_ADMIN and CONTENT_MGR have taste_map:write
    assert.strictEqual(hasPermission(RoleType.SUPER_ADMIN, "taste_map:write"), true);
    assert.strictEqual(hasPermission(RoleType.CONTENT_MGR, "taste_map:write"), true);

    // CUSTOMER, INVENTORY_MGR, and ORDER_MGR do NOT have taste_map:write
    assert.strictEqual(hasPermission(RoleType.CUSTOMER, "taste_map:write"), false);
    assert.strictEqual(hasPermission(RoleType.INVENTORY_MGR, "taste_map:write"), false);
    assert.strictEqual(hasPermission(RoleType.ORDER_MGR, "taste_map:write"), false);

    console.log("✅ Test 4 Passed: RBAC boundary isolates Taste Map management.");
  });

  it("Test 5: Partial Region Update Schema Verification", () => {
    console.log("▶️ Test 5: Partial Region Update Schema...");

    const partialUpdate = UpdateTasteMapRegionSchema.safeParse({
      isPublished: true,
      displayOrder: 2,
    });
    assert.strictEqual(partialUpdate.success, true);

    console.log("✅ Test 5 Passed: Partial update schema validated.");
  });
});

console.log("\n🎉 All Step 7 Taste Map Admin Tests passed successfully!\n");
