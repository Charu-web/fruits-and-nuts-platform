"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Trash2,
  Gift,
  ArrowRight,
  ShieldCheck,
  Truck,
  Plus,
  Minus,
  MessageCircle,
} from "lucide-react";
import { useCart } from "@/components/cart/cart-context";
import {
  buildCartWhatsAppMessage,
  createWhatsAppOrderLink,
} from "@/lib/whatsapp-shopping";
import { ProductImageFrame } from "@/components/catalog/product-image-frame";
import { getProductImageUrl } from "@/lib/catalog/product-asset-registry";
import { formatPrice } from "@/lib/utils";
import { Breadcrumbs } from "@/components/ui/breadcrumb";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";

export default function DedicatedCartPage() {
  const {
    cart,
    summary,
    isCartLoading,
    updateItemQuantity,
    removeItem,
    applyCoupon,
    removeCoupon,
    toggleGiftWrap,
    setGiftMessage,
  } = useCart();

  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [whatsappError, setWhatsappError] = useState<string | null>(null);

  const subtotal = summary?.subtotal ?? cart?.summary?.subtotal ?? 0;
  const discount = summary?.couponDiscount ?? summary?.discount ?? cart?.summary?.discount ?? 0;
  const freeShippingThreshold = summary?.freeShippingThreshold ?? 999;
  const isFreeShipping = subtotal >= freeShippingThreshold;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const freeShippingProgress = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  // Business Config: ₹75 standard delivery, ₹50 gift wrap synced via CartContext
  const isGiftWrapSelected = Boolean(summary?.giftWrapEnabled ?? cart?.summary?.giftWrapEnabled);
  const giftMessage = summary?.giftMessage ?? cart?.summary?.giftMessage ?? "";
  const shippingFee = isFreeShipping || subtotal === 0 ? 0 : (summary?.shippingFee ?? 75);
  const giftWrapFee = isGiftWrapSelected ? (summary?.giftWrapFee || 50) : 0;
  const estimatedTotal = Math.max(0, subtotal - discount + shippingFee + giftWrapFee);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;

    setIsApplyingCoupon(true);
    setCouponError(null);
    try {
      await applyCoupon(couponInput.trim().toUpperCase());
      setCouponInput("");
    } catch (err: any) {
      setCouponError(err.message || "Invalid or expired coupon code.");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = async () => {
    try {
      await removeCoupon();
    } catch (err: any) {
      console.error("Failed to remove coupon", err);
    }
  };

  const handleOrderOnWhatsApp = () => {
    const currentItems = cart?.items || [];
    if (currentItems.length === 0) return;
    setWhatsappError(null);

    const origin =
      typeof window !== "undefined" && window.location?.origin
        ? window.location.origin
        : undefined;

    const message = buildCartWhatsAppMessage({
      items: currentItems.map((item) => ({
        productName: item.variant?.product?.name || item.productName || "Gourmet Dry Fruit",
        productSlug: item.variant?.product?.slug || item.productSlug || null,
        sku: item.sku || null,
        weightGrams: item.variant?.weightGrams || item.weightGrams || null,
        unit: item.unit || "GRAMS",
        packageType: item.packageType || null,
        unitPrice: item.variant?.sellingPrice || item.unitPrice || 0,
        quantity: item.quantity,
      })),
      subtotal,
      discount,
      shippingFee,
      giftWrapFee,
      giftMessage: isGiftWrapSelected && giftMessage?.trim() ? giftMessage.trim() : undefined,
      estimatedTotal,
      appBaseUrl: origin,
    });

    const linkResult = createWhatsAppOrderLink(message);
    if (!linkResult.isConfigured || !linkResult.url) {
      setWhatsappError(
        linkResult.error || "WhatsApp ordering is currently unavailable. Please proceed with standard checkout."
      );
      return;
    }

    window.open(linkResult.url, "_blank", "noopener,noreferrer");
  };

  if (isCartLoading && !cart) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-10 h-10 border-4 border-[#173D2C] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#5F6D65] text-sm">Loading your royal shopping bag...</p>
      </div>
    );
  }

  const items = cart?.items || [];

  if (items.length === 0) {
    return (
      <div className="bg-[#FAF7F0] min-h-[60vh] flex items-center justify-center py-16 px-4">
        <div className="max-w-lg w-full bg-white rounded-3xl border border-[#DCE5D8] p-8 sm:p-12 text-center space-y-6 shadow-xs">
          <div className="w-20 h-20 rounded-full bg-[#FAF7F0] border border-[#DCE5D8] flex items-center justify-center text-[#B89453] mx-auto shadow-xs">
            <ShoppingBag className="w-9 h-9" />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#173D2C]">
            Your Shopping Bag is Empty
          </h1>
          <p className="text-stone-600 text-xs sm:text-sm max-w-sm mx-auto leading-relaxed">
            Explore our seasonal single-origin harvests and artisanal hampers to fill your pantry with royal goodness.
          </p>
          <div className="pt-2">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#173D2C] hover:bg-[#123123] text-[#FAF7F0] font-bold rounded-xl text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer border border-[#B89453]/35"
            >
              <span>Explore Royal Catalogue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      {/* Page Title & Breadcrumb */}
      <div>
        <div className="mb-3">
          <Breadcrumbs
            items={[
              {
                label: "Shopping Cart",
              },
            ]}
          />
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#173D2C]">
          Your Shopping Cart ({items.length} {items.length === 1 ? "Item" : "Items"})
        </h1>
      </div>

      {/* Free Shipping Progress Indicator */}
      <div className="bg-white border border-[#E5DEC9] p-4 rounded-2xl space-y-2 shadow-xs">
        <div className="flex justify-between text-xs font-bold text-[#173D2C]">
          <span>
            {isFreeShipping ? (
              <span className="text-emerald-800">
                🎉 Congratulations! You have unlocked FREE Express Shipping!
              </span>
            ) : (
              <span>
                Add <strong className="text-[#173D2C]">{formatPrice(remainingForFreeShipping)}</strong> more to get{" "}
                <strong className="text-[#173D2C]">FREE Express Delivery</strong> (₹75 standard fee applies)
              </span>
            )}
          </span>
          <span>
            {formatPrice(subtotal)} / {formatPrice(freeShippingThreshold)}
          </span>
        </div>
        <div className="w-full h-2 bg-[#FAF7F0] rounded-full overflow-hidden border border-[#E5DEC9]">
          <div
            className="h-full bg-[#173D2C] transition-all duration-500 rounded-full"
            style={{ width: `${freeShippingProgress}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT 8 COLS: CART LINE ITEMS TABLE */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-[#E5DEC9] p-6 shadow-xs space-y-6">
          <div className="divide-y divide-[#E5DEC9]/80">
            {items.map((item) => (
              <div
                key={item.id}
                className="py-5 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl border border-[#E5DEC9] flex items-center justify-center shrink-0 overflow-hidden bg-[#FAF7F0]">
                    <ProductImageFrame
                      src={
                        (item as any).imageUrl ||
                        item.variant.product?.images?.[0]?.imageUrl ||
                        (item.variant.product?.slug ? getProductImageUrl(item.variant.product.slug) : null)
                      }
                      alt={item.variant.product?.name || "Gourmet Dry Fruit"}
                      productName={item.variant.product?.name || "Gourmet Dry Fruit"}
                      size="sm"
                    />
                  </div>
                  <div>
                    <Link
                      href={`/product/${item.variant.product?.slug || ""}`}
                      className="font-serif font-bold text-base text-[#173D2C] hover:text-[#B89453] transition-colors line-clamp-1"
                    >
                      {item.variant.product?.name || "Gourmet Dry Fruit"}
                    </Link>
                    <p className="text-xs text-[#5F6D65]">
                      {item.variant.weightGrams >= 1000
                        ? `${item.variant.weightGrams / 1000}kg`
                        : `${item.variant.weightGrams}g`}{" "}
                      {item.sku ? `• SKU: ${item.sku}` : ""}
                    </p>
                    <span className="text-xs font-bold text-[#173D2C] sm:hidden block mt-1">
                      {formatPrice(item.variant.sellingPrice)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                  {/* Stepper */}
                  <div className="flex items-center border border-[#E5DEC9] rounded-lg bg-[#FAF7F0]">
                    <button
                      type="button"
                      onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center text-[#173D2C] hover:bg-white rounded-l-lg font-bold text-sm cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-xs font-bold text-[#173D2C]">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center text-[#173D2C] hover:bg-white rounded-r-lg font-bold text-sm cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-right min-w-[80px]">
                    <span className="text-sm font-bold text-[#173D2C] block">
                      {formatPrice(item.variant.sellingPrice * item.quantity)}
                    </span>
                    {item.variant.mrp > item.variant.sellingPrice && (
                      <span className="text-[10px] text-[#5F6D65] line-through block">
                        {formatPrice(item.variant.mrp * item.quantity)}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    aria-label="Remove item"
                    className="p-1.5 text-[#5F6D65] hover:text-rose-700 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Gift Wrap Addon */}
          <div className="pt-4 border-t border-[#E5DEC9] bg-[#FAF7F0] p-4 rounded-xl border border-[#E5DEC9] space-y-3">
            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isGiftWrapSelected}
                  onChange={(e) => toggleGiftWrap(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#173D2C]"
                />
                <div>
                  <span className="text-xs font-bold text-[#173D2C] flex items-center gap-1.5">
                    <Gift className="w-3.5 h-3.5 text-[#B89453]" />
                    <span>Add Bespoke Gift Packaging (₹50)</span>
                  </span>
                  <span className="text-[11px] text-[#5F6D65] block mt-0.5">
                    Gold ribbon, personalized calligraphy gift card, and royal seal casket packaging.
                  </span>
                </div>
              </div>
            </label>

            {isGiftWrapSelected && (
              <div className="pt-2 border-t border-[#E5DEC9]/70 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="cart-gift-message" className="text-[11px] font-bold text-[#173D2C]">
                    📜 Personalized Greeting Note (Optional)
                  </label>
                  {giftMessage && (
                    <button
                      type="button"
                      onClick={() => setGiftMessage(null)}
                      className="text-[10px] text-rose-700 hover:underline font-medium cursor-pointer"
                    >
                      Clear Note
                    </button>
                  )}
                </div>
                <input
                  id="cart-gift-message"
                  type="text"
                  maxLength={200}
                  placeholder="Write a warm note for your recipient..."
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value || null)}
                  className="w-full text-xs px-3 py-2 bg-white border border-[#E5DEC9] rounded-lg focus:outline-none focus:border-[#173D2C] text-[#173D2C]"
                />
              </div>
            )}
          </div>
        </div>

        {/* RIGHT 4 COLS: ORDER SUMMARY CARD */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-[#E5DEC9] p-6 shadow-xs space-y-6">
          <h2 className="font-serif text-xl font-bold text-[#173D2C] pb-3 border-b border-[#E5DEC9]">
            Order Financial Summary
          </h2>

          {/* Coupon Code Section */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[#173D2C] block">
              Promotional Coupon
            </label>
            {Boolean(cart?.coupon?.code || cart?.summary?.couponCode) ? (
              <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div>
                  <span className="text-xs font-bold text-emerald-800 block">
                    {cart?.coupon?.code || cart?.summary?.couponCode}
                  </span>
                  <span className="text-[11px] text-emerald-700">Coupon applied successfully</span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="text-xs text-rose-700 hover:underline font-semibold cursor-pointer"
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. ROYAL10"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  className="flex-1 text-xs uppercase px-3 py-2 bg-[#FAF7F0] border border-[#E5DEC9] rounded-lg focus:outline-none focus:border-[#173D2C] text-[#242824]"
                />
                <button
                  type="submit"
                  disabled={isApplyingCoupon || !couponInput.trim()}
                  className="px-4 py-2 bg-[#173D2D] hover:bg-[#102C21] text-[#FAF7F0] text-xs font-bold uppercase tracking-wider rounded-lg disabled:opacity-40 transition-all cursor-pointer"
                >
                  {isApplyingCoupon ? "..." : "Apply"}
                </button>
              </form>
            )}
            {couponError && <p className="text-xs text-rose-700 mt-1">{couponError}</p>}
          </div>

          {/* Line Totals */}
          <div className="space-y-3 pt-3 border-t border-[#E5DEC9] text-xs">
            <div className="flex justify-between text-[#4A4E46]">
              <span>Cart Subtotal</span>
              <span className="font-bold text-[#173D2C]">{formatPrice(subtotal)}</span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-emerald-800 font-medium">
                <span>Coupon Discount</span>
                <span>-{formatPrice(discount)}</span>
              </div>
            )}

            <div className="flex justify-between text-[#4A4E46]">
              <span>Standard Courier Delivery</span>
              <span className="font-bold text-[#173D2C]">
                {isFreeShipping ? <span className="text-emerald-800">FREE</span> : formatPrice(shippingFee)}
              </span>
            </div>

            {isGiftWrapSelected && (
              <div className="flex justify-between text-[#4A4E46]">
                <span>Gift Packaging Addon</span>
                <span className="font-bold text-[#173D2C]">{formatPrice(giftWrapFee)}</span>
              </div>
            )}

            <div className="pt-3 border-t border-[#E5DEC9] flex justify-between items-baseline">
              <span className="text-sm font-bold text-[#173D2C]">Estimated Total</span>
              <span className="text-2xl font-bold text-[#173D2C]">
                {formatPrice(estimatedTotal)}
              </span>
            </div>
            <p className="text-[10px] text-[#5F6D65] text-right">Inclusive of all taxes &amp; GST invoices</p>
          </div>

          {/* Checkout CTA */}
          <Link
            href="/checkout"
            className="w-full py-4 bg-[#B89453] hover:bg-[#987B3E] text-[#173D2C] font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all text-center block cursor-pointer border border-[#B89453]"
          >
            Proceed to Secure Checkout &rarr;
          </Link>

          {/* Shop on WhatsApp Option */}
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={handleOrderOnWhatsApp}
              className="w-full py-3.5 px-4 bg-[#FAF7F0] hover:bg-[#173D2C] text-[#173D2C] hover:text-[#FAF7F0] font-bold text-xs uppercase tracking-wider rounded-xl border-2 border-[#173D2C] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              <WhatsAppIcon className="w-4 h-4 text-[#1E7E34] shrink-0" />
              <span>Shop on WhatsApp</span>
            </button>
            <p className="text-[11px] text-[#5F6D65] text-center leading-relaxed">
              Your cart items will be pre-filled in WhatsApp and confirmed by the Fruits &amp; Nuts team.
            </p>
            {whatsappError && (
              <p role="alert" className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2 text-center">
                {whatsappError}
              </p>
            )}
          </div>

          <div className="text-center text-[11px] text-[#5F6D65] space-y-1">
            <p>🔒 256-Bit SSL Encrypted Checkout</p>
            <p>₹75 Delivery across India • Free above ₹999</p>
          </div>
        </div>
      </div>
    </div>
  );
}
