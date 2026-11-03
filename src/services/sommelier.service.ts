import { GoogleGenAI } from "@google/genai";
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

export interface ChatTurn {
  role: "user" | "model";
  text: string;
}

export class SommelierService {
  /**
   * Returns whether a valid Gemini API key is configured server-side.
   * Completely avoids exposing keys to logs or frontend.
   */
  static isLiveAiConfigured(): boolean {
    const key = process.env.GEMINI_API_KEY?.trim();
    return Boolean(key && key !== "" && key !== "mock-key" && !key.startsWith("placeholder_"));
  }

  /**
   * Asynchronous AI consultation entrypoint.
   * Leverages official @google/genai SDK when GEMINI_API_KEY is configured,
   * grounded strictly within the authentic product catalog.
   * Supports multi-turn conversation history.
   * Seamlessly falls back to the deterministic catalog rule engine if unconfigured,
   * timed out, or on network / rate limit failure.
   */
  static async consultAsync(
    query: string,
    history?: ChatTurn[]
  ): Promise<SommelierResponse> {
    if (!this.isLiveAiConfigured()) {
      return this.consult(query);
    }

    const apiKey = process.env.GEMINI_API_KEY!.trim();
    const cleanQuery = query.trim();

    if (!cleanQuery) {
      return this.consult("");
    }

    try {
      // 1. Build catalog summary for grounding
      const catalogSummary = STOREFRONT_PRODUCTS.map((p) => ({
        name: p.name,
        slug: p.slug,
        category: p.category?.name || "General",
        minPrice: p.priceRange?.minSellingPrice || 0,
        maxPrice: p.priceRange?.maxSellingPrice || 0,
        unit: p.variants?.[0]?.unit || "GRAMS",
        weightGrams: p.variants?.[0]?.weightGrams || 250,
        inStock: p.stockStatus === "IN_STOCK",
      }));

      // 2. System Instruction for Royal Gourmet Sommelier
      const systemInstruction = `You are the "Royal Gourmet Sommelier" — the intelligent, courteous shopping concierge for M/S Fruits & Nuts (fruitsandnuts.co.in), a premier purveyor of single-origin dry fruits, dates, nuts, artisanal teas, and luxury gift caskets in India.

CRITICAL OPERATIONAL RULES:
1. COMMUNICATE NATURALLY & ELEGANTLY: Provide courteous, concise, and helpful advice (2 to 4 sentences). Address the customer with refined warmth.
2. VERIFIED CATALOGUE GROUNDING: Recommend ONLY products that exist in the catalogue list below. Reference them by their exact slugs in "suggestedProductSlugs".
3. NEVER INVENT PRODUCTS OR PRICES: Never invent product names, fake prices, unverified discounts, false stock statuses, or delivery promises.
4. NO MEDICAL OR DISEASE-TREATMENT CLAIMS: Never claim to cure, treat, or prevent any illness or disease. You may mention natural dietary aspects (e.g. natural source of fiber, protein, low GI, zero added refined sugar), but always advise consulting a personal physician for specific medical conditions.
5. NO UNAUTHORIZED ORDER/PAYMENT CLAIMS: Never claim that an item was added, an order was placed, or a payment succeeded unless confirmed by the system.
6. CLARIFY IF UNMATCHED: If the customer asks for something not in the catalogue or unrelated, politely clarify what royal harvests are available or guide them to relevant sections.
7. OUTPUT FORMAT: Respond strictly in valid JSON matching this schema:
{
  "reply": "Your natural, elegant response to the customer.",
  "suggestedProductSlugs": ["exact-slug-1", "exact-slug-2"],
  "quickPrompts": ["Relevant question 1", "Relevant question 2", "Relevant question 3"]
}

VERIFIED CATALOGUE:
${JSON.stringify(catalogSummary)}`;

      // 3. Format validated multi-turn conversation history
      const formattedHistory: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];
      if (Array.isArray(history)) {
        for (const turn of history.slice(-6)) {
          if (
            (turn.role === "user" || turn.role === "model") &&
            typeof turn.text === "string" &&
            turn.text.trim()
          ) {
            formattedHistory.push({
              role: turn.role,
              parts: [{ text: turn.text.trim().substring(0, 500) }],
            });
          }
        }
      }

      const contents = [
        ...formattedHistory,
        { role: "user" as const, parts: [{ text: cleanQuery.substring(0, 1000) }] },
      ];

      // 4. Initialize official @google/genai client
      const ai = new GoogleGenAI({ apiKey });

      // Supported model cascade: prioritizes user override, then gemini-2.0-flash, gemini-2.0-flash-lite, gemini-1.5-flash-latest
      const candidateModels = [
        process.env.GEMINI_MODEL?.trim(),
        "gemini-2.0-flash",
        "gemini-2.0-flash-lite",
        "gemini-1.5-flash-latest",
        "gemini-1.5-flash",
      ].filter(Boolean) as string[];

      // 5. Execute with 5000ms timeout guard
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Gemini API call timed out after 5000ms")), 5000)
      );

      const generatePromise = (async () => {
        let lastError: any = null;
        for (const model of candidateModels) {
          try {
            const res = await ai.models.generateContent({
              model,
              contents,
              config: {
                systemInstruction,
                responseMimeType: "application/json",
                temperature: 0.2,
                maxOutputTokens: 800,
              },
            });
            if (res && res.text) {
              return res;
            }
          } catch (modelErr: any) {
            lastError = modelErr;
          }
        }
        throw lastError || new Error("All candidate Gemini models failed.");
      })();

      const response = await Promise.race([generatePromise, timeoutPromise]);
      const candidateText = response.text?.trim() || "";

      if (!candidateText) {
        return this.consult(cleanQuery);
      }

      // 6. Parse structured response
      let parsed: { reply?: string; suggestedProductSlugs?: string[]; quickPrompts?: string[] } = {};
      try {
        parsed = JSON.parse(candidateText);
      } catch {
        const jsonMatch = candidateText.match(/\{[\s\S]*\}/);
        if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
      }

      if (parsed.reply && typeof parsed.reply === "string") {
        // 7. Grounding validation: ensure recommended slugs actually exist in STOREFRONT_PRODUCTS
        const rawSlugs = Array.isArray(parsed.suggestedProductSlugs) ? parsed.suggestedProductSlugs : [];
        const validatedProducts = this.findProductsBySlugs(rawSlugs);

        // Fallback to keyword matching if Gemini suggested non-existent products
        const finalProducts =
          validatedProducts.length > 0 ? validatedProducts : this.consult(cleanQuery).suggestedProducts;

        return {
          reply: parsed.reply,
          suggestedProducts: finalProducts.slice(0, 3),
          quickPrompts:
            Array.isArray(parsed.quickPrompts) && parsed.quickPrompts.length > 0
              ? parsed.quickPrompts.slice(0, 4)
              : [
                  "Compare Medjool vs Ajwa Dates",
                  "Why are Kashmiri Mamra Almonds special?",
                  "Recommend products under ₹1,000",
                ],
          provider: "live_ai",
        };
      }

      return this.consult(cleanQuery);
    } catch (err: any) {
      // Gracefully fall back to deterministic catalogue rule engine
      console.warn(
        `[SommelierService] Gemini live AI consultation bypassed (${err?.message || "unknown"}). Falling back to Catalogue Rule Engine.`
      );
      return this.consult(cleanQuery);
    }
  }

  /**
   * Deterministic, grounded catalog intelligence engine.
   * Matches consumer culinary intent against verified harvests, authentic terroir stories,
   * dietary tags, budget boundaries, and official packaging standards from the actual store catalog.
   */
  static consult(query: string): SommelierResponse {
    const q = query.toLowerCase().trim();

    // Default suggestions displayed across interactions
    const defaultPrompts = [
      "Why are Kashmiri Mamra Almonds special?",
      "Which dates are suitable for gifting?",
      "Suggest a healthy snack",
      "Recommend products under ₹1,000",
    ];

    const provider: "catalog_rule_engine" | "live_ai" = "catalog_rule_engine";

    // 1. Inquiries about Dates suitable for Gifting / Festive Dates
    if (
      (q.includes("date") || q.includes("khajoor")) &&
      (q.includes("gift") || q.includes("present") || q.includes("festive") || q.includes("box"))
    ) {
      const products = this.findProductsBySlugs([
        "jumbo-medjool-dates",
        "ajwa-dates",
        "bespoke-gift-box",
      ]);
      return {
        reply:
          "For gifting, our Jumbo Medjool Dates and Saudi Ajwa Dates are presented in elegant packaging. Jumbo Medjool dates offer a rich, caramel-like sweetness with a plump, succulent texture, while Saudi Ajwa dates carry deep cultural significance and a delicate, firm bite. Both can be combined into our handcrafted Bespoke Gift Box with custom personalized messaging.",
        suggestedProducts: products,
        quickPrompts: [
          "Suggest a premium dry fruit gift combination",
          "Compare Medjool vs Ajwa Dates",
          "Recommend products under ₹1,000",
        ],
        provider,
      };
    }

    // 2. Budget / Price Inquiries: "under ₹1,000", "under 1000", "budget", "affordable"
    if (
      q.includes("under 1000") ||
      q.includes("under 1,000") ||
      q.includes("under ₹1000") ||
      q.includes("under ₹1,000") ||
      q.includes("under ₹ 1000") ||
      q.includes("under ₹ 1,000") ||
      q.includes("below 1000") ||
      q.includes("below ₹1000") ||
      q.includes("budget") ||
      q.includes("affordable") ||
      q.includes("under 500") ||
      q.includes("under ₹500")
    ) {
      const products = this.findProductsBySlugs([
        "king-cashews-w180",
        "kashmir-snow-walnuts",
        "kashmiri-mamra-almonds",
      ]);
      return {
        reply:
          "Here are our imperial harvests available under ₹1,000, offering luxury terroir quality at accessible price points: King Cashews W180 Jumbo (starting from ₹350 for 250g), Kashmir Valley Snow Walnuts (starting from ₹450 for 250g), and Grade A+ Kashmiri Imperial Mamra Almonds (starting from ₹650 for 250g).",
        suggestedProducts: products,
        quickPrompts: [
          "Suggest a healthy snack",
          "Recommend premium almonds",
          "Which dates are suitable for gifting?",
        ],
        provider,
      };
    }

    // 3. Dry Fruit Gift Combinations / Gift Hampers
    if (
      (q.includes("gift") || q.includes("hamper") || q.includes("casket") || q.includes("combination") || q.includes("combo")) &&
      (q.includes("dry fruit") || q.includes("combination") || q.includes("combo") || q.includes("box") || q.includes("premium"))
    ) {
      const products = this.findProductsBySlugs([
        "bespoke-gift-box",
        "kashmiri-mamra-almonds",
        "jumbo-medjool-dates",
      ]);
      return {
        reply:
          "For a distinguished dry fruit gift combination, we recommend pairing our high-altitude Kashmiri Imperial Mamra Almonds with Jumbo Medjool Dates inside our handcrafted Bespoke Gift Box. You can choose your casket finish, handpick inclusions, and add a wax-sealed personalized greeting note via our Build Your Own Box experience.",
        suggestedProducts: products,
        quickPrompts: [
          "Which dates are suitable for gifting?",
          "Recommend products under ₹1,000",
          "Why are Kashmiri Mamra Almonds special?",
        ],
        provider,
      };
    }

    // 4. Healthy Snack / Clean Nutrition Inquiries
    if (
      q.includes("healthy snack") ||
      q.includes("snack") ||
      q.includes("healthy") ||
      q.includes("clean snacking") ||
      q.includes("superfood") ||
      q.includes("nutrition")
    ) {
      const products = this.findProductsBySlugs([
        "kashmiri-mamra-almonds",
        "kashmir-snow-walnuts",
        "chia-seeds",
        "anjeer-bites",
      ]);
      return {
        reply:
          "For clean, healthy snacking with zero added refined sugars, we recommend raw Kashmiri Mamra Almonds and Kashmir Snow Walnuts for wholesome plant protein and healthy fats. For a naturally sweet fiber snack, our sun-dried Anjeer Fig & Date Bites contain 0g added sugar. (Note: These whole foods are nutritious choices; please consult a healthcare professional for personal dietary advice.)",
        suggestedProducts: products,
        quickPrompts: [
          "Diabetic-friendly & Low GI options",
          "Recommend premium almonds",
          "Recommend products under ₹1,000",
        ],
        provider,
      };
    }

    // 5. Kashmiri Mamra Almonds & Almond comparisons
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
          "Suggest a healthy snack",
          "Compare Medjool vs Ajwa Dates",
        ],
        provider,
      };
    }

    // 6. Dates / Khajoor selection & comparisons
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
          "Which dates are suitable for gifting?",
          "Are dates sweetened artificially?",
          "Tell me about Kashmiri Mamra Almonds",
        ],
        provider,
      };
    }

    // 7. Health & Dietary: Diabetic friendly / Low GI / Fitness / Protein
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
          "Suggest a healthy snack",
          "Build a custom wellness box",
        ],
        provider,
      };
    }

    // 8. Teas & Valley Infusions (Kahwa, CTC, Chai)
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

    // 9. Gifting, Corporate Hampers & Build-Your-Own-Box
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
          "Which dates are suitable for gifting?",
          "Suggest a premium dry fruit gift combination",
          "Show me bestseller harvests",
        ],
        provider,
      };
    }

    // 10. Walnuts & Cashews
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

    // 11. Shipping, Packaging & Freshness
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

    // 12. Dynamic catalog keyword matching fallback
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

    // 13. Welcoming Sommelier greeting
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
