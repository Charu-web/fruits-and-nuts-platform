import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { ProductImageFrame } from "@/components/catalog/product-image-frame";
import { GiftingCollectionsGrid } from "@/components/gifting/gifting-collections-grid";
import { IntelligentGiftFinder } from "@/components/gifting/intelligent-gift-finder";

export const metadata: Metadata = {
  title: "Occasions Gifting & Bespoke Hampers | M/S Fruits & Nuts",
  description: "Explore handcrafted luxury dry fruit gift boxes, corporate hampers, festive wedding collections, and custom wax-sealed gifting.",
};

export default function GiftingHubPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16">
      {/* Hero Banner */}
      <div className="relative bg-[#102C21] rounded-3xl overflow-hidden shadow-2xl p-8 sm:p-14 text-[#FAF7F0] border border-[#B99A58]/40 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-7 space-y-6">
          <span className="px-3.5 py-1 rounded-full bg-[#173D2D] border border-[#B99A58]/50 text-[#D4B776] text-xs font-bold uppercase tracking-widest inline-block">
            Artisanal Occasion Gifting
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#FAF7F0] leading-tight">
            The Art of Royal Gifting
          </h1>
          <p className="text-[#FAF7F0]/90 text-base leading-relaxed">
            Elevate every celebration with hand-selected imperial dry fruits and nuts packaged in sustainable wooden
            caskets, handcrafted silk boxes, and wax-sealed personalized messages.
          </p>
          <div className="pt-2 flex flex-wrap gap-4">
            <Link
              href="/build-your-own-box"
              className="px-8 py-3.5 bg-[#B99A58] hover:bg-[#987B3E] text-[#102C21] font-bold rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 cursor-pointer border border-[#B99A58]"
            >
              Build Your Own Box &rarr;
            </Link>
            <Link
              href="/shop"
              className="px-6 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-[#FAF7F0] font-medium rounded-xl backdrop-blur-xs transition-all cursor-pointer"
            >
              View Pre-Curated Hampers
            </Link>
          </div>
        </div>

        <div className="lg:col-span-5 flex justify-center">
          <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border-2 border-[#B99A58]/50 shadow-2xl bg-[#FAF7F0]">
            <ProductImageFrame
              src={null}
              productName="Bespoke Royal Casket"
              categoryName="Artisanal Gifting"
              size="pdp"
            />
            <div className="absolute bottom-3 left-3 right-3 text-center pointer-events-none">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4B776] bg-[#102C21]/90 px-3 py-1 rounded-full border border-[#B99A58]/40 backdrop-blur-xs">
                Handcrafted Wooden Casket & Velvet Sleeve
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Intelligent Gift Finder (Feature D) */}
      <IntelligentGiftFinder />

      {/* Curated Collections Grid */}
      <div className="space-y-8">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-[#987B3E]">Signature Collections</span>
          <h2 className="font-serif text-3xl font-bold text-[#102C21] mt-1">Curated Gift Hampers & Occasions</h2>
          <p className="text-[#6B7267] text-sm mt-2">
            Ready-to-ship luxury hampers designed for festivals, weddings, and distinguished corporate gifting. Select an occasion or customize your own box.
          </p>
        </div>

        <GiftingCollectionsGrid />
      </div>

      {/* Corporate & Bulk Inquiry Banner */}
      <div className="bg-white rounded-3xl border border-[#E5DEC9] p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-xs">
        <div className="lg:col-span-8 space-y-4">
          <span className="text-xs font-bold uppercase tracking-widest text-[#987B3E]">B2B & Bulk Solutions</span>
          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#102C21]">
            Corporate Gifting & Custom Brand Laser Engraving
          </h3>
          <p className="text-[#4A4E46] text-sm leading-relaxed max-w-2xl">
            From 25 to 5,000+ luxury gift boxes, our dedicated gifting concierges provide custom logo laser engraving
            on natural pine wood, custom sleeve printing, GST tax invoicing, and direct multi-destination courier dispatch.
          </p>
        </div>
        <div className="lg:col-span-4 flex lg:justify-end">
          <a
            href="mailto:customersupport@fruitsandnuts.co.in?subject=Corporate%20Gifting%20Inquiry"
            className="px-6 py-3.5 bg-[#102C21] hover:bg-[#173D2D] text-[#FAF7F0] font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all text-center block cursor-pointer border border-[#B99A58]/40"
          >
            Inquire for Corporate Rates
          </a>
        </div>
      </div>
    </div>
  );
}
