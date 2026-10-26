"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface VariantDetail {
  id: string;
  sku: string;
  weightGrams: number;
  unit: string;
  packageType: string;
  mrp: number;
  sellingPrice: number;
  wholesalePrice?: number | null;
  isActive: boolean;
  inventory?: {
    stockAvailable: number;
    safetyBufferThreshold: number;
  } | null;
}

interface ImageDetail {
  id: string;
  imageUrl: string;
  altText: string;
  isPrimary: boolean;
  sortOrder: number;
}

interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  skuBase: string;
  description: string;
  ingredients?: string | null;
  allergenInfo?: string | null;
  storageInstructions?: string | null;
  shelfLifeMonths?: number | null;
  hsnCode?: string | null;
  gstPercentage: number;
  isActive: boolean;
  isFeatured: boolean;
  isByobEligible: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  categoryId: number;
  subcategoryId?: number | null;
  category: { id: number; name: string; slug: string };
  subcategory?: { id: number; name: string; slug: string } | null;
  variants: VariantDetail[];
  images: ImageDetail[];
}

export default function AdminProductEditorPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id as string;

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Master Edit Form State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [skuBase, setSkuBase] = useState("");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [allergenInfo, setAllergenInfo] = useState("");
  const [storageInstructions, setStorageInstructions] = useState("");
  const [shelfLifeMonths, setShelfLifeMonths] = useState<number>(9);
  const [hsnCode, setHsnCode] = useState("");
  const [gstPercentage, setGstPercentage] = useState<number>(5.0);
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isByobEligible, setIsByobEligible] = useState(false);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");

  // Modal State for Variant Creation/Editing
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<VariantDetail | null>(null);
  const [variantSku, setVariantSku] = useState("");
  const [variantWeight, setVariantWeight] = useState(250);
  const [variantMrp, setVariantMrp] = useState(599);
  const [variantSellingPrice, setVariantSellingPrice] = useState(499);
  const [variantPackageType, setPackageType] = useState("STAND_UP_POUCH");
  const [variantInitialStock, setVariantInitialStock] = useState(50);
  const [variantSafetyBuffer, setVariantSafetyBuffer] = useState(10);
  const [variantIsActive, setVariantIsActive] = useState(true);

  // Modal State for Image Upload
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newImageAlt, setNewImageAlt] = useState("");
  const [newImageIsPrimary, setNewImageIsPrimary] = useState(false);

  const fetchProduct = async () => {
    if (!productId) return;
    try {
      setIsLoading(true);
      const res = await fetch(`/api/v1/admin/products/${productId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const p = json.data;
          setProduct(p);
          setName(p.name || "");
          setSlug(p.slug || "");
          setSkuBase(p.skuBase || "");
          setDescription(p.description || "");
          setIngredients(p.ingredients || "");
          setAllergenInfo(p.allergenInfo || "");
          setStorageInstructions(p.storageInstructions || "");
          setShelfLifeMonths(p.shelfLifeMonths || 9);
          setHsnCode(p.hsnCode || "");
          setGstPercentage(p.gstPercentage || 5.0);
          setIsActive(p.isActive ?? true);
          setIsFeatured(p.isFeatured ?? false);
          setIsByobEligible(p.isByobEligible ?? false);
          setMetaTitle(p.metaTitle || "");
          setMetaDescription(p.metaDescription || "");
        }
      }
    } catch (err) {
      console.error("Failed to load product", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const handleSaveMasterProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMessage(null);
    setIsSaving(true);

    try {
      const res = await fetch(`/api/v1/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          skuBase: skuBase.trim(),
          description: description.trim(),
          ingredients: ingredients.trim() || null,
          allergenInfo: allergenInfo.trim() || null,
          storageInstructions: storageInstructions.trim() || null,
          shelfLifeMonths: Number(shelfLifeMonths),
          hsnCode: hsnCode.trim() || null,
          gstPercentage: Number(gstPercentage),
          isActive,
          isFeatured,
          isByobEligible,
          metaTitle: metaTitle.trim() || null,
          metaDescription: metaDescription.trim() || null,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setFeedbackMessage({ text: "Master product updated successfully.", isError: false });
        await fetchProduct();
      } else {
        setFeedbackMessage({ text: json.error?.message || "Failed to update product.", isError: true });
      }
    } catch {
      setFeedbackMessage({ text: "Network error occurred while saving product.", isError: true });
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenAddVariant = () => {
    setEditingVariant(null);
    setVariantSku(`${skuBase}-${product?.variants?.length ? (product.variants.length + 1) * 250 : 250}G`);
    setVariantWeight(500);
    setVariantMrp(899);
    setVariantSellingPrice(799);
    setPackageType("STAND_UP_POUCH");
    setVariantInitialStock(30);
    setVariantSafetyBuffer(10);
    setVariantIsActive(true);
    setIsVariantModalOpen(true);
  };

  const handleOpenEditVariant = (v: VariantDetail) => {
    setEditingVariant(v);
    setVariantSku(v.sku);
    setVariantWeight(Number(v.weightGrams));
    setVariantMrp(Number(v.mrp));
    setVariantSellingPrice(Number(v.sellingPrice));
    setPackageType(v.packageType);
    setVariantIsActive(v.isActive);
    setIsVariantModalOpen(true);
  };

  const handleSaveVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (variantSellingPrice > variantMrp) {
      alert("Selling price cannot exceed MRP.");
      return;
    }

    try {
      if (editingVariant) {
        // Update existing variant
        const res = await fetch(`/api/v1/admin/products/${productId}/variants/${editingVariant.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sku: variantSku.trim().toUpperCase(),
            weightGrams: Number(variantWeight),
            mrp: Number(variantMrp),
            sellingPrice: Number(variantSellingPrice),
            packageType: variantPackageType,
            isActive: variantIsActive,
          }),
        });
        const json = await res.json();
        if (res.ok && json.success) {
          setIsVariantModalOpen(false);
          await fetchProduct();
        } else {
          alert(json.error?.message || "Failed to update variant.");
        }
      } else {
        // Create new variant
        const res = await fetch(`/api/v1/admin/products/${productId}/variants`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sku: variantSku.trim().toUpperCase(),
            weightGrams: Number(variantWeight),
            unit: "GRAMS",
            packageType: variantPackageType,
            mrp: Number(variantMrp),
            sellingPrice: Number(variantSellingPrice),
            isActive: variantIsActive,
            initialStock: Number(variantInitialStock),
            safetyBufferThreshold: Number(variantSafetyBuffer),
          }),
        });
        const json = await res.json();
        if (res.ok && json.success) {
          setIsVariantModalOpen(false);
          await fetchProduct();
        } else {
          alert(json.error?.message || "Failed to create variant.");
        }
      }
    } catch {
      alert("Network error saving variant.");
    }
  };

  const handleAddImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImageUrl.trim()) return;

    try {
      const res = await fetch(`/api/v1/admin/products/${productId}/images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storageKey: `products/${slug}/${Date.now()}.jpg`,
          imageUrl: newImageUrl.trim(),
          altText: newImageAlt.trim() || name,
          sortOrder: product?.images?.length || 0,
          isPrimary: newImageIsPrimary || (product?.images?.length === 0),
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setIsImageModalOpen(false);
        setNewImageUrl("");
        setNewImageAlt("");
        await fetchProduct();
      } else {
        alert(json.error?.message || "Failed to add image.");
      }
    } catch {
      alert("Error adding product image.");
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm("Are you sure you want to remove this image?")) return;
    try {
      const res = await fetch(`/api/v1/admin/products/${productId}/images/${imageId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchProduct();
      }
    } catch {
      alert("Failed to delete image.");
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-stone-400 space-y-3">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs">Loading product record...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-12 bg-white rounded-2xl border border-stone-200 text-center space-y-3">
        <h3 className="font-serif font-bold text-stone-900 text-lg">Product Not Found</h3>
        <p className="text-xs text-stone-500">The requested product ID does not exist in the catalog.</p>
        <Link
          href="/admin/products"
          className="inline-block px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold"
        >
          Return to Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-stone-200 pb-4">
        <div>
          <nav className="text-xs text-stone-400 mb-1 flex items-center gap-1.5 font-medium">
            <Link href="/admin/products" className="hover:text-stone-900 transition-colors">
              Products
            </Link>
            <span>/</span>
            <span className="text-stone-700 truncate max-w-xs">{product.name}</span>
          </nav>
          <h1 className="font-serif text-2xl font-bold text-stone-900">
            Edit: {product.name}
          </h1>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/product/${product.slug}`}
            target="_blank"
            className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl flex items-center gap-1"
          >
            <span>👁️</span> View Live
          </Link>
        </div>
      </div>

      {feedbackMessage && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
            feedbackMessage.isError
              ? "bg-rose-50 border border-rose-200 text-rose-800"
              : "bg-emerald-50 border border-emerald-200 text-emerald-800"
          }`}
        >
          <span>{feedbackMessage.isError ? "⚠️" : "✓"}</span>
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* 1. MASTER PRODUCT INFORMATION FORM */}
      <form onSubmit={handleSaveMasterProduct} className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-xs space-y-4">
        <h3 className="font-serif font-bold text-stone-900 text-base border-b border-stone-100 pb-2">
          1. Master Product Specifications
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
              Product Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
              URL Slug *
            </label>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full text-xs font-mono px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl"
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
              value={skuBase}
              onChange={(e) => setSkuBase(e.target.value.toUpperCase())}
              className="w-full text-xs font-mono px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
              Category
            </label>
            <input
              type="text"
              disabled
              value={product.category?.name || "—"}
              className="w-full text-xs px-3.5 py-2.5 bg-stone-100 border border-stone-200 rounded-xl text-stone-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
              GST Percentage (%)
            </label>
            <input
              type="number"
              value={gstPercentage}
              onChange={(e) => setGstPercentage(Number(e.target.value))}
              className="w-full text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
            Description
          </label>
          <textarea
            rows={4}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl"
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
            <span>Active on Storefront</span>
          </label>

          <label className="flex items-center gap-2 text-xs font-bold text-stone-700 cursor-pointer">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="rounded text-amber-500 focus:ring-amber-500"
            />
            <span>Featured on Homepage</span>
          </label>

          <label className="flex items-center gap-2 text-xs font-bold text-stone-700 cursor-pointer">
            <input
              type="checkbox"
              checked={isByobEligible}
              onChange={(e) => setIsByobEligible(e.target.checked)}
              className="rounded text-amber-500 focus:ring-amber-500"
            />
            <span>BYOB Eligible</span>
          </label>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl shadow transition-all disabled:opacity-50"
          >
            {isSaving ? "Saving Master Specs..." : "Save Master Specifications"}
          </button>
        </div>
      </form>

      {/* 2. PRODUCT VARIANTS SECTION */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-xs space-y-4">
        <div className="flex justify-between items-center border-b border-stone-100 pb-3">
          <div>
            <h3 className="font-serif font-bold text-stone-900 text-base">2. Product Package Variants</h3>
            <p className="text-xs text-stone-500">Weight options, prices, and warehouse availability</p>
          </div>
          <button
            type="button"
            onClick={handleOpenAddVariant}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-bold rounded-xl flex items-center gap-1"
          >
            <span>+</span> Add Variant
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-stone-400 font-bold uppercase tracking-wider bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="p-3">SKU</th>
                <th className="p-3">Weight</th>
                <th className="p-3">Package</th>
                <th className="p-3">MRP</th>
                <th className="p-3">Selling Price</th>
                <th className="p-3">Stock Units</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {product.variants?.map((v) => (
                <tr key={v.id} className="hover:bg-stone-50/80 transition-colors">
                  <td className="p-3 font-mono font-bold text-stone-800">{v.sku}</td>
                  <td className="p-3 font-semibold text-stone-900">{v.weightGrams}g</td>
                  <td className="p-3 text-stone-600">{v.packageType}</td>
                  <td className="p-3 text-stone-400 line-through">₹{v.mrp}</td>
                  <td className="p-3 font-bold text-stone-900">₹{v.sellingPrice}</td>
                  <td className="p-3 font-medium text-stone-800">
                    {v.inventory?.stockAvailable ?? 0} units
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        v.isActive ? "bg-emerald-100 text-emerald-800" : "bg-stone-100 text-stone-600"
                      }`}
                    >
                      {v.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleOpenEditVariant(v)}
                      className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-lg"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. PRODUCT IMAGES GALLERY */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-xs space-y-4">
        <div className="flex justify-between items-center border-b border-stone-100 pb-3">
          <div>
            <h3 className="font-serif font-bold text-stone-900 text-base">3. Media & Image Gallery</h3>
            <p className="text-xs text-stone-500">High-resolution photography and primary storefront image</p>
          </div>
          <button
            type="button"
            onClick={() => setIsImageModalOpen(true)}
            className="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl flex items-center gap-1"
          >
            <span>+</span> Add Media URL
          </button>
        </div>

        {product.images?.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {product.images.map((img) => (
              <div
                key={img.id}
                className="relative bg-stone-50 rounded-xl border border-stone-200 p-2 flex flex-col justify-between group"
              >
                <div className="aspect-square bg-stone-100 rounded-lg overflow-hidden relative mb-2">
                  <img src={img.imageUrl} alt={img.altText} className="w-full h-full object-cover" />
                  {img.isPrimary && (
                    <span className="absolute top-2 left-2 bg-amber-500 text-stone-950 font-bold text-[10px] px-2 py-0.5 rounded shadow">
                      Primary
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-stone-600 truncate block">{img.altText}</span>
                <div className="flex justify-between items-center pt-2 border-t border-stone-100 mt-2">
                  <button
                    type="button"
                    onClick={() => handleDeleteImage(img.id)}
                    className="text-[10px] text-rose-600 font-bold hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-stone-400 text-xs border border-dashed border-stone-200 rounded-xl">
            No gallery images attached yet. Add media URLs to showcase on the PDP.
          </div>
        )}
      </div>

      {/* VARIANT MODAL */}
      {isVariantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs" onClick={() => setIsVariantModalOpen(false)} />
          <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl z-10 space-y-4">
            <h4 className="font-serif font-bold text-stone-900 text-lg border-b border-stone-100 pb-2">
              {editingVariant ? "Edit Package Variant" : "Create New Package Variant"}
            </h4>

            <form onSubmit={handleSaveVariant} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                    value={variantWeight}
                    onChange={(e) => setVariantWeight(Number(e.target.value))}
                    className="w-full text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
                    MRP (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={variantMrp}
                    onChange={(e) => setVariantMrp(Number(e.target.value))}
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
                    value={variantSellingPrice}
                    onChange={(e) => setVariantSellingPrice(Number(e.target.value))}
                    className="w-full text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                  />
                </div>
              </div>

              {!editingVariant && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
                      Initial Warehouse Stock
                    </label>
                    <input
                      type="number"
                      required
                      value={variantInitialStock}
                      onChange={(e) => setVariantInitialStock(Number(e.target.value))}
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
                      value={variantSafetyBuffer}
                      onChange={(e) => setVariantSafetyBuffer(Number(e.target.value))}
                      className="w-full text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                    />
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsVariantModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 text-stone-600 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-xl text-xs"
                >
                  Save Variant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IMAGE MODAL */}
      {isImageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs" onClick={() => setIsImageModalOpen(false)} />
          <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl z-10 space-y-4">
            <h4 className="font-serif font-bold text-stone-900 text-lg border-b border-stone-100 pb-2">
              Attach Gallery Image URL
            </h4>

            <form onSubmit={handleAddImage} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
                  Public Image URL *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
                  Alt Text
                </label>
                <input
                  type="text"
                  placeholder="e.g., Premium Pouch Packaging Angle"
                  value={newImageAlt}
                  onChange={(e) => setNewImageAlt(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                />
              </div>

              <label className="flex items-center gap-2 text-xs font-bold text-stone-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newImageIsPrimary}
                  onChange={(e) => setNewImageIsPrimary(e.target.checked)}
                  className="rounded text-amber-500"
                />
                <span>Set as Primary Showcase Image</span>
              </label>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsImageModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 text-stone-600 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl text-xs"
                >
                  Attach Image
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
