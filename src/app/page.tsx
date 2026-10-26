"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Truck,
  Leaf,
  MapPin,
  Mail,
  CheckCircle,
  Gift,
  Coffee,
} from "lucide-react";
import { ProductCard, ProductCardProps } from "@/components/catalog/product-card";
import { ProductImageFrame } from "@/components/catalog/product-image-frame";
import { STOREFRONT_PRODUCTS, SHOP_BY_NEEDS, getValidImageUrl } from "@/lib/catalog/storefront-catalog";
import { fetchWithTimeout } from "@/lib/fetch-timeout";

interface HeroProductSlide {
  id: string;
  name: string;
  category: string;
  price: string;
  weight: string;
  imageUrl: string | null;
  altText: string;
  link: string;
  tagline: string;
}

const HERO_PRODUCT_SLIDES: HeroProductSlide[] = [
  {
    id: "kashmiri-mamra-almonds",
    name: "Kashmiri Imperial Mamra Almonds",
    category: "High Himalayan Reserve",
    price: "₹650",
    weight: "250g Pack",
    imageUrl: "/images/products/kashmiri-mamra-almonds.jpg",
    altText: "Kashmiri Imperial Mamra Almonds - Genuine Raw Unblanched Kernels",
    link: "/product/kashmiri-mamra-almonds",
    tagline: "Unblanched high-altitude Mamra almonds, naturally sun-dried to preserve vital nutrition and rich oils.",
  },
  {
    id: "king-cashews-w180",
    name: "King Cashews W180 Jumbo",
    category: "Goan Coastal Harvest",
    price: "₹420",
    weight: "250g Pack",
    imageUrl: "/images/products/king-cashews-w180.jpg",
    altText: "King Cashews W180 Jumbo - Authentic Branded Reserve",
    link: "/product/king-cashews-w180",
    tagline: "Hand-graded Goan jumbo cashews celebrated for exceptional size, buttery richness, and natural crunch.",
  },
  {
    id: "jumbo-medjool-dates",
    name: "Jordan Valley Jumbo Medjool Dates",
    category: "Single Estate Select",
    price: "₹475",
    weight: "250g Pack",
    imageUrl: "/images/products/jumbo-medjool-dates.jpg",
    altText: "Jordan Valley Jumbo Medjool Dates - Authentic Branded Reserve",
    link: "/product/jumbo-medjool-dates",
    tagline: "Plump, soft, and naturally sweet Medjool dates with succulent caramel pulp, vacuum-sealed at source.",
  },
  {
    id: "kashmir-snow-walnuts",
    name: "Kashmir Valley Snow Walnuts",
    category: "Kagzi Thin Shell",
    price: "₹420",
    weight: "250g Pack",
    imageUrl: "/images/products/kashmir-snow-walnuts.jpg",
    altText: "Kashmir Valley Snow Walnuts - Authentic Branded Reserve",
    link: "/product/kashmir-snow-walnuts",
    tagline: "Fragile-shelled Kagzi walnuts yielding undamaged golden-amber butterfly halves with delicate natural flavor.",
  },
];

const HOMEPAGE_CATEGORIES = [
  {
    name: "Dry Fruits & Nuts",
    slug: "dry-fruits",
    href: "/category/dry-fruits",
    image: "/images/products/kashmiri-mamra-almonds.jpg",
    description: "Mamra Almonds, W180 Cashews, Kagzi Walnuts",
    tag: "High Grade",
  },
  {
    name: "Royal Dates",
    slug: "dates-khajoor",
    href: "/category/dates-khajoor",
    image: "/images/products/jumbo-medjool-dates.jpg",
    description: "Jordan Medjool, Medina Ajwa, Bam Kimia",
    tag: "Naturally Sweet",
  },
  {
    name: "Estate Teas",
    slug: "tea",
    href: "/category/tea",
    image: "/images/tea/tea-brewing-lifestyle.jpg",
    description: "Saffron Kahwa, CTC Everest, Bombay Cutting",
    tag: "High Elevation",
  },
  {
    name: "Gourmet Chocolates",
    slug: "chocolates",
    href: "/category/chocolates",
    image: "/images/products/anjeer-bites.jpg",
    description: "Belgian Dark Dragées, Fig & Date Bites",
    tag: "Artisanal Confections",
  },
  {
    name: "Nutrient Seeds",
    slug: "seeds",
    href: "/category/seeds",
    image: null,
    description: "Raw Chia, Roasted Flax, Himalayan Pumpkin",
    tag: "Purity Grade",
  },
  {
    name: "Mouth Fresheners",
    slug: "mouth-fresheners",
    href: "/category/mouth-fresheners",
    image: "/images/products/shahi-paan-mukhwas.jpg",
    description: "Heritage Shahi Paan, Seed Mukhwas",
    tag: "100% Tobacco-Free",
  },
  {
    name: "Combos & Reserves",
    slug: "combos",
    href: "/category/combos",
    image: "/images/products/desi-ghee.jpg",
    description: "Curated Daily Pantry & Value Bundles",
    tag: "Best Value",
  },
  {
    name: "Royal Gift Packs",
    slug: "gifting",
    href: "/gifting",
    image: null,
    description: "Handcrafted Wooden & Velvet Gift Boxes",
    tag: "Bespoke Gifting",
  },
];

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [featuredProducts, setFeaturedProducts] = useState<ProductCardProps[]>(
    STOREFRONT_PRODUCTS.filter((p) => p.isBestseller)
  );
  const [activeCollectionTab, setActiveCollectionTab] = useState<
    "bestsellers" | "dry-fruits" | "dates" | "tea" | "chocolates" | "seeds"
  >("bestsellers");
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState<string | null>(null);

  // Auto advance hero carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_PRODUCT_SLIDES.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  // Load real database products when available
  useEffect(() => {
    async function loadData() {
      try {
        const prodRes = await fetchWithTimeout(
          "/api/v1/products?isFeatured=true&limit=8",
          undefined,
          2500
        ).catch(() => null);
        if (prodRes && prodRes.ok) {
          const prodData = await prodRes.json();
          if (prodData.success && prodData.data?.items?.length > 0) {
            setFeaturedProducts(prodData.data.items);
          }
        }
      } catch {
        // Fallback to static catalog
      }
    }
    loadData();
  }, []);

  const tabProducts =
    activeCollectionTab === "bestsellers"
      ? featuredProducts
      : STOREFRONT_PRODUCTS.filter((p) => p.collectionGroup === activeCollectionTab);

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setNewsletterStatus("Thank you for subscribing to the Connoisseurs Journal.");
      setNewsletterEmail("");
      setTimeout(() => setNewsletterStatus(null), 4000);
    }
  };

  const activeHero = HERO_PRODUCT_SLIDES[currentSlide];

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#242824]">
      {/* ============================================================ */}
      {/* SECTION A: REFINED EDITORIAL HERO STAGE                      */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-[#173D2C] text-[#FAF7F0] border-b border-[#C3A15D]/40">
        {/* Subtle Background Radial Glow */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            background:
              "radial-gradient(circle at 75% 30%, #C3A15D 0%, transparent 60%)",
          }}
        />

        <div className="max-w-7xl mx-auto py-14 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Column: Brand Messaging & Action */}
            <div className="lg:col-span-7 space-y-7 text-left">
              {/* Refined Eyebrow */}
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#102C21] border border-[#C3A15D]/40 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4B776]" />
                <span className="text-[#D4B776] text-[10px] sm:text-[11px] font-bold tracking-[0.22em] uppercase">
                  The Finest from Nature • Est. in India
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="font-serif text-3xl sm:text-5xl lg:text-[56px] font-bold tracking-tight leading-[1.12] text-[#FAF7F0] max-w-xl">
                Everyday Indulgence, Naturally.
              </h1>

              {/* Supporting Editorial Description */}
              <p className="text-[#FAF7F0]/85 text-sm sm:text-base lg:text-lg max-w-xl font-normal leading-relaxed">
                Handpicked Goan jumbo cashews, Kashmiri Mamra almonds, royal
                Medjool dates, and artisanal estate teas—carefully graded, sealed
                fresh, and delivered across India.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href="/shop"
                  className="px-8 py-4 bg-[#C3A15D] hover:bg-[#A8853D] text-[#173D2C] font-bold rounded-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 text-xs sm:text-sm uppercase tracking-widest inline-flex items-center gap-2 active:scale-98 cursor-pointer border border-[#C3A15D]"
                >
                  <span>Explore the Collection</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/build-your-own-box"
                  className="px-7 py-4 bg-white/10 hover:bg-white/20 border border-white/30 hover:border-[#D4B776] text-[#FAF7F0] font-semibold rounded-lg backdrop-blur-xs transition-all duration-300 text-xs sm:text-sm tracking-widest uppercase inline-flex items-center gap-2 active:scale-98 cursor-pointer hover:-translate-y-0.5"
                >
                  <Gift className="w-4 h-4 text-[#D4B776]" />
                  <span>Discover Gifting</span>
                </Link>
              </div>

              {/* Verified Trust Badges Only */}
              <div className="pt-6 flex flex-wrap items-center gap-6 text-xs text-[#FAF7F0]/80 border-t border-white/15">
                <div className="flex items-center gap-2 font-medium tracking-wide">
                  <Truck className="w-4 h-4 text-[#D4B776]" />
                  <span>Free Delivery Over ₹999</span>
                </div>
                <div className="flex items-center gap-2 font-medium tracking-wide">
                  <ShieldCheck className="w-4 h-4 text-[#D4B776]" />
                  <span>Airtight Freshness Packing</span>
                </div>
                <div className="flex items-center gap-2 font-medium tracking-wide">
                  <CheckCircle className="w-4 h-4 text-[#D4B776]" />
                  <span>FSSAI Food Safety Standards</span>
                </div>
              </div>
            </div>

            {/* Right Column: Verified Editorial Product Showcase */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="relative w-full max-w-[440px] rounded-xl overflow-hidden border border-[#C3A15D]/50 shadow-2xl bg-[#FAF7F0] transition-all duration-500 hover:border-[#D4B776]">
                {/* Product Photography Container */}
                <div className="relative aspect-[4/3] sm:aspect-[1/1] max-h-[380px] w-full bg-[#FAF7F0] overflow-hidden group">
                  {activeHero.imageUrl ? (
                    <img
                      src={activeHero.imageUrl}
                      alt={activeHero.altText}
                      loading="eager"
                      fetchPriority="high"
                      decoding="async"
                      className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                  ) : (
                    <ProductImageFrame
                      src={null}
                      productName={activeHero.name}
                      categoryName={activeHero.category}
                      size="pdp"
                    />
                  )}

                  {/* Compact Category Pill */}
                  <div className="absolute top-3.5 left-3.5 bg-[#173D2C]/95 backdrop-blur-xs text-[#D4B776] border border-[#C3A15D]/40 px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest shadow-md">
                    {activeHero.category}
                  </div>
                </div>

                {/* Compact Floating Footer Details */}
                <div className="p-4 bg-[#102C21] border-t border-[#C3A15D]/30 flex items-center justify-between gap-3 text-white">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-serif text-sm sm:text-base font-bold text-[#FAF7F0] truncate">
                      {activeHero.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs mt-0.5">
                      <span className="font-bold text-[#D4B776]">
                        {activeHero.price}
                      </span>
                      <span className="text-white/40">•</span>
                      <span className="text-[#FAF7F0]/75">{activeHero.weight}</span>
                    </div>
                  </div>

                  <Link
                    href={activeHero.link}
                    className="px-4 py-2 rounded-md bg-[#C3A15D] hover:bg-[#A8853D] text-[#173D2C] text-xs font-bold transition-all shrink-0 inline-flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
                  >
                    <span>View</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Carousel Slide Indicators */}
          <div className="max-w-7xl mx-auto flex items-center justify-between pt-8 border-t border-white/10 mt-8">
            <div className="flex items-center gap-2">
              {HERO_PRODUCT_SLIDES.map((slide, idx) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    currentSlide === idx
                      ? "w-8 bg-[#C3A15D]"
                      : "w-2.5 bg-white/30 hover:bg-white/60"
                  }`}
                  aria-label={`Slide ${idx + 1}: ${slide.name}`}
                />
              ))}
            </div>
            <span className="text-xs font-mono text-[#D4B776] tracking-widest">
              0{currentSlide + 1} / 0{HERO_PRODUCT_SLIDES.length}
            </span>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION B: SHOP BY CATEGORY                                   */}
      {/* ============================================================ */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-14 space-y-2.5">
          <span className="text-[10px] sm:text-xs font-bold tracking-[0.24em] text-[#987B3E] uppercase block">
            Curated Pantry
          </span>
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-[#173D2C] tracking-tight">
            Shop by Category
          </h2>
          <p className="text-[#5F6D65] text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
            Hand-selected kernels, single-estate dates, fragrant teas, artisanal bites, and bespoke hampers.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {HOMEPAGE_CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={cat.href}
              className="group flex flex-col justify-between bg-white rounded-lg p-3.5 sm:p-5 border border-[#E5DEC9] hover:border-[#C3A15D] hover:shadow-[0_12px_28px_-6px_rgba(23,61,44,0.12)] hover:-translate-y-1 transition-all duration-300"
            >
              <div className="relative aspect-square w-full rounded-md overflow-hidden mb-3.5 border border-[#E5DEC9] bg-[#FAF7F0]">
                <div className="w-full h-full transition-transform duration-500 ease-out group-hover:scale-105">
                  <ProductImageFrame
                    src={cat.image}
                    alt={cat.name}
                    productName={cat.name}
                    categoryName={cat.tag}
                    size="md"
                  />
                </div>
                <span className="absolute top-2.5 left-2.5 z-10 bg-[#173D2C]/90 text-[#D4B776] text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-xs">
                  {cat.tag}
                </span>
              </div>

              <div>
                <h3 className="font-serif text-sm sm:text-base font-bold text-[#173D2C] group-hover:text-[#987B3E] transition-colors">
                  {cat.name}
                </h3>
                <p className="text-[11px] text-[#5F6D65] line-clamp-1 mt-1">
                  {cat.description}
                </p>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#987B3E] group-hover:text-[#173D2C] mt-2.5 group-hover:translate-x-1 transition-transform">
                  Explore {cat.name} <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION B.5: SHOP BY EVERYDAY NEED (REQ-PF-04)               */}
      {/* ============================================================ */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#E5DEC9]">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-14 space-y-2.5">
          <span className="text-[10px] sm:text-xs font-bold tracking-[0.24em] text-[#987B3E] uppercase block">
            Curated Discovery
          </span>
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-[#173D2C] tracking-tight">
            Shop by Everyday Need
          </h2>
          <p className="text-[#5F6D65] text-xs sm:text-sm leading-relaxed max-w-xl mx-auto">
            From mindful morning wellness to high-protein workout fuel, executive desk snacking,
            wholesome family cooking, and bespoke gifting—discover harvests matched to your daily rhythm.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {SHOP_BY_NEEDS.map((need) => (
            <Link
              key={need.id}
              href={need.href}
              className="group flex flex-col justify-between bg-white rounded-lg p-5 border border-[#E5DEC9] hover:border-[#C3A15D] hover:shadow-[0_12px_28px_-6px_rgba(23,61,44,0.12)] hover:-translate-y-1 transition-all duration-300"
            >
              <div>
                <div className="relative aspect-[16/10] w-full rounded-md overflow-hidden mb-4 border border-[#E5DEC9] bg-[#FAF7F0]">
                  <div className="w-full h-full transition-transform duration-500 ease-out group-hover:scale-105">
                    <ProductImageFrame
                      src={getValidImageUrl(need.imageSlug) || null}
                      alt={need.label}
                      productName={need.label}
                      categoryName={need.badge}
                      size="md"
                    />
                  </div>
                  <span className="absolute top-2.5 left-2.5 z-10 bg-[#173D2C]/90 text-[#D4B776] text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded shadow-xs">
                    {need.badge}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-[#987B3E] tracking-wider uppercase block">
                    {need.tagline}
                  </span>
                  <h3 className="font-serif text-lg font-bold text-[#173D2C] group-hover:text-[#987B3E] transition-colors">
                    {need.label}
                  </h3>
                  <p className="text-xs text-[#5F6D65] leading-relaxed line-clamp-2">
                    {need.description}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E5DEC9]/80 mt-5 flex items-center justify-between">
                <span className="text-[11px] font-medium text-[#7A8780]">
                  View Curated Harvests
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-[#987B3E] group-hover:text-[#173D2C] group-hover:translate-x-1 transition-transform">
                  <span>Explore</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION C: CUSTOMER BESTSELLERS                               */}
      {/* ============================================================ */}
      <section className="py-16 sm:py-24 bg-white border-y border-[#E5DEC9] px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#E5DEC9]">
            <div>
              <span className="text-[10px] sm:text-xs font-bold tracking-[0.24em] text-[#987B3E] uppercase block mb-1.5">
                Signature Harvests
              </span>
              <h2 className="font-serif text-2xl sm:text-4xl font-bold text-[#173D2C] tracking-tight">
                Customer Bestsellers
              </h2>
              <p className="text-[#5F6D65] text-xs sm:text-sm mt-1 max-w-md">
                Our most coveted dry fruits, royal dates, and artisanal gourmet collections.
              </p>
            </div>

            {/* Collection Tab Switcher */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
              {[
                { id: "bestsellers", label: "All Bestsellers" },
                { id: "dry-fruits", label: "Royal Nuts" },
                { id: "dates", label: "Dates" },
                { id: "tea", label: "Artisanal Teas" },
                { id: "chocolates", label: "Chocolates & Bites" },
                { id: "seeds", label: "Super Seeds" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveCollectionTab(tab.id as any)}
                  className={`px-4 py-2 rounded-full text-xs font-bold tracking-wider uppercase transition-all duration-200 whitespace-nowrap cursor-pointer ${
                    activeCollectionTab === tab.id
                      ? "bg-[#173D2C] text-[#FAF7F0] border border-[#C3A15D] shadow-xs"
                      : "bg-[#FAF7F0] text-[#4A4E46] border border-[#E5DEC9] hover:border-[#C3A15D] hover:text-[#173D2C]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {tabProducts.slice(0, 8).map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>

          <div className="text-center pt-6">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-[#FAF7F0] hover:bg-[#173D2C] text-[#173D2C] hover:text-[#FAF7F0] border border-[#C3A15D]/60 hover:border-[#C3A15D] font-bold text-xs uppercase tracking-widest transition-all duration-300 shadow-xs cursor-pointer hover:shadow-md hover:-translate-y-0.5"
            >
              <span>Explore All Royal Harvests</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION D: TEA & SPECIALITY COLLECTION                        */}
      {/* ============================================================ */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="rounded-xl bg-gradient-to-r from-[#173D2C] via-[#102C21] to-[#0D241B] border border-[#C3A15D]/50 p-6 sm:p-12 text-white shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#102C21] border border-[#C3A15D]/40 text-[#D4B776] text-xs font-bold uppercase tracking-wider">
                <Coffee className="w-3.5 h-3.5 text-[#D4B776]" />
                <span>Artisanal Tea Atelier</span>
              </div>
              <h3 className="font-serif text-2xl sm:text-4xl font-bold text-[#FAF7F0] leading-tight tracking-tight">
                High-Elevation Teas &amp; Spiced Chai Blends
              </h3>
              <p className="text-sm text-[#FAF7F0]/85 leading-relaxed max-w-xl">
                Explore our estate selections: bold mountain CTC like <strong>Tea Everest</strong>, Assam orthodox <strong>Tea Supreme</strong>, fragrant <strong>Bombay Cutting Special</strong>, and imperial <strong>Kesariya Saffron Chai</strong> blended with authentic Kashmiri Mogra saffron.
              </p>
              <div className="pt-2 flex flex-wrap gap-3">
                <Link
                  href="/category/tea"
                  className="px-7 py-3 bg-[#C3A15D] hover:bg-[#A8853D] text-[#173D2C] font-bold rounded-lg text-xs uppercase tracking-widest transition-all shadow-md cursor-pointer inline-flex items-center gap-2 hover:-translate-y-0.5"
                >
                  <span>Explore All Teas</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/product/kashmiri-shahi-kahwa"
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/25 hover:border-white/50 text-[#FAF7F0] font-semibold rounded-lg text-xs uppercase tracking-widest transition-all hover:-translate-y-0.5"
                >
                  Shahi Saffron Kahwa
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 grid grid-cols-2 gap-3.5 text-center">
              <div className="p-4 rounded-lg bg-white/5 border border-[#C3A15D]/30 backdrop-blur-xs hover:border-[#D4B776] transition-colors">
                <span className="text-xs font-bold text-[#D4B776] block tracking-wide">Tea Everest CTC</span>
                <span className="font-serif text-xl font-bold text-white mt-1 block">From ₹55</span>
                <span className="text-[10px] text-white/70 block mt-0.5">100g to 1kg Pack</span>
              </div>
              <div className="p-4 rounded-lg bg-white/5 border border-[#C3A15D]/30 backdrop-blur-xs hover:border-[#D4B776] transition-colors">
                <span className="text-xs font-bold text-[#D4B776] block tracking-wide">Bombay Cutting</span>
                <span className="font-serif text-xl font-bold text-white mt-1 block">From ₹95</span>
                <span className="text-[10px] text-white/70 block mt-0.5">Spiced Kadak Chai</span>
              </div>
              <div className="p-4 rounded-lg bg-white/5 border border-[#C3A15D]/30 backdrop-blur-xs hover:border-[#D4B776] transition-colors">
                <span className="text-xs font-bold text-[#D4B776] block tracking-wide">Power Elaichi</span>
                <span className="font-serif text-xl font-bold text-white mt-1 block">From ₹140</span>
                <span className="text-[10px] text-white/70 block mt-0.5">Bold Cardamom Infusion</span>
              </div>
              <div className="p-4 rounded-lg bg-white/5 border border-[#C3A15D]/30 backdrop-blur-xs hover:border-[#D4B776] transition-colors">
                <span className="text-xs font-bold text-[#D4B776] block tracking-wide">Kesariya Chai</span>
                <span className="font-serif text-xl font-bold text-white mt-1 block">From ₹240</span>
                <span className="text-[10px] text-white/70 block mt-0.5">Pure Kashmiri Saffron</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION E: BESPOKE GIFTING & BOX BUILDER (BYOB)               */}
      {/* ============================================================ */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="relative bg-[#FAF7F0] rounded-xl border border-[#C3A15D]/50 p-8 sm:p-14 shadow-lg">
          <div className="max-w-3xl space-y-6">
            <span className="px-4 py-1.5 rounded-full bg-[#173D2C] text-[#D4B776] text-xs font-bold uppercase tracking-widest inline-flex items-center gap-2">
              <Gift className="w-3.5 h-3.5" />
              <span>Interactive Box Builder</span>
            </span>

            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-[#173D2C] tracking-tight">
              Build Your Own Royal Hamper
            </h2>

            <p className="text-[#5F6D65] text-xs sm:text-base leading-relaxed">
              Curate a custom gourmet casket in 4 simple steps: choose your wooden or velvet casket, select verified single-estate jars, add an occasion sleeve, and write a personalized wax-sealed note.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 py-2 text-center">
              <div className="p-4 bg-white rounded-lg border border-[#E5DEC9] hover:border-[#C3A15D] transition-colors shadow-xs">
                <span className="text-xs font-bold text-[#C3A15D] block uppercase tracking-wider">Step 1</span>
                <span className="text-xs font-bold text-[#173D2C] mt-1 block">Casket Style</span>
              </div>
              <div className="p-4 bg-white rounded-lg border border-[#E5DEC9] hover:border-[#C3A15D] transition-colors shadow-xs">
                <span className="text-xs font-bold text-[#C3A15D] block uppercase tracking-wider">Step 2</span>
                <span className="text-xs font-bold text-[#173D2C] mt-1 block">Select Fillings</span>
              </div>
              <div className="p-4 bg-white rounded-lg border border-[#E5DEC9] hover:border-[#C3A15D] transition-colors shadow-xs">
                <span className="text-xs font-bold text-[#C3A15D] block uppercase tracking-wider">Step 3</span>
                <span className="text-xs font-bold text-[#173D2C] mt-1 block">Custom Sleeve</span>
              </div>
              <div className="p-4 bg-white rounded-lg border border-[#E5DEC9] hover:border-[#C3A15D] transition-colors shadow-xs">
                <span className="text-xs font-bold text-[#C3A15D] block uppercase tracking-wider">Step 4</span>
                <span className="text-xs font-bold text-[#173D2C] mt-1 block">Wax Seal Note</span>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap gap-4">
              <Link
                href="/build-your-own-box"
                className="px-8 py-4 bg-[#173D2C] hover:bg-[#102C21] text-[#FAF7F0] font-bold rounded-lg shadow-md hover:shadow-xl transition-all duration-300 text-xs sm:text-sm uppercase tracking-widest inline-flex items-center gap-2 cursor-pointer border border-[#C3A15D]/60 hover:-translate-y-0.5"
              >
                <span>Launch Box Builder</span>
                <ArrowRight className="w-4 h-4 text-[#D4B776]" />
              </Link>
              <Link
                href="/gifting"
                className="px-7 py-4 bg-white hover:bg-[#FAF7F0] border border-[#E5DEC9] hover:border-[#C3A15D] text-[#173D2C] font-semibold rounded-lg text-xs sm:text-sm uppercase tracking-widest transition-all duration-300 hover:-translate-y-0.5"
              >
                Pre-Curated Gift Boxes
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION F: BRAND HERITAGE & SOURCING TRANSPARENCY            */}
      {/* ============================================================ */}
      <section className="bg-[#173D2C] text-[#FAF7F0] py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-[#C3A15D]/40">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          <div className="lg:col-span-7 space-y-5">
            <span className="text-[10px] sm:text-xs font-bold tracking-[0.24em] text-[#D4B776] uppercase">
              The Fruits &amp; Nuts Promise
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-[#FAF7F0] leading-tight tracking-tight">
              Purity from Orchard to Palate. <br className="hidden sm:inline" />
              Verified terroirs. Zero compromise.
            </h2>
            <p className="text-xs sm:text-sm text-[#FAF7F0]/85 leading-relaxed max-w-2xl">
              At Fruits &amp; Nuts, every harvest batch is chosen with unwavering attention to origin, physical grade, and natural nutrition. We maintain direct partnerships with growers across Kashmir, Goa, and global specialty regions. Packed in food-grade airtight canisters to preserve pure aroma and mineral-dense crunch.
            </p>
            <div className="pt-2 flex flex-wrap gap-4">
              <Link
                href="/taste-map"
                className="px-7 py-3 bg-[#C3A15D] hover:bg-[#A8853D] text-[#173D2C] text-xs font-bold uppercase tracking-widest rounded-lg transition-all cursor-pointer inline-flex items-center gap-2 hover:-translate-y-0.5 shadow-md"
              >
                <span>Explore Sourcing Map</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/food-safety-compliance"
                className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/25 hover:border-white/50 text-[#FAF7F0] text-xs font-semibold uppercase tracking-widest rounded-lg transition-all hover:-translate-y-0.5"
              >
                FSSAI Safety Standards
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="grid grid-cols-2 gap-4 w-full max-w-sm text-center">
              <div className="p-5 rounded-lg bg-[#102C21] border border-[#C3A15D]/40 space-y-1.5 hover:border-[#D4B776] transition-colors shadow-xs">
                <span className="font-serif text-2xl sm:text-3xl font-bold text-[#D4B776] tracking-tight">FSSAI</span>
                <p className="text-[10px] uppercase font-bold text-[#FAF7F0]/85 tracking-wider">Certified Standards</p>
              </div>
              <div className="p-5 rounded-lg bg-[#102C21] border border-[#C3A15D]/40 space-y-1.5 hover:border-[#D4B776] transition-colors shadow-xs">
                <span className="font-serif text-2xl sm:text-3xl font-bold text-[#D4B776] tracking-tight">0%</span>
                <p className="text-[10px] uppercase font-bold text-[#FAF7F0]/85 tracking-wider">Chemical Bleach</p>
              </div>
              <div className="p-5 rounded-lg bg-[#102C21] border border-[#C3A15D]/40 space-y-1.5 hover:border-[#D4B776] transition-colors shadow-xs">
                <span className="font-serif text-2xl sm:text-3xl font-bold text-[#D4B776] tracking-tight">Grade A</span>
                <p className="text-[10px] uppercase font-bold text-[#FAF7F0]/85 tracking-wider">Whole Kernels</p>
              </div>
              <div className="p-5 rounded-lg bg-[#102C21] border border-[#C3A15D]/40 space-y-1.5 hover:border-[#D4B776] transition-colors shadow-xs">
                <span className="font-serif text-2xl sm:text-3xl font-bold text-[#D4B776] tracking-tight">Airtight</span>
                <p className="text-[10px] uppercase font-bold text-[#FAF7F0]/85 tracking-wider">Sealed Freshness</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION G: STORE DISCOVERY                                    */}
      {/* ============================================================ */}
      <section className="py-16 sm:py-24 bg-white border-t border-[#E5DEC9] px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-10 pb-6 border-b border-[#E5DEC9]">
            <div>
              <span className="text-[10px] sm:text-xs font-bold tracking-[0.24em] text-[#987B3E] uppercase">
                Physical Boutiques
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#173D2C] mt-1 tracking-tight">
                Visit Our Stores
              </h2>
              <p className="text-[#5F6D65] text-xs sm:text-sm mt-1">
                Experience our tasting lounges and bespoke gifting packaging in person.
              </p>
            </div>
            <Link
              href="/stores"
              className="text-xs font-bold uppercase tracking-widest text-[#173D2C] hover:text-[#C3A15D] transition-colors inline-flex items-center gap-1.5"
            >
              <span>View All Outlets</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-lg bg-[#FAF7F0] border border-[#E5DEC9] hover:border-[#C3A15D] hover:shadow-[0_12px_28px_-6px_rgba(23,61,44,0.1)] hover:-translate-y-0.5 transition-all duration-300 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#173D2C] uppercase tracking-wider">
                  Gurgaon Flagship
                </span>
                <span className="text-[9px] bg-[#173D2C] text-[#D4B776] font-bold px-2 py-0.5 rounded tracking-wider">
                  OPEN
                </span>
              </div>
              <h4 className="font-serif font-bold text-[#173D2C] text-base">
                Sapphire 90 Mall Boutique
              </h4>
              <p className="text-xs text-[#4A4E46] leading-relaxed">
                K-12 Sapphire 90 Mall, Sector 90, Gurgaon, PIN 122505
              </p>
              <div className="pt-3 border-t border-[#E5DEC9] text-xs text-[#5F6D65]">
                Concierge: <span className="font-mono text-[#173D2C] font-semibold">+91-8368301495</span>
              </div>
            </div>

            <div className="p-6 rounded-lg bg-[#FAF7F0] border border-[#E5DEC9] hover:border-[#C3A15D] hover:shadow-[0_12px_28px_-6px_rgba(23,61,44,0.1)] hover:-translate-y-0.5 transition-all duration-300 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#173D2C] uppercase tracking-wider">
                  Gurgaon Sector 86
                </span>
                <span className="text-[9px] bg-[#173D2C] text-[#D4B776] font-bold px-2 py-0.5 rounded tracking-wider">
                  OPEN
                </span>
              </div>
              <h4 className="font-serif font-bold text-[#173D2C] text-base">
                Sector 86 Gourmet Outlet
              </h4>
              <p className="text-xs text-[#4A4E46] leading-relaxed">
                Shop No. 5, Ground Floor, Sector 86, Gurgaon, PIN 122505
              </p>
              <div className="pt-3 border-t border-[#E5DEC9] text-xs text-[#5F6D65]">
                Concierge: <span className="font-mono text-[#173D2C] font-semibold">+91-7633080180</span>
              </div>
            </div>

            <div className="p-6 rounded-lg bg-[#FAF7F0] border border-[#E5DEC9] hover:border-[#C3A15D] hover:shadow-[0_12px_28px_-6px_rgba(23,61,44,0.1)] hover:-translate-y-0.5 transition-all duration-300 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#173D2C] uppercase tracking-wider">
                  Ludhiana Regional
                </span>
                <span className="text-[9px] bg-[#173D2C] text-[#D4B776] font-bold px-2 py-0.5 rounded tracking-wider">
                  OPEN
                </span>
              </div>
              <h4 className="font-serif font-bold text-[#173D2C] text-base">
                Sant Tower Boutique
              </h4>
              <p className="text-xs text-[#4A4E46] leading-relaxed">
                Sant Tower, Pindi Street, Ludhiana, Punjab
              </p>
              <div className="pt-3 border-t border-[#E5DEC9] text-xs text-[#5F6D65]">
                Concierge: <span className="font-mono text-[#173D2C] font-semibold">+91-8368301495</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION H: HARVEST JOURNAL NEWSLETTER                          */}
      {/* ============================================================ */}
      <section className="py-16 sm:py-24 bg-[#FAF7F0] border-t border-[#E5DEC9] px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#173D2C] text-[#D4B776] mb-1 shadow-sm">
            <Mail className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#173D2C] tracking-tight">
            Join the Connoisseurs Harvest Journal
          </h3>
          <p className="text-xs sm:text-sm text-[#5F6D65] max-w-lg mx-auto leading-relaxed">
            Receive exclusive seasonal announcements for limited orchard batches, holiday gifting collections, and special offers.
          </p>

          <form onSubmit={handleNewsletter} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto pt-2">
            <input
              type="email"
              required
              placeholder="Enter your email address"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              className="flex-1 px-4 py-3.5 rounded-lg border border-[#E5DEC9] bg-white text-xs text-[#242824] focus:outline-none focus:border-[#173D2C] shadow-xs"
            />
            <button
              type="submit"
              className="px-8 py-3.5 bg-[#173D2C] hover:bg-[#102C21] text-[#FAF7F0] text-xs font-bold uppercase tracking-widest rounded-lg transition-all cursor-pointer border border-[#C3A15D]/50 hover:border-[#C3A15D] shadow-sm hover:shadow-md"
            >
              Subscribe
            </button>
          </form>

          {newsletterStatus && (
            <p className="text-xs text-emerald-800 font-semibold pt-1">
              {newsletterStatus}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
