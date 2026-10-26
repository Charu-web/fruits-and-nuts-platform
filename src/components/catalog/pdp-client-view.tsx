"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Truck,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Star,
  Minus,
  Plus,
  ShoppingCart,
  Check,
  MapPin,
  X,
  MessageCircle,
} from "lucide-react";
import { useCart } from "@/components/cart/cart-context";
import {
  buildSingleProductWhatsAppMessage,
  createWhatsAppOrderLink,
} from "@/lib/whatsapp-shopping";
import { ProductImageFrame } from "./product-image-frame";
import { ProductCard } from "./product-card";
import { getProductImageUrl } from "@/lib/catalog/product-asset-registry";
import { STOREFRONT_PRODUCTS } from "@/lib/catalog/storefront-catalog";
import { formatPrice } from "@/lib/utils";
import { Breadcrumbs } from "@/components/ui/breadcrumb";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { FrequentlyBoughtTogether } from "./frequently-bought-together";
import { RecentlyViewedProducts } from "./recently-viewed";

export interface PDPVariant {
  id: string;
  sku: string;
  weightGrams: number;
  unit: string;
  packageType: string;
  mrp: number;
  sellingPrice: number;
  discountPercentage: number;
  stockStatus: string;
  isAvailable: boolean;
}

export interface PDPImage {
  id: string;
  imageUrl: string;
  altText: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface PDPProductData {
  id: string;
  name: string;
  slug: string;
  skuBase: string;
  description: string;
  ingredients?: string | null;
  allergenInfo?: string | null;
  nutritionFacts?: Record<string, string | number> | null;
  storageInstructions?: string | null;
  shelfLifeMonths?: number | null;
  gstPercentage: number;
  isFeatured: boolean;
  isByobEligible: boolean;
  category: { id: number; name: string; slug: string };
  subcategory?: { id: number; name: string; slug: string } | null;
  images: PDPImage[];
  variants: PDPVariant[];
}

interface ReviewItem {
  id: string;
  rating: number;
  title: string | null;
  reviewText: string;
  isVerifiedBuyer: boolean;
  createdAt: string;
  user?: { profile?: { firstName?: string; lastName?: string } };
}

export function PDPClientView({ product }: { product: PDPProductData }) {
  const { addItem, isCartLoading } = useCart();

  // Selected Variant & Quantity
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<"description" | "nutrition" | "storage" | "shipping">("description");

  // PIN Code Delivery Estimator
  const [pinCode, setPinCode] = useState("");
  const [shippingEstimate, setShippingEstimate] = useState<{
    serviceable: boolean;
    estimatedDays?: string;
    shippingFee?: number;
    message?: string;
  } | null>(null);
  const [isEstimatingShipping, setIsEstimatingShipping] = useState(false);

  // Reviews State
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [averageRating, setAverageRating] = useState<number>(5.0);
  const [totalReviews, setTotalReviews] = useState<number>(0);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewTitle, setNewReviewTitle] = useState("");
  const [newReviewText, setNewReviewText] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSubmitMessage, setReviewSubmitMessage] = useState<string | null>(null);

  // Cart action state
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addSuccessMessage, setAddSuccessMessage] = useState(false);
  const [whatsappError, setWhatsappError] = useState<string | null>(null);

  const selectedVariant = product.variants[selectedVariantIndex] || product.variants[0];
  const fallbackImgUrl = getProductImageUrl(product.slug) || "";
  const images =
    product.images.length > 0 && product.images.some((img) => Boolean(img.imageUrl))
      ? product.images
      : [{ id: "placeholder", imageUrl: fallbackImgUrl, altText: product.name, isPrimary: true, sortOrder: 0 }];
  const currentImage = images[activeImageIndex] || images[0];

  // Related Products
  const relatedProducts = STOREFRONT_PRODUCTS.filter(
    (p) => p.slug !== product.slug && (p.category?.slug === product.category.slug || p.collectionGroup === product.category.slug)
  ).slice(0, 4);

  // Fetch verified reviews for this product
  useEffect(() => {
    async function loadReviews() {
      try {
        const res = await fetch(`/api/v1/products/${product.slug}/reviews`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setReviews(json.data.reviews || []);
            setAverageRating(json.data.averageRating || 5.0);
            setTotalReviews(json.data.totalReviews || 0);
          }
        }
      } catch (err) {
        console.error("Failed to load reviews", err);
      }
    }
    loadReviews();
  }, [product.slug]);

  const handlePinCodeCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinCode || pinCode.length !== 6) return;

    setIsEstimatingShipping(true);
    try {
      const res = await fetch(`/api/v1/shipping/estimate?postalCode=${pinCode}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setShippingEstimate({
            serviceable: true,
            estimatedDays: json.data.estimatedDeliveryDays || "2-4 Business Days",
            shippingFee: json.data.shippingFee,
            message: json.data.isFreeShipping ? "FREE Express Delivery Eligible" : `Standard Shipping: ₹${json.data.shippingFee}`,
          });
        } else {
          setShippingEstimate({
            serviceable: false,
            message: "Delivery is currently unserviceable to this PIN code.",
          });
        }
      } else {
        setShippingEstimate({
          serviceable: true,
          estimatedDays: "3-5 Business Days",
          message: "Standard Delivery Available across India",
        });
      }
    } catch {
      setShippingEstimate({
        serviceable: true,
        estimatedDays: "3-5 Business Days",
        message: "Standard Delivery Available across India",
      });
    } finally {
      setIsEstimatingShipping(false);
    }
  };

  const handleAddToCart = async (openDrawer = true) => {
    if (!selectedVariant || !selectedVariant.isAvailable || isAddingToCart) return;

    try {
      setIsAddingToCart(true);
      await addItem(selectedVariant.id, quantity);
      setAddSuccessMessage(true);
      setTimeout(() => setAddSuccessMessage(false), 2500);
    } catch (err) {
      console.error("Failed to add to cart", err);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!selectedVariant || !selectedVariant.isAvailable) return;
    await handleAddToCart(false);
    window.location.href = "/checkout";
  };

  const handleShopOnWhatsApp = () => {
    if (!selectedVariant) return;
    setWhatsappError(null);

    const currentUrl =
      typeof window !== "undefined" && window.location?.href
        ? window.location.href
        : undefined;

    const message = buildSingleProductWhatsAppMessage({
      productName: product.name,
      productSlug: product.slug,
      productUrl: currentUrl,
      sku: selectedVariant.sku || product.skuBase,
      weightGrams: selectedVariant.weightGrams,
      unit: selectedVariant.unit,
      packageType: selectedVariant.packageType,
      unitPrice: selectedVariant.sellingPrice,
      quantity,
    });

    const linkResult = createWhatsAppOrderLink(message);
    if (!linkResult.isConfigured || !linkResult.url) {
      setWhatsappError(
        linkResult.error || "WhatsApp shopping is currently unavailable. Please contact our concierge."
      );
      return;
    }

    window.open(linkResult.url, "_blank", "noopener,noreferrer");
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewText.trim()) return;

    setIsSubmittingReview(true);
    setReviewSubmitMessage(null);
    try {
      const res = await fetch("/api/v1/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          rating: newReviewRating,
          title: newReviewTitle || undefined,
          reviewText: newReviewText,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setReviewSubmitMessage("Thank you! Your verified review has been submitted for moderation.");
        setTimeout(() => {
          setIsReviewModalOpen(false);
          setReviewSubmitMessage(null);
          setNewReviewTitle("");
          setNewReviewText("");
        }, 2000);
      } else {
        setReviewSubmitMessage(json.error?.message || "Please sign in to submit a review for your purchased items.");
      }
    } catch {
      setReviewSubmitMessage("Failed to submit review. Please try again later.");
    } finally {
      setIsSubmittingReview(false);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Breadcrumb Navigation */}
      <div className="mb-6">
        <Breadcrumbs
          items={[
            {
              label: product.category.name,
              href: `/category/${product.category.slug}`,
            },
            {
              label: product.name,
            },
          ]}
        />
      </div>

      {/* Product Hero Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
        {/* Left: Product Imagery Gallery */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-square w-full rounded-lg bg-white border border-[#E5DEC9] shadow-xs overflow-hidden flex items-center justify-center group">
            <ProductImageFrame
              src={currentImage?.imageUrl}
              alt={currentImage?.altText || product.name}
              productName={product.name}
              categoryName={product.category?.name}
              size="pdp"
              priority
            />

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
              {selectedVariant && selectedVariant.discountPercentage > 0 && (
                <span className="bg-[#B89453] text-[#173D2C] font-bold text-xs px-3 py-1 rounded shadow-xs uppercase tracking-wider">
                  {selectedVariant.discountPercentage}% OFF
                </span>
              )}
              {selectedVariant?.stockStatus === "OUT_OF_STOCK" && (
                <span className="bg-[#173D2C] text-[#FAF7F0] font-semibold text-xs px-3 py-1 rounded uppercase tracking-wider">
                  Out of Stock
                </span>
              )}
              {selectedVariant?.stockStatus === "LOW_STOCK" && (
                <span className="bg-[#987B3E] text-white font-semibold text-xs px-3 py-1 rounded uppercase tracking-wider">
                  Only few units left
                </span>
              )}
            </div>
          </div>

          {/* Thumbnails */}
          {images.length > 1 && images.some((img) => Boolean(img.imageUrl)) && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {images
                .filter((img) => Boolean(img.imageUrl))
                .map((img, idx) => (
                  <button
                    key={img.id || idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-20 h-20 rounded-md overflow-hidden border-2 transition-all flex-shrink-0 bg-[#FAF7F0] cursor-pointer ${
                      activeImageIndex === idx ? "border-[#173D2C] shadow-sm" : "border-transparent hover:border-[#B89453]/60"
                    }`}
                  >
                    <img
                      src={img.imageUrl}
                      alt={img.altText}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/images/placeholder-product.svg";
                      }}
                    />
                  </button>
                ))}
            </div>
          )}

          {/* Quality Seals Bar */}
          <div className="grid grid-cols-3 gap-3 pt-2 text-center">
            <div className="p-3 bg-white rounded-md border border-[#E5DEC9] flex flex-col items-center">
              <ShieldCheck className="w-5 h-5 text-[#B89453] mb-1" />
              <span className="text-[11px] font-bold text-[#173D2C]">100% Authentic</span>
              <span className="text-[10px] text-[#5F6D65]">Single-Origin Harvest</span>
            </div>
            <div className="p-3 bg-white rounded-md border border-[#E5DEC9] flex flex-col items-center">
              <Truck className="w-5 h-5 text-[#B89453] mb-1" />
              <span className="text-[11px] font-bold text-[#173D2C]">Free Delivery</span>
              <span className="text-[10px] text-[#5F6D65]">On Orders Over ₹999</span>
            </div>
            <div className="p-3 bg-white rounded-md border border-[#E5DEC9] flex flex-col items-center">
              <RotateCcw className="w-5 h-5 text-[#B89453] mb-1" />
              <span className="text-[11px] font-bold text-[#173D2C]">Freshness Lock</span>
              <span className="text-[10px] text-[#5F6D65]">Nitrogen-Flushed</span>
            </div>
          </div>
        </div>

        {/* Right: Product Actions, Price, Variants & Add to Cart */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Link
                href={`/category/${product.category.slug}`}
                className="editorial-eyebrow text-[#987B3E] hover:text-[#173D2C] transition-colors"
              >
                {product.category.name}
              </Link>
              <span className="text-[11px] font-mono text-[#5F6D65]">SKU: {selectedVariant?.sku || product.skuBase}</span>
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-normal tracking-tight text-[#173D2C] leading-snug">
              {product.name}
            </h1>

            {/* Ratings Summary */}
            <div className="flex items-center gap-2 mt-2.5">
              <div className="flex items-center text-[#B89453] text-sm">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${
                      s <= Math.round(averageRating) ? "fill-[#B89453] text-[#B89453]" : "text-neutral-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-bold text-[#173D2C]">{averageRating.toFixed(1)}</span>
              <span className="text-xs text-[#5F6D65]">({totalReviews} verified reviews)</span>
            </div>
          </div>

          {/* Price Block */}
          <div className="p-4 sm:p-5 bg-white rounded-lg border border-[#E5DEC9] space-y-1 shadow-xs">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-[#173D2C] font-serif">
                {formatPrice(selectedVariant ? selectedVariant.sellingPrice : 0)}
              </span>
              {selectedVariant && selectedVariant.mrp > selectedVariant.sellingPrice && (
                <>
                  <span className="text-sm text-[#5F6D65]/70 line-through">
                    {formatPrice(selectedVariant.mrp)}
                  </span>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                    Save {formatPrice(selectedVariant.mrp - selectedVariant.sellingPrice)} ({selectedVariant.discountPercentage}%)
                  </span>
                </>
              )}
            </div>
            <p className="text-[11px] text-[#5F6D65]">Inclusive of all taxes &amp; origin batch testing</p>
          </div>

          {/* Variant Selector */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#173D2C] block mb-2.5">
              Select Net Weight / Package Size
            </label>
            <div className="flex flex-wrap gap-2.5">
              {product.variants.map((variant, idx) => (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => setSelectedVariantIndex(idx)}
                  className={`px-4 py-2.5 rounded-md text-xs font-semibold border-2 transition-all flex flex-col items-center cursor-pointer ${
                    selectedVariantIndex === idx
                      ? "border-[#173D2C] bg-[#173D2C] text-[#FAF7F0] shadow-xs"
                      : "border-[#E5DEC9] bg-white text-[#4A4E46] hover:border-[#B89453]"
                  }`}
                >
                  <span>{formatWeight(variant.weightGrams, variant.unit)}</span>
                  <span className={`text-[10px] mt-0.5 ${selectedVariantIndex === idx ? "text-[#D4B776]" : "text-[#5F6D65]"}`}>
                    {formatPrice(variant.sellingPrice)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Quantity Selector & Action Buttons */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-[#E5DEC9] rounded-md bg-white p-1">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1 || isAddingToCart}
                  aria-label="Decrease quantity"
                  className="w-9 h-9 flex items-center justify-center text-[#173D2C] hover:bg-[#FAF7F0] rounded disabled:opacity-30 font-bold cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center font-bold text-sm text-[#173D2C]">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  disabled={!selectedVariant?.isAvailable || isAddingToCart}
                  aria-label="Increase quantity"
                  className="w-9 h-9 flex items-center justify-center text-[#173D2C] hover:bg-[#FAF7F0] rounded disabled:opacity-30 font-bold cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleAddToCart(true)}
                disabled={!selectedVariant?.isAvailable || isAddingToCart || isCartLoading}
                className={`flex-1 py-3.5 px-6 rounded-md font-bold text-xs uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer ${
                  addSuccessMessage
                    ? "bg-emerald-800 text-white border border-emerald-900"
                    : !selectedVariant?.isAvailable
                    ? "bg-[#FAF7F0] text-[#5F6D65] cursor-not-allowed border border-[#E5DEC9]"
                    : "bg-[#173D2C] hover:bg-[#102C21] text-[#FAF7F0] border border-[#B89453]/40 hover:border-[#B89453] active:scale-98"
                }`}
              >
                {addSuccessMessage ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-200" />
                    <span>Added to Gourmet Bag</span>
                  </>
                ) : isAddingToCart ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Adding...</span>
                  </>
                ) : !selectedVariant?.isAvailable ? (
                  "Currently Out of Stock"
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4 text-[#D4B776]" />
                    <span>Add to Bag</span>
                  </>
                )}
              </button>
            </div>

            {selectedVariant?.isAvailable && (
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={isAddingToCart}
                className="w-full py-3.5 px-6 rounded-md font-bold text-xs uppercase tracking-widest bg-[#B89453] hover:bg-[#A38042] text-[#173D2C] transition-all shadow-xs cursor-pointer border border-[#B89453]"
              >
                Buy Now (Direct Express Checkout)
              </button>
            )}

            {/* Order on WhatsApp Option */}
            {selectedVariant && (
              <div className="pt-1 space-y-1.5">
                <button
                  type="button"
                  onClick={handleShopOnWhatsApp}
                  className="w-full py-3.5 px-6 rounded-md font-bold text-xs uppercase tracking-wider bg-[#FAF7F0] hover:bg-[#173D2C] text-[#173D2C] hover:text-[#FAF7F0] border-2 border-[#173D2C] transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <WhatsAppIcon className="w-4 h-4 text-[#1E7E34] shrink-0" />
                  <span>Order on WhatsApp</span>
                </button>
                <p className="text-[11px] text-[#5F6D65] text-center leading-relaxed">
                  Opens WhatsApp with your selected item details. Your order will be confirmed by the Fruits &amp; Nuts team on WhatsApp.
                </p>
                {whatsappError && (
                  <p role="alert" className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-md p-2 text-center">
                    {whatsappError}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* PIN Code Delivery Estimator */}
          <div className="p-4 bg-white rounded-lg border border-[#E5DEC9] space-y-2 shadow-xs">
            <span className="text-xs font-bold text-[#173D2C] flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#B89453]" />
              <span>Check Delivery &amp; Express Dispatch</span>
            </span>
            <form onSubmit={handlePinCodeCheck} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter 6-digit PIN code"
                maxLength={6}
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ""))}
                className="flex-1 text-xs px-3.5 py-2 bg-[#FAF7F0] border border-[#E5DEC9] rounded-md focus:outline-none focus:border-[#173D2C] text-[#242824]"
              />
              <button
                type="submit"
                disabled={pinCode.length !== 6 || isEstimatingShipping}
                className="px-4 py-2 bg-[#173D2C] hover:bg-[#102C21] text-[#FAF7F0] text-xs font-semibold rounded-md disabled:opacity-40 cursor-pointer"
              >
                {isEstimatingShipping ? "Checking..." : "Verify"}
              </button>
            </form>
            {shippingEstimate && (
              <div
                className={`text-xs p-2.5 rounded-md ${
                  shippingEstimate.serviceable
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-rose-50 text-rose-800 border border-rose-200"
                }`}
              >
                {shippingEstimate.message} {shippingEstimate.estimatedDays && `— (${shippingEstimate.estimatedDays})`}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabbed Product Details Panel */}
      <div className="mt-16 bg-white rounded-lg border border-[#E5DEC9] p-4 sm:p-8 shadow-xs max-w-full overflow-hidden">
        <div className="flex border-b border-[#E5DEC9] gap-4 sm:gap-6 overflow-x-auto max-w-full pb-0.5">
          {[
            { id: "description", label: "Product Story & Terroir" },
            { id: "nutrition", label: "Nutritional Facts" },
            { id: "storage", label: "Storage & Shelf Life" },
            { id: "shipping", label: "Shipping & Returns" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 text-xs uppercase tracking-widest font-semibold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? "border-[#173D2C] text-[#173D2C]"
                  : "border-transparent text-[#5F6D65] hover:text-[#173D2C]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="py-6">
          {activeTab === "description" && (
            <div className="prose max-w-none text-xs sm:text-sm leading-relaxed text-[#4A4E46] space-y-4">
              <p>{product.description}</p>
              {product.ingredients && (
                <div>
                  <h4 className="font-bold text-[#173D2C] mb-1">Ingredients:</h4>
                  <p>{product.ingredients}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "nutrition" && (
            <div className="space-y-4">
              <h4 className="text-xs sm:text-sm font-bold text-[#173D2C]">
                Nutritional Profile (Per 100g approximate):
              </h4>
              {product.nutritionFacts && typeof product.nutritionFacts === "object" ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.entries(product.nutritionFacts).map(([k, v]) => (
                    <div key={k} className="p-3 bg-[#FAF7F0] rounded-md border border-[#E5DEC9] text-center">
                      <span className="text-[10px] uppercase tracking-wider text-[#5F6D65] font-semibold block">
                        {k.replace(/_/g, " ")}
                      </span>
                      <span className="text-sm sm:text-base font-bold text-[#173D2C]">{String(v)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#5F6D65]">
                  Detailed nutritional metrics tested by certified food testing laboratories. Free from artificial trans fats and added sugar.
                </p>
              )}
            </div>
          )}

          {activeTab === "storage" && (
            <div className="space-y-3 text-xs sm:text-sm text-[#4A4E46]">
              <p>
                <strong className="text-[#173D2C]">Storage Instructions:</strong>{" "}
                {product.storageInstructions ||
                  "Store in a cool, dry place away from direct sunlight. Once opened, retain in the supplied airtight container to preserve natural oil profile and signature crunch."}
              </p>
              <p>
                <strong className="text-[#173D2C]">Shelf Life:</strong>{" "}
                {product.shelfLifeMonths ? `${product.shelfLifeMonths} Months from packaging` : "9 Months"}
              </p>
              {product.allergenInfo && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-900 text-xs">
                  <strong>Allergen Advisory:</strong> {product.allergenInfo}
                </div>
              )}
            </div>
          )}

          {activeTab === "shipping" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#4A4E46]">
              <div className="p-3.5 bg-[#FAF7F0] rounded-md border border-[#E5DEC9]">
                <h5 className="font-bold text-[#173D2C] mb-1">Pan-India Express Shipping</h5>
                <p>Complimentary express courier on orders above ₹999. Standard delivery dispatched within 24 hours.</p>
              </div>
              <div className="p-3.5 bg-[#FAF7F0] rounded-md border border-[#E5DEC9]">
                <h5 className="font-bold text-[#173D2C] mb-1">Return &amp; Replacement Policy</h5>
                <p>Due to hygiene and food safety regulations, edible harvests are eligible for replacement only in case of transit damage or seal defect within 48 hours.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Frequently Bought Together (Feature A: Recommendations) */}
      <FrequentlyBoughtTogether slug={product.slug} />

      {/* Verified Reviews Section */}
      <div className="mt-12 bg-white rounded-lg border border-[#E5DEC9] p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#E5DEC9] pb-6 mb-6">
          <div>
            <h3 className="font-serif text-2xl font-bold text-[#173D2C]">Verified Customer Reviews</h3>
            <p className="text-xs text-[#5F6D65] mt-1">Real experiences shared by verified purchasers</p>
          </div>
          <button
            type="button"
            onClick={() => setIsReviewModalOpen(true)}
            className="px-5 py-2.5 bg-[#173D2C] hover:bg-[#102C21] text-[#FAF7F0] text-xs font-semibold rounded-md shadow-xs cursor-pointer border border-[#B89453]/35 transition-all"
          >
            Write a Review
          </button>
        </div>

        {reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((rev) => (
              <div key={rev.id} className="p-4 bg-[#FAF7F0] rounded-md border border-[#E5DEC9] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[#B89453] text-sm">{"★".repeat(rev.rating)}</span>
                    {rev.title && <h5 className="text-xs font-bold text-[#173D2C]">{rev.title}</h5>}
                  </div>
                  {rev.isVerifiedBuyer && (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                      ✓ Verified Buyer
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#4A4E46] leading-relaxed">{rev.reviewText}</p>
                <div className="text-[10px] text-[#5F6D65]">
                  {rev.user?.profile?.firstName || "Verified Customer"} • {new Date(rev.createdAt).toLocaleDateString("en-IN")}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-[#5F6D65] text-xs">
            Be the first verified customer to share your thoughts on this harvest.
          </div>
        )}
      </div>

      {/* Related Products Grid */}
      {relatedProducts.length > 0 && (
        <div className="mt-16 pt-12 border-t border-[#E5DEC9]">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#987B3E]">
                Complementary Harvests
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#173D2C] mt-1">
                You May Also Relish
              </h3>
            </div>
            <Link
              href="/shop"
              className="text-xs font-bold uppercase tracking-wider text-[#173D2C] hover:text-[#B89453] transition-colors"
            >
              View All &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} {...p} />
            ))}
          </div>
        </div>
      )}

      {/* Recently Viewed Products (Feature F) */}
      <RecentlyViewedProducts currentSlug={product.slug} />

      {/* Review Submission Modal */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-[#173D2C]/60 backdrop-blur-xs" onClick={() => setIsReviewModalOpen(false)} />
          <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl z-10 space-y-4 border border-[#E5DEC9]">
            <div className="flex justify-between items-center border-b border-[#E5DEC9] pb-3">
              <h4 className="font-serif font-bold text-[#173D2C] text-lg">Review Your Experience</h4>
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="p-1 text-[#5F6D65] hover:text-[#173D2C] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {reviewSubmitMessage ? (
              <div className="p-4 bg-[#FAF7F0] rounded-xl text-[#173D2C] text-xs font-semibold text-center border border-[#E5DEC9]">
                {reviewSubmitMessage}
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#173D2C] block mb-1">
                    Rating
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewReviewRating(star)}
                        className={`text-2xl cursor-pointer ${star <= newReviewRating ? "text-[#B89453]" : "text-[#DDD2BF]"}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#173D2C] block mb-1">
                    Headline / Title (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Exceptionally fresh and crunchy kernels"
                    value={newReviewTitle}
                    onChange={(e) => setNewReviewTitle(e.target.value)}
                    className="w-full text-xs px-3.5 py-2 bg-[#FAF7F0] border border-[#E5DEC9] rounded-lg focus:outline-none focus:border-[#173D2C] text-[#242824]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#173D2C] block mb-1">
                    Your Review
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Share details about aroma, taste, crunch, and packaging..."
                    value={newReviewText}
                    onChange={(e) => setNewReviewText(e.target.value)}
                    className="w-full text-xs px-3.5 py-2 bg-[#FAF7F0] border border-[#E5DEC9] rounded-lg focus:outline-none focus:border-[#173D2C] text-[#242824]"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsReviewModalOpen(false)}
                    className="px-4 py-2 border border-[#E5DEC9] text-[#4A4E46] rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReview || !newReviewText.trim()}
                    className="px-5 py-2 bg-[#173D2C] hover:bg-[#102C21] text-[#FAF7F0] rounded-xl text-xs font-semibold disabled:opacity-40 cursor-pointer border border-[#B89453]/35"
                  >
                    {isSubmittingReview ? "Submitting..." : "Submit Review"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
