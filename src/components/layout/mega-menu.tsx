"use client";

import React from "react";
import Link from "next/link";

interface MegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MegaMenu({ isOpen, onClose }: MegaMenuProps) {
  if (!isOpen) return null;

  const categoryTaxonomy = [
    {
      title: "Fruits & Nuts",
      href: "/category/fruits-and-nuts",
      badge: "Signature Reserve",
      items: [
        { name: "Raw & Natural Mountain Nuts", href: "/category/fruits-and-nuts" },
        { name: "Roasted & Himalayan Salted", href: "/category/fruits-and-nuts" },
        { name: "Flavored Gourmet Nuts", href: "/category/fruits-and-nuts" },
      ],
    },
    {
      title: "Dry Fruits",
      href: "/category/dry-fruits",
      badge: "Estate Graded",
      items: [
        { name: "Kashmiri Imperial Mamra Almonds", href: "/category/dry-fruits" },
        { name: "King Cashews W180 (Goan Soil)", href: "/category/dry-fruits" },
        { name: "Kashmir Kagzi Snow Walnuts", href: "/category/dry-fruits" },
        { name: "Iranian Roasted Pistachios", href: "/category/dry-fruits" },
        { name: "Turkish Royal Anjeer Figs", href: "/category/dry-fruits" },
      ],
    },
    {
      title: "Dates / Khajoor",
      href: "/category/dates-khajoor",
      badge: "Single Estate",
      items: [
        { name: "Jordan Valley Jumbo Medjool", href: "/category/dates-khajoor" },
        { name: "Holy Medina Ajwa Cultivar", href: "/category/dates-khajoor" },
        { name: "Fresh Bam Kimia Dates", href: "/category/dates-khajoor" },
        { name: "Royal Dates & Pistachio Bites", href: "/category/chocolates" },
      ],
    },
    {
      title: "Artisanal Teas",
      href: "/category/tea",
      badge: "Single Garden",
      items: [
        { name: "Tea Everest (Strong Mountain CTC)", href: "/category/tea" },
        { name: "Tea Supreme (High Elevation Assam)", href: "/category/tea" },
        { name: "Bombay Cutting Special Chai", href: "/category/tea" },
        { name: "Kesariya Chai (Saffron Infused)", href: "/category/tea" },
        { name: "Power Elaichi & Paan Chai", href: "/category/tea" },
        { name: "Shahi Kashmiri Saffron Kahwa", href: "/category/tea" },
      ],
    },
    {
      title: "Gourmet Bites & Chocolates",
      href: "/category/chocolates",
      badge: "Artisan",
      items: [
        { name: "Artisanal Anjeer Bites", href: "/category/chocolates" },
        { name: "Royal Dates Bites (Gift Box)", href: "/category/chocolates" },
        { name: "Belgian Chocolate Almond Dragées", href: "/category/chocolates" },
        { name: "Chocolate Tea Special Blend", href: "/category/tea" },
      ],
    },
    {
      title: "Super Seeds",
      href: "/category/seeds",
      badge: "Wellness",
      items: [
        { name: "Raw Organic Chia Seeds (₹750/kg)", href: "/category/seeds" },
        { name: "Roasted Organic Flax Seeds (₹450/kg)", href: "/category/seeds" },
        { name: "Raw Himalayan Pumpkin Seeds", href: "/category/seeds" },
        { name: "Organic Basil Seeds / Sabja", href: "/category/seeds" },
      ],
    },
    {
      title: "Mouth Fresheners",
      href: "/category/mouth-fresheners",
      badge: "100% Tobacco-Free",
      items: [
        { name: "Heritage Shahi Paan Confections", href: "/category/mouth-fresheners" },
        { name: "Roasted Digestive Seeds Mukhwas", href: "/category/mouth-fresheners" },
        { name: "Traditional Amla Digestives", href: "/category/mouth-fresheners" },
      ],
    },
    {
      title: "Combos & Bundles",
      href: "/category/combos",
      badge: "Best Value",
      items: [
        { name: "Daily Health Family Packs", href: "/category/combos" },
        { name: "Multi-Pack Harvest Bundles", href: "/category/combos" },
      ],
    },
    {
      title: "Gift Packs & Gifting",
      href: "/gifting",
      highlight: true,
      badge: "Bespoke Atelier",
      items: [
        { name: "Build Your Own Box (4-Step BYOB)", href: "/build-your-own-box", isNew: true },
        { name: "Classic Pine Keepsake Boxes", href: "/gifting" },
        { name: "Royal Velvet Presentation Trays", href: "/gifting" },
        { name: "Heritage Wedding & Festive Hampers", href: "/gifting" },
      ],
    },
    {
      title: "Specialty Pantry",
      href: "/category/specialty",
      badge: "High Altitude",
      items: [
        { name: "Traditional A2 Desi Cow Ghee (₹1,400)", href: "/category/specialty" },
        { name: "Kashmiri Grade-A Mongra Saffron", href: "/category/specialty" },
        { name: "Organic Wild Forest Honey", href: "/category/specialty" },
      ],
    },
  ];

  return (
    <div
      className="absolute top-full left-0 w-full bg-[#FAF7F0] shadow-2xl border-b border-[#B99A58]/35 z-40 animate-fade-in"
      onMouseLeave={onClose}
    >
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#E5DEC9]">
          <div>
            <h3 className="font-serif text-lg font-bold text-[#102C21]">
              The Royal Gourmet Taxonomy
            </h3>
            <p className="text-xs text-[#6B7267]">
              Single-origin dry fruits, royal dates, estate-plucked teas, artisanal chocolates, and bespoke gifting.
            </p>
          </div>
          <Link
            href="/shop"
            onClick={onClose}
            className="text-xs font-bold uppercase tracking-wider text-[#173D2D] hover:text-[#B99A58] transition-colors flex items-center gap-1"
          >
            Browse Full Catalogue &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {categoryTaxonomy.map((cat, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-xl transition-all ${
                cat.highlight
                  ? "bg-[#102C21] text-[#FAF7F0] border border-[#B99A58]/50 shadow-md"
                  : "bg-white border border-[#E5DEC9] hover:border-[#B99A58]/60 hover:shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between gap-1.5 mb-2.5 pb-1.5 border-b border-[#E5DEC9]/60">
                <Link
                  href={cat.href}
                  onClick={onClose}
                  className={`font-serif text-xs font-bold tracking-wide transition-colors line-clamp-1 ${
                    cat.highlight ? "text-[#D4B776] hover:text-white" : "text-[#102C21] hover:text-[#B99A58]"
                  }`}
                >
                  {cat.title}
                </Link>
                {cat.badge && (
                  <span
                    className={`text-[8px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded shrink-0 ${
                      cat.highlight
                        ? "bg-[#B99A58] text-[#102C21]"
                        : "bg-[#B99A58]/15 text-[#987B3E] border border-[#B99A58]/30"
                    }`}
                  >
                    {cat.badge}
                  </span>
                )}
              </div>
              <ul className="space-y-1.5 text-[11px]">
                {cat.items.map((item, iIdx) => (
                  <li key={iIdx}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={`flex items-center justify-between transition-colors py-0.5 group line-clamp-1 ${
                        cat.highlight
                          ? "text-[#FAF7F0]/85 hover:text-white"
                          : "text-[#4A4E46] hover:text-[#173D2D]"
                      }`}
                    >
                      <span className="group-hover:translate-x-0.5 transition-transform truncate">{item.name}</span>
                      {"isNew" in item && item.isNew && (
                        <span className="text-[8px] text-[#102C21] font-bold bg-[#D4B776] px-1 py-0.1 rounded uppercase tracking-wider ml-1">
                          BYOB
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Featured Terroir & Provenance Banner */}
        <div className="mt-6 pt-4 border-t border-[#E5DEC9] flex flex-col sm:flex-row items-center justify-between bg-white p-4 rounded-xl border border-[#B99A58]/30 gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-full bg-[#102C21] text-[#D4B776] flex items-center justify-center font-bold text-sm shadow-xs border border-[#B99A58]/40">
              📍
            </div>
            <div>
              <p className="text-xs font-bold text-[#102C21] uppercase tracking-wider">
                The Royal India Taste Map & Provenance
              </p>
              <p className="text-xs text-[#6B7267]">
                Trace each harvest batch directly to Kashmiri orchards, Coorg highlands, and coastal Goan groves.
              </p>
            </div>
          </div>
          <Link
            href="/taste-map"
            onClick={onClose}
            className="px-5 py-2 bg-[#173D2D] hover:bg-[#102C21] text-[#D4B776] text-xs font-bold tracking-wider uppercase rounded-lg border border-[#B99A58]/40 transition-all transform hover:-translate-y-0.5 text-center whitespace-nowrap cursor-pointer"
          >
            Explore Interactive Map &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
