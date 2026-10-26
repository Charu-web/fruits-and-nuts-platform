"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  Gift,
  Check,
  ShoppingBag,
  Sliders,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import { useCart } from "@/components/cart/cart-context";
import { formatPrice } from "@/lib/utils";
import { STOREFRONT_PRODUCTS } from "@/lib/catalog/storefront-catalog";

interface GiftRecommendation {
  id: string;
  title: string;
  badge: string;
  description: string;
  boxSlug: string;
  recommendedProductSlug: string;
  variantId: string;
  price: number;
  mrp: number;
  imageUrl: string;
  inclusions: string[];
}

export function IntelligentGiftFinder() {
  const { addItem, openDrawer } = useCart();

  // Wizard state
  const [occasion, setOccasion] = useState<string>("festive");
  const [budget, setBudget] = useState<"under1500" | "1500to3500" | "above3500">("1500to3500");
  const [preference, setPreference] = useState<string>("classic");
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);

  // Recommendations logic based on selections
  const getRecommendations = (): GiftRecommendation[] => {
    const bespokeBox = STOREFRONT_PRODUCTS.find((p) => p.slug === "bespoke-gift-box");
    const pineBox = STOREFRONT_PRODUCTS.find((p) => p.slug === "imperial-pine-box");
    const silkBox = STOREFRONT_PRODUCTS.find((p) => p.slug === "royal-silk-duo-box");
    const trunkBox = STOREFRONT_PRODUCTS.find((p) => p.slug === "sovereign-heritage-trunk");

    if (budget === "under1500") {
      return [
        {
          id: "rec-silk-duo",
          title: "The Royal Silk Duo Casket",
          badge: "Best Value • Thoughtful Keepsake",
          description:
            "Handcrafted rigid silk gift box paired with vacuum-sealed jars of select dry fruits.",
          boxSlug: "royal-silk-duo-box",
          recommendedProductSlug: "royal-silk-duo-box",
          variantId: silkBox?.variants?.[0]?.id || "var-box-duo-2",
          price: 350,
          mrp: 450,
          imageUrl: silkBox?.primaryImage?.imageUrl || "/images/products/royal-silk-duo-box.jpg",
          inclusions: [
            "Handcrafted Rigid Silk Dual Casket",
            "Pair with Mamra Almonds & Jumbo Medjool",
            "Personalized Wax-Sealed Calligraphy Note",
          ],
        },
        {
          id: "rec-pine-starter",
          title: "Imperial Pine 4-Jar Wooden Casket",
          badge: "Artisanal Woodwork",
          description:
            "Natural polished pine casket with brass latches, ready for 4 curated gourmet jars.",
          boxSlug: "imperial-pine-box",
          recommendedProductSlug: "imperial-pine-box",
          variantId: pineBox?.variants?.[0]?.id || "var-box-pine-4",
          price: 650,
          mrp: 850,
          imageUrl: pineBox?.primaryImage?.imageUrl || "/images/products/imperial-pine-box.jpg",
          inclusions: [
            "Solid Himalayan Pine Wood Finish",
            "Antique Brass Latches & Hinges",
            "Room for 4 Gourmet Harvest Jars",
          ],
        },
      ];
    }

    if (budget === "above3500") {
      const grandVariant = bespokeBox?.variants?.[1];
      return [
        {
          id: "rec-grand-imperial",
          title: "Fruits & Nuts Grand Imperial Sovereign Hamper",
          badge: "Supreme Luxury • Heirloom Grade",
          description:
            "The pinnacle of Indian gifting: solid carved teakwood casket with 4 oversized gourmet jars and ceremonial silver vark confections.",
          boxSlug: "bespoke-gift-box",
          recommendedProductSlug: "bespoke-gift-box",
          variantId: grandVariant?.id || "var-gft-grd",
          price: grandVariant?.sellingPrice || 4999,
          mrp: grandVariant?.mrp || 5800,
          imageUrl: bespokeBox?.primaryImage?.imageUrl || "/images/products/bespoke-gift-box.jpg",
          inclusions: [
            "Carved Heirloom Teak Wood Casket",
            "Kashmiri Imperial Mamra Almonds (500g)",
            "Jordan Valley Jumbo Medjool Dates (500g)",
            "Kashmir Snow Walnuts & Shahi Kahwa Tea",
            "Gold-Foil Envelope & Wax-Sealed Scroll",
          ],
        },
        {
          id: "rec-heritage-trunk",
          title: "Sovereign Heritage Teak Trunk",
          badge: "Corporate & Royal Weddings",
          description:
            "Distinguished 6-jar banquet trunk fitted with antique brass studs and royal velvet lining.",
          boxSlug: "sovereign-heritage-trunk",
          recommendedProductSlug: "sovereign-heritage-trunk",
          variantId: trunkBox?.variants?.[0]?.id || "var-box-trunk-6",
          price: 950,
          mrp: 1250,
          imageUrl: trunkBox?.primaryImage?.imageUrl || "/images/products/sovereign-heritage-trunk.jpg",
          inclusions: [
            "Heavyweight Heritage Teak Finish Trunk",
            "Brass Lockable Latch System",
            "Fits 6 Full-Size Harvest Glass Jars",
          ],
        },
      ];
    }

    // Default: 1500to3500
    const stdVariant = bespokeBox?.variants?.[0];
    return [
      {
        id: "rec-royal-curated",
        title: "Fruits & Nuts Royal Imperial Hamper Box",
        badge: "Most Popular • Festive Favorite",
        description:
          "Handcrafted teak wood casket filled with our four flagship valley harvests. Perfect for festive celebrations, weddings, and executive appreciation.",
        boxSlug: "bespoke-gift-box",
        recommendedProductSlug: "bespoke-gift-box",
        variantId: stdVariant?.id || "var-gft-std",
        price: stdVariant?.sellingPrice || 2999,
        mrp: stdVariant?.mrp || 3499,
        imageUrl: bespokeBox?.primaryImage?.imageUrl || "/images/products/bespoke-gift-box.jpg",
        inclusions: [
          "Handcrafted Teak Wood Casket",
          "Kashmiri Imperial Mamra Almonds (250g)",
          "Jordan Valley Jumbo Medjool Dates (250g)",
          "Kashmir Snow Walnuts & Shahi Kahwa (100g)",
          "Wax-Sealed Custom Card Included",
        ],
      },
      {
        id: "rec-pine-curated",
        title: "Imperial Pine 4-Jar Wooden Casket",
        badge: "Bespoke Builder Ready",
        description:
          "Artisanal wooden casket. Pair with any 4 dry fruits or teas in our interactive 3D box builder.",
        boxSlug: "imperial-pine-box",
        recommendedProductSlug: "imperial-pine-box",
        variantId: pineBox?.variants?.[0]?.id || "var-box-pine-4",
        price: 650,
        mrp: 850,
        imageUrl: pineBox?.primaryImage?.imageUrl || "/images/products/imperial-pine-box.jpg",
        inclusions: [
          "Natural Solid Pine Wood Construction",
          "Brass Latches & Satin Ribbon Lining",
          "Deep-links into Step-by-Step Box Builder",
        ],
      },
    ];
  };

  const recommendations = getRecommendations();

  const handleAddToCart = async (rec: GiftRecommendation) => {
    try {
      setAddingId(rec.id);
      await addItem(rec.variantId, 1);
      setAddedId(rec.id);
      openDrawer();
      setTimeout(() => setAddedId(null), 2500);
    } catch (err) {
      console.error("Failed to add gift hamper", err);
    } finally {
      setAddingId(null);
    }
  };

  const handleReset = () => {
    setOccasion("festive");
    setBudget("1500to3500");
    setPreference("classic");
  };

  return (
    <div className="bg-[#FAF7F0] rounded-3xl border border-[#E5DEC9] p-6 sm:p-10 shadow-sm space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5DEC9] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Gift className="w-5 h-5 text-[#B89453]" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#987B3E]">
              Intelligent Gift Finder
            </span>
          </div>
          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#173D2C]">
            Curate the Perfect Gift in 3 Steps
          </h3>
          <p className="text-xs sm:text-sm text-[#5F6D65] mt-1">
            Answer 3 quick preferences and let our gifting concierge match the ideal hamper or casket.
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="self-start sm:self-auto text-xs font-semibold text-[#5F6D65] hover:text-[#173D2C] flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5DEC9] bg-white transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Filters</span>
        </button>
      </div>

      {/* 3-Step Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Step 1: Occasion */}
        <div className="space-y-3 bg-white p-5 rounded-2xl border border-[#E5DEC9]">
          <span id="step-occasion-label" className="text-[11px] font-bold uppercase tracking-wider text-[#987B3E] block">
            Step 1 • Occasion
          </span>
          <div role="radiogroup" aria-labelledby="step-occasion-label" className="space-y-2">
            {[
              { id: "festive", label: "Diwali & Festivals" },
              { id: "wedding", label: "Weddings & Anniversaries" },
              { id: "corporate", label: "Corporate & Executive" },
              { id: "wellness", label: "Health & Personal Care" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={occasion === item.id}
                onClick={() => setOccasion(item.id)}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between cursor-pointer border ${
                  occasion === item.id
                    ? "bg-[#173D2C] text-[#FAF7F0] border-[#173D2C] shadow-xs"
                    : "bg-[#FAF7F0] text-[#4A4E46] border-[#E5DEC9] hover:border-[#B89453]"
                }`}
              >
                <span>{item.label}</span>
                {occasion === item.id && <Check className="w-3.5 h-3.5 text-[#B89453]" />}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Budget */}
        <div className="space-y-3 bg-white p-5 rounded-2xl border border-[#E5DEC9]">
          <span id="step-budget-label" className="text-[11px] font-bold uppercase tracking-wider text-[#987B3E] block">
            Step 2 • Budget Tier
          </span>
          <div role="radiogroup" aria-labelledby="step-budget-label" className="space-y-2">
            {[
              { id: "under1500", label: "Under ₹1,500", note: "Thoughtful Tokens" },
              { id: "1500to3500", label: "₹1,500 – ₹3,500", note: "Imperial Reserve" },
              { id: "above3500", label: "Above ₹3,500", note: "Royal Sovereign Casket" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={budget === item.id}
                onClick={() => setBudget(item.id as any)}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between cursor-pointer border ${
                  budget === item.id
                    ? "bg-[#173D2C] text-[#FAF7F0] border-[#173D2C] shadow-xs"
                    : "bg-[#FAF7F0] text-[#4A4E46] border-[#E5DEC9] hover:border-[#B89453]"
                }`}
              >
                <div>
                  <div className="font-bold">{item.label}</div>
                  <div className={`text-[10px] ${budget === item.id ? "text-[#DDD2BF]" : "text-[#5F6D65]"}`}>
                    {item.note}
                  </div>
                </div>
                {budget === item.id && <Check className="w-3.5 h-3.5 text-[#B89453]" />}
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Recipient Preference */}
        <div className="space-y-3 bg-white p-5 rounded-2xl border border-[#E5DEC9]">
          <span id="step-preference-label" className="text-[11px] font-bold uppercase tracking-wider text-[#987B3E] block">
            Step 3 • Palate / Style
          </span>
          <div role="radiogroup" aria-labelledby="step-preference-label" className="space-y-2">
            {[
              { id: "classic", label: "Classic Imperial Dry Fruits" },
              { id: "dates-confection", label: "Luxury Dates & Fig Bites" },
              { id: "tea-rituals", label: "Saffron Kahwa & Estate Teas" },
              { id: "bespoke-builder", label: "Build Custom Selection" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={preference === item.id}
                onClick={() => setPreference(item.id)}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between cursor-pointer border ${
                  preference === item.id
                    ? "bg-[#173D2C] text-[#FAF7F0] border-[#173D2C] shadow-xs"
                    : "bg-[#FAF7F0] text-[#4A4E46] border-[#E5DEC9] hover:border-[#B89453]"
                }`}
              >
                <span>{item.label}</span>
                {preference === item.id && <Check className="w-3.5 h-3.5 text-[#B89453]" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recommended Hampers Presentation */}
      <div className="space-y-4 pt-4 border-t border-[#E5DEC9]">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#987B3E]">
              Recommended Curations
            </span>
            <h4 className="font-serif text-xl sm:text-2xl font-bold text-[#173D2C]">
              Perfect Matches for Your Occasion
            </h4>
          </div>
          <Link
            href="/build-your-own-box"
            className="text-xs font-bold text-[#173D2C] hover:text-[#B89453] inline-flex items-center gap-1 transition-colors"
          >
            <span>Or design from scratch</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className="bg-white rounded-2xl border border-[#E5DEC9] hover:border-[#B89453] p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 mb-1.5">
                      {rec.badge}
                    </span>
                    <h5 className="font-serif font-bold text-lg text-[#173D2C] leading-snug">
                      {rec.title}
                    </h5>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-bold text-[#173D2C]">{formatPrice(rec.price)}</div>
                    {rec.mrp > rec.price && (
                      <div className="text-[10px] text-[#5F6D65] line-through">
                        {formatPrice(rec.mrp)}
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-xs text-[#5F6D65] leading-relaxed">{rec.description}</p>

                {/* Inclusions Pill List */}
                <div className="bg-[#FAF7F0] rounded-xl p-3 border border-[#E5DEC9] space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#987B3E] block">
                    Curated Inclusions:
                  </span>
                  <ul className="text-xs text-[#4A4E46] space-y-1">
                    {rec.inclusions.map((inc, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-[#B89453] shrink-0" />
                        <span>{inc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleAddToCart(rec)}
                  disabled={addingId === rec.id}
                  className="flex-1 px-5 py-3 bg-[#173D2C] hover:bg-[#102C21] text-[#FAF7F0] rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all border border-[#B89453]/40 cursor-pointer disabled:opacity-50"
                >
                  {addedId === rec.id ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>Added to Cart!</span>
                    </>
                  ) : addingId === rec.id ? (
                    <span>Adding to Cart...</span>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4 text-[#B89453]" />
                      <span>Add Hamper to Cart</span>
                    </>
                  )}
                </button>

                <Link
                  href={`/build-your-own-box?box=${rec.boxSlug}`}
                  className="px-5 py-3 bg-white hover:bg-[#FAF7F0] text-[#173D2C] border border-[#E5DEC9] hover:border-[#173D2C] rounded-xl text-xs font-bold text-center transition-all cursor-pointer"
                >
                  Customize in BYOB &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
