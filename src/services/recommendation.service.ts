import {
  STOREFRONT_PRODUCTS,
  NeedTag,
} from "@/lib/catalog/storefront-catalog";
import { ProductCardProps } from "@/components/catalog/product-card";

export interface ComplementaryPairing {
  product: ProductCardProps & {
    tag?: string;
    terroir?: string;
    needTags?: NeedTag[];
  };
  rationale: string;
  badge: string;
}

export interface FrequentlyBoughtTogetherBundle {
  primaryProduct: {
    id: string;
    name: string;
    slug: string;
    imageUrl: string;
    variant: {
      id: string;
      sku: string;
      weightLabel: string;
      sellingPrice: number;
      mrp: number;
    };
  };
  complementaryProduct: {
    id: string;
    name: string;
    slug: string;
    imageUrl: string;
    variant: {
      id: string;
      sku: string;
      weightLabel: string;
      sellingPrice: number;
      mrp: number;
    };
  };
  bundleSellingPrice: number;
  bundleMrp: number;
  bundleSavings: number;
  bundleDiscountPercent: number;
  rationale: string;
}

/**
 * Knowledge graph mapping flagship gourmet harvests to their traditional culinary & nutritional pairings.
 */
const CULINARY_PAIRING_GRAPH: Record<
  string,
  Array<{ targetSlug: string; rationale: string; badge: string }>
> = {
  "kashmiri-mamra-almonds": [
    {
      targetSlug: "kashmiri-shahi-kahwa",
      rationale: "Traditional valley ritual: Mamra almond slivers stirred into warm saffron Kahwa infusion.",
      badge: "Signature Ritual",
    },
    {
      targetSlug: "kashmir-snow-walnuts",
      rationale: "High Himalayan brain fuel: cold-climate Mamra almonds paired with rich Kagzi walnuts.",
      badge: "Terroir Synergy",
    },
    {
      targetSlug: "jumbo-medjool-dates",
      rationale: "Clean natural energy: crisp almond crunch with luscious Medjool caramel sweetness.",
      badge: "Vedic Fuel",
    },
    {
      targetSlug: "afghan-raisins-kishmish",
      rationale: "Time-honored morning combination for natural iron and long-lasting vitality.",
      badge: "Everyday Vitality",
    },
  ],
  "jumbo-medjool-dates": [
    {
      targetSlug: "kashmiri-mamra-almonds",
      rationale: "Stuffed date delicacy: pitted Medjool filled with crisp raw Kashmiri Mamra almonds.",
      badge: "Royal Pairing",
    },
    {
      targetSlug: "king-cashews-w180",
      rationale: "Creamy whole cashew crunch perfectly balances the velvety molasses profile of Medjool.",
      badge: "Gourmet Texture",
    },
    {
      targetSlug: "pista-salted",
      rationale: "Vibrant emerald pistachio kernels complement date caramel sweetness.",
      badge: "Middle Eastern Classic",
    },
  ],
  "kashmir-snow-walnuts": [
    {
      targetSlug: "kashmiri-mamra-almonds",
      rationale: "The complete Himalayan kernel duo: pure plant Omega-3s with vitamin E richness.",
      badge: "Cognitive Health",
    },
    {
      targetSlug: "kashmiri-shahi-kahwa",
      rationale: "Aromatic green tea infused with cinnamon and cloves, paired with buttery raw walnut halves.",
      badge: "Tea Ceremony",
    },
  ],
  "king-cashews-w180": [
    {
      targetSlug: "pista-salted",
      rationale: "The ultimate entertaining platter: jumbo W180 cashews and roasted salted pistachios.",
      badge: "Host Reserve",
    },
    {
      targetSlug: "jumbo-medjool-dates",
      rationale: "Rich wholesome pairing balancing savory nut oils with rich natural fructose.",
      badge: "Gourmet Contrast",
    },
  ],
  "kashmiri-shahi-kahwa": [
    {
      targetSlug: "kashmiri-mamra-almonds",
      rationale: "Authentic serving standard: Kahwa is traditionally garnished with fresh crushed Mamra slivers.",
      badge: "Mandatory Garnish",
    },
    {
      targetSlug: "kashmir-snow-walnuts",
      rationale: "Slow-roasted afternoon accompaniment for authentic mountain tea sessions.",
      badge: "Mountain Classic",
    },
  ],
  "bespoke-gift-box": [
    {
      targetSlug: "kashmiri-mamra-almonds",
      rationale: "The crown jewel inclusion for any bespoke handcrafted corporate or festive casket.",
      badge: "Gifting Pillar",
    },
    {
      targetSlug: "jumbo-medjool-dates",
      rationale: "Prestige presentation piece featuring large select Medjool dates in velvet casing.",
      badge: "Festive Favorite",
    },
  ],
};

export class RecommendationService {
  /**
   * Retrieves intelligent complementary product pairings for a given product slug.
   * Leverages the culinary knowledge graph, filled with need-affinity and category fallbacks.
   */
  static getComplementaryPairings(slug: string, limit = 4): ComplementaryPairing[] {
    const primary = STOREFRONT_PRODUCTS.find((p) => p.slug === slug);
    const pairings: ComplementaryPairing[] = [];
    const seenSlugs = new Set<string>([slug]);

    // 1. Check knowledge graph
    const graphEntries = CULINARY_PAIRING_GRAPH[slug] || [];
    for (const entry of graphEntries) {
      if (pairings.length >= limit) break;
      const targetProduct = STOREFRONT_PRODUCTS.find((p) => p.slug === entry.targetSlug);
      if (targetProduct && !seenSlugs.has(targetProduct.slug)) {
        pairings.push({
          product: targetProduct,
          rationale: entry.rationale,
          badge: entry.badge,
        });
        seenSlugs.add(targetProduct.slug);
      }
    }

    // 2. Fill with shared NeedTag affinity if needed
    if (pairings.length < limit && primary?.needTags && primary.needTags.length > 0) {
      const primaryNeed = primary.needTags[0];
      const needMatches = STOREFRONT_PRODUCTS.filter(
        (p) => !seenSlugs.has(p.slug) && p.needTags?.includes(primaryNeed)
      );

      for (const match of needMatches) {
        if (pairings.length >= limit) break;
        pairings.push({
          product: match,
          rationale: `Curated for ${primary.needTags.map((t) => t.toUpperCase()).join(" & ")} lifestyle affinity.`,
          badge: "Need Match",
        });
        seenSlugs.add(match.slug);
      }
    }

    // 3. Fallback to same-category or bestselling harvests
    if (pairings.length < limit) {
      const categoryFallbacks = STOREFRONT_PRODUCTS.filter(
        (p) => !seenSlugs.has(p.slug) && (p.category?.slug === primary?.category?.slug || p.isBestseller)
      );

      for (const fallback of categoryFallbacks) {
        if (pairings.length >= limit) break;
        pairings.push({
          product: fallback,
          rationale: "Frequently selected by patrons exploring our royal dry fruit collection.",
          badge: "Patron Favorite",
        });
        seenSlugs.add(fallback.slug);
      }
    }

    return pairings.slice(0, limit);
  }

  /**
   * Generates a "Frequently Bought Together" combo bundle containing the primary harvest
   * and its highest-affinity pairing, with calculated bundle savings and 1-click cart payload.
   */
  static getFrequentlyBoughtTogether(slug: string): FrequentlyBoughtTogetherBundle | null {
    const primary = STOREFRONT_PRODUCTS.find((p) => p.slug === slug);
    if (!primary || !primary.variants || primary.variants.length === 0) {
      return null;
    }

    const pairings = this.getComplementaryPairings(slug, 1);
    if (pairings.length === 0) {
      return null;
    }

    const pairing = pairings[0];
    const compProduct = pairing.product;
    if (!compProduct.variants || compProduct.variants.length === 0) {
      return null;
    }

    // Choose default variant (prefer index 0 or 1)
    const primaryVariant = primary.variants[0];
    const compVariant = compProduct.variants[0];

    const bundleSellingPrice = primaryVariant.sellingPrice + compVariant.sellingPrice;
    const bundleMrp = primaryVariant.mrp + compVariant.mrp;
    const bundleSavings = bundleMrp - bundleSellingPrice;
    const bundleDiscountPercent =
      bundleMrp > 0 ? Math.round((bundleSavings / bundleMrp) * 100) : 0;

    return {
      primaryProduct: {
        id: primary.id,
        name: primary.name,
        slug: primary.slug,
        imageUrl: primary.primaryImage?.imageUrl || "/images/placeholder-product.svg",
        variant: {
          id: primaryVariant.id,
          sku: primaryVariant.sku,
          weightLabel: `${primaryVariant.weightGrams}${primaryVariant.unit === "KILOGRAMS" ? "kg" : "g"}`,
          sellingPrice: primaryVariant.sellingPrice,
          mrp: primaryVariant.mrp,
        },
      },
      complementaryProduct: {
        id: compProduct.id,
        name: compProduct.name,
        slug: compProduct.slug,
        imageUrl: compProduct.primaryImage?.imageUrl || "/images/placeholder-product.svg",
        variant: {
          id: compVariant.id,
          sku: compVariant.sku,
          weightLabel: `${compVariant.weightGrams}${compVariant.unit === "KILOGRAMS" ? "kg" : "g"}`,
          sellingPrice: compVariant.sellingPrice,
          mrp: compVariant.mrp,
        },
      },
      bundleSellingPrice,
      bundleMrp,
      bundleSavings,
      bundleDiscountPercent,
      rationale: pairing.rationale,
    };
  }

  /**
   * Retrieves products matching a curated need category (Wellness, Fitness, Office, Tea, Gifting).
   */
  static getNeedBasedRecommendations(needTag: NeedTag, excludeSlug?: string, limit = 4) {
    return STOREFRONT_PRODUCTS.filter(
      (p) => (!excludeSlug || p.slug !== excludeSlug) && p.needTags?.includes(needTag)
    ).slice(0, limit);
  }
}
