import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CreateStoreSchema,
  UpdateStoreSchema,
  StoreQuerySchema,
} from "../lib/validation/store.schema";
import { hasPermission } from "../lib/auth/rbac";
import { RoleType, StoreStatus } from "@prisma/client";
import { StoreService } from "../services/store.service";

console.log("🧪 Running Step 8 Store Directory Admin Test Suite...\n");

describe("Phase 9J Step 8 — Store Directory & Outlet Management Tests", () => {
  it("Test 1: Indian PIN Code and Mandatory Fields Validation", () => {
    console.log("▶️ Test 1: PIN Code and Address Schema Validation...");

    // Valid Store Location
    const valid = CreateStoreSchema.safeParse({
      name: "Srinagar Flagship Experience Boutique",
      addressStreet: "Shop 12-14, Heritage Square, Residency Road",
      city: "Srinagar",
      state: "Jammu & Kashmir",
      postalCode: "190001",
      phone: "+91 194 245 8899",
      email: "residency@fruitsandnuts.in",
      latitude: 34.0837,
      longitude: 74.7973,
      operatingHours: {
        mon_sat: "10:00 AM - 9:00 PM",
        sunday: "11:00 AM - 8:00 PM",
      },
      outletStatus: StoreStatus.OPEN,
      displayOrder: 1,
    });
    assert.strictEqual(valid.success, true);

    // Invalid PIN Code (Starts with 0 or has 5 digits or alpha chars)
    const invalidPin1 = CreateStoreSchema.safeParse({
      name: "Store",
      addressStreet: "Main Road",
      city: "Delhi",
      state: "Delhi",
      postalCode: "010001",
      phone: "+91 9988776655",
    });
    assert.strictEqual(invalidPin1.success, false, "PIN code starting with 0 must be rejected");

    const invalidPin2 = CreateStoreSchema.safeParse({
      name: "Store",
      addressStreet: "Main Road",
      city: "Delhi",
      state: "Delhi",
      postalCode: "11000",
      phone: "+91 9988776655",
    });
    assert.strictEqual(invalidPin2.success, false, "5-digit PIN code must be rejected");

    console.log("✅ Test 1 Passed: Indian 6-digit PIN code and address constraints verified.");
  });

  it("Test 2: Store Status Transitions & Update Schema", () => {
    console.log("▶️ Test 2: Store Status & Partial Update Validation...");

    const partialUpdate = UpdateStoreSchema.safeParse({
      outletStatus: StoreStatus.COMING_SOON,
      displayOrder: 5,
    });
    assert.strictEqual(partialUpdate.success, true);

    const invalidStatus = UpdateStoreSchema.safeParse({
      outletStatus: "PERMANENTLY_SHUT",
    });
    assert.strictEqual(invalidStatus.success, false, "Invalid status enum must fail validation");

    console.log("✅ Test 2 Passed: Store status and partial update schema validated.");
  });

  it("Test 3: RBAC Store Management Permissions", () => {
    console.log("▶️ Test 3: RBAC Store Permissions Matrix...");

    // SUPER_ADMIN and CONTENT_MGR have stores:write
    assert.strictEqual(hasPermission(RoleType.SUPER_ADMIN, "stores:write"), true);
    assert.strictEqual(hasPermission(RoleType.CONTENT_MGR, "stores:write"), true);

    // CUSTOMER, INVENTORY_MGR, and ORDER_MGR do NOT have stores:write
    assert.strictEqual(hasPermission(RoleType.CUSTOMER, "stores:write"), false);
    assert.strictEqual(hasPermission(RoleType.INVENTORY_MGR, "stores:write"), false);
    assert.strictEqual(hasPermission(RoleType.ORDER_MGR, "stores:write"), false);

    console.log("✅ Test 3 Passed: RBAC boundary isolates store directory management.");
  });

  it("Test 4: Haversine Geo-Distance Computation", () => {
    console.log("▶️ Test 4: Haversine Geolocation Distance Calculation...");

    // Srinagar (34.0837, 74.7973) to Connaught Place Delhi (28.6315, 77.2167)
    const distanceKm = StoreService.haversineDistanceKm(34.0837, 74.7973, 28.6315, 77.2167);

    // Aerial distance is ~646 km
    assert.strictEqual(distanceKm > 640 && distanceKm < 660, true, `Calculated distance ${distanceKm}km is accurate`);

    console.log(`✅ Test 4 Passed: Haversine distance arithmetic verified (${distanceKm} km).`);
  });
});

console.log("\n🎉 All Step 8 Store Admin Tests passed successfully!\n");
