"use client";

import { useState, useEffect, useCallback } from "react";
import {
  STOREFRONT_PRODUCTS,
} from "@/lib/catalog/storefront-catalog";
import { ProductCardProps } from "@/components/catalog/product-card";

const STORAGE_KEY = "fn_recently_viewed_slugs_v1";
const MAX_RECENT_ITEMS = 8;

export function useRecentlyViewed(currentSlug?: string) {
  const [viewedSlugs, setViewedSlugs] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Read saved history on mount (privacy-first localStorage)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setViewedSlugs(parsed.filter((s) => typeof s === "string"));
        }
      }
    } catch {
      // In private browsing mode or storage disabled
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Record current product view if provided
  useEffect(() => {
    if (!currentSlug || !isLoaded) return;

    setViewedSlugs((prev) => {
      const next = [currentSlug, ...prev.filter((s) => s !== currentSlug)].slice(
        0,
        MAX_RECENT_ITEMS
      );
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Safe storage quota handling
      }
      return next;
    });
  }, [currentSlug, isLoaded]);

  // Clear history function
  const clearHistory = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
    setViewedSlugs([]);
  }, []);

  // Resolve slugs against verified catalogue
  const products: ProductCardProps[] = viewedSlugs
    .filter((slug) => slug !== currentSlug) // Exclude current page product
    .map((slug) => STOREFRONT_PRODUCTS.find((p) => p.slug === slug))
    .filter((p): p is (typeof STOREFRONT_PRODUCTS)[number] => Boolean(p));

  return {
    products,
    clearHistory,
    isLoaded,
    hasHistory: products.length > 0,
  };
}
