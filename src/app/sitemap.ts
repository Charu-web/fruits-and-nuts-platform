import type { MetadataRoute } from "next";
import db from "@/lib/db";
import { STOREFRONT_PRODUCTS, STOREFRONT_CATEGORIES } from "@/lib/catalog/storefront-catalog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.fruitsandnuts.co.in";
  const now = new Date();

  // 1. Static Core Storefront Routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/shop`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/build-your-own-box`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${baseUrl}/gifting`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${baseUrl}/taste-map`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${baseUrl}/stores`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.75 },
    { url: `${baseUrl}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.75 },
    { url: `${baseUrl}/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.75 },
    { url: `${baseUrl}/food-safety-compliance`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/privacy-policy`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: `${baseUrl}/terms-and-conditions`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: `${baseUrl}/shipping-policy`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: `${baseUrl}/refund-policy`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
  ];

  // 2. Discover Category Slugs (authoritative storefront catalog)
  const categoryMap = new Map<string, Date>();
  STOREFRONT_CATEGORIES.forEach((cat) => {
    if (cat.slug && cat.slug !== "all") {
      categoryMap.set(cat.slug, now);
    }
  });

  // 3. Discover Product Slugs (authoritative storefront catalog)
  const productMap = new Map<string, Date>();
  STOREFRONT_PRODUCTS.forEach((prod) => {
    if (prod.slug) {
      productMap.set(prod.slug, now);
    }
  });

  // 4. Safely enrich from database if active and connected
  try {
    const dbCategories = await db.category.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    });
    dbCategories.forEach((c) => {
      if (c.slug) categoryMap.set(c.slug, c.updatedAt || now);
    });

    const dbProducts = await db.product.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    });
    dbProducts.forEach((p) => {
      if (p.slug) productMap.set(p.slug, p.updatedAt || now);
    });
  } catch {
    // Database offline or unreachable; gracefully preserve storefront catalog entries
  }

  const categoryRoutes: MetadataRoute.Sitemap = Array.from(categoryMap.entries()).map(
    ([slug, lastModified]) => ({
      url: `${baseUrl}/category/${slug}`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    })
  );

  const productRoutes: MetadataRoute.Sitemap = Array.from(productMap.entries()).map(
    ([slug, lastModified]) => ({
      url: `${baseUrl}/product/${slug}`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.85,
    })
  );

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
