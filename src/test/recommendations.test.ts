import assert from "node:assert";
import {
  RecommendationService,
} from "../services/recommendation.service";

async function runRecommendationTests() {
  console.log("🧪 Running Phase 14 Feature A — Recommendation Service Tests...\n");

  // Test 1: Flagship pairing knowledge graph
  console.log("▶️ Test 1: Knowledge graph complementary pairings for Kashmiri Mamra Almonds...");
  const mamraPairings = RecommendationService.getComplementaryPairings("kashmiri-mamra-almonds", 3);
  assert.ok(mamraPairings.length > 0, "Should return pairings for Kashmiri Mamra Almonds");
  assert.strictEqual(mamraPairings[0].product.slug, "kashmiri-shahi-kahwa", "First pairing should be Shahi Kahwa");
  assert.ok(mamraPairings[0].rationale.includes("warm saffron Kahwa"), "Rationale should describe ritual");
  assert.strictEqual(mamraPairings[0].badge, "Signature Ritual");
  console.log("  ✓ Mamra Almond pairings verified with authentic ritual badge.");

  // Test 2: Medjool Dates pairings
  console.log("▶️ Test 2: Pairings for Jordan Medjool Dates...");
  const datePairings = RecommendationService.getComplementaryPairings("jumbo-medjool-dates", 2);
  assert.ok(datePairings.length > 0, "Should return pairings for Medjool Dates");
  assert.strictEqual(datePairings[0].product.slug, "kashmiri-mamra-almonds", "Medjool should pair with Mamra almonds");
  assert.strictEqual(datePairings[0].badge, "Royal Pairing");
  console.log("  ✓ Medjool Dates pairings verified.");

  // Test 3: Frequently Bought Together Bundle calculation
  console.log("▶️ Test 3: Frequently Bought Together Bundle calculation & pricing...");
  const bundle = RecommendationService.getFrequentlyBoughtTogether("kashmiri-mamra-almonds");
  assert.ok(bundle !== null, "Bundle should not be null for valid flagship harvest");
  assert.strictEqual(bundle!.primaryProduct.slug, "kashmiri-mamra-almonds");
  assert.strictEqual(bundle!.complementaryProduct.slug, "kashmiri-shahi-kahwa");
  assert.strictEqual(
    bundle!.bundleSellingPrice,
    bundle!.primaryProduct.variant.sellingPrice + bundle!.complementaryProduct.variant.sellingPrice,
    "Bundle selling price must equal sum of variant prices"
  );
  assert.strictEqual(
    bundle!.bundleMrp,
    bundle!.primaryProduct.variant.mrp + bundle!.complementaryProduct.variant.mrp,
    "Bundle MRP must equal sum of variant MRPs"
  );
  assert.strictEqual(
    bundle!.bundleSavings,
    bundle!.bundleMrp - bundle!.bundleSellingPrice,
    "Bundle savings must equal MRP minus selling price"
  );
  assert.ok(bundle!.bundleDiscountPercent >= 0, "Discount percentage must be non-negative");
  console.log(`  ✓ Bundle arithmetic verified: ₹${bundle!.bundleSellingPrice} (MRP ₹${bundle!.bundleMrp}, Save ₹${bundle!.bundleSavings})`);

  // Test 4: Need-based recommendations
  console.log("▶️ Test 4: Need-based recommendations for 'wellness' & 'fitness'...");
  const wellnessRecs = RecommendationService.getNeedBasedRecommendations("wellness", undefined, 4);
  assert.ok(wellnessRecs.length > 0, "Should find wellness products");
  wellnessRecs.forEach((p) => {
    assert.ok(p.needTags?.includes("wellness"), `Product ${p.slug} must include wellness tag`);
  });
  console.log(`  ✓ Found ${wellnessRecs.length} wellness-aligned harvests.`);

  // Test 5: Fallback & edge cases
  console.log("▶️ Test 5: Graceful fallback for unknown slugs...");
  const unknownPairings = RecommendationService.getComplementaryPairings("unknown-product-slug", 3);
  assert.ok(Array.isArray(unknownPairings), "Should return array even for non-existent slug");
  const unknownBundle = RecommendationService.getFrequentlyBoughtTogether("non-existent-product");
  assert.strictEqual(unknownBundle, null, "Unknown product should return null bundle");
  console.log("  ✓ Edge cases and non-existent products handled safely without throwing.");

  console.log("\n✅ ALL RECOMMENDATION SERVICE TESTS PASSED!\n");
}

runRecommendationTests().catch((err) => {
  console.error("❌ Recommendation test failure:", err);
  process.exit(1);
});
