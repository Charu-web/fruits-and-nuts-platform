"use client";

import React from "react";
import { History, Trash2 } from "lucide-react";
import { ProductCard } from "./product-card";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";

interface RecentlyViewedProductsProps {
  currentSlug?: string;
  maxDisplay?: number;
}

export function RecentlyViewedProducts({
  currentSlug,
  maxDisplay = 4,
}: RecentlyViewedProductsProps) {
  const { products, clearHistory, hasHistory } = useRecentlyViewed(currentSlug);

  if (!hasHistory) return null;

  const displayProducts = products.slice(0, maxDisplay);
  if (displayProducts.length === 0) return null;

  return (
    <div className="mt-16 pt-12 border-t border-[#E5DEC9]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <History className="w-4 h-4 text-[#B89453]" />
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#987B3E]">
              Browsing Session
            </span>
          </div>
          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#173D2C]">
            Recently Viewed Harvests
          </h3>
        </div>

        <button
          type="button"
          onClick={clearHistory}
          className="self-start sm:self-auto text-xs font-semibold text-[#5F6D65] hover:text-rose-700 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5DEC9] bg-white transition-colors cursor-pointer"
          title="Clear browsing session history"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear History</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {displayProducts.map((p) => (
          <ProductCard key={p.id} {...p} />
        ))}
      </div>
    </div>
  );
}
