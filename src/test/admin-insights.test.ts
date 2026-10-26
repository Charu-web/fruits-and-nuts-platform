import assert from "node:assert";
import { InventoryInsightsService } from "../services/inventory-insights.service";

async function runAdminInsightsTests() {
  console.log("🧪 Running Phase 14 Feature E — Advanced Admin Insights Tests...\n");

  const mockInventory = [
    {
      variantId: "var-mamra-250",
      sku: "FN-ALM-250",
      productName: "Kashmiri Imperial Mamra Almonds",
      categoryName: "Dry Fruits & Nuts",
      stockAvailable: 8,
      safetyBuffer: 10,
      unitsSold30d: 60, // 2 units / day velocity
    },
    {
      variantId: "var-medjool-500",
      sku: "FN-DAT-500",
      productName: "Jordan Valley Jumbo Medjool Dates",
      categoryName: "Dates / Khajoor",
      stockAvailable: 15,
      safetyBuffer: 10,
      unitsSold30d: 30, // 1 unit / day velocity -> 15 days left
    },
    {
      variantId: "var-wln-1000",
      sku: "FN-WLN-1KG",
      productName: "Kashmir Valley Snow Walnuts",
      categoryName: "Dry Fruits & Nuts",
      stockAvailable: 100,
      safetyBuffer: 15,
      unitsSold30d: 15, // 0.5 units / day -> 200 days left
    },
    {
      variantId: "var-spc-new",
      sku: "FN-SPC-NEW",
      productName: "Rare Himalayan Black Morel Guchhi",
      categoryName: "Pantry & Vedic Ghee",
      stockAvailable: 5,
      safetyBuffer: 5,
      unitsSold30d: 0, // No sales yet
    },
  ];

  // Test 1: Critical Runout Risk (< 7 days or below safety buffer)
  console.log("▶️ Test 1: Critical runout velocity detection...");
  const insights = InventoryInsightsService.calculateRunoutEstimates(mockInventory);
  const criticalItem = insights.find((i) => i.sku === "FN-ALM-250");
  assert.ok(criticalItem, "Must find Mamra 250g in insights");
  assert.strictEqual(criticalItem!.runoutRisk, "CRITICAL", "Must flag stock <= buffer as CRITICAL");
  assert.strictEqual(criticalItem!.dailyVelocity, 2);
  assert.ok(criticalItem!.daysToRunout !== null && criticalItem!.daysToRunout <= 7);
  assert.ok(criticalItem!.suggestedRestockQty > 0, "Must calculate restock quantity for 45-day buffer");
  assert.strictEqual(criticalItem!.confidence, "HIGH");
  console.log(`  ✓ Critical runout flagged accurately: ${criticalItem!.daysToRunout} days left, Restock suggestion: +${criticalItem!.suggestedRestockQty} units.`);

  // Test 2: Attention Runout Risk (8 - 21 days)
  console.log("▶️ Test 2: Attention runout velocity detection...");
  const attentionItem = insights.find((i) => i.sku === "FN-DAT-500");
  assert.ok(attentionItem);
  assert.strictEqual(attentionItem!.runoutRisk, "ATTENTION");
  assert.strictEqual(attentionItem!.dailyVelocity, 1);
  assert.strictEqual(attentionItem!.daysToRunout, 15);
  console.log(`  ✓ Attention risk flagged accurately: 15 days left.`);

  // Test 3: Healthy Runout Status (> 21 days)
  console.log("▶️ Test 3: Healthy stock runway detection...");
  const healthyItem = insights.find((i) => i.sku === "FN-WLN-1KG");
  assert.ok(healthyItem);
  assert.strictEqual(healthyItem!.runoutRisk, "HEALTHY");
  assert.ok(healthyItem!.daysToRunout !== null && healthyItem!.daysToRunout > 21);
  assert.strictEqual(healthyItem!.suggestedRestockQty, 0, "Healthy items require 0 restock");
  console.log(`  ✓ Healthy runway verified: Adequate stock for ${healthyItem!.daysToRunout} days.`);

  // Test 4: Insufficient Sales Data Flagging
  console.log("▶️ Test 4: Insufficient data handling...");
  const noSalesItem = insights.find((i) => i.sku === "FN-SPC-NEW");
  assert.ok(noSalesItem);
  assert.strictEqual(noSalesItem!.runoutRisk, "INSUFFICIENT_DATA");
  assert.strictEqual(noSalesItem!.daysToRunout, null, "Days to runout must be null when velocity is zero");
  assert.strictEqual(noSalesItem!.confidence, "INSUFFICIENT_DATA");
  console.log("  ✓ Zero-sales item explicitly marked INSUFFICIENT_DATA without fabricating runout.");

  // Test 5: Read-Only Invariance
  console.log("▶️ Test 5: Verifying read-only non-mutating nature of calculations...");
  assert.strictEqual(mockInventory[0].stockAvailable, 8, "Original stockAvailable must be unmodified");
  assert.strictEqual(mockInventory[3].stockAvailable, 5, "Original stockAvailable must be unmodified");
  console.log("  ✓ Read-only calculation verified; database and memory state preserved.");

  console.log("\n✅ ALL ADVANCED ADMIN INSIGHTS TESTS PASSED!\n");
}

runAdminInsightsTests().catch((err) => {
  console.error("❌ Admin insights test failure:", err);
  process.exit(1);
});
