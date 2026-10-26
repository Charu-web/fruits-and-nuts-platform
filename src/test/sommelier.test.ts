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

  console.log("\n✅ ALL SOMMELIER AI ASSISTANT TESTS PASSED!\n");
}

runSommelierTests().catch((err) => {
  console.error("❌ Sommelier test failure:", err);
  process.exit(1);
});
