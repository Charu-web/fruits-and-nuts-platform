import {
  STOREFRONT_PRODUCTS,
  NeedTag,
} from "@/lib/catalog/storefront-catalog";
import { ProductCardProps } from "@/components/catalog/product-card";

/**
 * Traditional Indian & gourmet food terminology synonyms.
 */
const SYNONYM_MAP: Record<string, string[]> = {
  // Almonds
  badam: ["almond", "mamra"],
  badaam: ["almond", "mamra"],
  almond: ["mamra", "badam"],
  almonds: ["mamra", "badam"],
  mamra: ["almond", "badam"],

  // Cashews
  kaju: ["cashew", "w180"],
  cashew: ["kaju", "w180"],
  cashews: ["kaju", "w180"],
  w180: ["cashew", "kaju"],

  // Walnuts
  akhrot: ["walnut", "kagzi", "snow"],
  akrot: ["walnut", "kagzi"],
  walnut: ["akhrot", "kagzi"],
  walnuts: ["akhrot", "kagzi"],
  kagzi: ["walnut", "akhrot"],

  // Dates
  khajoor: ["date", "medjool", "ajwa", "kimia"],
  khajur: ["date", "medjool", "ajwa", "kimia"],
  dates: ["khajoor", "medjool", "ajwa", "kimia"],
  date: ["khajoor", "medjool", "ajwa"],
  medjool: ["date", "khajoor"],
  ajwa: ["date", "khajoor"],
  kimia: ["date", "khajoor"],

  // Pistachios
  pista: ["pistachio"],
  pistachio: ["pista"],
  pistachios: ["pista"],

  // Raisins
  kishmish: ["raisin", "raisins"],
  kismis: ["raisin", "raisins"],
  raisin: ["kishmish"],
  raisins: ["kishmish"],

  // Teas & Spices
  tea: ["chai", "kahwa", "ctc"],
  chai: ["tea", "kahwa"],
  kahwa: ["tea", "green tea", "saffron", "kehwa"],
  kehwa: ["kahwa", "tea"],
  qahwa: ["kahwa", "tea"],
  saffron: ["kesar", "kahwa", "kesariya"],
  kesar: ["saffron", "kesariya"],
  elaichi: ["cardamom"],
  cardamom: ["elaichi"],
  laung: ["clove", "cloves"],
  clove: ["laung"],
  cloves: ["laung"],
  jaiphal: ["nutmeg"],
  nutmeg: ["jaiphal"],
  hing: ["asafoetida"],
  asafoetida: ["hing"],
  haldi: ["turmeric", "lakadong"],
  turmeric: ["haldi", "lakadong"],

  // Pantry & Confections
  ghee: ["desi cow", "bilona", "a2"],
  bilona: ["ghee"],
  mukhwas: ["paan", "digestive"],
  paan: ["mukhwas", "pan"],
  khakhra: ["snack", "methi"],
  fig: ["anjeer"],
  anjeer: ["fig"],

  // Gifting
  gift: ["box", "hamper", "casket", "byob"],
  gifting: ["box", "hamper", "casket"],
  hamper: ["gift", "box", "casket"],
  box: ["gift", "hamper", "trunk"],
};

/**
 * Maps common lifestyle terms to official catalogue NeedTags.
 */
const NEED_MAP: Record<string, NeedTag> = {
  wellness: "wellness",
  health: "wellness",
  healthy: "wellness",
  immunity: "wellness",
  fitness: "fitness",
  gym: "fitness",
  protein: "fitness",
  workout: "fitness",
  family: "family",
  kitchen: "family",
  daily: "family",
  office: "office",
  desk: "office",
  snack: "office",
  snacking: "office",
  tea: "tea",
  chai: "tea",
  infusion: "tea",
  gifting: "gifting",
  gift: "gifting",
  festive: "gifting",
  diwali: "gifting",
  eid: "gifting",
  wedding: "gifting",
};

/**
 * Standard Levenshtein distance between two strings.
 */
function levenshtein(a: string, b: string): number {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;

  const matrix = Array.from({ length: bn + 1 }, (_, i) => [i]);
  for (let j = 0; j <= an; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= bn; i++) {
    for (let j = 1; j <= an; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[bn][an];
}

export type StorefrontCatalogProduct = (typeof STOREFRONT_PRODUCTS)[number];

export interface SmartSearchResult {
  products: StorefrontCatalogProduct[];
  totalMatches: number;
  expandedTerms: string[];
  matchedNeedTag?: NeedTag;
}

export class SmartSearchService {
  /**
   * Performs an intelligent, typo-tolerant search across the catalogue.
   * Scores products based on exact name matches, synonym matches, fuzzy phonetic matches,
   * category, terroir, and need-tag affinity.
   */
  static search(
    query: string,
    options?: { limit?: number; categorySlug?: string; needTag?: NeedTag }
  ): SmartSearchResult {
    const raw = query.toLowerCase().trim();
    if (!raw) {
      const all = options?.categorySlug
        ? STOREFRONT_PRODUCTS.filter((p) => p.category?.slug === options.categorySlug)
        : STOREFRONT_PRODUCTS;
      return {
        products: all.slice(0, options?.limit || 12),
        totalMatches: all.length,
        expandedTerms: [],
      };
    }

    const tokens = raw.split(/[\s,+/_-]+/).filter((t) => t.length > 1);

    // 1. Synonym & Need Tag expansion
    const expandedTerms = new Set<string>(tokens);
    let detectedNeed: NeedTag | undefined = options?.needTag;

    for (const token of tokens) {
      if (SYNONYM_MAP[token]) {
        SYNONYM_MAP[token].forEach((syn) => expandedTerms.add(syn));
      }
      if (!detectedNeed && NEED_MAP[token]) {
        detectedNeed = NEED_MAP[token];
      }
    }

    // 2. Score each product
    const scoredProducts: Array<{ product: StorefrontCatalogProduct; score: number }> = [];

    for (const p of STOREFRONT_PRODUCTS) {
      // Optional category constraint
      if (options?.categorySlug && options.categorySlug !== "all") {
        if (p.category?.slug !== options.categorySlug && p.collectionGroup !== options.categorySlug) {
          continue;
        }
      }

      let score = 0;
      const pNameLower = p.name.toLowerCase();
      const pSlugLower = p.slug.toLowerCase();
      const pCatLower = p.category?.name.toLowerCase() || "";
      const pTagLower = p.tag?.toLowerCase() || "";
      const pTerroirLower = p.terroir?.toLowerCase() || "";
      const pTokensSet = new Set<string>();
      pNameLower.split(/[\s,+/()_-]+/).forEach((t) => {
        if (t.length > 1) {
          pTokensSet.add(t);
          if (t.endsWith("s") && t.length > 3) pTokensSet.add(t.slice(0, -1));
        }
      });
      pSlugLower.split("-").forEach((t) => {
        if (t.length > 1) {
          pTokensSet.add(t);
          if (t.endsWith("s") && t.length > 3) pTokensSet.add(t.slice(0, -1));
        }
      });
      const pTokens = Array.from(pTokensSet);

      // A. Exact full string match
      if (pNameLower.includes(raw) || pSlugLower.includes(raw)) {
        score += 80;
      }

      // B. Token evaluation (direct, synonyms, fuzzy)
      for (const term of expandedTerms) {
        // Direct substring in name
        if (pNameLower.includes(term)) {
          score += 40;
        } else if (pCatLower.includes(term)) {
          score += 25;
        } else if (pTagLower.includes(term) || pTerroirLower.includes(term)) {
          score += 20;
        }

        // Fuzzy match against product tokens
        if (term.length >= 4) {
          const termNorm = term.endsWith("s") && term.length > 4 ? term.slice(0, -1) : term;
          for (const pToken of pTokens) {
            if (pToken.length >= 4) {
              const dist = Math.min(
                levenshtein(term, pToken),
                levenshtein(termNorm, pToken)
              );
              if (dist === 1) {
                score += 35; // 1-letter typo
              } else if (dist === 2 && Math.max(term.length, pToken.length) >= 5) {
                score += 25; // 2-letter transposition/typo
              }
            }
          }
        }
      }

      // C. Need-tag affinity bonus
      if (detectedNeed && p.needTags?.includes(detectedNeed)) {
        score += 25;
      }

      if (score > 0) {
        scoredProducts.push({ product: p, score });
      }
    }

    // Sort by relevance score descending
    scoredProducts.sort((a, b) => b.score - a.score);

    const limit = options?.limit || 20;
    const finalProducts = scoredProducts.slice(0, limit).map((s) => s.product);

    return {
      products: finalProducts,
      totalMatches: scoredProducts.length,
      expandedTerms: Array.from(expandedTerms),
      matchedNeedTag: detectedNeed,
    };
  }
}
