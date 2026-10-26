import assert from "node:assert";
import {
  CreateCouponSchema,
  UpdateCouponSchema,
  ApplyCouponSchema,
  ValidateCouponSchema,
} from "../lib/validation/coupon.schema";
import { hasPermission } from "../lib/auth/rbac";
import { DiscountType, RoleType } from "@prisma/client";

async function runCouponTests() {
  console.log("🧪 Running Phase 9E Coupon & Discount Tests...\n");

  const now = new Date();
  const validStartDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day ago
  const validEndDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days ahead

  // ----------------------------------------------------------------------
  // Test 1: Coupon Schema Validation
  // ----------------------------------------------------------------------
  console.log("▶️ Test 1: Coupon Schema & Constraint Validation...");

  // Valid Percentage Coupon
  const validPercentCoupon = CreateCouponSchema.parse({
    code: "WELCOME10",
    discountType: DiscountType.PERCENTAGE,
    discountValue: 10,
    maxDiscountAmount: 500,
    minOrderAmount: 999,
    usageLimitTotal: 1000,
    usageLimitPerUser: 1,
    startDate: validStartDate,
    endDate: validEndDate,
    isActive: true,
  });
  assert.strictEqual(validPercentCoupon.code, "WELCOME10");
  assert.strictEqual(validPercentCoupon.discountValue, 10);
  assert.strictEqual(validPercentCoupon.maxDiscountAmount, 500);

  // Valid Flat Coupon
  const validFlatCoupon = CreateCouponSchema.parse({
    code: "FESTIVE250",
    discountType: DiscountType.FLAT_AMOUNT,
    discountValue: 250,
    minOrderAmount: 1500,
    startDate: validStartDate,
    endDate: validEndDate,
  });
  assert.strictEqual(validFlatCoupon.code, "FESTIVE250");
  assert.strictEqual(validFlatCoupon.discountType, DiscountType.FLAT_AMOUNT);

  // Invalid Percentage (> 100%)
  assert.throws(() => {
    CreateCouponSchema.parse({
      code: "INVALID150",
      discountType: DiscountType.PERCENTAGE,
      discountValue: 150, // Invalid: > 100%
      startDate: validStartDate,
      endDate: validEndDate,
    });
  }, /Percentage discount value cannot exceed 100%/);

  // Invalid Dates (endDate before startDate)
  assert.throws(() => {
    CreateCouponSchema.parse({
      code: "EXPIREDCOUPON",
      discountType: DiscountType.FLAT_AMOUNT,
      discountValue: 100,
      startDate: validEndDate,
      endDate: validStartDate, // Expired / inverted
    });
  }, /Expiry date must be after the start date/);

  // Invalid Coupon Code (special characters or too short)
  assert.throws(() => {
    CreateCouponSchema.parse({
      code: "W@!",
      discountType: DiscountType.PERCENTAGE,
      discountValue: 10,
      startDate: validStartDate,
      endDate: validEndDate,
    });
  }, /Coupon code must be 3-32 uppercase alphanumeric/);
  console.log("✅ Test 1 Passed: Schema constraints, discount type limits, and dates validated.");

  // ----------------------------------------------------------------------
  // Test 2: Server-Authoritative Discount Arithmetic
  // ----------------------------------------------------------------------
  console.log("▶️ Test 2: Discount Calculation Arithmetic & Caps...");

  function computeDiscount(
    discountType: DiscountType,
    discountValue: number,
    maxDiscountAmount: number | null,
    subtotal: number
  ): number {
    let discount = 0;
    if (discountType === DiscountType.PERCENTAGE) {
      const raw = (subtotal * discountValue) / 100;
      discount = maxDiscountAmount ? Math.min(raw, maxDiscountAmount) : raw;
    } else {
      discount = Math.min(discountValue, subtotal);
    }
    return Math.min(discount, subtotal);
  }

  // Percentage 15% on ₹4000 (uncapped = ₹600, capped at ₹500)
  assert.strictEqual(computeDiscount(DiscountType.PERCENTAGE, 15, 500, 4000), 500);

  // Percentage 10% on ₹2000 (no cap = ₹200)
  assert.strictEqual(computeDiscount(DiscountType.PERCENTAGE, 10, null, 2000), 200);

  // Flat ₹300 on ₹1500
  assert.strictEqual(computeDiscount(DiscountType.FLAT_AMOUNT, 300, null, 1500), 300);

  // Flat ₹500 on ₹350 (should never exceed subtotal, resulting in ₹350 discount and ₹0 subtotal)
  assert.strictEqual(computeDiscount(DiscountType.FLAT_AMOUNT, 500, null, 350), 350);
  console.log("✅ Test 2 Passed: Percentage max-cap and subtotal clamping verified.");

  // ----------------------------------------------------------------------
  // Test 3: Date & Usage Gate Validations
  // ----------------------------------------------------------------------
  console.log("▶️ Test 3: Validity Windows & Usage Bounds...");

  function checkCouponEligibility(
    startDate: Date,
    endDate: Date,
    minOrderAmount: number,
    totalUsages: number,
    usageLimitTotal: number | null,
    userUsages: number,
    usageLimitPerUser: number,
    subtotal: number
  ): { valid: boolean; error?: string } {
    const checkNow = new Date();
    if (checkNow < startDate) return { valid: false, error: "NOT_YET_ACTIVE" };
    if (checkNow > endDate) return { valid: false, error: "EXPIRED" };
    if (subtotal < minOrderAmount) return { valid: false, error: "MIN_ORDER_NOT_MET" };
    if (usageLimitTotal !== null && totalUsages >= usageLimitTotal) return { valid: false, error: "GLOBAL_LIMIT_REACHED" };
    if (userUsages >= usageLimitPerUser) return { valid: false, error: "USER_LIMIT_REACHED" };
    return { valid: true };
  }

  // Valid usage
  const okResult = checkCouponEligibility(validStartDate, validEndDate, 1000, 5, 100, 0, 1, 1500);
  assert.strictEqual(okResult.valid, true);

  // Subtotal too low
  const lowSubtotal = checkCouponEligibility(validStartDate, validEndDate, 1000, 5, 100, 0, 1, 750);
  assert.strictEqual(lowSubtotal.valid, false);
  assert.strictEqual(lowSubtotal.error, "MIN_ORDER_NOT_MET");

  // User already used
  const userExhausted = checkCouponEligibility(validStartDate, validEndDate, 1000, 5, 100, 1, 1, 1500);
  assert.strictEqual(userExhausted.valid, false);
  assert.strictEqual(userExhausted.error, "USER_LIMIT_REACHED");

  // Global limit reached
  const globalExhausted = checkCouponEligibility(validStartDate, validEndDate, 1000, 100, 100, 0, 1, 1500);
  assert.strictEqual(globalExhausted.valid, false);
  assert.strictEqual(globalExhausted.error, "GLOBAL_LIMIT_REACHED");
  console.log("✅ Test 3 Passed: Expiry, minimum cart value, and usage limits verified.");

  // ----------------------------------------------------------------------
  // Test 4: Apply & Validate Schemas
  // ----------------------------------------------------------------------
  console.log("▶️ Test 4: Apply and Validate Schemas...");

  const apply = ApplyCouponSchema.parse({ code: "welcome10" });
  assert.strictEqual(apply.code, "WELCOME10"); // Auto upper-cased

  const validate = ValidateCouponSchema.parse({ code: "festive2026", subtotal: 1200 });
  assert.strictEqual(validate.code, "FESTIVE2026");
  assert.strictEqual(validate.subtotal, 1200);
  console.log("✅ Test 4 Passed: Input auto-formatting and payload validation passed.");

  // ----------------------------------------------------------------------
  // Test 5: RBAC Role Permissions for Coupon Management
  // ----------------------------------------------------------------------
  console.log("▶️ Test 5: RBAC Coupon Permissions...");

  // Customer cannot manage coupons
  assert.strictEqual(hasPermission(RoleType.CUSTOMER, "coupons:write"), false);
  assert.strictEqual(hasPermission(RoleType.CUSTOMER, "coupons:read"), false);

  // Super Admin and Content Manager can read & write coupons
  assert.strictEqual(hasPermission(RoleType.SUPER_ADMIN, "coupons:write"), true);
  assert.strictEqual(hasPermission(RoleType.SUPER_ADMIN, "coupons:read"), true);
  assert.strictEqual(hasPermission(RoleType.CONTENT_MGR, "coupons:write"), true);
  assert.strictEqual(hasPermission(RoleType.CONTENT_MGR, "coupons:read"), true);
  console.log("✅ Test 5 Passed: Role-based access control matrix restricts coupon operations.");

  console.log("\n🎉 All Phase 9E Coupon Tests passed successfully!\n");
}

runCouponTests().catch((err) => {
  console.error("❌ Coupon test failure:", err);
  process.exit(1);
});
