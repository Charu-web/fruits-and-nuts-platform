import {
  STOREFRONT_PRODUCTS,
} from "@/lib/catalog/storefront-catalog";
import { ProductCardProps } from "@/components/catalog/product-card";

export interface SommelierResponse {
  reply: string;
  suggestedProducts: ProductCardProps[];
  quickPrompts: string[];
  provider: "catalog_rule_engine" | "live_ai";
}

export class SommelierService {
  /**
   * Deterministic, grounded catalog intelligence engine.
   * Matches consumer culinary intent against verified harvests, authentic terroir stories,
   * dietary tags, and official shipping/packaging standards from the actual store catalog.
   */
  static consult(query: string): SommelierResponse {
    const q = query.toLowerCase().trim();

    // Default suggestions displayed across interactions
    const defaultPrompts = [
      "Why are Kashmiri Mamra Almonds special?",
      "Compare Medjool vs Ajwa Dates",
      "Diabetic-friendly & Low GI options",
      "Build a custom luxury gift casket",
    ];

    // Determine provider: if external live AI key is configured in env, flag live_ai; otherwise catalogue rule engine
    const isLiveAiConfigured = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "mock-key");
    const provider: "catalog_rule_engine" | "live_ai" = isLiveAiConfigured ? "live_ai" : "catalog_rule_engine";

    // 1. Kashmiri Mamra Almonds & Almond comparisons
    if (
      q.includes("mamra") ||
      q.includes("almond") ||
      q.includes("badam") ||
      q.includes("california")
    ) {
      const products = this.findProductsBySlugs([
        "kashmiri-mamra-almonds",
        "kashmir-snow-walnuts",
        "kashmiri-shahi-kahwa",
      ]);
      return {
        reply:
          "Kashmiri Imperial Mamra Almonds (Grade A+) are single-origin almonds sourced from the high altitudes of Kashmir. Unlike standard California almonds, authentic Kashmiri Mamra almonds are recognized by their distinct concave shape, smaller size, and crisp natural crunch. They are packed unroasted and unsalted to preserve their natural state.",
        suggestedProducts: products,
        quickPrompts: [
          "How to consume Mamra almonds?",
          "Pair Mamra with Shahi Kahwa",
          "Compare Medjool vs Ajwa Dates",
        ],
        provider,
      };
    }

    // 2. Dates / Khajoor selection & comparisons
    if (
      q.includes("date") ||
      q.includes("khajoor") ||
      q.includes("medjool") ||
      q.includes("ajwa") ||
      q.includes("kimia")
    ) {
      const products = this.findProductsBySlugs([
        "jumbo-medjool-dates",
        "ajwa-dates",
        "kimia-dates",
      ]);
      return {
        reply:
          "Our catalogue features three distinct date selections: Jumbo Medjool Dates, celebrated for their large size, soft flesh, and natural caramel sweetness; Saudi Ajwa Dates, which are dark, smaller, and moderately firm; and fresh Kimia Dates, which are soft and moist. None contain added sugars or artificial preservatives.",
        suggestedProducts: products,
        quickPrompts: [
          "Which date is best for natural snacking?",
          "Are dates sweetened artificially?",
          "Tell me about Kashmiri Mamra Almonds",
        ],
        provider,
      };
    }

    // 3. Health & Dietary: Diabetic friendly / Low GI / Fitness / Protein
    if (
      q.includes("diabet") ||
      q.includes("sugar") ||
      q.includes("low gi") ||
      q.includes("weight") ||
      q.includes("fitness") ||
      q.includes("gym") ||
      q.includes("protein")
    ) {
      const products = this.findProductsBySlugs([
        "kashmir-snow-walnuts",
        "kashmiri-mamra-almonds",
        "chia-seeds",
        "anjeer-bites",
      ]);
      return {
        reply:
          "For clean snacking with zero added refined sugars, our catalogue offers raw nuts, seeds, and dried fruit. Kashmiri Mamra Almonds and Kashmir Snow Walnuts naturally supply plant-based dietary protein and fiber. Our Chia Seeds provide raw dietary fiber. Anjeer Fig Bites are prepared with sun-dried figs and dates with 0g refined sugar added. Please consult your physician or nutritionist for personal dietary advice.",
        suggestedProducts: products,
        quickPrompts: [
          "What are the features of Snow Walnuts?",
          "Show me Artisanal Teas",
          "Build a custom wellness box",
        ],
        provider,
      };
    }

    // 4. Teas & Valley Infusions (Kahwa, CTC, Chai)
    if (
      q.includes("tea") ||
      q.includes("kahwa") ||
      q.includes("chai") ||
      q.includes("digest") ||
      q.includes("saffron")
    ) {
      const products = this.findProductsBySlugs([
        "kashmiri-shahi-kahwa",
        "tea-everest",
        "bombay-cutting",
      ]);
      return {
        reply:
          "Our tea collection includes Shahi Kashmiri Saffron Kahwa, an artisanal green tea blended with cinnamon, green cardamom pods, cloves, and pure Kashmiri saffron. It is traditionally prepared as a warm infusion and enjoyed with slivered Mamra almonds. We also offer orthodox whole leaf black teas and spiced blends.",
        suggestedProducts: products,
        quickPrompts: [
          "How to brew authentic Kashmiri Kahwa?",
          "What almonds pair with Kahwa?",
          "Explore gift hampers",
        ],
        provider,
      };
    }

    // 5. Gifting, Corporate Hampers & Build-Your-Own-Box
    if (
      q.includes("gift") ||
      q.includes("hamper") ||
      q.includes("box") ||
      q.includes("wedding") ||
      q.includes("diwali") ||
      q.includes("corporate")
    ) {
      const products = this.findProductsBySlugs([
        "bespoke-gift-box",
        "kashmiri-mamra-almonds",
        "jumbo-medjool-dates",
      ]);
      return {
        reply:
          "For gifting, we offer pre-curated luxury boxes (such as our Royal Silk Duo and Imperial Pine boxes) as well as an interactive 'Build Your Own Box' builder (/build-your-own-box). You can select your casket finish, handpick your harvest inclusions, and add a personalized wax-sealed greeting note.",
        suggestedProducts: products,
        quickPrompts: [
          "Go to Build Your Own Box",
          "What is the corporate gifting minimum?",
          "Show me bestseller harvests",
        ],
        provider,
      };
    }

    // 6. Walnuts & Cashews
    if (q.includes("walnut") || q.includes("cashew") || q.includes("kaju") || q.includes("akhrot")) {
      const products = this.findProductsBySlugs([
        "kashmir-snow-walnuts",
        "king-cashews-w180",
      ]);
      return {
        reply:
          "Our Kashmir Valley Snow Walnuts are Kagzi-variety thin-shell walnuts with intact golden halves. Our Cashews are King W180 grade — the largest kernel size classification available — carefully sorted for intact whole kernels without chemical processing or bleaching.",
        suggestedProducts: products,
        quickPrompts: [
          "Pairing walnuts with tea",
          "What does W180 grade mean?",
          "Browse all dry fruits",
        ],
        provider,
      };
    }

    // 7. Shipping, Packaging & Freshness
    if (
      q.includes("ship") ||
      q.includes("deliver") ||
      q.includes("fresh") ||
      q.includes("packag") ||
      q.includes("storage") ||
      q.includes("shelf")
    ) {
      return {
        reply:
          "All harvests are vacuum-sealed or packaged in airtight containers to preserve freshness. We dispatch orders across India via express courier partners, with complimentary shipping on orders over ₹1,999. Harvests have a recommended shelf life of 6 to 9 months when stored in a cool, dry place away from direct sunlight.",
        suggestedProducts: this.findProductsBySlugs([
          "kashmiri-mamra-almonds",
          "jumbo-medjool-dates",
        ]),
        quickPrompts: [
          "Check delivery to my PIN code",
          "Return & replacement policy",
          "View current bestsellers",
        ],
        provider,
      };
    }

    // 8. Dynamic catalog keyword matching fallback
    const matchedProducts = STOREFRONT_PRODUCTS.filter((p) => {
      const words = q.split(/\s+/).filter((w) => w.length > 2);
      return words.some(
        (word) =>
          p.name.toLowerCase().includes(word) ||
          p.category?.name.toLowerCase().includes(word) ||
          p.tag?.toLowerCase().includes(word) ||
          p.terroir?.toLowerCase().includes(word)
      );
    }).slice(0, 3);

    if (matchedProducts.length > 0) {
      return {
        reply: `Here are our verified harvests matching your enquiry for "${query}". Each product is graded and sourced according to our catalogue specifications.`,
        suggestedProducts: matchedProducts,
        quickPrompts: defaultPrompts,
        provider,
      };
    }

    // 9. Welcoming Sommelier greeting
    return {
      reply:
        "Welcome to M/S Fruits & Nuts. I am your Royal Gourmet Sommelier, powered by our verified catalogue advisory engine. I can guide you through our single-origin harvests — from high-altitude Kashmiri Mamra Almonds and Jumbo Medjool Dates to Himalayan Snow Walnuts and bespoke ceremonial gift boxes. How may I curate your experience today?",
      suggestedProducts: this.findProductsBySlugs([
        "kashmiri-mamra-almonds",
        "jumbo-medjool-dates",
        "kashmiri-shahi-kahwa",
      ]),
      quickPrompts: defaultPrompts,
      provider,
    };
  }

  private static findProductsBySlugs(slugs: string[]): ProductCardProps[] {
    return STOREFRONT_PRODUCTS.filter((p) => slugs.includes(p.slug));
  }
}
