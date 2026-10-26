"use client";

import React, { useState } from "react";

export interface ProductImageFrameProps {
  src?: string | null;
  alt?: string;
  productName: string;
  categoryName?: string;
  aspectRatio?: "square" | "portrait" | "video";
  size?: "sm" | "md" | "lg" | "pdp";
  className?: string;
  priority?: boolean;
}

/**
 * Premium Product Image Frame with Intentional Luxury Fallback
 *
 * Implements M/S Fruits & Nuts luxury aesthetic:
 * - Consistent double-line antique-gold hairline frame
 * - Warm ivory-to-parchment background (#FAF7F0 -> #F2EAD8)
 * - Deep forest-green medallion (#102C21) with FN royal gold monogram
 * - Prominent, readable serif product-name fallback
 * - Graceful client image loading with seamless error handling
 */
export function ProductImageFrame({
  src,
  alt,
  productName,
  categoryName,
  aspectRatio = "square",
  size = "md",
  className = "",
  priority = false,
}: ProductImageFrameProps) {
  const [hasImageError, setHasImageError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const shouldRenderImage = Boolean(src) && !hasImageError;

  const isSmall = size === "sm";
  const isPdp = size === "pdp" || size === "lg";

  return (
    <div
      className={`relative w-full h-full bg-[#FAF7F0] overflow-hidden flex items-center justify-center select-none ${className}`}
      style={{
        background: "radial-gradient(circle at 50% 45%, #FCFAF6 0%, #F5EFE3 70%, #ECE3D0 100%)",
      }}
    >
      {shouldRenderImage ? (
        <img
          src={src!}
          alt={alt || `${productName} - Royal Gourmet Reserve`}
          className="w-full h-full object-cover object-center transition-transform duration-500 hover:scale-105"
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          onError={() => setHasImageError(true)}
        />

      ) : (
        /* Intentional Luxury Branded Fallback - Product Name is the Hero */
        <div className="relative w-full h-full flex flex-col items-center justify-between p-3.5 sm:p-5 text-center">
          {/* Ornate Gold Inset Hairline Frame */}
          <div className="absolute inset-2 sm:inset-3 border border-[#B99A58]/35 rounded-lg pointer-events-none" />
          <div className="absolute inset-2.5 sm:inset-3.5 border border-[#B99A58]/20 rounded-md pointer-events-none" />

          {/* Corner Flourishes */}
          <div className="absolute top-2.5 left-2.5 sm:top-3.5 sm:left-3.5 w-2 h-2 sm:w-2.5 sm:h-2.5 border-t-2 border-l-2 border-[#B99A58] pointer-events-none" />
          <div className="absolute top-2.5 right-2.5 sm:top-3.5 sm:right-3.5 w-2 h-2 sm:w-2.5 sm:h-2.5 border-t-2 border-r-2 border-[#B99A58] pointer-events-none" />
          <div className="absolute bottom-2.5 left-2.5 sm:bottom-3.5 sm:left-3.5 w-2 h-2 sm:w-2.5 sm:h-2.5 border-b-2 border-l-2 border-[#B99A58] pointer-events-none" />
          <div className="absolute bottom-2.5 right-2.5 sm:bottom-3.5 sm:right-3.5 w-2 h-2 sm:w-2.5 sm:h-2.5 border-b-2 border-r-2 border-[#B99A58] pointer-events-none" />

          {/* Top Eyebrow: Category / Terroir Pedigree */}
          <div className="pt-1.5 sm:pt-2 z-10 w-full px-2">
            <span className="inline-block text-[8px] sm:text-[10px] tracking-[0.22em] font-bold uppercase text-[#987B3E] px-2 py-0.5 rounded-full bg-[#102C21]/5 border border-[#B99A58]/25 truncate max-w-full">
              {categoryName ? categoryName.toUpperCase() : "ROYAL RESERVE"}
            </span>
          </div>

          {/* Center: Subtle Royal Crest + Prominent Product Name */}
          <div className="flex flex-col items-center justify-center my-auto px-2 z-10 w-full max-w-[94%]">
            {/* Refined Royal Brand Crest - Compact and Subordinate to Product Title */}
            <div
              className={`rounded-md bg-white border border-[#B99A58] shadow-xs flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-105 shrink-0 ${
                isSmall
                  ? "h-6 px-1 mb-1"
                  : isPdp
                  ? "h-12 sm:h-14 px-2 py-1 mb-3 border-2"
                  : "h-8 sm:h-9 px-1.5 py-0.5 mb-2"
              }`}
            >
              <img
                src="/images/logo.jpg"
                alt="Fruits & Nuts"
                className="h-full w-auto object-contain"
              />
            </div>

            {/* Clear, Prominent Product-Name Fallback */}
            <h4
              className={`font-serif font-bold text-[#102C21] leading-snug line-clamp-3 px-1 tracking-tight ${
                isSmall
                  ? "text-[11px] leading-tight"
                  : isPdp
                  ? "text-lg sm:text-2xl lg:text-3xl text-[#102C21] font-bold"
                  : "text-xs sm:text-sm md:text-[15px] text-[#102C21]"
              }`}
            >
              {productName}
            </h4>

            {/* Harvest Selection Subtitle */}
            <span
              className={`block text-[#6B7267] font-medium tracking-wide mt-1 ${
                isSmall
                  ? "hidden"
                  : isPdp
                  ? "text-xs sm:text-sm text-[#5F6D65] mt-2 font-medium"
                  : "text-[10px] sm:text-[11px] text-[#5F6D65]"
              }`}
            >
              {isPdp
                ? "Authentic Gourmet Pantry • Studio Photo Pending"
                : "Authentic Harvest"}
            </span>
          </div>

          {/* Bottom Luxury Footer */}
          <div className="pb-1.5 sm:pb-2 flex items-center justify-center gap-1.5 sm:gap-2 z-10 w-full px-2">
            <span className="h-[1px] w-5 sm:w-8 bg-gradient-to-r from-transparent to-[#B99A58]/50" />
            <span className="text-[7px] sm:text-[9px] tracking-[0.2em] text-[#987B3E] font-bold uppercase whitespace-nowrap">
              M/S Fruits &amp; Nuts
            </span>
            <span className="h-[1px] w-5 sm:w-8 bg-gradient-to-l from-transparent to-[#B99A58]/50" />
          </div>
        </div>
      )}
    </div>
  );
}
