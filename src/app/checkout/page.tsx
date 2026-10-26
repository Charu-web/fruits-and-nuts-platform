"use client";

import React, { useState } from "react";
import { useCart } from "@/components/cart/cart-context";
import Link from "next/link";
import {
  Lock,
  Banknote,
  Truck,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  ShoppingBag,
  CheckCircle2,
} from "lucide-react";
import { ProductImageFrame } from "@/components/catalog/product-image-frame";
import { getProductImageUrl } from "@/lib/catalog/product-asset-registry";
import { formatPrice } from "@/lib/utils";
import { Breadcrumbs } from "@/components/ui/breadcrumb";

interface AddressForm {
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  landmark: string;
  city: string;
  state: string;
  postalCode: string;
  gstin: string;
  companyName: string;
}

export default function CheckoutPage() {
  const { cart, isCartLoading, refreshCart } = useCart();

  const [form, setForm] = useState<AddressForm>({
    recipientName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    landmark: "",
    city: "",
    state: "",
    postalCode: "",
    gstin: "",
    companyName: "",
  });

  const paymentMethod: "COD" = "COD";
  const [includeGstInvoice, setIncludeGstInvoice] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const subtotal = cart?.summary?.subtotal || 0;
  const couponDiscount = cart?.summary?.couponDiscount || cart?.summary?.discount || 0;
  const catalogueSavings = cart?.summary?.discountSavings || 0;

  // Business Config: Pan-India Express Logistics
  const freeShippingThreshold = 999;
  const isFreeShipping = subtotal >= freeShippingThreshold || subtotal === 0;
  const shippingFee = isFreeShipping ? 0 : 75;
  const codFee = 50; // Standard COD handling charge
  const giftWrapFee = cart?.summary?.giftWrapFee || 0;
  const grandTotal = Math.max(0, subtotal - couponDiscount + shippingFee + codFee + giftWrapFee);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Form validation
    if (!form.recipientName || !form.phone || !form.addressLine1 || !form.city || !form.state || !form.postalCode) {
      setErrorMessage("Please fill in all mandatory shipping address fields.");
      return;
    }

    if (form.phone.replace(/\D/g, "").length < 10) {
      setErrorMessage("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (form.postalCode.length !== 6) {
      setErrorMessage("Please enter a valid 6-digit postal code.");
      return;
    }

    if (!cart || cart.items.length === 0) {
      setErrorMessage("Your cart is empty. Add products before checking out.");
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Create COD order on server (authoritative server-side pricing & inventory hold)
      const createRes = await fetch("/api/v1/checkout/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingAddress: {
            recipientName: form.recipientName,
            phone: form.phone,
            addressLine1: form.addressLine1,
            addressLine2: form.addressLine2 || undefined,
            landmark: form.landmark || undefined,
            city: form.city,
            state: form.state,
            postalCode: form.postalCode,
            country: "India",
            gstin: includeGstInvoice ? form.gstin : undefined,
            companyName: includeGstInvoice ? form.companyName : undefined,
          },
          paymentMethod: "COD",
          giftWrapEnabled: cart?.summary?.giftWrapEnabled || false,
          giftMessage: cart?.summary?.giftMessage || undefined,
          items: items.map((i) => ({
            variantId: i.variantId,
            quantity: i.quantity,
          })),
        }),
      });

      const orderData = await createRes.json();
      if (!createRes.ok || !orderData.success) {
        throw new Error(orderData.error?.message || "Failed to place order. Please check address details and try again.");
      }

      const orderId = orderData.data?.id;
      if (!orderId) {
        throw new Error("Order confirmed but missing reference ID. Please check your account.");
      }

      // 2. Direct COD Flow: Clear cart and route straight to order confirmation
      await refreshCart();
      window.location.href = `/checkout/success/${orderId}`;
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred during checkout.");
    } finally {
      setIsProcessing(false);
    }
  };

  const items = cart?.items || [];

  if (isCartLoading && !cart) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-10 h-10 border-4 border-[#173D2C] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#5F6D65] text-sm">Preparing secure checkout portal...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-[#FAF7F0] min-h-[60vh] flex items-center justify-center py-16 px-4">
        <div className="max-w-lg w-full bg-white rounded-3xl border border-[#DCE5D8] p-8 sm:p-12 text-center space-y-6 shadow-xs">
          <div className="w-20 h-20 rounded-full bg-[#FAF7F0] border border-[#DCE5D8] flex items-center justify-center text-[#B89453] mx-auto shadow-xs">
            <ShoppingBag className="w-9 h-9" />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#173D2C]">
            No Items in Checkout
          </h1>
          <p className="text-stone-600 text-xs sm:text-sm max-w-sm mx-auto leading-relaxed">
            Your shopping bag is empty. Please select products from our catalogue to proceed with secure checkout.
          </p>
          <div className="pt-2">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#173D2C] hover:bg-[#123123] text-[#FAF7F0] font-bold rounded-xl text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer border border-[#B89453]/35"
            >
              <span>Return to Catalogue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      {/* Breadcrumb Navigation */}
      <div>
        <div className="mb-3">
          <Breadcrumbs
            items={[
              {
                label: "Cart",
                href: "/cart",
              },
              {
                label: "Express Checkout",
              },
            ]}
          />
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#173D2C]">
          Secure Express Checkout
        </h1>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT 7 COLS: ADDRESS & PAYMENT FORM */}
        <div className="lg:col-span-7 space-y-8">
          {/* 1. SHIPPING ADDRESS */}
          <div className="bg-white rounded-2xl border border-[#E5DEC9] p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center gap-3 border-b border-[#E5DEC9] pb-4">
              <span className="w-7 h-7 rounded-full bg-[#173D2C] text-[#FAF7F0] flex items-center justify-center font-bold text-xs">
                1
              </span>
              <div>
                <h3 className="font-serif text-lg font-bold text-[#173D2C]">
                  Shipping &amp; Delivery Destination
                </h3>
                <p className="text-xs text-[#5F6D65]">
                  Provide verified recipient details for pan-India express courier
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#173D2C] block mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  name="recipientName"
                  value={form.recipientName}
                  onChange={handleInputChange}
                  placeholder="e.g., Rajesh Sharma"
                  className="w-full text-xs px-3.5 py-2.5 bg-[#FAF7F0] border border-[#E5DEC9] rounded-xl focus:outline-none focus:border-[#173D2C] text-[#242824]"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#173D2C] block mb-1">
                  Mobile Number (10-digit) *
                </label>
                <input
                  type="tel"
                  required
                  name="phone"
                  value={form.phone}
                  onChange={handleInputChange}
                  placeholder="e.g., 9876543210"
                  className="w-full text-xs px-3.5 py-2.5 bg-[#FAF7F0] border border-[#E5DEC9] rounded-xl focus:outline-none focus:border-[#173D2C] text-[#242824]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#173D2C] block mb-1">
                Flat / House No. / Building / Street *
              </label>
              <input
                type="text"
                required
                name="addressLine1"
                value={form.addressLine1}
                onChange={handleInputChange}
                placeholder="e.g., Flat 402, Royal Palms Residency"
                className="w-full text-xs px-3.5 py-2.5 bg-[#FAF7F0] border border-[#E5DEC9] rounded-xl focus:outline-none focus:border-[#173D2C] text-[#242824]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#173D2C] block mb-1">
                  Area / Locality
                </label>
                <input
                  type="text"
                  name="addressLine2"
                  value={form.addressLine2}
                  onChange={handleInputChange}
                  placeholder="e.g., Sector 90"
                  className="w-full text-xs px-3.5 py-2.5 bg-[#FAF7F0] border border-[#E5DEC9] rounded-xl focus:outline-none focus:border-[#173D2C] text-[#242824]"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#173D2C] block mb-1">
                  Nearby Landmark
                </label>
                <input
                  type="text"
                  name="landmark"
                  value={form.landmark}
                  onChange={handleInputChange}
                  placeholder="e.g., Near Sapphire 90 Mall"
                  className="w-full text-xs px-3.5 py-2.5 bg-[#FAF7F0] border border-[#E5DEC9] rounded-xl focus:outline-none focus:border-[#173D2C] text-[#242824]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#173D2C] block mb-1">
                  City *
                </label>
                <input
                  type="text"
                  required
                  name="city"
                  value={form.city}
                  onChange={handleInputChange}
                  placeholder="e.g., Gurgaon"
                  className="w-full text-xs px-3.5 py-2.5 bg-[#FAF7F0] border border-[#E5DEC9] rounded-xl focus:outline-none focus:border-[#173D2C] text-[#242824]"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#173D2C] block mb-1">
                  State *
                </label>
                <input
                  type="text"
                  required
                  name="state"
                  value={form.state}
                  onChange={handleInputChange}
                  placeholder="e.g., Haryana"
                  className="w-full text-xs px-3.5 py-2.5 bg-[#FAF7F0] border border-[#E5DEC9] rounded-xl focus:outline-none focus:border-[#173D2C] text-[#242824]"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#173D2C] block mb-1">
                  PIN Code (6 digits) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  name="postalCode"
                  value={form.postalCode}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, postalCode: e.target.value.replace(/\D/g, "") }))
                  }
                  placeholder="e.g., 122505"
                  className="w-full text-xs px-3.5 py-2.5 bg-[#FAF7F0] border border-[#E5DEC9] rounded-xl focus:outline-none focus:border-[#173D2C] text-[#242824]"
                />
              </div>
            </div>

            {/* GSTIN B2B Invoice Option */}
            <div className="pt-3 border-t border-[#E5DEC9]">
              <label className="flex items-center gap-2.5 text-xs text-[#4A4E46] font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeGstInvoice}
                  onChange={(e) => setIncludeGstInvoice(e.target.checked)}
                  className="rounded accent-[#173D2C]"
                />
                <span>I have a GSTIN for Tax Input Credit (B2B Corporate Invoice)</span>
              </label>

              {includeGstInvoice && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 p-4 bg-[#FAF7F0] rounded-xl border border-[#E5DEC9]">
                  <div>
                    <label className="text-[11px] font-bold text-[#173D2C] block mb-1">
                      GSTIN Number
                    </label>
                    <input
                      type="text"
                      name="gstin"
                      value={form.gstin}
                      onChange={handleInputChange}
                      placeholder="e.g., 06AAAFN1234F1Z5"
                      className="w-full text-xs uppercase px-3 py-2 bg-white border border-[#E5DEC9] rounded-lg text-[#173D2C]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-[#173D2C] block mb-1">
                      Registered Company Name
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      value={form.companyName}
                      onChange={handleInputChange}
                      placeholder="e.g., Royal Gourmet LLP"
                      className="w-full text-xs px-3 py-2 bg-white border border-[#E5DEC9] rounded-lg text-[#173D2C]"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. PAYMENT METHOD — COD ONLY */}
          <div className="bg-white rounded-2xl border border-[#E5DEC9] p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center gap-3 border-b border-[#E5DEC9] pb-4">
              <span className="w-7 h-7 rounded-full bg-[#173D2C] text-[#FAF7F0] flex items-center justify-center font-bold text-xs">
                2
              </span>
              <div>
                <h3 className="font-serif text-lg font-bold text-[#173D2C]">
                  Payment Method
                </h3>
                <p className="text-xs text-[#5F6D65]">
                  Pay safely upon parcel inspection and delivery
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl border-2 border-[#173D2C] bg-[#FAF7F0] shadow-xs ring-1 ring-[#173D2C]/20 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#173D2C] text-[#FAF7F0] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <Banknote className="w-5 h-5 text-[#B89453]" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-[#173D2C]">
                      Cash on Delivery (COD)
                    </span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                      Available Pan-India
                    </span>
                  </div>
                  <p className="text-xs text-[#5F6D65] leading-relaxed">
                    Pay securely using cash or QR/UPI scanner directly to our logistics partner upon parcel delivery.
                  </p>
                  <p className="text-[11px] text-[#8C733E] font-medium pt-1">
                    ✓ No advance online payment required. Your order will be confirmed immediately.
                  </p>
                </div>
              </div>
              <CheckCircle2 className="w-5 h-5 text-[#173D2C] shrink-0 mt-1" />
            </div>
          </div>
        </div>

        {/* RIGHT 5 COLS: SUMMARY & PLACE ORDER BUTTON */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E5DEC9] p-6 shadow-xl sticky top-28 space-y-6">
          <h3 className="font-serif text-xl font-bold text-[#173D2C] border-b border-[#E5DEC9] pb-3">
            Review Your Order ({items.length} Items)
          </h3>

          <div className="space-y-3 max-h-60 overflow-y-auto pr-1 divide-y divide-[#E5DEC9]/80">
            {items.map((item) => (
              <div key={item.id} className="pt-3 first:pt-0 flex justify-between items-center text-xs gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-lg border border-[#E5DEC9] flex items-center justify-center shrink-0 overflow-hidden bg-[#FAF7F0]">
                    <ProductImageFrame
                      src={
                        (item as any).imageUrl ||
                        item.variant.product?.images?.[0]?.imageUrl ||
                        (item.variant.product?.slug ? getProductImageUrl(item.variant.product.slug) : null)
                      }
                      alt={item.variant.product?.name || "Harvest Item"}
                      productName={item.variant.product?.name || "Harvest Item"}
                      size="sm"
                    />
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-[#173D2C] block truncate max-w-[170px] sm:max-w-[200px]">
                      {item.variant.product?.name}
                    </span>
                    <span className="text-[#5F6D65] text-[11px] block">
                      Qty: {item.quantity} • {item.variant.weightGrams >= 1000 ? `${item.variant.weightGrams / 1000}kg` : `${item.variant.weightGrams}g`}
                    </span>
                  </div>
                </div>
                <span className="font-bold text-[#173D2C] whitespace-nowrap shrink-0">
                  {formatPrice(item.variant.sellingPrice * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-2 pt-4 border-t border-[#E5DEC9] text-xs">
            <div className="flex justify-between text-[#4A4E46]">
              <span>Subtotal</span>
              <span className="font-semibold text-[#173D2C]">{formatPrice(subtotal)}</span>
            </div>
            {couponDiscount > 0 && (
              <div className="flex justify-between text-emerald-800 font-medium">
                <span>Coupon Applied</span>
                <span>-{formatPrice(couponDiscount)}</span>
              </div>
            )}
            {catalogueSavings > 0 && couponDiscount === 0 && (
              <div className="flex justify-between text-[#8C733E] text-[11px]">
                <span>Catalogue MRP Savings</span>
                <span className="font-semibold">{formatPrice(catalogueSavings)} (Included)</span>
              </div>
            )}
            <div className="flex justify-between text-[#4A4E46]">
              <span>Cold Chain Shipping</span>
              <span className="font-semibold text-[#173D2C]">
                {shippingFee === 0 ? <span className="text-emerald-800 font-bold">FREE</span> : formatPrice(shippingFee)}
              </span>
            </div>
            <div className="flex justify-between text-[#4A4E46]">
              <span>COD Handling Charge</span>
              <span className="font-semibold text-[#173D2C]">{formatPrice(codFee)}</span>
            </div>
            {giftWrapFee > 0 && (
              <div className="flex justify-between text-[#4A4E46]">
                <span className="flex items-center gap-1">
                  <span>🎁 Luxury Gift Wrap & Box</span>
                </span>
                <span className="font-semibold text-[#173D2C]">{formatPrice(giftWrapFee)}</span>
              </div>
            )}
            {cart?.summary?.giftMessage && (
              <div className="p-3 bg-[#FAF7F0] rounded-xl border border-[#E5DEC9] text-xs text-[#3E4D45] space-y-1 mt-2">
                <span className="font-bold text-[#173D2C] text-[11px] uppercase tracking-wider block">
                  📜 Wax-Sealed Greeting Note:
                </span>
                <p className="italic text-[11px] text-[#5F6D65]">&ldquo;{cart.summary.giftMessage}&rdquo;</p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[#E5DEC9]">
            <div className="flex justify-between items-baseline mb-4">
              <span className="text-sm font-bold text-[#173D2C]">Total Payable on Delivery (COD)</span>
              <span className="text-2xl font-bold text-[#173D2C]">
                {formatPrice(grandTotal)}
              </span>
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-4 bg-[#B89453] hover:bg-[#987B3E] text-[#173D2C] font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 border border-[#B89453] inline-flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>
                {isProcessing
                  ? "Confirming COD Order..."
                  : `Place COD Order • ${formatPrice(grandTotal)}`}
              </span>
            </button>
          </div>

          <div className="p-3 bg-[#FAF7F0] rounded-xl border border-[#E5DEC9] text-center text-[11px] text-[#5F6D65] space-y-1">
            <p className="flex items-center justify-center gap-1.5 font-medium text-[#173D2C]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-800" />
              <span>100% Guaranteed Fresh Harvest • Inspect Before Paying</span>
            </p>
            <p>
              Concierge Support:{" "}
              <a href="tel:+918368301495" className="text-[#173D2C] font-bold">
                +91-8368301495
              </a>
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
