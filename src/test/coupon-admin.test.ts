import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CreateCouponSchema,
  UpdateCouponSchema,
  AdminCouponListQuerySchema,
  ValidateCouponSchema,
} from "../lib/validation/coupon.schema";
import { hasPermission } from "../lib/auth/rbac";
import { DiscountType, RoleType } from "@prisma/client";

console.log("🧪 Running Step 10 Coupon & Promotional Campaign Admin Test Suite...\n");

describe("Phase 9J Step 10 — Coupon & Promotional Campaign Admin Tests", () => {
  it("Test 1: Coupon Code & Discount Value Schema Validation", () => {
    console.log("▶️ Test 1: Coupon Code & Discount Value Validation...");

    // Valid Percentage Coupon
    const validPercent = CreateCouponSchema.safeParse({
      code: "ROYAL15",
      discountType: DiscountType.PERCENTAGE,
      discountValue: 15,
      maxDiscountAmount: 500,
      minOrderAmount: 999,
      usageLimitTotal: 1000,
      usageLimitPerUser: 1,
      startDate: new Date("2026-10-01T00:00:00Z"),
      endDate: new Date("2026-11-01T00:00:00Z"),
      isActive: true,
    });
    assert.strictEqual(validPercent.success, true);

    // Valid Flat Amount Coupon
    const validFlat = CreateCouponSchema.safeParse({
      code: "FLAT200OFF",
      discountType: DiscountType.FLAT_AMOUNT,
      discountValue: 200,
      minOrderAmount: 1499,
      usageLimitTotal: 500,
      usageLimitPerUser: 2,
      startDate: new Date("2026-10-01T00:00:00Z"),
      endDate: new Date("2026-12-31T00:00:00Z"),
      isActive: true,
    });
    assert.strictEqual(validFlat.success, true);

    // Invalid: Percentage discount exceeding 100%
    const invalidPercent = CreateCouponSchema.safeParse({
      code: "SUPER150",
      discountType: DiscountType.PERCENTAGE,
      discountValue: 150, // Exceeds 100%
      startDate: new Date("2026-10-01T00:00:00Z"),
      endDate: new Date("2026-11-01T00:00:00Z"),
    });
    assert.strictEqual(invalidPercent.success, false, "Percentage discount > 100% must fail validation");

    // Invalid: Negative discount value
    const negativeDiscount = CreateCouponSchema.safeParse({
      code: "INVALID_NEG",
      discountType: DiscountType.FLAT_AMOUNT,
      discountValue: -50,
      startDate: new Date("2026-10-01T00:00:00Z"),
      endDate: new Date("2026-11-01T00:00:00Z"),
    });
    assert.strictEqual(negativeDiscount.success, false, "Negative discount value must fail validation");

    console.log("✅ Test 1 Passed: Coupon discount types and percentage limits verified.");
  });

  it("Test 2: Date Window Constraints Validation", () => {
    console.log("▶️ Test 2: Date Range Invariants (End > Start)...");

    // Invalid: End date before start date
    const invertedDates = CreateCouponSchema.safeParse({
      code: "EXPIRED_TEST",
      discountType: DiscountType.PERCENTAGE,
      discountValue: 10,
      startDate: new Date("2026-12-01T00:00:00Z"),
      endDate: new Date("2026-10-01T00:00:00Z"), // Earlier than start date
    });
    assert.strictEqual(invertedDates.success, false, "End date earlier than start date must fail validation");

    // Invalid: Same start and end date
    const sameDates = CreateCouponSchema.safeParse({
      code: "SAME_DATE_TEST",
      discountType: DiscountType.PERCENTAGE,
      discountValue: 10,
      startDate: new Date("2026-10-01T00:00:00Z"),
      endDate: new Date("2026-10-01T00:00:00Z"),
    });
    assert.strictEqual(sameDates.success, false, "Same start and end date must fail validation");

    console.log("✅ Test 2 Passed: Date range invariants strictly enforced.");
  });

  it("Test 3: Coupon Code Formatting Constraints", () => {
    console.log("▶️ Test 3: Coupon Code Format Constraints...");

    // Valid formats
    assert.strictEqual(CreateCouponSchema.safeParse({
      code: "FESTIVE_2026",
      discountType: DiscountType.FLAT_AMOUNT,
      discountValue: 100,
      startDate: new Date("2026-10-01T00:00:00Z"),
      endDate: new Date("2026-11-01T00:00:00Z"),
    }).success, true);

    // Invalid formats: lowercase, spaces, special chars
    const invalidCode1 = CreateCouponSchema.safeParse({
      code: "festive 2026",
      discountType: DiscountType.FLAT_AMOUNT,
      discountValue: 100,
      startDate: new Date("2026-10-01T00:00:00Z"),
      endDate: new Date("2026-11-01T00:00:00Z"),
    });
    assert.strictEqual(invalidCode1.success, false, "Coupon codes with spaces must fail");

    const invalidCode2 = CreateCouponSchema.safeParse({
      code: "AB", // Too short (< 3 chars)
      discountType: DiscountType.FLAT_AMOUNT,
      discountValue: 100,
      startDate: new Date("2026-10-01T00:00:00Z"),
      endDate: new Date("2026-11-01T00:00:00Z"),
    });
    assert.strictEqual(invalidCode2.success, false, "Coupon codes < 3 characters must fail");

    console.log("✅ Test 3 Passed: Coupon code formatting constraints enforced.");
  });

  it("Test 4: RBAC Coupon Management Permissions Matrix", () => {
    console.log("▶️ Test 4: RBAC Coupon Permissions Matrix...");

    // SUPER_ADMIN and CONTENT_MGR have coupons:write and coupons:read
    assert.strictEqual(hasPermission(RoleType.SUPER_ADMIN, "coupons:read"), true);
    assert.strictEqual(hasPermission(RoleType.SUPER_ADMIN, "coupons:write"), true);

    assert.strictEqual(hasPermission(RoleType.CONTENT_MGR, "coupons:read"), true);
    assert.strictEqual(hasPermission(RoleType.CONTENT_MGR, "coupons:write"), true);

    // INVENTORY_MGR and ORDER_MGR do NOT have coupons:write
    assert.strictEqual(hasPermission(RoleType.INVENTORY_MGR, "coupons:write"), false);
    assert.strictEqual(hasPermission(RoleType.ORDER_MGR, "coupons:write"), false);

    // CUSTOMER does NOT have coupons:write or coupons:read (admin route)
    assert.strictEqual(hasPermission(RoleType.CUSTOMER, "coupons:write"), false);
    assert.strictEqual(hasPermission(RoleType.CUSTOMER, "coupons:read"), false);

    console.log("✅ Test 4 Passed: RBAC boundary isolates coupon campaign management.");
  });

  it("Test 5: Storefront Coupon Validation Schema", () => {
    console.log("▶️ Test 5: Storefront Coupon Application & Validation Schema...");

    const validValidate = ValidateCouponSchema.safeParse({
      code: "ROYAL10",
      subtotal: 1250.50,
    });
    assert.strictEqual(validValidate.success, true);

    const negativeSubtotal = ValidateCouponSchema.safeParse({
      code: "ROYAL10",
      subtotal: -100,
    });
    assert.strictEqual(negativeSubtotal.success, false, "Negative cart subtotal must fail validation");

    console.log("✅ Test 5 Passed: Storefront validation schema constraints verified.");
  });
});
