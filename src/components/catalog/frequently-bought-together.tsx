"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Plus, Check, ShoppingBag, Sparkles } from "lucide-react";
import { useCart } from "@/components/cart/cart-context";
import { formatPrice } from "@/lib/utils";
import {
  RecommendationService,
  FrequentlyBoughtTogetherBundle,
} from "@/services/recommendation.service";

interface FrequentlyBoughtTogetherProps {
  slug: string;
}

export function FrequentlyBoughtTogether({ slug }: FrequentlyBoughtTogetherProps) {
  const { addItem, openDrawer } = useCart();
  const [bundle, setBundle] = useState<FrequentlyBoughtTogetherBundle | null>(
    () => RecommendationService.getFrequentlyBoughtTogether(slug)
  );
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  useEffect(() => {
    // Deterministic instant local retrieval with API fallback
    const localBundle = RecommendationService.getFrequentlyBoughtTogether(slug);
    if (localBundle) {
      setBundle(localBundle);
    } else {
      fetch(`/api/v1/recommendations?slug=${slug}&type=bundle`)
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data?.bundle) {
            setBundle(json.data.bundle);
          }
        })
        .catch(() => {});
    }
  }, [slug]);

  if (!bundle) return null;

  const handleAddBoth = async () => {
    if (isAdding) return;
    try {
      setIsAdding(true);
      await addItem(bundle.primaryProduct.variant.id, 1);
      await addItem(bundle.complementaryProduct.variant.id, 1);
      setIsAdded(true);
      openDrawer();
      setTimeout(() => setIsAdded(false), 3000);
    } catch (err) {
      console.error("Failed to add bundle to cart", err);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="mt-12 bg-[#FAF7F0] rounded-2xl border border-[#E5DEC9] p-6 sm:p-8 shadow-xs">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-[#B89453]" />
        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#987B3E]">
          Perfect Pairings &amp; Culinary Synergy
        </span>
      </div>
      <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#173D2C] mb-2">
        Frequently Bought Together
      </h3>
      <p className="text-xs text-[#5F6D65] mb-6 max-w-2xl italic leading-relaxed">
        &ldquo;{bundle.rationale}&rdquo;
      </p>

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        {/* Products Visual Row */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          {/* Primary Item */}
          <Link
            href={`/product/${bundle.primaryProduct.slug}`}
            className="flex items-center gap-3 p-3 bg-white rounded-xl border border-[#E5DEC9] hover:border-[#B89453] transition-all group"
          >
            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-[#FAF7F0] shrink-0 border border-[#E5DEC9]">
              <Image
                src={bundle.primaryProduct.imageUrl || "/images/placeholder-product.svg"}
                alt={bundle.primaryProduct.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div>
              <p className="text-xs font-bold text-[#173D2C] group-hover:text-[#B89453] transition-colors line-clamp-1">
                {bundle.primaryProduct.name}
              </p>
              <p className="text-[10px] text-[#5F6D65]">{bundle.primaryProduct.variant.weightLabel}</p>
              <p className="text-xs font-bold text-[#173D2C] mt-0.5">
                {formatPrice(bundle.primaryProduct.variant.sellingPrice)}
              </p>
            </div>
          </Link>

          {/* Plus sign */}
          <div className="w-8 h-8 rounded-full bg-[#173D2C]/10 text-[#173D2C] flex items-center justify-center font-bold text-sm shrink-0">
            <Plus className="w-4 h-4" />
          </div>

          {/* Complementary Item */}
          <Link
            href={`/product/${bundle.complementaryProduct.slug}`}
            className="flex items-center gap-3 p-3 bg-white rounded-xl border border-[#E5DEC9] hover:border-[#B89453] transition-all group"
          >
            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-[#FAF7F0] shrink-0 border border-[#E5DEC9]">
              <Image
                src={bundle.complementaryProduct.imageUrl || "/images/placeholder-product.svg"}
                alt={bundle.complementaryProduct.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div>
              <p className="text-xs font-bold text-[#173D2C] group-hover:text-[#B89453] transition-colors line-clamp-1">
                {bundle.complementaryProduct.name}
              </p>
              <p className="text-[10px] text-[#5F6D65]">{bundle.complementaryProduct.variant.weightLabel}</p>
              <p className="text-xs font-bold text-[#173D2C] mt-0.5">
                {formatPrice(bundle.complementaryProduct.variant.sellingPrice)}
              </p>
            </div>
          </Link>
        </div>

        {/* Pricing & 1-Click Action */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto pt-4 lg:pt-0 border-t lg:border-t-0 border-[#E5DEC9]">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg sm:text-xl font-bold text-[#173D2C]">
                {formatPrice(bundle.bundleSellingPrice)}
              </span>
              {bundle.bundleMrp > bundle.bundleSellingPrice && (
                <span className="text-xs text-[#5F6D65] line-through">
                  {formatPrice(bundle.bundleMrp)}
                </span>
              )}
            </div>
            {bundle.bundleSavings > 0 && (
              <span className="inline-block mt-0.5 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                Save {formatPrice(bundle.bundleSavings)} ({bundle.bundleDiscountPercent}% OFF)
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleAddBoth}
            disabled={isAdding}
            className="w-full sm:w-auto px-6 py-3 bg-[#173D2C] hover:bg-[#102C21] text-[#FAF7F0] rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all border border-[#B89453]/40 cursor-pointer disabled:opacity-50"
          >
            {isAdded ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Pairing Added to Cart!</span>
              </>
            ) : isAdding ? (
              <span>Adding Bundle...</span>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4 text-[#B89453]" />
                <span>Add Both to Cart</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
