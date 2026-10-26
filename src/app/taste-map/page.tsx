"use client";

import React, { Suspense, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useCart } from "@/components/cart/cart-context";
import { ProductImageFrame } from "@/components/catalog/product-image-frame";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { InteractiveIndiaMap } from "@/components/taste-map/interactive-india-map";
import {
  VERIFIED_INDIA_REGIONS,
  INTERNATIONAL_HERITAGE_TERROIRS,
  VerifiedTasteRegion,
  getTasteRegionBySlug,
  getStateRegion,
} from "@/lib/data/india-taste-regions";
import { STOREFRONT_PRODUCTS } from "@/lib/catalog/storefront-catalog";
import {
  MapPin,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Compass,
  CheckCircle2,
  Globe2,
  Layers,
  ShoppingBag,
  ExternalLink,
} from "lucide-react";

function TasteMapContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addItem, openDrawer, isCartLoading } = useCart();
  const [, startTransition] = useTransition();

  // Selected state from URL query parameter, with default to 'jammu-and-kashmir'
  const regionQueryParam = searchParams.get("region");
  const initialRegion = getTasteRegionBySlug(regionQueryParam || "") || VERIFIED_INDIA_REGIONS[0];

  const [selectedRegion, setSelectedRegion] = useState<VerifiedTasteRegion | null>(initialRegion);
  const [selectedStateName, setSelectedStateName] = useState<string>(initialRegion.state);
  const [selectedStateId, setSelectedStateId] = useState<string>(initialRegion.stateId);
  const [activeTab, setActiveTab] = useState<"india" | "international">("india");
  const [addingProductId, setAddingProductId] = useState<string | null>(null);
  const [addedSuccessId, setAddedSuccessId] = useState<string | null>(null);

  // Synchronize state if URL query param changes (e.g. back/forward navigation)
  useEffect(() => {
    if (regionQueryParam) {
      const match = getTasteRegionBySlug(regionQueryParam);
      if (match) {
        setSelectedRegion(match);
        setSelectedStateName(match.state);
        setSelectedStateId(match.stateId);
      }
    }
  }, [regionQueryParam]);

  // Handle region or state click from map or directory
  const handleSelectRegion = (
    region: VerifiedTasteRegion | null,
    stateId?: string,
    stateName?: string
  ) => {
    setSelectedRegion(region);
    if (stateId) setSelectedStateId(stateId);
    if (stateName) setSelectedStateName(stateName);

    // Persist to URL parameter without full page reload
    if (region) {
      const newUrl = `/taste-map?region=${encodeURIComponent(region.slug)}`;
      window.history.replaceState(null, "", newUrl);
    } else if (stateId) {
      const newUrl = `/taste-map?region=${encodeURIComponent(stateId)}`;
      window.history.replaceState(null, "", newUrl);
    }
  };

  // Add to Bag handler using real cart context
  const handleQuickAdd = async (variantId: string, productId: string) => {
    try {
      setAddingProductId(productId);
      await addItem(variantId, 1);
      setAddedSuccessId(productId);
      openDrawer();
      setTimeout(() => setAddedSuccessId(null), 2500);
    } catch (err) {
      console.error("Failed to add to cart", err);
    } finally {
      setAddingProductId(null);
    }
  };

  // Resolve linked products from authoritative storefront catalog
  const linkedProducts = React.useMemo(() => {
    if (!selectedRegion) return [];
    return selectedRegion.productSlugs
      .map((slug) => STOREFRONT_PRODUCTS.find((p) => p.slug === slug))
      .filter((p): p is (typeof STOREFRONT_PRODUCTS)[number] => Boolean(p));
  }, [selectedRegion]);

  return (
    <div className="bg-[#FAF7F0] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        {/* Breadcrumb Navigation */}
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "India Taste Map & Provenance" },
          ]}
        />

        {/* Page Header */}
        <PageHeader
          eyebrow="GEOGRAPHICAL PROVENANCE & TERROIR"
          title="The India Taste Map"
          description="Explore the authentic micro-climates of India. Every harvest in the Fruits & Nuts reserve is mapped to its genuine geological origin, traditional processing method, and single-estate terroir."
        />

        {/* View Switcher: India Terroir vs International Reserves */}
        <div className="flex items-center justify-between border-b border-[#DCE5D8] pb-4 gap-4 flex-wrap">
          <div className="flex items-center gap-2 p-1 bg-white rounded-2xl border border-[#DCE5D8] shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab("india")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "india"
                  ? "bg-[#173D2C] text-[#FAF7F0] shadow-xs"
                  : "text-stone-600 hover:text-[#173D2C]"
              }`}
            >
              <Compass className="w-4 h-4 text-[#B89453]" />
              <span>India Terroir Map</span>
              <span className="text-[10px] bg-[#B89453] text-[#173D2C] px-1.5 py-0.2 rounded-full font-bold">
                10 Regions
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("international")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "international"
                  ? "bg-[#173D2C] text-[#FAF7F0] shadow-xs"
                  : "text-stone-600 hover:text-[#173D2C]"
              }`}
            >
              <Globe2 className="w-4 h-4 text-[#B89453]" />
              <span>International Reserves</span>
              <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.2 rounded-full font-semibold">
                Imported
              </span>
            </button>
          </div>

          <div className="text-xs text-stone-500 hidden md:flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Strict FSSAI compliance — zero fabricated disease claims</span>
          </div>
        </div>

        {activeTab === "india" ? (
          /* MAIN TWO-COLUMN WORKBENCH: REAL INDIA MAP + REGIONAL DETAIL */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT 7 COLS: GEOGRAPHICALLY ACCURATE INDIA SVG MAP */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-[#DCE5D8] p-5 sm:p-8 shadow-xs flex flex-col items-center">
              <InteractiveIndiaMap
                selectedRegionSlug={selectedRegion?.slug || null}
                selectedStateId={selectedStateId}
                onSelectRegion={handleSelectRegion}
              />

              {/* Accessible Terroir Directory Tabs */}
              <div className="w-full mt-8 pt-6 border-t border-[#DCE5D8] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#173D2C] uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#B89453]" />
                    Verified Terroir Directory
                  </span>
                  <span className="text-[11px] text-stone-500">Tap to select region</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {VERIFIED_INDIA_REGIONS.map((region) => {
                    const isSelected = selectedRegion?.slug === region.slug;
                    return (
                      <button
                        key={region.id}
                        type="button"
                        onClick={() => handleSelectRegion(region, region.stateId, region.state)}
                        className={`text-xs px-3.5 py-2 rounded-xl font-medium border transition-all cursor-pointer flex items-center gap-2 ${
                          isSelected
                            ? "border-[#173D2C] bg-[#173D2C] text-[#FAF7F0] shadow-xs"
                            : "border-[#DCE5D8] bg-[#FAF7F0] text-stone-700 hover:border-[#B89453] hover:bg-white"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isSelected
                              ? "bg-[#B89453]"
                              : region.associationType === "grown_in"
                              ? "bg-emerald-600"
                              : "bg-[#B89453]"
                          }`}
                        />
                        <span>{region.state}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                            isSelected
                              ? "bg-white/20 text-[#FAF7F0]"
                              : "bg-stone-200/60 text-stone-600"
                          }`}
                        >
                          {region.productSlugs.length}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT 5 COLS: PERSISTENT REGIONAL TERROIR SPOTLIGHT */}
            <div className="lg:col-span-5 space-y-6">
              {selectedRegion ? (
                <div className="bg-white rounded-3xl border border-[#DCE5D8] p-6 sm:p-8 shadow-xs space-y-6">
                  {/* Region Header & Association Badge */}
                  <div className="border-b border-[#DCE5D8]/70 pb-5 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-[#B89453]">
                        {selectedRegion.state} • India
                      </span>
                      <span className="text-[10px] font-mono text-stone-400">
                        {selectedRegion.coordinates.lat.toFixed(2)}° N, {selectedRegion.coordinates.lng.toFixed(2)}° E
                      </span>
                    </div>

                    <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#173D2C] leading-tight">
                      {selectedRegion.name}
                    </h3>

                    {/* Verification Status Badge */}
                    <div className="pt-1">
                      {selectedRegion.associationType === "grown_in" && (
                        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200 shadow-2xs">
                          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{selectedRegion.associationLabel}</span>
                        </div>
                      )}
                      {selectedRegion.associationType === "produced_in" && (
                        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-900 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200 shadow-2xs">
                          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>{selectedRegion.associationLabel}</span>
                        </div>
                      )}
                      {selectedRegion.associationType === "regionally_associated" && (
                        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-900 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-200 shadow-2xs">
                          <Compass className="w-4 h-4 text-indigo-600 shrink-0" />
                          <span>{selectedRegion.associationLabel}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Terroir & Geological Background */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-[#173D2C] text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#B89453]" />
                      Geological Terroir & Soil
                    </h4>
                    <p className="text-xs sm:text-sm text-stone-700 leading-relaxed bg-[#FAF7F0] p-4 rounded-2xl border border-[#DCE5D8]">
                      {selectedRegion.terroirNotes}
                    </p>
                  </div>

                  {/* Cultural Heritage Narrative */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-[#173D2C] text-xs uppercase tracking-wider">
                      Regional Harvest Heritage
                    </h4>
                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                      {selectedRegion.culturalStory}
                    </p>
                  </div>

                  {/* Verified Products from this Region */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-[#173D2C] text-xs uppercase tracking-wider">
                        Authentic Regional Harvests ({linkedProducts.length}):
                      </h4>
                      <span className="text-[11px] text-stone-500">Official Retail Price</span>
                    </div>

                    {linkedProducts.length > 0 ? (
                      <div className="space-y-3">
                        {linkedProducts.map((product) => {
                          const primaryVariant = product.variants?.[0];
                          const isAdding = addingProductId === product.id;
                          const isSuccess = addedSuccessId === product.id;

                          return (
                            <div
                              key={product.id}
                              className="p-3.5 bg-[#FAF7F0] rounded-2xl border border-[#DCE5D8] hover:border-[#B89453]/60 transition-all flex items-center justify-between gap-3 shadow-2xs"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-14 h-14 rounded-xl border border-[#DCE5D8] shrink-0 overflow-hidden bg-white">
                                  <ProductImageFrame
                                    src={product.primaryImage?.imageUrl}
                                    alt={product.primaryImage?.altText || product.name}
                                    productName={product.name}
                                    categoryName={product.category?.name}
                                    size="sm"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <Link
                                    href={`/product/${product.slug}`}
                                    className="font-bold text-xs sm:text-sm text-[#173D2C] hover:text-[#B89453] transition-colors line-clamp-1 block"
                                  >
                                    {product.name}
                                  </Link>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-xs font-bold text-[#173D2C]">
                                      {formatPrice(primaryVariant?.sellingPrice || 499)}
                                    </span>
                                    {primaryVariant && (
                                      <span className="text-[10px] text-stone-500 font-medium">
                                        ({primaryVariant.weightGrams >= 1000 ? `${primaryVariant.weightGrams / 1000}kg` : `${primaryVariant.weightGrams}g`})
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <Link
                                  href={`/product/${product.slug}`}
                                  className="p-2 rounded-lg text-stone-500 hover:text-[#173D2C] hover:bg-white border border-transparent hover:border-[#DCE5D8] transition-all"
                                  title="View Product Details"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </Link>

                                {primaryVariant && (
                                  <button
                                    type="button"
                                    onClick={() => handleQuickAdd(primaryVariant.id, product.id)}
                                    disabled={isAdding || isCartLoading}
                                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl shadow-xs cursor-pointer border transition-all flex items-center gap-1.5 ${
                                      isSuccess
                                        ? "bg-emerald-700 text-white border-emerald-700"
                                        : "bg-[#173D2C] hover:bg-[#123123] text-white border-[#B89453]/30 hover:border-[#B89453]"
                                    }`}
                                  >
                                    {isSuccess ? (
                                      <>
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>Added</span>
                                      </>
                                    ) : isAdding ? (
                                      <span>Adding...</span>
                                    ) : (
                                      <>
                                        <ShoppingBag className="w-3.5 h-3.5" />
                                        <span>Add</span>
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-5 bg-[#FAF7F0] rounded-2xl text-center border border-dashed border-[#DCE5D8] space-y-2">
                        <p className="text-xs text-stone-600">
                          Batches from {selectedRegion.name} are currently in seasonal preparation.
                        </p>
                        <Link
                          href="/shop"
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#173D2C] hover:text-[#B89453] transition-colors"
                        >
                          <span>Explore Full Catalogue</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Empty state for Indian state without current product association */
                <div className="bg-white rounded-3xl border border-[#DCE5D8] p-8 shadow-xs text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-[#FAF7F0] border border-[#DCE5D8] mx-auto flex items-center justify-center text-stone-500">
                    <Compass className="w-6 h-6 text-[#B89453]" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-bold text-[#173D2C]">{selectedStateName}</h3>
                    <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                      We are currently vetting and onboarding certified estate partners in {selectedStateName}. Only verified single-origin products are displayed on the India Taste Map.
                    </p>
                  </div>
                  <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
                    <button
                      type="button"
                      onClick={() => handleSelectRegion(VERIFIED_INDIA_REGIONS[0])}
                      className="px-4 py-2 bg-[#FAF7F0] hover:bg-stone-100 text-[#173D2C] text-xs font-semibold rounded-xl border border-[#DCE5D8] transition-all cursor-pointer"
                    >
                      Return to Kashmir Valley
                    </button>
                    <Link
                      href="/shop"
                      className="px-4 py-2 bg-[#173D2C] hover:bg-[#123123] text-white text-xs font-semibold rounded-xl border border-[#B89453]/30 transition-all inline-flex items-center justify-center gap-1.5"
                    >
                      <span>Browse Full Catalogue</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* INTERNATIONAL RESERVES PANEL (TRANSPARENT SOURCING) */
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-[#DCE5D8] p-6 sm:p-8 shadow-xs space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#B89453]">
                TRANSPARENT GLOBAL SOURCING
              </span>
              <h3 className="font-serif text-2xl font-bold text-[#173D2C]">
                Authentic International Heritage Cultivars
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 max-w-3xl leading-relaxed">
                While the majority of our nuts and spices are harvested across India's micro-climates, certain royal delicacies — such as Jordan Valley Medjool dates, Holy Medina Ajwa dates, and Persian mountain pistachios — are natively grown outside Indian borders. In accordance with strict FSSAI guidelines, we present their authentic geographical origins transparently below.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {INTERNATIONAL_HERITAGE_TERROIRS.map((inter) => {
                const prods = inter.productSlugs
                  .map((slug) => STOREFRONT_PRODUCTS.find((p) => p.slug === slug))
                  .filter((p): p is (typeof STOREFRONT_PRODUCTS)[number] => Boolean(p));

                return (
                  <div
                    key={inter.id}
                    className="bg-white rounded-3xl border border-[#DCE5D8] p-6 shadow-xs flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#B89453]">
                          {inter.country}
                        </span>
                        <Globe2 className="w-4 h-4 text-stone-400" />
                      </div>
                      <h4 className="font-serif text-lg font-bold text-[#173D2C]">{inter.region}</h4>
                      <p className="text-xs text-stone-600 leading-relaxed bg-[#FAF7F0] p-3 rounded-xl border border-[#DCE5D8]">
                        {inter.terroirDescription}
                      </p>
                      <div className="text-[11px] text-emerald-800 font-medium flex items-start gap-1.5 pt-1">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{inter.sourcingNote}</span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-[#DCE5D8]">
                      <span className="text-[11px] font-bold text-[#173D2C] uppercase tracking-wider block">
                        Featured Harvests:
                      </span>
                      {prods.map((p) => (
                        <div key={p.id} className="flex items-center justify-between text-xs py-1">
                          <Link
                            href={`/product/${p.slug}`}
                            className="font-medium text-[#173D2C] hover:text-[#B89453] transition-colors line-clamp-1"
                          >
                            {p.name}
                          </Link>
                          <span className="font-bold text-[#173D2C] shrink-0 ml-2">
                            {formatPrice(p.variants?.[0]?.sellingPrice || 499)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TasteMapPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF7F0] flex items-center justify-center p-8">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-[#173D2C] border-t-transparent animate-spin mx-auto" />
            <p className="text-xs font-semibold text-[#173D2C] uppercase tracking-wider">
              Loading India Taste Map...
            </p>
          </div>
        </div>
      }
    >
      <TasteMapContent />
    </Suspense>
  );
}
