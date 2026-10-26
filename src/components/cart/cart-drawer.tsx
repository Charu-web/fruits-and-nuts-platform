"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  X,
  Plus,
  Minus,
  Trash2,
  Gift,
  ArrowRight,
  Sparkles,
  Check,
  MessageCircle,
} from "lucide-react";
import { useCart } from "./cart-context";
import { ProductImageFrame } from "@/components/catalog/product-image-frame";
import { formatPrice } from "@/lib/utils";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import {
  buildCartWhatsAppMessage,
  createWhatsAppOrderLink,
} from "@/lib/whatsapp-shopping";

export function CartDrawer() {
  const {
    items,
    summary,
    isDrawerOpen,
    closeDrawer,
    updateQuantity,
    removeItem,
    applyCoupon,
    removeCoupon,
    toggleGiftWrap,
    setGiftMessage,
  } = useCart();

  const [couponInput, setCouponInput] = useState("");
  const [couponFeedback, setCouponFeedback] = useState<{ text: string; isError: boolean } | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [whatsappError, setWhatsappError] = useState<string | null>(null);

  const handleOrderOnWhatsApp = () => {
    if (items.length === 0) return;
    setWhatsappError(null);

    const origin =
      typeof window !== "undefined" && window.location?.origin
        ? window.location.origin
        : undefined;

    const message = buildCartWhatsAppMessage({
      items: items.map((item) => ({
        productName: item.productName || item.variant?.product?.name || "Gourmet Dry Fruit",
        productSlug: item.productSlug || item.variant?.product?.slug || null,
        sku: item.sku || null,
        weightGrams: item.weightGrams || item.variant?.weightGrams || null,
        unit: item.unit || "GRAMS",
        packageType: item.packageType || null,
        unitPrice: item.unitPrice || item.variant?.sellingPrice || 0,
        quantity: item.quantity,
      })),
      subtotal: summary.subtotal,
      discount: summary.discountSavings,
      shippingFee: summary.shippingFee,
      giftWrapFee: summary.giftWrapFee,
      giftMessage: summary.giftWrapEnabled && summary.giftMessage?.trim() ? summary.giftMessage.trim() : undefined,
      estimatedTotal: summary.finalPayable,
      appBaseUrl: origin,
    });

    const linkResult = createWhatsAppOrderLink(message);
    if (!linkResult.isConfigured || !linkResult.url) {
      setWhatsappError(
        linkResult.error || "WhatsApp ordering is currently unavailable."
      );
      return;
    }

    window.open(linkResult.url, "_blank", "noopener,noreferrer");
  };

  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeDrawer();
    }
    if (isDrawerOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDrawerOpen, closeDrawer]);

  if (!isDrawerOpen) return null;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setIsApplyingCoupon(true);
    setCouponFeedback(null);
    const res = await applyCoupon(couponInput.trim().toUpperCase());
    setIsApplyingCoupon(false);
    setCouponFeedback({
      text: res.message,
      isError: !res.success,
    });
    if (res.success) {
      setCouponInput("");
    }
  };

  const freeShippingProgress = Math.min(100, (summary.subtotal / 999) * 100);
  const amountToFreeShipping = Math.max(0, 999 - summary.subtotal);

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden animate-fade-in"
      aria-labelledby="slide-over-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#173D2C]/60 backdrop-blur-xs transition-opacity"
        onClick={closeDrawer}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FAF7F0] shadow-2xl flex flex-col border-l border-[#E5DEC9]">
          {/* Header */}
          <div className="p-5 bg-[#173D2C] text-[#FAF7F0] flex items-center justify-between border-b border-[#B89453]/30">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-5 h-5 text-[#D4B776]" />
              <h2
                id="slide-over-title"
                className="text-lg font-serif tracking-wide font-semibold text-[#FAF7F0]"
              >
                Your Gourmet Bag ({summary.itemCount})
              </h2>
            </div>
            <button
              type="button"
              onClick={closeDrawer}
              aria-label="Close cart"
              className="text-white/70 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Indicator */}
          <div className="p-4 bg-white border-b border-[#E5DEC9]">
            <div className="flex justify-between text-xs font-semibold text-[#173D2C] mb-1.5">
              <span>
                {amountToFreeShipping > 0
                  ? `Add ${formatPrice(amountToFreeShipping)} more for FREE Delivery`
                  : "🎉 Unlocked FREE Delivery across India!"}
              </span>
              <span>{Math.round(freeShippingProgress)}%</span>
            </div>
            <div className="w-full h-2 bg-[#FAF7F0] rounded-full overflow-hidden border border-[#E5DEC9]">
              <div
                className="h-full bg-[#173D2C] transition-all duration-500 rounded-full"
                style={{ width: `${freeShippingProgress}%` }}
              />
            </div>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-4 divide-y divide-[#E5DEC9]">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#5F6D65]">
                <ShoppingBag className="w-12 h-12 text-[#B89453] mb-3 stroke-1" />
                <p className="font-serif text-lg font-semibold text-[#173D2C] mb-1">
                  Your cart is empty
                </p>
                <p className="text-xs mb-6 max-w-xs">
                  Explore our royal harvests of Kashmiri Mamra, Medjool Dates, and Artisanal Teas.
                </p>
                <Link
                  href="/shop"
                  onClick={closeDrawer}
                  className="px-6 py-2.5 bg-[#173D2C] text-[#FAF7F0] text-xs font-semibold rounded-xl hover:bg-[#102C21] transition-all uppercase tracking-wider cursor-pointer border border-[#B89453]/35 shadow-sm inline-flex items-center gap-1.5"
                >
                  <span>Start Shopping</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="py-3.5 flex gap-3.5 bg-white p-3 rounded-xl mb-2 border border-[#E5DEC9] shadow-xs"
                >
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-md border border-[#E5DEC9] flex items-center justify-center shrink-0 overflow-hidden bg-[#FAF7F0]">
                    <ProductImageFrame
                      src={item.imageUrl}
                      alt={item.productName}
                      productName={item.productName}
                      size="sm"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <Link
                          href={`/product/${item.productSlug}`}
                          onClick={closeDrawer}
                          className="text-xs font-semibold text-[#173D2C] hover:text-[#B89453] line-clamp-1 transition-colors"
                        >
                          {item.productName}
                        </Link>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          aria-label="Remove item"
                          className="text-[#5F6D65] hover:text-rose-700 p-0.5 cursor-pointer ml-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[11px] text-[#5F6D65] mt-0.5">
                        {item.weightGrams >= 1000 ? `${item.weightGrams / 1000}kg` : `${item.weightGrams}g`} • {item.packageType.replace("_", " ")}
                      </p>
                    </div>

                    <div className="flex justify-between items-center mt-2">
                      {/* Stepper */}
                      <div className="flex items-center border border-[#E5DEC9] bg-[#FAF7F0] rounded-lg">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          aria-label="Decrease quantity"
                          className="px-2 py-0.5 text-xs text-[#173D2C] hover:bg-white cursor-pointer font-bold rounded-l-lg"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 py-0.5 text-xs font-semibold text-[#173D2C]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          aria-label="Increase quantity"
                          className="px-2 py-0.5 text-xs text-[#173D2C] hover:bg-white cursor-pointer font-bold rounded-r-lg"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <span className="text-xs sm:text-sm font-bold text-[#173D2C]">
                          {formatPrice(item.lineTotal)}
                        </span>
                        {item.mrp > item.unitPrice && (
                          <span className="block text-[10px] text-[#5F6D65]/70 line-through">
                            {formatPrice(item.mrp * item.quantity)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout Action */}
          {items.length > 0 && (
            <div className="p-4 bg-white border-t border-[#E5DEC9] space-y-3">
              {/* Coupon Row */}
              <div>
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Discount Coupon"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    className="flex-1 text-xs px-3 py-2 border border-[#E5DEC9] rounded-lg bg-[#FAF7F0] focus:border-[#173D2C] uppercase text-[#173D2C]"
                  />
                  <button
                    type="submit"
                    disabled={isApplyingCoupon || !couponInput.trim()}
                    className="px-3.5 py-2 bg-[#173D2C] hover:bg-[#102C21] text-[#FAF7F0] text-xs font-semibold rounded-lg disabled:opacity-50 cursor-pointer"
                  >
                    {isApplyingCoupon ? "..." : "Apply"}
                  </button>
                </form>
                {couponFeedback && (
                  <p
                    role="status"
                    aria-live="polite"
                    className={`text-[11px] mt-1 ${
                      couponFeedback.isError ? "text-rose-600" : "text-emerald-700"
                    }`}
                  >
                    {couponFeedback.text}
                  </p>
                )}
                {summary.couponCode && (
                  <div className="mt-1 flex items-center justify-between text-xs text-emerald-800 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                    <span>
                      Applied: <strong>{summary.couponCode}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      aria-label="Remove applied coupon"
                      className="text-[11px] underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Gift Wrap Toggle */}
              <div className="space-y-2">
                <label className="flex items-center justify-between p-2.5 bg-[#FAF7F0] rounded-xl border border-[#E5DEC9] cursor-pointer text-xs">
                  <span className="flex items-center gap-1.5 font-medium text-[#173D2C]">
                    <Gift className="w-3.5 h-3.5 text-[#B89453]" />
                    <span>Luxury Gift Box Packaging (+₹50)</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={summary.giftWrapEnabled}
                    onChange={(e) => toggleGiftWrap(e.target.checked)}
                    className="rounded accent-[#173D2C]"
                  />
                </label>

                {summary.giftMessage && (
                  <div className="p-2.5 bg-[#FAF7F0] rounded-xl border border-[#E5DEC9] text-[11px] text-[#3E4D45]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-[#173D2C] flex items-center gap-1">
                        <span>📜 Personalized Greeting Note</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setGiftMessage(null)}
                        className="text-[10px] text-rose-600 hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                    <p className="italic text-[#5F6D65] line-clamp-2">&ldquo;{summary.giftMessage}&rdquo;</p>
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="space-y-1.5 text-xs text-[#5F6D65] pt-2 border-t border-[#E5DEC9]">
                <div className="flex justify-between">
                  <span>Cart Subtotal</span>
                  <span className="font-semibold text-[#173D2C]">
                    {formatPrice(summary.subtotal)}
                  </span>
                </div>
                {summary.discountSavings > 0 && (
                  <div className="flex justify-between text-emerald-800">
                    <span>Catalog Savings</span>
                    <span>-{formatPrice(summary.discountSavings)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping Fee</span>
                  <span>
                    {summary.shippingFee === 0 ? (
                      <strong className="text-emerald-800">FREE</strong>
                    ) : (
                      formatPrice(summary.shippingFee)
                    )}
                  </span>
                </div>
                {summary.giftWrapFee > 0 && (
                  <div className="flex justify-between">
                    <span>Gift Wrap Addon</span>
                    <span>{formatPrice(summary.giftWrapFee)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-[#173D2C] pt-1.5 border-t border-[#E5DEC9]">
                  <span>Estimated Total</span>
                  <span className="text-base text-[#173D2C]">
                    {formatPrice(summary.finalPayable)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/cart"
                    onClick={closeDrawer}
                    className="w-full py-2.5 text-center text-xs font-bold border border-[#173D2C] text-[#173D2C] rounded-xl hover:bg-[#FAF7F0] transition-colors uppercase tracking-wider cursor-pointer"
                  >
                    View Cart
                  </Link>
                  <Link
                    href="/checkout"
                    onClick={closeDrawer}
                    className="w-full py-2.5 text-center text-xs font-bold bg-[#B89453] hover:bg-[#987B3E] text-[#173D2C] rounded-xl transition-all uppercase tracking-wider shadow-sm cursor-pointer border border-[#B89453] inline-flex items-center justify-center gap-1"
                  >
                    <span>Checkout</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <button
                  type="button"
                  onClick={handleOrderOnWhatsApp}
                  className="w-full py-2.5 px-4 bg-[#FAF7F0] hover:bg-[#173D2C] text-[#173D2C] hover:text-[#FAF7F0] font-bold text-xs uppercase tracking-wider rounded-xl border border-[#173D2C] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5 text-[#1E7E34] shrink-0" />
                  <span>Shop on WhatsApp</span>
                </button>
                <p className="text-[10px] text-[#5F6D65] text-center">
                  Order will be confirmed by the Fruits &amp; Nuts team on WhatsApp.
                </p>
                {whatsappError && (
                  <p role="alert" className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-1.5 text-center">
                    {whatsappError}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
