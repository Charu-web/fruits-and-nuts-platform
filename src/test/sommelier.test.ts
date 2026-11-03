import assert from "node:assert";
import { SommelierService } from "../services/sommelier.service";

async function runSommelierTests() {
  console.log("🧪 Running Phase 14 Feature B — AI Shopping Assistant (Sommelier) Tests...\n");

  // Test 1: Welcome Greeting & Prompts
  console.log("▶️ Test 1: Default Sommelier Greeting & Initial Prompts...");
  const welcome = SommelierService.consult("");
  assert.ok(welcome.reply.includes("Royal Gourmet Sommelier"), "Must introduce Royal Sommelier");
  assert.ok(welcome.suggestedProducts.length >= 2, "Must offer starting flagship harvests");
  assert.ok(welcome.quickPrompts.length >= 3, "Must offer quick starter prompts");
  console.log("  ✓ Welcome greeting and starting catalog items verified.");

  // Test 2: Mamra Almond Terroir Query
  console.log("▶️ Test 2: Inquiries regarding Kashmiri Mamra Almonds...");
  const mamraAnswer = SommelierService.consult("Why should I choose Kashmiri Mamra almonds over California?");
  assert.ok(
    mamraAnswer.reply.includes("Kashmiri") && mamraAnswer.reply.includes("Mamra"),
    "Must explain verified single-origin Kashmiri Mamra attributes"
  );
  assert.ok(
    mamraAnswer.provider === "catalog_rule_engine" || mamraAnswer.provider === "live_ai",
    "Must indicate authentic provider engine"
  );
  assert.ok(
    mamraAnswer.suggestedProducts.some((p) => p.slug === "kashmiri-mamra-almonds"),
    "Must recommend Kashmiri Mamra product card"
  );
  console.log("  ✓ Mamra Almond high-altitude terroir rationale verified.");

  // Test 3: Date Comparison (Medjool vs Ajwa)
  console.log("▶️ Test 3: Date comparisons (Medjool vs Ajwa)...");
  const dateAnswer = SommelierService.consult("Which dates are softer, Medjool or Ajwa?");
  assert.ok(dateAnswer.reply.includes("Medjool") && dateAnswer.reply.includes("Ajwa"));
  assert.ok(
    dateAnswer.suggestedProducts.some((p) => p.slug === "jumbo-medjool-dates"),
    "Must include Jordan Medjool"
  );
  assert.ok(
    dateAnswer.suggestedProducts.some((p) => p.slug === "ajwa-dates"),
    "Must include Medina Ajwa"
  );
  console.log("  ✓ Single-estate date comparisons verified.");

  // Test 4: Diabetic & Low GI Recommendations
  console.log("▶️ Test 4: Diabetic-friendly & metabolic nutrition recommendations...");
  const diabeticAnswer = SommelierService.consult("Can you suggest diabetic friendly dry fruits?");
  assert.ok(
    diabeticAnswer.reply.toLowerCase().includes("glycemic") ||
      diabeticAnswer.reply.toLowerCase().includes("sugar") ||
      diabeticAnswer.reply.toLowerCase().includes("walnuts"),
    "Must provide grounded low-GI dietary context"
  );
  assert.ok(
    diabeticAnswer.suggestedProducts.some((p) => p.slug === "kashmir-snow-walnuts"),
    "Must include Snow Walnuts for Omega-3 ALA"
  );
  console.log("  ✓ Clean low-GI / metabolic recommendations verified.");

  // Test 5: Tea & Valley Rituals
  console.log("▶️ Test 5: Artisanal tea and Kahwa inquiries...");
  const teaAnswer = SommelierService.consult("What is authentic Kashmiri Kahwa tea?");
  assert.ok(teaAnswer.reply.includes("Kahwa") && teaAnswer.reply.includes("saffron"));
  assert.ok(
    teaAnswer.suggestedProducts.some((p) => p.slug === "kashmiri-shahi-kahwa"),
    "Must include Shahi Kahwa product"
  );
  console.log("  ✓ Traditional Kahwa tea ceremony guidance verified.");

  // Test 6: Custom Gifting & Hampers
  console.log("▶️ Test 6: Bespoke gifting & Build Your Own Box guidance...");
  const giftAnswer = SommelierService.consult("I need a luxury corporate gift hamper for Diwali");
  assert.ok(
    giftAnswer.reply.includes("Build Your Own Box") || giftAnswer.reply.includes("Bespoke"),
    "Must reference bespoke gifting capabilities"
  );
  assert.ok(
    giftAnswer.suggestedProducts.some((p) => p.slug === "bespoke-gift-box"),
    "Must link Bespoke Gift Box"
  );
  console.log("  ✓ Luxury gifting advisory verified.");

  // Test 7: Fallback & Unknown Inquiries
  console.log("▶️ Test 7: Arbitrary or unknown query fallback...");
  const randomAnswer = SommelierService.consult("xyz123 random non-existent keyword");
  assert.ok(typeof randomAnswer.reply === "string" && randomAnswer.reply.length > 0);
  assert.ok(Array.isArray(randomAnswer.suggestedProducts));
  assert.ok(Array.isArray(randomAnswer.quickPrompts));
  console.log("  ✓ Safe fallback handling verified without errors.");

  // Test 8: Which dates are suitable for gifting?
  console.log("▶️ Test 8: Which dates are suitable for gifting?...");
  const giftingDatesAnswer = SommelierService.consult("Which dates are suitable for gifting?");
  assert.ok(
    giftingDatesAnswer.reply.toLowerCase().includes("medjool") ||
      giftingDatesAnswer.reply.toLowerCase().includes("ajwa"),
    "Must recommend Medjool or Ajwa for gifting"
  );
  assert.ok(
    giftingDatesAnswer.suggestedProducts.some((p) => p.slug === "jumbo-medjool-dates" || p.slug === "ajwa-dates"),
    "Must include authentic date products"
  );
  console.log("  ✓ Gifting dates recommendation verified.");

  // Test 9: Suggest a healthy snack
  console.log("▶️ Test 9: Suggest a healthy snack...");
  const healthySnackAnswer = SommelierService.consult("Suggest a healthy snack");
  assert.ok(
    healthySnackAnswer.reply.toLowerCase().includes("healthy") ||
      healthySnackAnswer.reply.toLowerCase().includes("snack") ||
      healthySnackAnswer.reply.toLowerCase().includes("protein"),
    "Must provide grounded healthy snacking context"
  );
  assert.ok(
    healthySnackAnswer.suggestedProducts.length >= 2,
    "Must suggest healthy snack products"
  );
  console.log("  ✓ Healthy snack recommendations verified.");

  // Test 10: Recommend products under ₹1,000
  console.log("▶️ Test 10: Recommend products under ₹1,000...");
  const budgetAnswer = SommelierService.consult("Recommend products under ₹1,000");
  assert.ok(
    budgetAnswer.reply.includes("1,000") || budgetAnswer.reply.includes("1000"),
    "Must reference the ₹1,000 budget constraint"
  );
  assert.ok(
    budgetAnswer.suggestedProducts.every((p) => (p.priceRange?.minSellingPrice ?? 0) <= 1000),
    "All recommended products must have a variant under ₹1,000"
  );
  console.log("  ✓ Under ₹1,000 budget recommendations verified.");

  // Test 11: Suggest a premium dry fruit gift combination
  console.log("▶️ Test 11: Suggest a premium dry fruit gift combination...");
  const comboAnswer = SommelierService.consult("Suggest a premium dry fruit gift combination");
  assert.ok(
    comboAnswer.reply.toLowerCase().includes("gift") ||
      comboAnswer.reply.toLowerCase().includes("bespoke") ||
      comboAnswer.reply.toLowerCase().includes("box"),
    "Must recommend bespoke gift box combination"
  );
  assert.ok(
    comboAnswer.suggestedProducts.some((p) => p.slug === "bespoke-gift-box"),
    "Must include Bespoke Gift Box in combination"
  );
  console.log("  ✓ Premium dry fruit gift combination verified.");

  // Test 12: consultAsync with fallback resilience
  console.log("▶️ Test 12: consultAsync async execution with fallback resilience...");
  const asyncResult = await SommelierService.consultAsync("Recommend premium almonds");
  assert.ok(typeof asyncResult.reply === "string" && asyncResult.reply.length > 0);
  assert.ok(asyncResult.suggestedProducts.some((p) => p.slug === "kashmiri-mamra-almonds"));
  assert.ok(
    asyncResult.provider === "catalog_rule_engine" || asyncResult.provider === "live_ai",
    "Must provide a valid provider tag"
  );
  console.log("  ✓ consultAsync executed with provider resilience verified.");

  // Test 13: Multi-turn conversation history handling
  console.log("▶️ Test 13: Multi-turn conversation history handling...");
  const multiTurnResult = await SommelierService.consultAsync("What about dates?", [
    { role: "user", text: "Recommend premium almonds" },
    { role: "model", text: "We recommend our Kashmiri Imperial Mamra Almonds." },
  ]);
  assert.ok(typeof multiTurnResult.reply === "string" && multiTurnResult.reply.length > 0);
  assert.ok(
    multiTurnResult.suggestedProducts.some((p) => p.slug.includes("date")),
    "Multi-turn response must ground in verified date products"
  );
  console.log("  ✓ Multi-turn conversation history verified.");

  // Test 14: Strict catalogue grounding validation
  console.log("▶️ Test 14: Strict catalogue grounding validation...");
  const groundingResult = await SommelierService.consultAsync("Suggest a healthy snack");
  assert.ok(groundingResult.suggestedProducts.length > 0);
  for (const product of groundingResult.suggestedProducts) {
    assert.ok(product.slug, "Every recommended product must have a slug");
    assert.ok(product.name, "Every recommended product must have a name");
    assert.ok(product.priceRange?.minSellingPrice !== undefined, "Every recommended product must have a price");
  }
  console.log("  ✓ All recommendations verified against authentic catalogue schema.");

  console.log("\n✅ ALL SOMMELIER AI ASSISTANT TESTS PASSED!\n");
}

runSommelierTests().catch((err) => {
  console.error("❌ Sommelier test failure:", err);
  process.exit(1);
});
