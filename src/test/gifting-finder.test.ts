import assert from "node:assert";
import { STOREFRONT_PRODUCTS } from "../lib/catalog/storefront-catalog";

async function runGiftingFinderTests() {
  console.log("🧪 Running Phase 14 Feature D — Intelligent Gift Finder Tests...\n");

  const bespokeBox = STOREFRONT_PRODUCTS.find((p) => p.slug === "bespoke-gift-box");
  const pineBox = STOREFRONT_PRODUCTS.find((p) => p.slug === "imperial-pine-box");
  const silkBox = STOREFRONT_PRODUCTS.find((p) => p.slug === "royal-silk-duo-box");
  const trunkBox = STOREFRONT_PRODUCTS.find((p) => p.slug === "sovereign-heritage-trunk");

  // Test 1: Catalogue box records exist and have active variants
  console.log("▶️ Test 1: Verifying gifting box products in authoritative catalog...");
  assert.ok(bespokeBox, "Bespoke gift box must exist in catalog");
  assert.ok(pineBox, "Imperial pine box must exist in catalog");
  assert.ok(silkBox, "Royal silk duo box must exist in catalog");
  assert.ok(trunkBox, "Sovereign heritage trunk must exist in catalog");
  assert.ok(bespokeBox!.variants && bespokeBox!.variants.length >= 2, "Bespoke box must have multiple size variants");
  console.log("  ✓ All 4 gifting caskets verified with real catalog variants.");

  // Test 2: Budget tier Under ₹1,500
  console.log("▶️ Test 2: Budget tier Under ₹1,500 options...");
  const silkPrice = silkBox!.variants![0].sellingPrice;
  assert.ok(silkPrice <= 1500, "Silk box price must be under ₹1,500");
  assert.strictEqual(silkPrice, 350);
  console.log(`  ✓ Under ₹1,500 budget verified: Silk Duo Casket at ₹${silkPrice}.`);

  // Test 3: Budget tier ₹1,500 - ₹3,500
  console.log("▶️ Test 3: Budget tier ₹1,500 - ₹3,500 options...");
  const stdPrice = bespokeBox!.variants![0].sellingPrice;
  assert.ok(stdPrice >= 1500 && stdPrice <= 3500, "Standard Bespoke Hamper must be in ₹1,500 - ₹3,500 range");
  assert.strictEqual(stdPrice, 2999);
  console.log(`  ✓ Imperial Reserve budget verified: Royal Hamper at ₹${stdPrice}.`);

  // Test 4: Budget tier Above ₹3,500
  console.log("▶️ Test 4: Budget tier Above ₹3,500 options...");
  const grandPrice = bespokeBox!.variants![1].sellingPrice;
  assert.ok(grandPrice >= 3500, "Grand Imperial Hamper must be above ₹3,500");
  assert.strictEqual(grandPrice, 4999);
  console.log(`  ✓ Sovereign tier budget verified: Grand Imperial at ₹${grandPrice}.`);

  // Test 5: Box Builder Deep Link Integrity
  console.log("▶️ Test 5: BYOB Deep-linking target slugs...");
  const validBoxSlugs = ["bespoke-gift-box", "imperial-pine-box", "royal-silk-duo-box", "sovereign-heritage-trunk"];
  validBoxSlugs.forEach((slug) => {
    const product = STOREFRONT_PRODUCTS.find((p) => p.slug === slug);
    assert.ok(product, `Target slug ${slug} must be a valid product for /build-your-own-box?box=${slug}`);
  });
  console.log("  ✓ All 4 BYOB deep-link target slugs verified.");

  console.log("\n✅ ALL INTELLIGENT GIFT FINDER TESTS PASSED!\n");
}

runGiftingFinderTests().catch((err) => {
  console.error("❌ Gifting finder test failure:", err);
  process.exit(1);
});
