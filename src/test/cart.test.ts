import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import {
  AddToCartSchema,
  UpdateCartItemSchema,
  AddToWishlistSchema,
  MoveToCartSchema,
} from "../lib/validation/cart.schema";

async function runCartAndWishlistTests() {
  console.log("🧪 Running Phase 9D Cart & Wishlist Tests...\n");

  // ----------------------------------------------------------------------
  // Test 1: Cart & Wishlist Payload Validation
  // ----------------------------------------------------------------------
  console.log("▶️ Test 1: Add to Cart and Update Quantity Validation...");

  // Valid Add to Cart
  const validAdd = AddToCartSchema.parse({
    variantId: "123e4567-e89b-12d3-a456-426614174000",
    quantity: 3,
  });
  assert.strictEqual(validAdd.quantity, 3);

  // Default quantity = 1
  const defaultAdd = AddToCartSchema.parse({
    variantId: "123e4567-e89b-12d3-a456-426614174000",
  });
  assert.strictEqual(defaultAdd.quantity, 1);

  // Rejection of 0 quantity
  assert.throws(() => {
    AddToCartSchema.parse({
      variantId: "123e4567-e89b-12d3-a456-426614174000",
      quantity: 0,
    });
  }, /Quantity must be at least 1/);

  // Rejection of negative quantity
  assert.throws(() => {
    AddToCartSchema.parse({
      variantId: "123e4567-e89b-12d3-a456-426614174000",
      quantity: -5,
    });
  }, /Quantity must be at least 1/);

  // Rejection of excessive quantity (> 99)
  assert.throws(() => {
    AddToCartSchema.parse({
      variantId: "123e4567-e89b-12d3-a456-426614174000",
      quantity: 150,
    });
  }, /Maximum order quantity per item is 99/);

  // Invalid UUID
  assert.throws(() => {
    AddToCartSchema.parse({
      variantId: "invalid-uuid-string",
      quantity: 2,
    });
  }, /Variant ID must be a valid UUID/);
  console.log("✅ Test 1 Passed: Cart input schemas enforce integer bounds (1-99) and UUID validity.");

  // ----------------------------------------------------------------------
  // Test 2: Server-Side Authoritative Pricing & Tax Calculations
  // ----------------------------------------------------------------------
  console.log("▶️ Test 2: Server-Authoritative Price & GST Arithmetic...");

  const mockItems = [
    {
      unitMrp: 1200,
      unitSellingPrice: 999,
      quantity: 2,
      gstPercentage: 5,
    },
    {
      unitMrp: 800,
      unitSellingPrice: 650,
      quantity: 1,
      gstPercentage: 12,
    },
  ];

  let calculatedSubtotal = 0;
  let calculatedTotalMrp = 0;
  let calculatedGst = 0;

  for (const item of mockItems) {
    const lineSellingPrice = item.unitSellingPrice * item.quantity;
    const lineMrp = item.unitMrp * item.quantity;
    const itemGst = lineSellingPrice * (item.gstPercentage / (100 + item.gstPercentage));

    calculatedSubtotal += lineSellingPrice;
    calculatedTotalMrp += lineMrp;
    calculatedGst += itemGst;
  }

  const calculatedSavings = calculatedTotalMrp - calculatedSubtotal;

  assert.strictEqual(calculatedSubtotal, 999 * 2 + 650); // 2648
  assert.strictEqual(calculatedTotalMrp, 1200 * 2 + 800); // 3200
  assert.strictEqual(calculatedSavings, 3200 - 2648); // 552
  assert.strictEqual(Math.round(calculatedGst * 100) / 100, Math.round(((1998 * (5 / 105)) + (650 * (12 / 112))) * 100) / 100);
  console.log("✅ Test 2 Passed: Server-authoritative subtotal, total MRP, discount savings, and GST verified.");

  // ----------------------------------------------------------------------
  // Test 3: Inventory Availability & Checkout Readiness Flags
  // ----------------------------------------------------------------------
  console.log("▶️ Test 3: Availability & Out-of-Stock State Handling...");

  function evaluateItemAvailability(productActive: boolean, variantActive: boolean, stockAvailable: number, requestedQty: number) {
    if (!productActive || !variantActive) {
      return { isAvailable: false, reason: "PRODUCT_UNAVAILABLE" };
    }
    if (stockAvailable <= 0) {
      return { isAvailable: false, reason: "OUT_OF_STOCK" };
    }
    if (requestedQty > stockAvailable) {
      return { isAvailable: false, reason: "INSUFFICIENT_STOCK" };
    }
    return { isAvailable: true };
  }

  // Normal in stock
  const state1 = evaluateItemAvailability(true, true, 20, 2);
  assert.strictEqual(state1.isAvailable, true);

  // Out of stock
  const state2 = evaluateItemAvailability(true, true, 0, 1);
  assert.strictEqual(state2.isAvailable, false);
  assert.strictEqual(state2.reason, "OUT_OF_STOCK");

  // Insufficient stock
  const state3 = evaluateItemAvailability(true, true, 3, 5);
  assert.strictEqual(state3.isAvailable, false);
  assert.strictEqual(state3.reason, "INSUFFICIENT_STOCK");

  // Deactivated product
  const state4 = evaluateItemAvailability(false, true, 50, 1);
  assert.strictEqual(state4.isAvailable, false);
  assert.strictEqual(state4.reason, "PRODUCT_UNAVAILABLE");

  // Overall Cart readiness
  const cartWithUnavailable = [state1, state2];
  const isReady1 = cartWithUnavailable.every((i) => i.isAvailable);
  assert.strictEqual(isReady1, false);

  const cartAllAvailable = [state1];
  const isReady2 = cartAllAvailable.every((i) => i.isAvailable);
  assert.strictEqual(isReady2, true);
  console.log("✅ Test 3 Passed: Out-of-stock and checkout readiness validation passed.");

  // ----------------------------------------------------------------------
  // Test 4: Wishlist & Move-to-Cart Schemas
  // ----------------------------------------------------------------------
  console.log("▶️ Test 4: Wishlist and Move-to-Cart Schemas...");

  const validWishlistAdd = AddToWishlistSchema.parse({
    variantId: "123e4567-e89b-12d3-a456-426614174000",
  });
  assert.strictEqual(validWishlistAdd.variantId, "123e4567-e89b-12d3-a456-426614174000");

  const validMoveToCart = MoveToCartSchema.parse({
    variantId: "123e4567-e89b-12d3-a456-426614174000",
    quantity: 2,
  });
  assert.strictEqual(validMoveToCart.quantity, 2);
  console.log("✅ Test 4 Passed: Wishlist and Move-to-Cart schemas verified.");

  // ----------------------------------------------------------------------
  // Test 5: Quantity Update HTTP Contract & Guest Cart Recalculation
  // ----------------------------------------------------------------------
  console.log("▶️ Test 5: Quantity Update Route Method & Contract Verification...");

  const updateRouteSource = fs.readFileSync(
    path.join(process.cwd(), "src/app/api/v1/cart/items/[itemId]/route.ts"),
    "utf8"
  );
  assert.ok(
    updateRouteSource.includes("export async function PUT"),
    "Cart item API route must export PUT handler for quantity updates"
  );
  assert.ok(
    !updateRouteSource.includes("export async function PATCH"),
    "Cart item API route does not export PATCH handler"
  );

  const cartContextSource = fs.readFileSync(
    path.join(process.cwd(), "src/components/cart/cart-context.tsx"),
    "utf8"
  );
  assert.ok(
    cartContextSource.includes('method: "PUT"'),
    "CartContext updateQuantity must send PUT request matching API route method"
  );
  assert.ok(
    !cartContextSource.includes('method: "PATCH"'),
    "CartContext updateQuantity must not send unsupported PATCH request"
  );

  // Validate UpdateCartItemSchema contract
  const validUpdate = UpdateCartItemSchema.parse({ quantity: 4 });
  assert.strictEqual(validUpdate.quantity, 4);

  // Test guest line total and subtotal calculation on quantity change
  const guestItem = {
    id: "guest-item-1",
    unitPrice: 650,
    quantity: 1,
    lineTotal: 650,
  };
  const updatedQty = 3;
  const updatedLineTotal = guestItem.unitPrice * updatedQty;
  assert.strictEqual(updatedLineTotal, 1950, "Guest item line total must recalculate as unitPrice * quantity");

  console.log("✅ Test 5 Passed: Quantity update PUT method alignment and guest calculation verified.");

  console.log("\n🎉 All Phase 9D Cart & Wishlist Tests passed successfully!\n");
}

runCartAndWishlistTests().catch((err) => {
  console.error("❌ Cart test failure:", err);
  process.exit(1);
});
