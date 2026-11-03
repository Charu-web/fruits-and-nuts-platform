"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Heart,
  ShoppingBag,
  Trash2,
  Package,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Check,
  RotateCcw,
} from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/components/cart/cart-context";
import { STOREFRONT_PRODUCTS } from "@/lib/catalog/storefront-catalog";

interface WishlistProduct {
  id: string;
  variantId: string;
  productId: string;
  name: string;
  slug: string;
  sku: string;
  weightGrams: number;
  unit: string;
  packageType: string;
  primaryImageUrl: string | null;
  mrp: number;
  sellingPrice: number;
  discountPercentage: number;
  stockAvailable: number;
  stockStatus: string;
  isAvailable: boolean;
  addedAt?: string | Date;
}

export default function WishlistPage() {
  const { addItem, openDrawer } = useCart();
  const [items, setItems] = useState<WishlistProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMovingId, setIsMovingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [successNote, setSuccessNote] = useState<string | null>(null);

  const fetchWishlist = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      // 1. Check server-side authenticated wishlist first
      const res = await fetch("/api/v1/wishlist/items", { cache: "no-store" }).catch(() => null);

      if (res && res.ok) {
        setIsAuthenticated(true);
        const json = await res.json();
        const serverItems: WishlistProduct[] = Array.isArray(json.data) ? json.data : (json.data?.items || []);

        // Migrate any unauthenticated local items to server
        try {
          const localSaved = localStorage.getItem("fn_wishlist");
          if (localSaved) {
            const localList: string[] = JSON.parse(localSaved);
            if (Array.isArray(localList) && localList.length > 0) {
              const serverSlugs = new Set(serverItems.map((i) => i.slug));
              const serverVariantIds = new Set(serverItems.map((i) => i.variantId));
              const unsynced = localList.filter((s) => !serverSlugs.has(s) && !serverVariantIds.has(s));

              if (unsynced.length > 0) {
                for (const slugOrId of unsynced) {
                  await fetch("/api/v1/wishlist/items", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ variantId: slugOrId, slug: slugOrId }),
                  }).catch(() => null);
                }

                // Re-fetch authoritative items after sync
                const reRes = await fetch("/api/v1/wishlist/items", { cache: "no-store" });
                if (reRes.ok) {
                  const reJson = await reRes.json();
                  const updatedList: WishlistProduct[] = Array.isArray(reJson.data) ? reJson.data : (reJson.data?.items || []);
                  setItems(updatedList);
                  try {
                    localStorage.setItem("fn_wishlist", JSON.stringify(updatedList.map((i) => i.slug)));
                  } catch {}
                  return;
                }
              }
            }
          }
        } catch {}

        setItems(serverItems);
        try {
          localStorage.setItem("fn_wishlist", JSON.stringify(serverItems.map((i) => i.slug)));
        } catch {}
        return;
      }

      // 2. Unauthenticated / Guest fallback mode
      setIsAuthenticated(false);
      try {
        const localSaved = localStorage.getItem("fn_wishlist");
        if (localSaved) {
          const localList: string[] = JSON.parse(localSaved);
          if (Array.isArray(localList) && localList.length > 0) {
            const matched = STOREFRONT_PRODUCTS.filter(
              (p) => localList.includes(p.slug) || localList.includes(p.id)
            ).map((p) => {
              const variant = p.variants?.[0];
              const currentPrice = variant ? variant.sellingPrice : (p.priceRange?.minSellingPrice ?? 0);
              const currentMrp = variant ? variant.mrp : (p.priceRange?.minMrp ?? currentPrice);
              const discountPercentage = currentMrp > currentPrice ? Math.round(((currentMrp - currentPrice) / currentMrp) * 100) : 0;
              return {
                id: p.id,
                variantId: variant?.id || p.id,
                productId: p.id,
                name: p.name,
                slug: p.slug,
                sku: variant?.sku || p.slug,
                weightGrams: variant?.weightGrams || 500,
                unit: variant?.unit || "g",
                packageType: variant?.packageType || "Pouch",
                primaryImageUrl: p.primaryImage?.imageUrl || "/images/products/royal-afghan-figs.jpg",
                mrp: currentMrp,
                sellingPrice: currentPrice,
                discountPercentage,
                stockAvailable: 50,
                stockStatus: p.stockStatus || "IN_STOCK",
                isAvailable: p.stockStatus !== "OUT_OF_STOCK",
              };
            });
            setItems(matched);
            return;
          }
        }
        setItems([]);
      } catch {
        setItems([]);
      }
    } catch (err: any) {
      console.error("Failed to load wishlist:", err);
      setErrorMessage("Unable to retrieve saved items. Please check your connection and retry.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();

    const handleSync = () => {
      fetchWishlist();
    };
    window.addEventListener("wishlist-updated", handleSync);
    return () => window.removeEventListener("wishlist-updated", handleSync);
  }, []);

  const handleRemove = async (item: WishlistProduct) => {
    try {
      setRemovingId(item.variantId || item.id);
      // Remove locally
      const updated = items.filter((i) => i.id !== item.id && i.variantId !== item.variantId);
      setItems(updated);

      try {
        const saved = localStorage.getItem("fn_wishlist");
        if (saved) {
          let list: string[] = JSON.parse(saved);
          list = list.filter((s) => s !== item.slug && s !== item.id && s !== item.variantId);
          localStorage.setItem("fn_wishlist", JSON.stringify(list));
        }
      } catch {}

      if (isAuthenticated) {
        await fetch(`/api/v1/wishlist/items/${item.variantId || item.id}`, {
          method: "DELETE",
        });
      }

      window.dispatchEvent(new CustomEvent("wishlist-updated"));
    } catch (err) {
      console.error("Failed to remove item", err);
    } finally {
      setRemovingId(null);
    }
  };

  const handleMoveToCart = async (item: WishlistProduct) => {
    try {
      setIsMovingId(item.variantId || item.id);
      setSuccessNote(null);

      if (isAuthenticated) {
        const res = await fetch("/api/v1/wishlist/move-to-cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ variantId: item.variantId, quantity: 1 }),
        });

        if (res.ok) {
          await handleRemove(item);
          openDrawer();
          setSuccessNote(`Moved "${item.name}" to your shopping bag.`);
          setTimeout(() => setSuccessNote(null), 4000);
          return;
        }
      }

      // Fallback client cart addition
      await addItem(item.variantId, 1);

      await handleRemove(item);
      openDrawer();
      setSuccessNote(`Moved "${item.name}" to your shopping bag.`);
      setTimeout(() => setSuccessNote(null), 4000);
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to move item to cart.");
    } finally {
      setIsMovingId(null);
    }
  };

  return (
    <div className="bg-[#FAF7F0] min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Wishlist" },
          ]}
        />

        {/* Header Block */}
        <div className="bg-white rounded-2xl border border-[#DCE5D8] p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#B89453]">
                Saved Favorites
              </span>
              <Badge variant="gold" className="text-[9px]">
                {items.length} {items.length === 1 ? "Item" : "Items"}
              </Badge>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#173D2C] mt-1">
              My Curated Wishlist
            </h1>
            <p className="text-xs text-stone-600 mt-1 max-w-xl">
              Saved reserve products. Move items to your cart when you are ready to complete your harvest order.
            </p>
          </div>

          {!isAuthenticated && !isLoading && (
            <div className="p-3.5 bg-[#FAF7F0] rounded-xl border border-[#DCE5D8] text-xs text-stone-700 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#B89453] shrink-0" />
              <span>
                <Link href="/login" className="font-bold text-[#173D2C] underline hover:text-[#B89453]">
                  Sign in
                </Link>{" "}
                to sync and save your wishlist across all devices.
              </span>
            </div>
          )}
        </div>

        {/* Notifications */}
        {successNote && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl flex items-center gap-2 shadow-xs">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successNote}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={fetchWishlist}
              className="px-3 py-1 bg-rose-600 text-white rounded-lg font-bold text-xs hover:bg-rose-700 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Wishlist Items Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white rounded-2xl border border-[#DCE5D8] p-4 h-80 animate-pulse space-y-3">
                <div className="h-44 bg-[#FAF7F0] rounded-xl" />
                <div className="h-4 bg-[#FAF7F0] rounded w-3/4" />
                <div className="h-4 bg-[#FAF7F0] rounded w-1/2" />
                <div className="h-9 bg-[#FAF7F0] rounded-xl mt-4" />
              </div>
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {items.map((item) => {
              const img = item.primaryImageUrl || "/images/products/royal-afghan-figs.jpg";
              const inStock = item.isAvailable && item.stockStatus !== "OUT_OF_STOCK";

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-[#DCE5D8] overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Image Frame */}
                    <div className="relative aspect-square bg-[#FAF7F0] overflow-hidden">
                      <Link href={`/product/${item.slug}`}>
                        <img
                          src={img}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = "/images/products/royal-afghan-figs.jpg";
                          }}
                        />
                      </Link>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemove(item)}
                        disabled={removingId === item.variantId}
                        aria-label={`Remove ${item.name} from wishlist`}
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs text-stone-500 hover:text-rose-600 hover:bg-white shadow-xs flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      {/* Discount Badge */}
                      {item.discountPercentage > 0 && (
                        <span className="absolute top-3 left-3 bg-[#B89453] text-[#173D2C] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {item.discountPercentage}% Off
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-stone-500 font-mono">
                        <span>{item.weightGrams ? `${item.weightGrams}${item.unit || "g"}` : ""}</span>
                        <span className={inStock ? "text-emerald-700 font-bold" : "text-rose-600 font-bold"}>
                          {inStock ? "In Stock" : "Out of Stock"}
                        </span>
                      </div>

                      <Link href={`/product/${item.slug}`} className="block">
                        <h3 className="font-serif font-bold text-[#173D2C] text-sm group-hover:text-[#B89453] transition-colors line-clamp-2">
                          {item.name}
                        </h3>
                      </Link>

                      {/* Price Row */}
                      <div className="flex items-baseline gap-2 pt-1">
                        <span className="text-base font-bold text-[#173D2C]">
                          {formatPrice(item.sellingPrice)}
                        </span>
                        {item.mrp > item.sellingPrice && (
                          <span className="text-xs text-stone-400 line-through">
                            {formatPrice(item.mrp)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Bottom Bar */}
                  <div className="p-4 pt-0">
                    <button
                      type="button"
                      onClick={() => handleMoveToCart(item)}
                      disabled={!inStock || isMovingId === item.variantId}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        inStock
                          ? "bg-[#173D2C] hover:bg-[#102C21] text-white shadow-xs active:scale-98"
                          : "bg-stone-200 text-stone-500 cursor-not-allowed"
                      }`}
                    >
                      {isMovingId === item.variantId ? (
                        <span>Moving to Bag...</span>
                      ) : (
                        <>
                          <ShoppingBag className="w-3.5 h-3.5 text-[#B89453]" />
                          <span>Move to Bag</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="bg-white rounded-2xl border border-[#DCE5D8] p-12 text-center space-y-4 max-w-xl mx-auto shadow-xs">
            <div className="w-16 h-16 rounded-full bg-[#FAF7F0] text-[#B89453] border border-[#DCE5D8] flex items-center justify-center mx-auto">
              <Heart className="w-8 h-8" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-[#173D2C]">
              Your Wishlist is Empty
            </h2>
            <p className="text-xs text-stone-600 leading-relaxed">
              Explore our single-estate dry fruits, Medjool dates, antioxidant berries, artisan teas, and bespoke gift boxes. Save your favorites here anytime.
            </p>
            <div className="pt-2">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#173D2C] hover:bg-[#102C21] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-xs"
              >
                <span>Explore Reserve Collection</span>
                <ArrowRight className="w-4 h-4 text-[#B89453]" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
