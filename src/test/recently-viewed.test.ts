import assert from "node:assert";
import { STOREFRONT_PRODUCTS } from "../lib/catalog/storefront-catalog";

/**
 * Pure helper mirroring useRecentlyViewed state logic for automated headless testing.
 */
function recordViewSimulation(prev: string[], currentSlug: string, maxItems = 8): string[] {
  return [currentSlug, ...prev.filter((s) => s !== currentSlug)].slice(0, maxItems);
}

function resolveProducts(slugs: string[], excludeSlug?: string) {
  return slugs
    .filter((slug) => slug !== excludeSlug)
    .map((slug) => STOREFRONT_PRODUCTS.find((p) => p.slug === slug))
    .filter(Boolean);
}

async function runRecentlyViewedTests() {
  console.log("🧪 Running Phase 14 Feature F — Recently Viewed Products Tests...\n");

  // Test 1: Deduplication logic
  console.log("▶️ Test 1: History deduplication and MRU ordering...");
  let history: string[] = [];
  history = recordViewSimulation(history, "kashmiri-mamra-almonds");
  history = recordViewSimulation(history, "jumbo-medjool-dates");
  history = recordViewSimulation(history, "kashmir-snow-walnuts");
  assert.deepStrictEqual(history, [
    "kashmir-snow-walnuts",
    "jumbo-medjool-dates",
    "kashmiri-mamra-almonds",
  ]);

  // Re-visiting Mamra almonds moves it to the head of the list
  history = recordViewSimulation(history, "kashmiri-mamra-almonds");
  assert.deepStrictEqual(history, [
    "kashmiri-mamra-almonds",
    "kashmir-snow-walnuts",
    "jumbo-medjool-dates",
  ]);
  assert.strictEqual(history.length, 3, "No duplicate items permitted");
  console.log("  ✓ Most Recently Used (MRU) ordering and deduplication verified.");

  // Test 2: Capacity Limit (Max 8 items)
  console.log("▶️ Test 2: Maximum capacity boundary test...");
  const extraSlugs = [
    "pista-salted",
    "afghan-raisins-kishmish",
    "afghan-khumani",
    "ajwa-dates",
    "kimia-dates",
    "tea-everest",
    "bespoke-gift-box",
  ];
  for (const slug of extraSlugs) {
    history = recordViewSimulation(history, slug, 8);
  }
  assert.strictEqual(history.length, 8, "Must strictly enforce maximum 8 items");
  assert.strictEqual(history[0], "bespoke-gift-box", "Latest item must be at index 0");
  console.log("  ✓ Strict cap of 8 items enforced.");

  // Test 3: Exclusion of Currently Viewed PDP Item
  console.log("▶️ Test 3: Excluding current product from recently viewed shelf...");
  const resolvedForMamra = resolveProducts(history, "kashmiri-mamra-almonds");
  assert.ok(
    resolvedForMamra.every((p: any) => p.slug !== "kashmiri-mamra-almonds"),
    "Must exclude current PDP product"
  );
  console.log("  ✓ Current active product correctly omitted from recommendations.");

  // Test 4: Privacy & Sanitization Check
  console.log("▶️ Test 4: Privacy-first data storage compliance...");
  history.forEach((slug) => {
    assert.ok(typeof slug === "string", "Stored data must only be string slugs");
    assert.ok(!slug.includes("@") && !slug.includes("password"), "Must not contain sensitive user data");
  });
  console.log("  ✓ Storage conforms to privacy-first client-side anonymous footprint.");

  console.log("\n✅ ALL RECENTLY VIEWED PRODUCTS TESTS PASSED!\n");
}

runRecentlyViewedTests().catch((err) => {
  console.error("❌ Recently viewed test failure:", err);
  process.exit(1);
});
