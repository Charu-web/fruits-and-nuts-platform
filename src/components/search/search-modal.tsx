"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Search, X, ArrowRight, Sparkles } from "lucide-react";
import { STOREFRONT_PRODUCTS } from "@/lib/catalog/storefront-catalog";
import { ProductImageFrame } from "@/components/catalog/product-image-frame";
import { formatPrice } from "@/lib/utils";
import { SmartSearchService } from "@/services/smart-search.service";

const POPULAR_SEARCHES = [
  "Mamra Almonds",
  "Medjool Dates",
  "Kashmiri Saffron Kahwa",
  "W180 King Cashews",
  "Snow Walnuts",
  "A2 Desi Cow Ghee",
  "Bespoke Gift Box",
  "Belgian Chocolate",
];

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const searchResult =
    query.trim().length > 1
      ? SmartSearchService.search(query, { limit: 6 })
      : { products: [], totalMatches: 0, expandedTerms: [] };

  const results = searchResult.products;

  const handleClose = useCallback(() => {
    setQuery("");
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#173D2C]/60 backdrop-blur-xs transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Dialog */}
      <div
        ref={modalRef}
        className="relative mx-auto mt-16 sm:mt-24 w-full max-w-2xl px-4 z-10"
        role="dialog"
        aria-modal="true"
        aria-label="Search Gourmet Harvests"
      >
        <div className="overflow-hidden rounded-2xl bg-white shadow-2xl border border-[#B89453]/40 animate-fade-in">
          {/* Search Input Bar */}
          <div className="flex items-center border-b border-[#E5DEC9] px-4 py-3 sm:py-4 bg-[#FAF7F0]">
            <Search className="h-5 w-5 text-[#B89453] shrink-0 mr-3" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search royal dry fruits, dates, artisanal teas, gifting"
              placeholder="Search royal dry fruits, dates, artisanal teas, gifting..."
              className="flex-1 bg-transparent text-sm sm:text-base text-[#242824] placeholder:text-[#5F6D65]/60 outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="p-1 rounded-full text-[#5F6D65] hover:text-[#242824] hover:bg-neutral-200/50 mr-2 cursor-pointer"
                aria-label="Clear search query"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close search dialog"
              className="text-xs font-semibold text-[#173D2C] hover:text-[#B89453] uppercase tracking-wider px-2 py-1 rounded cursor-pointer"
            >
              ESC
            </button>
          </div>

          {/* Body Content */}
          <div className="max-h-[60vh] overflow-y-auto p-4 sm:p-6" role="region" aria-live="polite">
            {query.trim().length > 1 ? (
              <div>
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#E5DEC9]/60">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#987B3E]">
                      Matching Harvests ({results.length})
                    </span>
                    {searchResult.matchedNeedTag && (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 uppercase">
                        {searchResult.matchedNeedTag}
                      </span>
                    )}
                  </div>
                  <Link
                    href={`/shop?search=${encodeURIComponent(query.trim())}`}
                    onClick={handleClose}
                    className="text-xs font-semibold text-[#173D2C] hover:text-[#B89453] inline-flex items-center gap-1"
                  >
                    View all results <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>

                {results.length > 0 ? (
                  <div className="divide-y divide-[#E5DEC9]/40">
                    {results.map((product) => (
                      <Link
                        key={product.id}
                        href={`/product/${product.slug}`}
                        onClick={handleClose}
                        className="flex items-center gap-4 py-3 px-2 rounded-xl hover:bg-[#FAF7F0] transition-colors group"
                      >
                        <div className="h-14 w-14 rounded-lg overflow-hidden shrink-0 border border-[#E5DEC9] bg-[#FAF7F0]">
                          <ProductImageFrame
                            src={product.primaryImage?.imageUrl}
                            alt={product.name}
                            productName={product.name}
                            categoryName={product.category?.name}
                            size="sm"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-[#173D2C] group-hover:text-[#B89453] transition-colors truncate">
                            {product.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-[#987B3E] font-medium">
                              {product.category?.name}
                            </span>
                            <span className="text-white/30">•</span>
                            <span className="text-xs font-bold text-[#173D2C]">
                              {formatPrice(product.priceRange?.minSellingPrice ?? 0)}
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-[#B89453] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <p className="font-serif text-base font-semibold text-[#173D2C]">
                      No harvests found for &ldquo;{query}&rdquo;
                    </p>
                    <p className="text-xs text-[#5F6D65] mt-1 mb-4">
                      Try searching for Mamra, Medjool, Kahwa, Cashews, or Gifting.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        handleClose();
                        window.dispatchEvent(new CustomEvent("open-sommelier"));
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#173D2C] hover:bg-[#102C21] text-[#FAF7F0] text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer border border-[#B89453]/40"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#B89453]" />
                      <span>Ask Royal Sommelier Instead</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#987B3E] mb-3">
                  Popular Royal Harvest Searches
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {POPULAR_SEARCHES.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => setQuery(term)}
                      className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-[#FAF7F0] hover:bg-[#DCE5D8] border border-[#E5DEC9] text-[#173D2C] transition-colors cursor-pointer"
                    >
                      {term}
                    </button>
                  ))}
                </div>

                <div className="pt-4 border-t border-[#E5DEC9]/60">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#987B3E] mb-3">
                    Curated Signature Harvests
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {STOREFRONT_PRODUCTS.filter((p) => p.isBestseller)
                      .slice(0, 4)
                      .map((item) => (
                        <Link
                          key={item.id}
                          href={`/product/${item.slug}`}
                          onClick={handleClose}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#FAF7F0] transition-colors group"
                        >
                          <div className="h-10 w-10 rounded-md overflow-hidden shrink-0 border border-[#E5DEC9]">
                            <ProductImageFrame
                              src={item.primaryImage?.imageUrl}
                              alt={item.name}
                              productName={item.name}
                              categoryName={item.category?.name}
                              size="sm"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-[#173D2C] truncate group-hover:text-[#B89453]">
                              {item.name}
                            </p>
                            <p className="text-[10px] text-[#987B3E]">
                              {formatPrice(item.priceRange?.minSellingPrice ?? 0)}
                            </p>
                          </div>
                        </Link>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
