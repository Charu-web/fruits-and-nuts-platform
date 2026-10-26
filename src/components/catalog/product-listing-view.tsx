"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, Search, X, ChevronLeft, ChevronRight, Check, Sparkles } from "lucide-react";
import { ProductCard, ProductCardProps } from "./product-card";
import {
  STOREFRONT_PRODUCTS,
  STOREFRONT_CATEGORIES,
  SHOP_BY_NEEDS,
  NeedTag,
} from "@/lib/catalog/storefront-catalog";
import { fetchWithTimeout } from "@/lib/fetch-timeout";
import { Breadcrumbs } from "@/components/ui/breadcrumb";
import { SmartSearchService } from "@/services/smart-search.service";
import { RecentlyViewedProducts } from "./recently-viewed";
import { useCart } from "@/components/cart/cart-context";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import {
  buildCartWhatsAppMessage,
  buildSingleProductWhatsAppMessage,
  createWhatsAppOrderLink,
} from "@/lib/whatsapp-shopping";

interface CategoryOption {
  id: number;
  name: string;
  slug: string;
}

interface ProductListingViewProps {
  initialCategorySlug?: string;
  categoryTitle?: string;
  categoryDescription?: string;
  initialNeed?: string;
}

const FALLBACK_CATEGORIES: CategoryOption[] = STOREFRONT_CATEGORIES.map((c) => ({
  id: c.id,
  name: c.name,
  slug: c.slug,
}));

const FALLBACK_PRODUCTS: ProductCardProps[] = STOREFRONT_PRODUCTS;

function ProductListingViewInner({
  initialCategorySlug,
  categoryTitle,
  categoryDescription,
  initialNeed,
}: ProductListingViewProps) {
  const searchParams = useSearchParams();
  const urlNeed = searchParams.get("need") || "";
  const { items: cartItems, summary: cartSummary } = useCart();

  const [products, setProducts] = useState<ProductCardProps[]>(FALLBACK_PRODUCTS);
  const [categories, setCategories] = useState<CategoryOption[]>(FALLBACK_CATEGORIES);
  const [isLoading, setIsLoading] = useState(false);

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategorySlug || "");
  const [selectedNeed, setSelectedNeed] = useState<string>(initialNeed || urlNeed || "");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [isByobEligible, setIsByobEligible] = useState<boolean>(false);
  const [sortOption, setSortOption] = useState<string>("featured");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(FALLBACK_PRODUCTS.length);

  // Mobile Filter Drawer State
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Sync URL ?need= parameter when user navigates
  useEffect(() => {
    const n = searchParams.get("need");
    if (n !== null) {
      setSelectedNeed(n);
      setCurrentPage(1);
    }
  }, [searchParams]);

  // Load Categories for Filter Sidebar
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetchWithTimeout("/api/v1/categories", undefined, 2000).catch(() => null);
        if (res && res.ok) {
          const json = await res.json();
          if (json.success && json.data && json.data.length > 0) {
            setCategories(json.data);
          }
        }
      } catch (err) {
        console.error("Failed to fetch categories", err);
      }
    }
    fetchCategories();
  }, []);

  // Fetch Products based on current filters
  const fetchProducts = useCallback(async () => {
    try {
      if (products.length === 0) {
        setIsLoading(true);
      }
      const params = new URLSearchParams();

      if (selectedCategory) params.set("category", selectedCategory);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      if (minPrice) params.set("minPrice", minPrice);
      if (maxPrice) params.set("maxPrice", maxPrice);
      if (inStockOnly) params.set("inStockOnly", "true");
      if (isByobEligible) params.set("isByobEligible", "true");
      if (sortOption) params.set("sort", sortOption);
      params.set("page", String(currentPage));
      params.set("limit", "12");

      const res = await fetchWithTimeout(`/api/v1/products?${params.toString()}`, undefined, 2000).catch(() => null);
      if (res && res.ok) {
        const json = await res.json();
        const rawItems = Array.isArray(json.data) ? json.data : (json.data?.items || []);
        if (json.success && rawItems && rawItems.length > 0) {
          let items: ProductCardProps[] = rawItems.map((item: ProductCardProps) => {
            if (!item.primaryImage?.imageUrl) {
              const sfMatch = STOREFRONT_PRODUCTS.find(
                (sp) => sp.slug === item.slug || sp.name?.toLowerCase() === item.name?.toLowerCase()
              );
              if (sfMatch?.primaryImage?.imageUrl) {
                return { ...item, primaryImage: sfMatch.primaryImage };
              }
            }
            return item;
          });
          if (selectedNeed) {
            const matchingSlugs = new Set(
              STOREFRONT_PRODUCTS.filter((p) => p.needTags?.includes(selectedNeed as any)).map((p) => p.slug)
            );
            items = items.filter((p) => matchingSlugs.has(p.slug) || p.needTags?.includes(selectedNeed as any));
          }
          setProducts(items);
          const total = json.meta?.total || items.length;
          setTotalPages(Math.max(1, Math.ceil(total / 12)));
          setTotalCount(total);
          return;
        }
      }

      // Fallback in-memory catalog
      let filtered = [...STOREFRONT_PRODUCTS];
      if (selectedCategory && selectedCategory !== "all") {
        filtered = filtered.filter(
          (p) =>
            p.category?.slug === selectedCategory ||
            p.collectionGroup === selectedCategory ||
            (selectedCategory === "dry-fruits" &&
              (p.category?.slug === "dry-fruits" || p.category?.slug === "fruits-and-nuts"))
        );
      }
      if (selectedNeed) {
        filtered = filtered.filter((p) => p.needTags?.includes(selectedNeed as any));
      }
      if (searchQuery.trim()) {
        const smartRes = SmartSearchService.search(searchQuery.trim(), {
          categorySlug: selectedCategory && selectedCategory !== "all" ? selectedCategory : undefined,
          needTag: selectedNeed ? (selectedNeed as any) : undefined,
          limit: 100,
        });
        filtered = smartRes.products;
      }
      if (minPrice) {
        filtered = filtered.filter((p) => (p.priceRange?.minSellingPrice ?? 0) >= Number(minPrice));
      }
      if (maxPrice) {
        filtered = filtered.filter((p) => (p.priceRange?.minSellingPrice ?? 0) <= Number(maxPrice));
      }
      if (sortOption === "price_asc") {
        filtered.sort((a, b) => (a.priceRange?.minSellingPrice ?? 0) - (b.priceRange?.minSellingPrice ?? 0));
      } else if (sortOption === "price_desc") {
        filtered.sort((a, b) => (b.priceRange?.minSellingPrice ?? 0) - (a.priceRange?.minSellingPrice ?? 0));
      } else if (sortOption === "discount") {
        filtered.sort((a, b) => (b.priceRange?.discountPercentage ?? 0) - (a.priceRange?.discountPercentage ?? 0));
      }
      setProducts(filtered);
      setTotalCount(filtered.length);
    } catch (err) {
      console.error("Error fetching product catalogue", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, selectedNeed, searchQuery, minPrice, maxPrice, inStockOnly, isByobEligible, sortOption, currentPage]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleResetFilters = () => {
    if (!initialCategorySlug) setSelectedCategory("");
    setSelectedNeed("");
    setSearchQuery("");
    setMinPrice("");
    setMaxPrice("");
    setInStockOnly(false);
    setIsByobEligible(false);
    setSortOption("featured");
    setCurrentPage(1);
  };

  const handleCatalogShopOnWhatsApp = () => {
    const origin =
      typeof window !== "undefined" && window.location?.origin
        ? window.location.origin
        : undefined;

    let message = "";
    if (cartItems && cartItems.length > 0) {
      message = buildCartWhatsAppMessage({
        items: cartItems.map((item) => ({
          productName: item.productName || item.variant?.product?.name || "Gourmet Dry Fruit",
          productSlug: item.productSlug || item.variant?.product?.slug || null,
          sku: item.sku || null,
          weightGrams: item.weightGrams || item.variant?.weightGrams || null,
          unit: item.unit || "GRAMS",
          packageType: item.packageType || null,
          unitPrice: item.unitPrice || item.variant?.sellingPrice || 0,
          quantity: item.quantity,
        })),
        subtotal: cartSummary.subtotal,
        discount: cartSummary.discountSavings,
        shippingFee: cartSummary.shippingFee,
        giftWrapFee: cartSummary.giftWrapFee,
        giftMessage: cartSummary.giftWrapEnabled && cartSummary.giftMessage?.trim() ? cartSummary.giftMessage.trim() : undefined,
        estimatedTotal: cartSummary.finalPayable,
        appBaseUrl: origin,
      });
    } else if (products.length > 0) {
      const firstProduct = products[0];
      const firstVariant = firstProduct.variants?.[0];
      message = buildSingleProductWhatsAppMessage(
        {
          productName: firstProduct.name,
          productSlug: firstProduct.slug,
          sku: firstVariant?.sku || null,
          weightGrams: firstVariant?.weightGrams || null,
          unit: firstVariant?.unit || "GRAMS",
          packageType: firstVariant?.packageType || null,
          unitPrice: firstVariant?.sellingPrice ?? firstProduct.priceRange?.minSellingPrice ?? 0,
          quantity: 1,
        },
        origin
      );
    }

    const linkResult = createWhatsAppOrderLink(message);
    if (linkResult.isConfigured && linkResult.url) {
      window.open(linkResult.url, "_blank", "noopener,noreferrer");
    }
  };

  const hasActiveFilters =
    (!initialCategorySlug && !!selectedCategory) ||
    !!selectedNeed ||
    !!searchQuery ||
    !!minPrice ||
    !!maxPrice ||
    inStockOnly ||
    isByobEligible;

  const currentNeedObj = SHOP_BY_NEEDS.find((n) => n.id === selectedNeed);
  const displayTitle = categoryTitle || (currentNeedObj ? currentNeedObj.label : "The Royal Catalogue");
  const displayDescription =
    categoryDescription ||
    (currentNeedObj
      ? `${currentNeedObj.tagline} — ${currentNeedObj.description}`
      : "Explore our complete collection of single-origin dry fruits, royal dates, high-altitude teas, and luxury gifting boxes.");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Page Heading & Breadcrumb */}
      <div className="border-b border-[#E5DEC9] pb-6 mb-8">
        <div className="mb-3">
          <Breadcrumbs
            items={[
              {
                label: displayTitle,
              },
            ]}
          />
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="editorial-eyebrow text-[#987B3E] block mb-2">CURATED RESERVES &amp; SINGLE-ORIGINS</span>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-[#173D2C]">
              {displayTitle}
            </h1>
            <p className="text-[#4A4E46] text-xs sm:text-sm mt-2 max-w-3xl leading-relaxed">
              {displayDescription}
            </p>
          </div>
          {currentNeedObj && (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#173D2C] text-[#FAF7F0] text-xs font-semibold self-start md:self-auto shadow-xs border border-[#C3A15D]/40">
              <Sparkles className="w-3.5 h-3.5 text-[#D4B776]" />
              <span>Curated by Need: {currentNeedObj.badge}</span>
            </div>
          )}
        </div>
      </div>

      {/* Curated "Shop by Need" Discovery Bar */}
      <div className="mb-6 bg-white p-4 rounded-lg border border-[#E5DEC9] shadow-xs">
        <div className="flex items-center justify-between mb-2.5 px-1">
          <span className="text-[11px] font-bold tracking-widest uppercase text-[#987B3E] flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-[#B89453]" />
            <span>Curated Lifestyle &amp; Everyday Needs</span>
          </span>
          {selectedNeed && (
            <button
              type="button"
              onClick={() => {
                setSelectedNeed("");
                setCurrentPage(1);
              }}
              className="text-[11px] font-semibold text-[#5F6D65] hover:text-[#173D2C] underline cursor-pointer"
            >
              Reset Need Filter
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <button
            type="button"
            onClick={() => {
              setSelectedNeed("");
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium tracking-wide transition-all whitespace-nowrap cursor-pointer ${
              selectedNeed === ""
                ? "bg-[#173D2C] text-[#FAF7F0] shadow-xs"
                : "bg-[#FAF7F0] text-[#4A4E46] hover:bg-[#E5DEC9]/50"
            }`}
          >
            All Needs
          </button>
          {SHOP_BY_NEEDS.map((need) => (
            <button
              key={need.id}
              type="button"
              onClick={() => {
                setSelectedNeed(need.id === selectedNeed ? "" : need.id);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium tracking-wide transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                selectedNeed === need.id
                  ? "bg-[#173D2C] text-[#FAF7F0] shadow-xs border border-[#C3A15D]"
                  : "bg-[#FAF7F0] text-[#4A4E46] hover:bg-[#E5DEC9]/50 border border-transparent"
              }`}
            >
              <span>{need.label}</span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded-full uppercase font-bold ${
                  selectedNeed === need.id
                    ? "bg-[#D4B776] text-[#173D2C]"
                    : "bg-[#E5DEC9] text-[#5F6D65]"
                }`}
              >
                {need.badge}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Category Navigation Pill Strip */}
      <div className="mb-8 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex items-center gap-2 min-w-max">
          <button
            type="button"
            onClick={() => {
              setSelectedCategory("");
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wider uppercase transition-all cursor-pointer ${
              selectedCategory === ""
                ? "bg-[#173D2C] text-[#FAF7F0] border border-[#B89453] shadow-xs"
                : "bg-white text-[#4A4E46] border border-[#E5DEC9] hover:border-[#B89453] hover:text-[#173D2C]"
            }`}
          >
            All Harvests
          </button>
          {categories
            .filter((c) => c.slug !== "all")
            .map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.slug);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wider uppercase transition-all cursor-pointer ${
                  selectedCategory === cat.slug
                    ? "bg-[#173D2C] text-[#FAF7F0] border border-[#B89453] shadow-xs"
                    : "bg-white text-[#4A4E46] border border-[#E5DEC9] hover:border-[#B89453] hover:text-[#173D2C]"
                }`}
              >
                {cat.name}
              </button>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* DESKTOP FILTER SIDEBAR */}
        <aside className="hidden lg:block space-y-6 bg-white p-6 rounded-lg border border-[#E5DEC9] shadow-xs h-fit sticky top-28">
          <div className="flex items-center justify-between border-b border-[#E5DEC9] pb-3">
            <h3 className="font-serif font-bold text-[#173D2C] text-base flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#B89453]" />
              <span>Filters</span>
            </h3>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-[#987B3E] hover:text-[#173D2C] hover:underline font-semibold cursor-pointer"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Search Filter */}
          <div>
            <label htmlFor="catalog-keyword-search" className="text-xs font-bold uppercase tracking-wider text-[#173D2C] block mb-2">
              Keyword Search
            </label>
            <div className="relative">
              <input
                id="catalog-keyword-search"
                type="text"
                placeholder="Search kernels, figs, teas..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full text-xs px-3.5 py-2.5 bg-[#FAF7F0] border border-[#E5DEC9] rounded-lg focus:outline-none focus:border-[#173D2C] text-[#242824]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear keyword search"
                  className="absolute right-2.5 top-2.5 text-[#5F6D65] hover:text-[#242824] p-0.5 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Shop by Everyday Need Filter */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#173D2C] block mb-2">
              Shop by Everyday Need
            </label>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  setSelectedNeed("");
                  setCurrentPage(1);
                }}
                className={`w-full text-left text-xs px-3 py-2 rounded-lg transition-colors font-medium flex items-center justify-between cursor-pointer ${
                  selectedNeed === ""
                    ? "bg-[#173D2C] text-[#FAF7F0] font-semibold"
                    : "text-[#4A4E46] hover:bg-[#FAF7F0]"
                }`}
              >
                <span>All Everyday Needs</span>
                {selectedNeed === "" && <Check className="w-3.5 h-3.5 text-[#D4B776]" />}
              </button>
              {SHOP_BY_NEEDS.map((need) => (
                <button
                  key={need.id}
                  type="button"
                  onClick={() => {
                    setSelectedNeed(need.id === selectedNeed ? "" : need.id);
                    setCurrentPage(1);
                  }}
                  className={`w-full text-left text-xs px-3 py-2 rounded-lg transition-colors font-medium flex items-center justify-between cursor-pointer ${
                    selectedNeed === need.id
                      ? "bg-[#173D2C] text-[#FAF7F0] font-semibold"
                      : "text-[#4A4E46] hover:bg-[#FAF7F0]"
                  }`}
                >
                  <span className="truncate pr-1">{need.label}</span>
                  {selectedNeed === need.id && <Check className="w-3.5 h-3.5 text-[#D4B776] shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          {!initialCategorySlug && (
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#173D2C] block mb-2">
                Category
              </label>
              <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("");
                    setCurrentPage(1);
                  }}
                  className={`w-full text-left text-xs px-3 py-2 rounded-lg transition-colors font-medium flex items-center justify-between cursor-pointer ${
                    selectedCategory === ""
                      ? "bg-[#173D2C] text-[#FAF7F0] font-semibold"
                      : "text-[#4A4E46] hover:bg-[#FAF7F0]"
                  }`}
                >
                  <span>All Categories</span>
                  {selectedCategory === "" && <Check className="w-3.5 h-3.5 text-[#D4B776]" />}
                </button>
                {categories
                  .filter((c) => c.slug !== "all")
                  .map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat.slug);
                        setCurrentPage(1);
                      }}
                      className={`w-full text-left text-xs px-3 py-2 rounded-lg transition-colors font-medium flex items-center justify-between cursor-pointer ${
                        selectedCategory === cat.slug
                          ? "bg-[#173D2C] text-[#FAF7F0] font-semibold"
                          : "text-[#4A4E46] hover:bg-[#FAF7F0]"
                      }`}
                    >
                      <span>{cat.name}</span>
                      {selectedCategory === cat.slug && <Check className="w-3.5 h-3.5 text-[#D4B776]" />}
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Price Range */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#173D2C] block mb-2">
              Price Range (₹)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Min ₹"
                value={minPrice}
                onChange={(e) => {
                  setMinPrice(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full text-xs px-3 py-2 bg-[#FAF7F0] border border-[#E5DEC9] rounded-lg focus:outline-none focus:border-[#173D2C] text-[#242824]"
              />
              <input
                type="number"
                placeholder="Max ₹"
                value={maxPrice}
                onChange={(e) => {
                  setMaxPrice(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full text-xs px-3 py-2 bg-[#FAF7F0] border border-[#E5DEC9] rounded-lg focus:outline-none focus:border-[#173D2C] text-[#242824]"
              />
            </div>
          </div>

          {/* Availability */}
          <div className="pt-2 border-t border-[#E5DEC9] space-y-3">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-[#4A4E46]">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => {
                  setInStockOnly(e.target.checked);
                  setCurrentPage(1);
                }}
                className="w-4 h-4 rounded accent-[#173D2C]"
              />
              <span>In Stock Only</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-[#4A4E46]">
              <input
                type="checkbox"
                checked={isByobEligible}
                onChange={(e) => {
                  setIsByobEligible(e.target.checked);
                  setCurrentPage(1);
                }}
                className="w-4 h-4 rounded accent-[#173D2C]"
              />
              <span>Build-Your-Own-Box Eligible</span>
            </label>
          </div>
        </aside>

        {/* MAIN PRODUCT GRID & CONTROLS */}
        <main className="lg:col-span-3 space-y-6">
          {/* Royal Sommelier AI Discovery Banner */}
          <div className="p-4 sm:p-5 rounded-lg bg-[#102C21] text-[#FAF7F0] border border-[#B89453]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-[#B89453]/20 border border-[#B89453]/40 flex items-center justify-center text-[#B89453] shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="font-serif font-bold text-sm sm:text-base text-[#FAF7F0] flex items-center gap-2">
                  <span>Royal Gourmet Sommelier</span>
                  <span className="text-[9px] font-sans font-bold uppercase tracking-widest bg-[#B89453] text-[#173D2C] px-2 py-0.5 rounded">
                    AI Concierge
                  </span>
                </p>
                <p className="text-xs text-[#DDD2BF] mt-0.5">
                  Explore single-estate origins, dietary pairings, or bespoke reserve advisory for {categoryTitle || "our harvests"}.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("open-sommelier"))}
              className="self-start sm:self-auto px-4 py-2.5 bg-[#B89453] hover:bg-[#A38042] text-[#173D2C] font-bold text-[11px] uppercase tracking-wider rounded-md transition-colors cursor-pointer shrink-0 shadow-xs"
            >
              Consult Sommelier →
            </button>
          </div>

          {/* Top Bar: Sort, Count, WhatsApp Shopping, Mobile Filter Trigger */}
          <div className="bg-white p-4 rounded-lg border border-[#E5DEC9] flex flex-wrap items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(true)}
                className="lg:hidden flex items-center gap-1.5 px-3 py-2 bg-[#FAF7F0] text-[#173D2C] rounded-lg border border-[#E5DEC9] text-xs font-semibold cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#B89453]" />
                <span>Filters {hasActiveFilters && "•"}</span>
              </button>
              <span className="text-xs text-[#5F6D65] font-medium">
                Showing <strong className="text-[#173D2C]">{products.length}</strong> {products.length === 1 ? "Harvest" : "Harvests"}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleCatalogShopOnWhatsApp}
                className="px-3.5 py-2 rounded-lg text-xs font-bold tracking-wider uppercase bg-[#173D2C] hover:bg-[#102C21] text-[#FAF7F0] border border-[#B89453]/60 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <WhatsAppIcon className="w-3.5 h-3.5 text-[#4ADE80] shrink-0" />
                <span>
                  {cartItems.length > 0
                    ? `Shop on WhatsApp (${cartItems.length})`
                    : "Shop on WhatsApp"}
                </span>
              </button>

              <div className="flex items-center gap-2">
                <label htmlFor="sort" className="text-xs text-[#5F6D65] font-medium whitespace-nowrap">
                  Sort By:
                </label>
                <select
                  id="sort"
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="text-xs px-3 py-2 bg-[#FAF7F0] border border-[#E5DEC9] rounded-lg focus:outline-none focus:border-[#173D2C] text-[#242824] font-medium cursor-pointer"
                >
                  <option value="featured">Featured Reserve</option>
                  <option value="newest">Latest Arrivals</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="name_asc">Name: A to Z</option>
                </select>
              </div>
            </div>
          </div>

          {/* Active Filter Pills */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-[#5F6D65] font-medium">Active Filters:</span>
              {selectedNeed && (
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-[#173D2C] text-[#FAF7F0]">
                  Need: {SHOP_BY_NEEDS.find((n) => n.id === selectedNeed)?.label || selectedNeed}
                  <button type="button" onClick={() => setSelectedNeed("")} aria-label="Remove wellness need filter" className="hover:text-[#D4B776] cursor-pointer">✕</button>
                </span>
              )}
              {selectedCategory && !initialCategorySlug && (
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-[#173D2C] text-[#FAF7F0]">
                  Category: {categories.find((c) => c.slug === selectedCategory)?.name || selectedCategory}
                  <button type="button" onClick={() => setSelectedCategory("")} aria-label="Remove category filter" className="hover:text-[#D4B776] cursor-pointer">✕</button>
                </span>
              )}
              {searchQuery && (
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-[#173D2C] text-[#FAF7F0]">
                  Search: &ldquo;{searchQuery}&rdquo;
                  <button type="button" onClick={() => setSearchQuery("")} aria-label="Remove keyword search filter" className="hover:text-[#D4B776] cursor-pointer">✕</button>
                </span>
              )}
              {minPrice && (
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-[#173D2C] text-[#FAF7F0]">
                  Min: ₹{minPrice}
                  <button type="button" onClick={() => setMinPrice("")} aria-label="Remove minimum price filter" className="hover:text-[#D4B776] cursor-pointer">✕</button>
                </span>
              )}
              {maxPrice && (
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-[#173D2C] text-[#FAF7F0]">
                  Max: ₹{maxPrice}
                  <button type="button" onClick={() => setMaxPrice("")} aria-label="Remove maximum price filter" className="hover:text-[#D4B776] cursor-pointer">✕</button>
                </span>
              )}
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-[#987B3E] hover:underline font-semibold ml-2 cursor-pointer"
              >
                Clear All
              </button>
            </div>
          )}

          {/* Products Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="aspect-square bg-white rounded-2xl animate-pulse border border-[#E5DEC9]" />
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-[#B89453]/50 p-8 space-y-4">
              <span className="text-4xl block">🔍</span>
              <h3 className="font-serif text-xl font-bold text-[#173D2C]">No Harvest Selections Found</h3>
              <p className="text-xs text-[#5F6D65] max-w-md mx-auto">
                No products match the selected criteria. Try adjusting your filters or search keywords.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-6 py-2.5 bg-[#173D2C] hover:bg-[#102C21] text-[#FAF7F0] rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border border-[#B89453]/40"
              >
                Reset All Filters
              </button>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <nav aria-label="Product catalogue pagination" className="flex items-center justify-center gap-2 pt-8">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                aria-label="Previous page"
                className="px-3.5 py-2 rounded-lg border border-[#E5DEC9] bg-white text-xs font-semibold disabled:opacity-40 cursor-pointer text-[#173D2C] flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentPage(idx + 1)}
                  aria-label={`Page ${idx + 1}`}
                  aria-current={currentPage === idx + 1 ? "page" : undefined}
                  className={`w-9 h-9 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    currentPage === idx + 1
                      ? "bg-[#173D2C] text-[#FAF7F0]"
                      : "bg-white border border-[#E5DEC9] text-[#173D2C] hover:border-[#B89453]"
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                aria-label="Next page"
                className="px-3.5 py-2 rounded-lg border border-[#E5DEC9] bg-white text-xs font-semibold disabled:opacity-40 cursor-pointer text-[#173D2C] flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </nav>
          )}
        </main>
      </div>

      {/* RECENTLY VIEWED HARVESTS CAROUSEL */}
      <RecentlyViewedProducts maxDisplay={4} />

      {/* MOBILE FILTER MODAL DRAWER */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs animate-fade-in"
            onClick={() => setIsMobileFilterOpen(false)}
          />
          <div className="relative ml-auto w-full max-w-xs bg-white h-full shadow-2xl p-6 overflow-y-auto z-10 space-y-6">
            <div className="flex items-center justify-between border-b border-[#E5DEC9] pb-4">
              <h3 className="font-serif font-bold text-lg text-[#173D2C]">Filter Harvests</h3>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-1 text-[#5F6D65] hover:text-[#173D2C] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Search */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#173D2C] block mb-1.5">
                Keyword Search
              </label>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-[#FAF7F0] border border-[#E5DEC9] rounded-lg text-[#242824]"
              />
            </div>

            {/* Mobile Shop by Everyday Need */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#173D2C] block mb-1.5">
                Everyday Need
              </label>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setSelectedNeed("")}
                  className={`w-full text-left text-xs px-3 py-1.5 rounded-lg ${
                    selectedNeed === "" ? "bg-[#173D2C] text-[#FAF7F0]" : "text-[#4A4E46]"
                  }`}
                >
                  All Needs
                </button>
                {SHOP_BY_NEEDS.map((need) => (
                  <button
                    key={need.id}
                    type="button"
                    onClick={() => setSelectedNeed(need.id === selectedNeed ? "" : need.id)}
                    className={`w-full text-left text-xs px-3 py-1.5 rounded-lg ${
                      selectedNeed === need.id ? "bg-[#173D2C] text-[#FAF7F0]" : "text-[#4A4E46]"
                    }`}
                  >
                    {need.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Categories */}
            {!initialCategorySlug && (
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#173D2C] block mb-1.5">
                  Category
                </label>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("")}
                    className={`w-full text-left text-xs px-3 py-1.5 rounded-lg ${
                      selectedCategory === "" ? "bg-[#173D2C] text-[#FAF7F0]" : "text-[#4A4E46]"
                    }`}
                  >
                    All Categories
                  </button>
                  {categories
                    .filter((c) => c.slug !== "all")
                    .map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.slug)}
                        className={`w-full text-left text-xs px-3 py-1.5 rounded-lg ${
                          selectedCategory === cat.slug ? "bg-[#173D2C] text-[#FAF7F0]" : "text-[#4A4E46]"
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Mobile Price */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#173D2C] block mb-1.5">
                Price (₹)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-[#FAF7F0] border border-[#E5DEC9] rounded-lg"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-[#FAF7F0] border border-[#E5DEC9] rounded-lg"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-[#E5DEC9] space-y-2">
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-full py-3 bg-[#173D2C] text-[#FAF7F0] font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
              >
                Apply Filters
              </button>
              <button
                type="button"
                onClick={handleResetFilters}
                className="w-full py-2 bg-[#FAF7F0] text-[#987B3E] font-semibold text-xs rounded-xl border border-[#E5DEC9] cursor-pointer"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ProductListingView(props: ProductListingViewProps) {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-16 text-center text-[#5F6D65] font-serif">
          Loading Royal Harvests Catalogue...
        </div>
      }
    >
      <ProductListingViewInner {...props} />
    </Suspense>
  );
}
