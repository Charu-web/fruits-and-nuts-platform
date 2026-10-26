"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ProductImageFrame } from "@/components/catalog/product-image-frame";
import { Sparkles, ArrowRight, Gift } from "lucide-react";

export interface GiftCollectionItem {
  id: string;
  title: string;
  tag: string;
  occasionCategory: "all" | "diwali" | "wedding" | "corporate" | "wellness";
  occasionId: string;
  boxId: string;
  description: string;
  price: string;
  imageUrl: string | null;
  features: string[];
}

const COLLECTIONS: GiftCollectionItem[] = [
  {
    id: "diwali-imperial",
    title: "Imperial Diwali & Festive Hamper",
    tag: "Festive Exclusive",
    occasionCategory: "diwali",
    occasionId: "sleeve-diwali",
    boxId: "box-4",
    description: "Solid pine wood casket featuring Kashmiri Mamra Almonds, Kagzi Walnuts, Jumbo Medjool Dates, and Saffron Kahwa.",
    price: "From ₹2,499",
    imageUrl: null,
    features: ["4 Single-Origin Jars", "Festive Gold Ribbon", "Pine Wood Casket"],
  },
  {
    id: "wedding-heritage",
    title: "Royal Wedding Heritage Trunk",
    tag: "Celebrations",
    occasionCategory: "wedding",
    occasionId: "sleeve-wedding",
    boxId: "box-6",
    description: "Teak finish antique brass trunk curated with jumbo Goan cashews, Turkish apricots, Belgian dark dragées, and dry fruit bites.",
    price: "From ₹4,999",
    imageUrl: null,
    features: ["6 Gourmet Fillings", "Crimson Velvet Sleeve", "Antique Brass Latches"],
  },
  {
    id: "corporate-prestige",
    title: "Executive Corporate Prestige Box",
    tag: "Corporate Gifting",
    occasionCategory: "corporate",
    occasionId: "sleeve-corporate",
    boxId: "box-4",
    description: "Embossed matte slate sleeve with customized company branding, whole raw nuts, and vacuum-sealed gourmet selections.",
    price: "From ₹1,899",
    imageUrl: null,
    features: ["B2B GST Invoicing", "Custom Logo Sleeve Option", "4 Pure Harvest Jars"],
  },
  {
    id: "wellness-trio",
    title: "Artisanal Health & Wellness Duo",
    tag: "Everyday Luxury",
    occasionCategory: "wellness",
    occasionId: "sleeve-classic",
    boxId: "box-2",
    description: "Compact botanical duo featuring raw organic pumpkin seeds, roasted salted pistachios, and dried cranberries.",
    price: "From ₹1,299",
    imageUrl: null,
    features: ["Handcrafted Silk Box", "Pure Clean Nutrition", "Botanical Green Sleeve"],
  },
];

const OCCASION_FILTERS = [
  { id: "all", label: "All Hampers" },
  { id: "diwali", label: "Diwali & Festive" },
  { id: "wedding", label: "Royal Weddings" },
  { id: "corporate", label: "Corporate Prestige" },
  { id: "wellness", label: "Health & Wellness" },
] as const;

export function GiftingCollectionsGrid() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredCollections =
    selectedCategory === "all"
      ? COLLECTIONS
      : COLLECTIONS.filter((c) => c.occasionCategory === selectedCategory);

  return (
    <div className="space-y-8">
      {/* Occasion Filter Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
        {OCCASION_FILTERS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSelectedCategory(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === tab.id
                ? "bg-[#102C21] text-[#FAF7F0] shadow-md border border-[#102C21]"
                : "bg-white text-[#5F6D65] hover:text-[#102C21] border border-[#E5DEC9] hover:border-[#B99A58]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredCollections.map((c) => (
          <div
            key={c.id}
            className="bg-white rounded-2xl border border-[#E5DEC9] overflow-hidden flex flex-col justify-between hover:border-[#B99A58] hover:shadow-xl transition-all group"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#FAF7F0]">
              <ProductImageFrame
                src={c.imageUrl}
                productName={c.title}
                categoryName={c.tag}
                size="md"
              />
              <div className="absolute top-3 left-3 pointer-events-none">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4B776] bg-[#102C21]/90 px-2.5 py-0.5 rounded-full border border-[#B99A58]/40 shadow-xs">
                  {c.tag}
                </span>
              </div>
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <h3 className="font-serif font-bold text-[#102C21] text-base group-hover:text-[#987B3E] transition-colors">
                  {c.title}
                </h3>
                <p className="text-xs text-[#6B7267] leading-relaxed mt-1 line-clamp-3">
                  {c.description}
                </p>

                {/* Micro Features */}
                <ul className="mt-3 space-y-1 text-[11px] text-[#5F6D65]">
                  {c.features.map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#B99A58]" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t border-[#E5DEC9] flex items-center justify-between mt-auto">
                <div>
                  <span className="text-[10px] text-[#5F6D65] block uppercase tracking-wider">Starting at</span>
                  <span className="font-serif font-bold text-[#102C21] text-base">{c.price}</span>
                </div>
                <Link
                  href={`/build-your-own-box?box=${c.boxId}&occasion=${c.occasionId}`}
                  className="px-3.5 py-2 rounded-lg bg-[#102C21] hover:bg-[#173D2D] text-[#FAF7F0] text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1 hover:gap-1.5 cursor-pointer border border-[#B99A58]/40"
                >
                  <span>Customize</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
