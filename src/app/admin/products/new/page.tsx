"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Category {
  id: number;
  name: string;
  subcategories?: { id: number; name: string }[];
}

export default function AdminNewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [skuBase, setSkuBase] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [subcategoryId, setSubcategoryId] = useState<number | "">("");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [allergenInfo, setAllergenInfo] = useState("");
  const [storageInstructions, setStorageInstructions] = useState("");
  const [shelfLifeMonths, setShelfLifeMonths] = useState<number>(9);
  const [hsnCode, setHsnCode] = useState("0802");
  const [gstPercentage, setGstPercentage] = useState<number>(5.0);
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isByobEligible, setIsByobEligible] = useState(false);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");

  // Initial Default Variant State
  const [variantSku, setVariantSku] = useState("");
  const [weightGrams, setWeightGrams] = useState<number>(250);
  const [sellingPrice, setSellingPrice] = useState<number>(499);
  const [mrp, setMrp] = useState<number>(599);
  const [packageType, setPackageType] = useState("STAND_UP_POUCH");
  const [initialStock, setInitialStock] = useState<number>(50);
  const [safetyBufferThreshold, setSafetyBufferThreshold] = useState<number>(10);

  // Initial Primary Image URL
  const [primaryImageUrl, setPrimaryImageUrl] = useState("");
  const [primaryImageAlt, setPrimaryImageAlt] = useState("");

  // Load Categories on mount
  useEffect(() => {
    async function loadCategories() {
      try {
        setIsLoadingCategories(true);
        const res = await fetch("/api/v1/categories");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setCategories(json.data);
            if (json.data.length > 0) {
              setCategoryId(json.data[0].id);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load categories", err);
      } finally {
        setIsLoadingCategories(false);
      }
    }
    loadCategories();
  }, []);

  // Auto-generate slug and SKU base from product name
  const handleNameChange = (val: string) => {
    setName(val);
    const generatedSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setSlug(generatedSlug);

    const generatedSku = `FN-${val
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .slice(0, 12)}`;
    setSkuBase(generatedSku);
    setVariantSku(`${generatedSku}-250G`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim() || !slug.trim() || !skuBase.trim() || !categoryId || !description.trim()) {
      setErrorMessage("Please complete all mandatory product master fields.");
      return;
    }

    if (sellingPrice > mrp) {
      setErrorMessage("Variant selling price cannot exceed the Maximum Retail Price (MRP).");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: any = {
        categoryId: Number(categoryId),
        subcategoryId: subcategoryId ? Number(subcategoryId) : undefined,
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        skuBase: skuBase.trim().toUpperCase(),
        description: description.trim(),
        ingredients: ingredients.trim() || undefined,
        allergenInfo: allergenInfo.trim() || undefined,
        storageInstructions: storageInstructions.trim() || undefined,
        shelfLifeMonths: Number(shelfLifeMonths),
        hsnCode: hsnCode.trim() || undefined,
        gstPercentage: Number(gstPercentage),
        isActive,
        isFeatured,
        isByobEligible,
        metaTitle: metaTitle.trim() || undefined,
        metaDescription: metaDescription.trim() || undefined,
        variants: [
          {
            sku: variantSku.trim().toUpperCase() || `${skuBase}-250G`,
            weightGrams: Number(weightGrams),
            unit: "GRAMS",
            packageType,
            mrp: Number(mrp),
            sellingPrice: Number(sellingPrice),
            isActive: true,
            initialStock: Number(initialStock),
            safetyBufferThreshold: Number(safetyBufferThreshold),
          },
        ],
        images: primaryImageUrl.trim()
          ? [
              {
                storageKey: `products/${slug}/primary.jpg`,
                imageUrl: primaryImageUrl.trim(),
                altText: primaryImageAlt.trim() || name,
                sortOrder: 0,
                isPrimary: true,
              },
            ]
          : undefined,
      };

      const res = await fetch("/api/v1/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        router.push(`/admin/products/${json.data.id}`);
      } else {
        setErrorMessage(json.error?.message || "Failed to create master product.");
      }
    } catch {
      setErrorMessage("An unexpected network error occurred while creating product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-stone-200 pb-4">
        <div>
          <nav className="text-xs text-stone-400 mb-1 flex items-center gap-1.5 font-medium">
            <Link href="/admin/products" className="hover:text-stone-900 transition-colors">
              Products
            </Link>
            <span>/</span>
            <span className="text-stone-700">New Product</span>
          </nav>
          <h1 className="font-serif text-2xl font-bold text-stone-900">Create New Master Product</h1>
        </div>

        <Link
          href="/admin/products"
          className="px-4 py-2 border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-bold rounded-xl"
        >
          Cancel
        </Link>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
          <span>⚠️</span>
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 1. MASTER IDENTITY */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-xs space-y-4">
          <h3 className="font-serif font-bold text-stone-900 text-base border-b border-stone-100 pb-2">
            1. Master Product Identity
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
                Product Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Imperial Mamra Almonds"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
                URL Slug *
              </label>
              <input
                type="text"
                required
                placeholder="e.g., imperial-mamra-almonds"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                className="w-full text-xs font-mono px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
                SKU Base *
              </label>
              <input
                type="text"
                required
                placeholder="e.g., FN-ALM-MAMRA"
                value={skuBase}
                onChange={(e) => setSkuBase(e.target.value.toUpperCase().replace(/[^A-Z0-9-_]/g, ""))}
                className="w-full text-xs font-mono px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
                Primary Category *
              </label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(Number(e.target.value))}
                className="w-full text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-medium focus:outline-none focus:border-amber-500"
              >
                {isLoadingCategories ? (
                  <option value="">Loading categories...</option>
                ) : (
                  categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
                GST Percentage (%)
              </label>
              <select
                value={gstPercentage}
                onChange={(e) => setGstPercentage(Number(e.target.value))}
                className="w-full text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-medium focus:outline-none focus:border-amber-500"
              >
                <option value={0}>0% (Tax Exempt)</option>
                <option value={5}>5% (Standard Foodstuff GST)</option>
                <option value={12}>12% (Prepared Food / Hampers)</option>
                <option value={18}>18% (Confectionery / Gift Boxes)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
              Description & Origin Terroir *
            </label>
            <textarea
              rows={4}
              required
              placeholder="Detailed description of harvest provenance, nutritional attributes, and artisanal grading..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex flex-wrap gap-6 pt-2">
            <label className="flex items-center gap-2 text-xs font-bold text-stone-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded text-amber-500 focus:ring-amber-500"
              />
              <span>Publish Active on Storefront</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-bold text-stone-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="rounded text-amber-500 focus:ring-amber-500"
              />
              <span>Feature on Homepage Carousel</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-bold text-stone-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isByobEligible}
                onChange={(e) => setIsByobEligible(e.target.checked)}
                className="rounded text-amber-500 focus:ring-amber-500"
              />
              <span>BYOB Hamper Eligible</span>
            </label>
          </div>
        </div>

        {/* 2. INITIAL DEFAULT VARIANT & STOCK */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-xs space-y-4">
          <h3 className="font-serif font-bold text-stone-900 text-base border-b border-stone-100 pb-2">
            2. Initial Default Variant & Warehouse Stock
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
                Variant SKU *
              </label>
              <input
                type="text"
                required
                value={variantSku}
                onChange={(e) => setVariantSku(e.target.value.toUpperCase())}
                className="w-full text-xs font-mono px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
                Net Weight (Grams) *
              </label>
              <input
                type="number"
                required
                value={weightGrams}
                onChange={(e) => setWeightGrams(Number(e.target.value))}
                className="w-full text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
                Package Type
              </label>
              <select
                value={packageType}
                onChange={(e) => setPackageType(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl"
              >
                <option value="STAND_UP_POUCH">Stand-Up Zipper Pouch</option>
                <option value="GLASS_JAR">Artisanal Glass Jar</option>
                <option value="TIN_CADDY">Royal Tin Caddy</option>
                <option value="WOODEN_BOX">Handcrafted Wooden Casket</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
                MRP (₹) *
              </label>
              <input
                type="number"
                required
                value={mrp}
                onChange={(e) => setMrp(Number(e.target.value))}
                className="w-full text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
                Selling Price (₹) *
              </label>
              <input
                type="number"
                required
                value={sellingPrice}
                onChange={(e) => setSellingPrice(Number(e.target.value))}
                className="w-full text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
                Initial Stock Units
              </label>
              <input
                type="number"
                required
                value={initialStock}
                onChange={(e) => setInitialStock(Number(e.target.value))}
                className="w-full text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
                Safety Buffer Threshold
              </label>
              <input
                type="number"
                required
                value={safetyBufferThreshold}
                onChange={(e) => setSafetyBufferThreshold(Number(e.target.value))}
                className="w-full text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* 3. PRIMARY IMAGE */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-xs space-y-4">
          <h3 className="font-serif font-bold text-stone-900 text-base border-b border-stone-100 pb-2">
            3. Primary Showcase Image
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
                Image CDN / S3 URL
              </label>
              <input
                type="url"
                placeholder="https://images.fruitsandnuts.co.in/products/mamra.jpg"
                value={primaryImageUrl}
                onChange={(e) => setPrimaryImageUrl(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
                Image Alt Text
              </label>
              <input
                type="text"
                placeholder="e.g., Kashmiri Mamra Almond Kernels"
                value={primaryImageAlt}
                onChange={(e) => setPrimaryImageAlt(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Submit Action */}
        <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
          <Link
            href="/admin/products"
            className="px-6 py-3 border border-stone-200 text-stone-700 text-xs font-bold rounded-xl"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3 bg-amber-500 hover:bg-amber-600 active:scale-98 text-stone-950 font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50"
          >
            {isSubmitting ? "Creating Master Product..." : "Create Product & Open Variant Manager →"}
          </button>
        </div>
      </form>
    </div>
  );
}
