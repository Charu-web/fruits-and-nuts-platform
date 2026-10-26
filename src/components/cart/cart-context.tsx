"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getProductImageUrl } from "@/lib/catalog/product-asset-registry";
import { getProductAndVariantById } from "@/lib/catalog/storefront-catalog";

export interface CartItemData {
  id: string;
  variantId: string;
  productId: string;
  productName: string;
  productSlug: string;
  sku: string;
  weightGrams: number;
  unit: string;
  packageType: string;
  unitPrice: number;
  mrp: number;
  quantity: number;
  lineTotal: number;
  imageUrl?: string | null;
  stockAvailable?: number;
  variant: {
    id: string;
    weightGrams: number;
    sellingPrice: number;
    mrp: number;
    product?: {
      name: string;
      slug: string;
      images?: { imageUrl: string }[];
    };
  };
}

export interface CartSummaryData {
  subtotal: number;
  discount: number;
  totalMrp: number;
  discountSavings: number;
  couponDiscount: number;
  couponCode: string | null;
  shippingFee: number;
  freeShippingThreshold: number;
  giftWrapFee: number;
  giftWrapEnabled: boolean;
  giftMessage?: string | null;
  finalPayable: number;
  itemCount: number;
}

export interface CartObject {
  items: CartItemData[];
  summary: CartSummaryData;
  coupon: { code: string } | null;
}

interface CartContextType {
  items: CartItemData[];
  summary: CartSummaryData;
  cart: CartObject;
  isLoading: boolean;
  isCartLoading: boolean;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  addToCart: (variantId: string, quantity?: number) => Promise<void>;
  addItem: (variantId: string, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  updateItemQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => Promise<void>;
  toggleGiftWrap: (enabled: boolean, message?: string) => Promise<void>;
  setGiftMessage: (message: string | null) => void;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItemData[]>([]);
  const [summary, setSummary] = useState<CartSummaryData>({
    subtotal: 0,
    discount: 0,
    totalMrp: 0,
    discountSavings: 0,
    couponDiscount: 0,
    couponCode: null,
    shippingFee: 0,
    freeShippingThreshold: 999,
    giftWrapFee: 0,
    giftWrapEnabled: false,
    finalPayable: 0,
    itemCount: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);
  const toggleDrawer = () => setIsDrawerOpen((prev) => !prev);

  const updateSummaryFromItems = (
    currentItems: CartItemData[],
    couponCode: string | null = null,
    giftWrap = false,
    giftMessage: string | null = null
  ) => {
    const subtotal = currentItems.reduce((acc, i) => acc + i.lineTotal, 0);
    const totalMrp = currentItems.reduce((acc, i) => acc + i.mrp * i.quantity, 0);
    const totalItems = currentItems.reduce((acc, i) => acc + i.quantity, 0);
    const shippingFee = subtotal >= 999 || subtotal === 0 ? 0 : 75;
    const giftWrapFee = giftWrap ? 50 : 0;

    const newSummary: CartSummaryData = {
      subtotal,
      discount: 0,
      totalMrp,
      discountSavings: Math.max(0, totalMrp - subtotal),
      couponDiscount: 0,
      couponCode,
      shippingFee,
      freeShippingThreshold: 999,
      giftWrapFee,
      giftWrapEnabled: giftWrap,
      giftMessage: giftMessage || null,
      finalPayable: subtotal + shippingFee + giftWrapFee,
      itemCount: totalItems,
    };
    setItems(currentItems);
    setSummary(newSummary);
    try {
      localStorage.setItem("fn_guest_cart_items", JSON.stringify(currentItems));
      localStorage.setItem("fn_gift_wrap_enabled", JSON.stringify(giftWrap));
      if (giftMessage) {
        localStorage.setItem("fn_gift_message", giftMessage);
      } else {
        localStorage.removeItem("fn_gift_message");
      }
    } catch {}
  };

  const refreshCart = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/v1/cart");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const rawItems = json.data.items || [];
          const formattedItems: CartItemData[] = rawItems.map((item: any) => ({
            id: item.id,
            variantId: item.variantId,
            productId: item.variant?.productId || "",
            productName: item.variant?.product?.name || "Gourmet Item",
            productSlug: item.variant?.product?.slug || "",
            sku: item.variant?.sku || "",
            weightGrams: item.variant?.weightGrams ? Number(item.variant.weightGrams) : 0,
            unit: item.variant?.unit || "GRAMS",
            packageType: item.variant?.packageType || "POUCH",
            unitPrice: item.variant?.sellingPrice ? Number(item.variant.sellingPrice) : 0,
            mrp: item.variant?.mrp ? Number(item.variant.mrp) : 0,
            quantity: item.quantity,
            lineTotal: (item.variant?.sellingPrice ? Number(item.variant.sellingPrice) : 0) * item.quantity,
            imageUrl:
              (item.variant?.product?.slug ? getProductImageUrl(item.variant.product.slug) : null) ||
              item.variant?.product?.images?.[0]?.imageUrl ||
              null,
            stockAvailable: item.variant?.inventory?.stockAvailable || 50,
            variant: {
              id: item.variantId,
              weightGrams: item.variant?.weightGrams ? Number(item.variant.weightGrams) : 0,
              sellingPrice: item.variant?.sellingPrice ? Number(item.variant.sellingPrice) : 0,
              mrp: item.variant?.mrp ? Number(item.variant.mrp) : 0,
              product: item.variant?.product,
            },
          }));

          const subtotal = formattedItems.reduce((acc, i) => acc + i.lineTotal, 0);
          const totalMrp = formattedItems.reduce((acc, i) => acc + i.mrp * i.quantity, 0);
          const totalItems = formattedItems.reduce((acc, i) => acc + i.quantity, 0);
          const shippingFee = subtotal >= 999 || subtotal === 0 ? 0 : 75;

          const couponDiscount = Number(json.data.couponDiscount || 0);
          let isWrap = false;
          let storedMsg: string | null = null;
          if (typeof window !== "undefined") {
            if (formattedItems.length > 0) {
              try {
                const rawWrap = localStorage.getItem("fn_gift_wrap_enabled");
                isWrap = rawWrap ? Boolean(JSON.parse(rawWrap)) : false;
                storedMsg = localStorage.getItem("fn_gift_message");
              } catch {}
            } else {
              try {
                localStorage.removeItem("fn_gift_wrap_enabled");
                localStorage.removeItem("fn_gift_message");
              } catch {}
            }
          }
          const giftWrapFee = isWrap ? 50 : 0;

          setItems(formattedItems);
          setSummary({
            subtotal,
            discount: couponDiscount,
            totalMrp,
            discountSavings: Math.max(0, totalMrp - subtotal),
            couponDiscount,
            couponCode: json.data.couponCode || null,
            shippingFee,
            freeShippingThreshold: 999,
            giftWrapFee,
            giftWrapEnabled: isWrap,
            giftMessage: isWrap ? (storedMsg || null) : null,
            finalPayable: Math.max(0, subtotal - couponDiscount + shippingFee + giftWrapFee),
            itemCount: totalItems,
          });
          return;
        }
      }

      // Guest / offline fallback from localStorage
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("fn_guest_cart_items");
        const storedWrap = localStorage.getItem("fn_gift_wrap_enabled");
        const storedMsg = localStorage.getItem("fn_gift_message");
        const isWrap = storedWrap ? JSON.parse(storedWrap) : false;
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
              const enriched = parsed.map((item: CartItemData) => ({
                ...item,
                imageUrl:
                  (item.productSlug ? getProductImageUrl(item.productSlug) : null) ||
                  item.imageUrl ||
                  null,
              }));
              updateSummaryFromItems(enriched, null, isWrap, storedMsg);
            }
          } catch {}
        }
      }
    } catch (err) {
      console.error("Failed to load cart:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = async (variantId: string, quantity = 1) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId, quantity }),
      });
      if (res.ok) {
        await refreshCart();
        openDrawer();
        return;
      }
    } catch {
      // API call failed, handle local guest addition below
    }

    // Guest Cart Local Fallback (matches Nutraj guest shopping flow)
    const matched = getProductAndVariantById(variantId);
    if (matched) {
      const { product, variant } = matched;
      setItems((prevItems) => {
        const existingIdx = prevItems.findIndex((i) => i.variantId === variantId);
        let updatedItems: CartItemData[];
        if (existingIdx > -1) {
          updatedItems = prevItems.map((item, idx) =>
            idx === existingIdx
              ? {
                  ...item,
                  quantity: item.quantity + quantity,
                  lineTotal: (item.quantity + quantity) * item.unitPrice,
                }
              : item
          );
        } else {
          const newItem: CartItemData = {
            id: `guest-item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            variantId: variant.id,
            productId: product.id,
            productName: product.name,
            productSlug: product.slug,
            sku: variant.sku,
            weightGrams: variant.weightGrams,
            unit: variant.unit,
            packageType: "POUCH",
            unitPrice: variant.sellingPrice,
            mrp: variant.mrp,
            quantity,
            lineTotal: variant.sellingPrice * quantity,
            imageUrl: product.primaryImage?.imageUrl || getProductImageUrl(product.slug),
            stockAvailable: 50,
            variant: {
              id: variant.id,
              weightGrams: variant.weightGrams,
              sellingPrice: variant.sellingPrice,
              mrp: variant.mrp,
              product: {
                name: product.name,
                slug: product.slug,
              },
            },
          };
          updatedItems = [...prevItems, newItem];
        }
        updateSummaryFromItems(updatedItems, summary.couponCode, summary.giftWrapEnabled, summary.giftMessage);
        return updatedItems;
      });
      openDrawer();
    }
    setIsLoading(false);
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeItem(itemId);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/cart/items/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      if (res.ok) {
        await refreshCart();
        setIsLoading(false);
        return;
      }
    } catch {}

    // Guest update fallback
    setItems((prevItems) => {
      const updated = prevItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              quantity,
              lineTotal: quantity * item.unitPrice,
            }
          : item
      );
      updateSummaryFromItems(updated, summary.couponCode, summary.giftWrapEnabled, summary.giftMessage);
      return updated;
    });
    setIsLoading(false);
  };

  const removeItem = async (itemId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/cart/items/${itemId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await refreshCart();
        setIsLoading(false);
        return;
      }
    } catch {}

    // Guest remove fallback
    setItems((prevItems) => {
      const updated = prevItems.filter((item) => item.id !== itemId);
      const keepWrap = updated.length > 0 ? summary.giftWrapEnabled : false;
      const keepMsg = updated.length > 0 ? summary.giftMessage : null;
      updateSummaryFromItems(updated, summary.couponCode, keepWrap, keepMsg);
      return updated;
    });
    setIsLoading(false);
  };

  const applyCoupon = async (code: string) => {
    try {
      const res = await fetch("/api/v1/cart/coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          await refreshCart();
          return { success: true, message: `Coupon '${code}' applied successfully!` };
        }
      }
    } catch {}

    // Verified local promotional coupons
    const upper = code.trim().toUpperCase();
    if (upper === "ROYAL10" || upper === "WELCOME10") {
      const disc = Math.round(summary.subtotal * 0.1);
      setSummary((prev) => ({
        ...prev,
        couponCode: upper,
        couponDiscount: disc,
        finalPayable: Math.max(0, prev.subtotal - disc + prev.shippingFee + prev.giftWrapFee),
      }));
      return { success: true, message: `Promo Code '${upper}' applied (10% discount)!` };
    }
    return { success: false, message: "Invalid or expired coupon code." };
  };

  const removeCoupon = async () => {
    try {
      await fetch("/api/v1/cart/coupon", { method: "DELETE" });
      await refreshCart();
    } catch {}
    setSummary((prev) => ({
      ...prev,
      couponCode: null,
      couponDiscount: 0,
      finalPayable: prev.subtotal + prev.shippingFee + prev.giftWrapFee,
    }));
  };

  const toggleGiftWrap = async (enabled: boolean, message?: string) => {
    const msg = message !== undefined ? message : summary.giftMessage;
    setSummary((prev) => ({
      ...prev,
      giftWrapEnabled: enabled,
      giftWrapFee: enabled ? 50 : 0,
      giftMessage: enabled ? (msg || null) : null,
      finalPayable: prev.subtotal + (enabled ? 50 : 0) + prev.shippingFee - prev.couponDiscount,
    }));
    try {
      localStorage.setItem("fn_gift_wrap_enabled", JSON.stringify(enabled));
      if (enabled && msg) {
        localStorage.setItem("fn_gift_message", msg);
      } else if (!enabled) {
        localStorage.removeItem("fn_gift_message");
      }
    } catch {}
  };

  const setGiftMessage = (message: string | null) => {
    setSummary((prev) => ({
      ...prev,
      giftMessage: message,
    }));
    try {
      if (message) {
        localStorage.setItem("fn_gift_message", message);
      } else {
        localStorage.removeItem("fn_gift_message");
      }
    } catch {}
  };

  const cart: CartObject = {
    items,
    summary,
    coupon: summary.couponCode ? { code: summary.couponCode } : null,
  };

  return (
    <CartContext.Provider
      value={{
        items,
        summary,
        cart,
        isLoading,
        isCartLoading: isLoading,
        isDrawerOpen,
        openDrawer,
        closeDrawer,
        toggleDrawer,
        addToCart,
        addItem: addToCart,
        updateQuantity,
        updateItemQuantity: updateQuantity,
        removeItem,
        applyCoupon,
        removeCoupon,
        toggleGiftWrap,
        setGiftMessage,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
