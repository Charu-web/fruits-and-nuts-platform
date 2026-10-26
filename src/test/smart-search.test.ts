import assert from "node:assert";
import { SmartSearchService } from "../services/smart-search.service";

async function runSmartSearchTests() {
  console.log("🧪 Running Phase 14 Feature C — Smart Search Tests...\n");

  // Test 1: Direct keyword search
  console.log("▶️ Test 1: Exact product keyword search ('Mamra')...");
  const mamraRes = SmartSearchService.search("Mamra");
  assert.ok(mamraRes.products.length > 0, "Should find products for 'Mamra'");
  assert.strictEqual(
    mamraRes.products[0].slug,
    "kashmiri-mamra-almonds",
    "First result should be Kashmiri Imperial Mamra Almonds"
  );
  console.log("  ✓ Exact keyword matching verified.");

  // Test 2: Traditional Indian food synonyms
  console.log("▶️ Test 2: Indian culinary synonyms ('badam', 'kaju', 'akhrot', 'khajoor')...");
  
  // badam -> almonds
  const badamRes = SmartSearchService.search("badam");
  assert.ok(
    badamRes.products.some((p) => p.slug === "kashmiri-mamra-almonds"),
    "'badam' query must return Mamra almonds"
  );

  // kaju -> cashews
  const kajuRes = SmartSearchService.search("kaju");
  assert.ok(
    kajuRes.products.some((p) => p.slug === "king-cashews-w180"),
    "'kaju' query must return W180 cashews"
  );

  // akhrot -> walnuts
  const akhrotRes = SmartSearchService.search("akhrot");
  assert.ok(
    akhrotRes.products.some((p) => p.slug === "kashmir-snow-walnuts"),
    "'akhrot' query must return Snow walnuts"
  );

  // khajoor -> dates
  const khajoorRes = SmartSearchService.search("khajoor");
  assert.ok(
    khajoorRes.products.some((p) => p.slug === "jumbo-medjool-dates" || p.slug === "ajwa-dates"),
    "'khajoor' query must return Medjool / Ajwa dates"
  );
  console.log("  ✓ All vernacular Hindi/Urdu culinary synonyms successfully resolved.");

  // Test 3: Typo tolerance and fuzzy matching
  console.log("▶️ Test 3: Typo tolerance ('almdon', 'medjul', 'pistacio')...");
  
  const typoAlmond = SmartSearchService.search("almdon");
  assert.ok(
    typoAlmond.products.some((p) => p.slug === "kashmiri-mamra-almonds"),
    "Typo 'almdon' must resolve to Mamra almonds"
  );

  const typoDate = SmartSearchService.search("medjul");
  assert.ok(
    typoDate.products.some((p) => p.slug === "jumbo-medjool-dates"),
    "Typo 'medjul' must resolve to Jumbo Medjool dates"
  );

  const typoPista = SmartSearchService.search("pistacio");
  assert.ok(
    typoPista.products.some((p) => p.slug === "pista-salted"),
    "Typo 'pistacio' must resolve to salted pistachios"
  );
  console.log("  ✓ Levenshtein fuzzy matching and typo tolerance verified.");

  // Test 4: Lifestyle and Need-based search queries
  console.log("▶️ Test 4: Need-based queries ('immunity', 'workout', 'festive')...");
  const wellnessRes = SmartSearchService.search("immunity");
  assert.strictEqual(wellnessRes.matchedNeedTag, "wellness", "Query 'immunity' should map to 'wellness' tag");
  assert.ok(wellnessRes.products.length > 0, "Should return wellness harvests");

  const fitnessRes = SmartSearchService.search("workout");
  assert.strictEqual(fitnessRes.matchedNeedTag, "fitness", "Query 'workout' should map to 'fitness' tag");
  console.log("  ✓ Lifestyle Need-tag automatic query expansion verified.");

  // Test 5: Category constrained search
  console.log("▶️ Test 5: Category-scoped search ('tea' in 'dry-fruits')...");
  const constrainedRes = SmartSearchService.search("tea", { categorySlug: "dry-fruits" });
  assert.ok(
    constrainedRes.products.every((p) => p.category?.slug === "dry-fruits"),
    "Results must strictly obey categorySlug filter"
  );
  console.log("  ✓ Category filtering constraint verified.");

  // Test 6: Empty query handling
  console.log("▶️ Test 6: Empty query safe fallback...");
  const emptyRes = SmartSearchService.search("", { limit: 5 });
  assert.strictEqual(emptyRes.products.length, 5, "Empty query returns first N products");
  console.log("  ✓ Empty query handled gracefully without exceptions.");

  console.log("\n✅ ALL SMART SEARCH TESTS PASSED!\n");
}

runSmartSearchTests().catch((err) => {
  console.error("❌ Smart search test failure:", err);
  process.exit(1);
});
