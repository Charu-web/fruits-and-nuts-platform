"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, Plus, Check } from "lucide-react";
import { useCart } from "@/components/cart/cart-context";
import { ProductImageFrame } from "./product-image-frame";
import { getProductImageUrl } from "@/lib/catalog/product-asset-registry";
import { formatPrice } from "@/lib/utils";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import {
  buildSingleProductWhatsAppMessage,
  createWhatsAppOrderLink,
} from "@/lib/whatsapp-shopping";

export interface ProductCardVariant {
  id: string;
  sku: string;
  weightGrams: number;
  unit: string;
  packageType?: string;
  mrp: number;
  sellingPrice: number;
  discountPercentage?: number;
  stockStatus?: string;
  isAvailable?: boolean;
}

export interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  category?: { name: string; slug: string } | null;
  primaryImage?: { imageUrl: string; altText: string } | null;
  priceRange?: {
    minSellingPrice: number;
    maxSellingPrice: number;
    minMrp: number;
    maxMrp: number;
    discountPercentage: number;
  };
  stockStatus?: string;
  variants?: ProductCardVariant[];
  needTags?: string[];
}

export function ProductCard({
  id,
  name,
  slug,
  category,
  primaryImage,
  priceRange,
  stockStatus = "IN_STOCK",
  variants = [],
}: ProductCardProps) {
  const { addItem, isCartLoading } = useCart();
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [addedNotification, setAddedNotification] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Read saved wishlist from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("fn_wishlist");
      if (saved) {
        const list: string[] = JSON.parse(saved);
        if (list.includes(id) || list.includes(slug)) {
          setIsWishlisted(true);
        }
      }
    } catch {
      // Ignore localStorage read errors in SSR/private browsing
    }
  }, [id, slug]);

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const saved = localStorage.getItem("fn_wishlist");
      let list: string[] = saved ? JSON.parse(saved) : [];
      if (isWishlisted) {
        list = list.filter((item) => item !== id && item !== slug);
        setIsWishlisted(false);
      } else {
        list.push(slug);
        setIsWishlisted(true);
      }
      localStorage.setItem("fn_wishlist", JSON.stringify(list));
    } catch {
      setIsWishlisted(!isWishlisted);
    }
  };

  const selectedVariant = variants.length > 0 ? variants[selectedVariantIndex] : null;

  const currentPrice = selectedVariant ? selectedVariant.sellingPrice : priceRange?.minSellingPrice ?? 0;
  const currentMrp = selectedVariant ? selectedVariant.mrp : priceRange?.minMrp ?? 0;
  const discountPercent =
    selectedVariant?.discountPercentage !== undefined
      ? selectedVariant.discountPercentage
      : priceRange?.discountPercentage ?? (currentMrp > currentPrice ? Math.round(((currentMrp - currentPrice) / currentMrp) * 100) : 0);

  const isOutOfStock =
    stockStatus === "OUT_OF_STOCK" ||
    (selectedVariant !== null && selectedVariant.isAvailable === false);

  const isLowStock = stockStatus === "LOW_STOCK";

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isOutOfStock || isAdding) return;

    const variantIdToAdd = selectedVariant ? selectedVariant.id : variants[0]?.id;
    if (!variantIdToAdd) {
      window.location.href = `/product/${slug}`;
      return;
    }

    try {
      setIsAdding(true);
      await addItem(variantIdToAdd, 1);
      setAddedNotification(true);
      setTimeout(() => setAddedNotification(false), 2000);
    } catch {
      // Cart context handles error display
    } finally {
      setIsAdding(false);
    }
  };

  const handleShopOnWhatsApp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const origin =
      typeof window !== "undefined" && window.location?.origin
        ? window.location.origin
        : undefined;

    const message = buildSingleProductWhatsAppMessage(
      {
        productName: name,
        productSlug: slug,
        sku: selectedVariant?.sku || null,
        weightGrams: selectedVariant?.weightGrams || null,
        unit: selectedVariant?.unit || "GRAMS",
        packageType: selectedVariant?.packageType || null,
        unitPrice: currentPrice,
        quantity: 1,
      },
      origin
    );

    const linkResult = createWhatsAppOrderLink(message);
    if (linkResult.isConfigured && linkResult.url) {
      window.open(linkResult.url, "_blank", "noopener,noreferrer");
    }
  };

  const formatWeight = (grams: number, unit?: string) => {
    if (unit === "KILOGRAMS" || grams >= 1000) {
      const kg = grams >= 1000 ? grams / 1000 : grams;
      return `${kg}kg`;
    }
    return `${grams}g`;
  };

  return (
    <div className="group relative flex flex-col justify-between bg-white rounded-lg border border-[#E5DEC9] hover:border-[#B89453] shadow-xs hover:shadow-[0_12px_28px_-6px_rgba(23,61,44,0.12)] hover:-translate-y-1 transition-all duration-300 overflow-hidden">
      {/* Image, Badges and Wishlist Trigger */}
      <Link href={`/product/${slug}`} className="block relative aspect-square w-full bg-[#FAF7F0] overflow-hidden">
        <div className="w-full h-full transition-transform duration-500 ease-out group-hover:scale-[1.03]">
          <ProductImageFrame
            src={primaryImage?.imageUrl || getProductImageUrl(slug)}
            alt={primaryImage?.altText || name}
            productName={name}
            categoryName={category?.name}
            size="md"
          />
        </div>

        {/* Badges Container (Top-Left) */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
          {discountPercent > 0 && (
            <span className="bg-[#B89453] text-[#173D2C] font-bold text-[10px] tracking-widest uppercase px-2 py-0.5 rounded-sm shadow-xs border border-[#987B3E]/30">
              {discountPercent}% OFF
            </span>
          )}
          {isOutOfStock && (
            <span className="bg-[#173D2C]/90 backdrop-blur-xs text-[#FAF7F0] font-medium text-[10px] tracking-widest uppercase px-2 py-0.5 rounded-sm">
              Out of Stock
            </span>
          )}
          {isLowStock && !isOutOfStock && (
            <span className="bg-[#987B3E] text-white font-medium text-[10px] tracking-widest uppercase px-2 py-0.5 rounded-sm">
              Low Stock
            </span>
          )}
        </div>

        {/* Wishlist Button (Top-Right) */}
        <button
          type="button"
          onClick={toggleWishlist}
          aria-label={isWishlisted ? `Remove ${name} from wishlist` : `Add ${name} to wishlist`}
          className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-xs border border-[#E5DEC9] shadow-xs transition-transform duration-200 hover:scale-110 hover:border-[#B89453] cursor-pointer"
        >
          <Heart
            className={`h-3.5 w-3.5 transition-colors ${
              isWishlisted
                ? "fill-[#7F202B] text-[#7F202B]"
                : "text-[#5F6D65] hover:text-[#173D2C]"
            }`}
          />
        </button>
      </Link>

      {/* Product Information */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-3 bg-white">
        <div>
          {/* Category Eyebrow */}
          <div className="min-h-[1.25rem] mb-1 flex items-center">
            {category ? (
              <Link
                href={`/category/${category.slug}`}
                className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#987B3E] hover:text-[#173D2C] transition-colors line-clamp-1 block"
              >
                {category.name}
              </Link>
            ) : (
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#987B3E] block">
                ROYAL HARVEST
              </span>
            )}
          </div>

          {/* Product Title */}
          <Link href={`/product/${slug}`} className="group/title block">
            <h3 className="font-serif text-sm sm:text-base font-bold text-[#173D2C] group-hover/title:text-[#987B3E] transition-colors line-clamp-2 leading-snug min-h-[2.5rem] sm:min-h-[2.8rem]">
              {name}
            </h3>
          </Link>
        </div>

        {/* Variant Selectors or Net Weight Badge */}
        <div className="min-h-[2rem] flex items-center">
          {variants.length > 1 ? (
            <div className="flex flex-wrap gap-1.5">
              {variants.map((v, idx) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedVariantIndex(idx);
                  }}
                  className={`text-xs px-2.5 py-1 rounded-md font-medium border transition-all duration-200 cursor-pointer ${
                    selectedVariantIndex === idx
                      ? "border-[#173D2C] bg-[#173D2C] text-[#FAF7F0] shadow-xs"
                      : "border-[#E5DEC9] bg-[#FAF7F0] text-[#4A4E46] hover:border-[#B89453] hover:text-[#173D2C]"
                  }`}
                >
                  {formatWeight(v.weightGrams, v.unit)}
                </button>
              ))}
            </div>
          ) : variants.length === 1 ? (
            <span className="text-xs font-medium text-[#4A4E46] bg-[#FAF7F0] border border-[#E5DEC9] px-2.5 py-1 rounded-md">
              Net Weight: {formatWeight(variants[0].weightGrams, variants[0].unit)}
            </span>
          ) : (
            <span className="text-xs font-medium text-[#4A4E46] bg-[#FAF7F0] border border-[#E5DEC9] px-2.5 py-1 rounded-md">
              Single-Estate Selection
            </span>
          )}
        </div>

        {/* Pricing & Add to Cart Container */}
        <div className="pt-3 border-t border-[#E5DEC9] mt-auto space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="shrink-0">
              <div className="flex items-baseline gap-1.5">
                <span className="text-base sm:text-lg font-bold text-[#173D2C] font-serif tracking-tight">
                  {formatPrice(currentPrice)}
                </span>
                {currentMrp > currentPrice && (
                  <span className="text-xs text-[#5F6D65]/70 line-through">
                    {formatPrice(currentMrp)}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-[#5F6D65] font-medium block">
                Inclusive of GST
              </span>
            </div>

            <button
              type="button"
              onClick={handleQuickAdd}
              disabled={isOutOfStock || isAdding || isCartLoading}
              aria-label={
                addedNotification
                  ? `${name} added to cart`
                  : isOutOfStock
                  ? `${name} is sold out`
                  : isAdding
                  ? `Adding ${name} to cart...`
                  : selectedVariant
                  ? `Add ${name} (${formatWeight(selectedVariant.weightGrams, selectedVariant.unit)}) to cart`
                  : `Add ${name} to cart`
              }
              className={`px-3.5 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-all duration-200 shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0 ${
                addedNotification
                  ? "bg-emerald-800 text-white border border-emerald-900"
                  : isOutOfStock
                  ? "bg-[#FAF7F0] text-[#5F6D65] cursor-not-allowed border border-[#E5DEC9]"
                  : "bg-[#173D2C] hover:bg-[#102C21] text-[#FAF7F0] active:scale-95 border border-[#B89453]/50 hover:border-[#B89453] hover:shadow-md"
              }`}
            >
              {addedNotification ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Added</span>
                </>
              ) : isAdding ? (
                <>
                  <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Adding...</span>
                </>
              ) : isOutOfStock ? (
                <span>Sold Out</span>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5 text-[#D4B776]" />
                  <span>Add</span>
                </>
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={handleShopOnWhatsApp}
            aria-label={`Shop ${name} on WhatsApp`}
            className="w-full py-2 px-3 rounded-lg text-xs font-bold tracking-wider uppercase bg-[#FAF7F0] hover:bg-[#173D2C] text-[#173D2C] hover:text-[#FAF7F0] border border-[#173D2C]/80 transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <WhatsAppIcon className="w-3.5 h-3.5 text-[#1E7E34] group-hover:text-current shrink-0" />
            <span>Shop on WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
}
