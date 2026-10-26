"use client";

import React, { useEffect, useState, useCallback, useTransition } from "react";
import Link from "next/link";

interface SubcategoryItem {
  id: number;
  categoryId: number;
  name: string;
  slug: string;
  description?: string | null;
  displayOrder: number;
  isActive: boolean;
}

interface CategoryItem {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  displayOrder: number;
  isActive: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  subcategories: SubcategoryItem[];
  _count?: {
    products: number;
  };
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Search & Filter
  const [search, setSearch] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Record<number, boolean>>({ 1: true, 2: true });

  // Modal States
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);

  const [isSubcategoryModalOpen, setIsSubcategoryModalOpen] = useState(false);
  const [selectedParentCategoryId, setSelectedParentCategoryId] = useState<number>(1);
  const [editingSubcategory, setEditingSubcategory] = useState<SubcategoryItem | null>(null);

  // Form Fields - Category
  const [catName, setCatName] = useState("");
  const [catSlug, setCatSlug] = useState("");
  const [catDescription, setCatDescription] = useState("");
  const [catImageUrl, setCatImageUrl] = useState("");
  const [catDisplayOrder, setCatDisplayOrder] = useState<number>(1);
  const [catIsActive, setCatIsActive] = useState<boolean>(true);
  const [catMetaTitle, setCatMetaTitle] = useState("");
  const [catMetaDescription, setCatMetaDescription] = useState("");

  // Form Fields - Subcategory
  const [subName, setSubName] = useState("");
  const [subSlug, setSubSlug] = useState("");
  const [subDescription, setSubDescription] = useState("");
  const [subDisplayOrder, setSubDisplayOrder] = useState<number>(1);
  const [subIsActive, setSubIsActive] = useState<boolean>(true);

  const [isSubmitting, startSubmitting] = useTransition();

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/admin/categories");
      if (!res.ok) {
        throw new Error(`Failed to load categories (HTTP ${res.status})`);
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setCategories(data.data);
      } else {
        throw new Error(data.error?.message || "Failed to load category taxonomy");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const toggleExpand = (catId: number) => {
    setExpandedCategories((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCatName("");
    setCatSlug("");
    setCatDescription("");
    setCatImageUrl("");
    setCatDisplayOrder(categories.length + 1);
    setCatIsActive(true);
    setCatMetaTitle("");
    setCatMetaDescription("");
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatSlug(cat.slug);
    setCatDescription(cat.description || "");
    setCatImageUrl(cat.imageUrl || "");
    setCatDisplayOrder(cat.displayOrder);
    setCatIsActive(cat.isActive);
    setCatMetaTitle(cat.metaTitle || "");
    setCatMetaDescription(cat.metaDescription || "");
    setIsCategoryModalOpen(true);
  };

  const handleOpenAddSubcategory = (categoryId: number) => {
    setSelectedParentCategoryId(categoryId);
    setEditingSubcategory(null);
    setSubName("");
    setSubSlug("");
    setSubDescription("");
    setSubDisplayOrder(1);
    setSubIsActive(true);
    setIsSubcategoryModalOpen(true);
  };

  const handleOpenEditSubcategory = (catId: number, sub: SubcategoryItem) => {
    setSelectedParentCategoryId(catId);
    setEditingSubcategory(sub);
    setSubName(sub.name);
    setSubSlug(sub.slug);
    setSubDescription(sub.description || "");
    setSubDisplayOrder(sub.displayOrder);
    setSubIsActive(sub.isActive);
    setIsSubcategoryModalOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    startSubmitting(async () => {
      try {
        const payload = {
          name: catName.trim(),
          slug: catSlug.trim() || catName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          description: catDescription.trim() || null,
          imageUrl: catImageUrl.trim() || null,
          displayOrder: Number(catDisplayOrder) || 1,
          isActive: Boolean(catIsActive),
          metaTitle: catMetaTitle.trim() || null,
          metaDescription: catMetaDescription.trim() || null,
        };

        const url = editingCategory
          ? `/api/v1/admin/categories/${editingCategory.id}`
          : "/api/v1/admin/categories";
        const method = editingCategory ? "PUT" : "POST";

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (data.success) {
          setIsCategoryModalOpen(false);
          setSuccessMessage(
            editingCategory
              ? `Category "${catName}" updated successfully.`
              : `New category "${catName}" created.`
          );
          setTimeout(() => setSuccessMessage(null), 4000);
          fetchCategories();
        } else {
          alert(data.error?.message || "Failed to save category");
        }
      } catch (err: any) {
        alert(err.message || "Network error while saving category");
      }
    });
  };

  const handleSaveSubcategory = (e: React.FormEvent) => {
    e.preventDefault();
    startSubmitting(async () => {
      try {
        const payload = {
          categoryId: selectedParentCategoryId,
          name: subName.trim(),
          slug: subSlug.trim() || subName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          description: subDescription.trim() || null,
          displayOrder: Number(subDisplayOrder) || 1,
          isActive: Boolean(subIsActive),
        };

        const url = editingSubcategory
          ? `/api/v1/admin/subcategories/${editingSubcategory.id}`
          : "/api/v1/admin/subcategories";
        const method = editingSubcategory ? "PUT" : "POST";

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (data.success) {
          setIsSubcategoryModalOpen(false);
          setSuccessMessage(
            editingSubcategory
              ? `Subcategory "${subName}" updated successfully.`
              : `New subcategory "${subName}" created.`
          );
          setTimeout(() => setSuccessMessage(null), 4000);
          fetchCategories();
        } else {
          alert(data.error?.message || "Failed to save subcategory");
        }
      } catch (err: any) {
        alert(err.message || "Network error while saving subcategory");
      }
    });
  };

  const handleDeleteCategory = async (cat: CategoryItem) => {
    if (!window.confirm(`Are you sure you want to delete category "${cat.name}" and all its subcategories?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/v1/admin/categories/${cat.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage(`Category "${cat.name}" deleted.`);
        setTimeout(() => setSuccessMessage(null), 4000);
        fetchCategories();
      } else {
        alert(data.error?.message || "Failed to delete category");
      }
    } catch (err: any) {
      alert(err.message || "Network error while deleting category");
    }
  };

  // KPI Calculations
  const totalCategories = categories.length;
  const totalSubcategories = categories.reduce((sum, c) => sum + (c.subcategories?.length || 0), 0);
  const totalProducts = categories.reduce((sum, c) => sum + (c._count?.products || 0), 0);
  const activeTaxonomies = categories.filter((c) => c.isActive).length;

  const filteredCategories = categories.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.slug.toLowerCase().includes(q) ||
      c.subcategories.some((s) => s.name.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📂</span>
            <h1 className="text-2xl font-serif font-bold text-stone-900 tracking-tight">
              Category Architecture & Taxonomy Management
            </h1>
          </div>
          <p className="text-sm text-stone-500 mt-1">
            Product groupings, catalog hierarchies, display sequences, and storefront navigation structures.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleOpenAddCategory}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[#102C21] hover:bg-[#1a4434] text-white transition-colors shadow-sm"
          >
            <span>+</span> Add Root Category
          </button>
          <button
            type="button"
            onClick={() => fetchCategories()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 transition-colors"
          >
            <span>🔄</span> Refresh
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold">✓</span>
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-600 font-bold">✕</button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} className="text-amber-600 font-bold">✕</button>
        </div>
      )}

      {/* KPI Metrics Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider block">Root Categories</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-stone-900 font-mono">{totalCategories}</span>
            <span className="text-xs text-stone-400 font-medium">taxonomies</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider block">Subcategories</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-[#102C21] font-mono">{totalSubcategories}</span>
            <span className="text-xs text-stone-400 font-medium">nested groups</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider block">Mapped Products</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-[#B99A58] font-mono">{totalProducts}</span>
            <span className="text-xs text-stone-400 font-medium">SKUs cataloged</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider block">Active Status</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-emerald-700 font-mono">{activeTaxonomies}</span>
            <span className="text-xs text-emerald-600 font-medium">
              ({totalCategories > 0 ? Math.round((activeTaxonomies / totalCategories) * 100) : 0}%)
            </span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
        <div className="relative">
          <span className="absolute left-3 top-2.5 text-stone-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search categories or nested subcategories by name or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-emerald-700 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Category List & Subcategory Accordion */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-stone-400 text-xs">
            <div className="w-7 h-7 border-2 border-emerald-800 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading category taxonomy and subcategory structures...
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="p-16 text-center text-stone-400 text-xs space-y-2">
            <span className="text-3xl block">📂</span>
            <p className="text-sm font-medium text-stone-700">No categories match your search keyword.</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-200">
            {filteredCategories.map((cat) => {
              const isExpanded = !!expandedCategories[cat.id];
              const subCount = cat.subcategories?.length || 0;

              return (
                <div key={cat.id} className="transition-colors">
                  {/* Category Root Header Row */}
                  <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-stone-50/50 hover:bg-stone-50">
                    <div className="flex items-start md:items-center gap-3">
                      <button
                        type="button"
                        onClick={() => toggleExpand(cat.id)}
                        className="w-7 h-7 rounded-lg bg-white border border-stone-200 flex items-center justify-center text-stone-600 hover:text-stone-900 transition-colors font-bold text-xs flex-shrink-0 mt-0.5 md:mt-0"
                      >
                        {isExpanded ? "▼" : "▶"}
                      </button>

                      <div className="w-7 h-7 rounded-lg bg-[#FAF7F0] border border-[#B99A58]/30 text-[#102C21] font-mono font-bold text-xs flex items-center justify-center flex-shrink-0">
                        #{cat.displayOrder}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-serif font-bold text-stone-900 text-sm">{cat.name}</span>
                          <span className="text-[11px] font-mono text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">
                            /{cat.slug}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                              cat.isActive
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-stone-100 text-stone-500 border border-stone-200"
                            }`}
                          >
                            {cat.isActive ? "Active" : "Hidden"}
                          </span>
                        </div>
                        {cat.description && (
                          <p className="text-xs text-stone-500 mt-0.5 line-clamp-1">{cat.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end md:self-center">
                      <span className="text-xs font-medium text-stone-500 bg-white border border-stone-200 px-2.5 py-1 rounded-lg">
                        {subCount} {subCount === 1 ? "subcategory" : "subcategories"}
                      </span>
                      <span className="text-xs font-semibold text-[#102C21] bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg">
                        {cat._count?.products || 0} products
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenAddSubcategory(cat.id)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200"
                        >
                          + Add Sub
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditCategory(cat)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-stone-700 bg-white hover:bg-stone-100 rounded-lg transition-colors border border-stone-200"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Subcategories Container */}
                  {isExpanded && (
                    <div className="bg-stone-100/60 p-4 pl-12 border-t border-stone-200">
                      {subCount === 0 ? (
                        <div className="text-xs text-stone-400 italic py-2">
                          No subcategories added yet. Click "+ Add Sub" to create one.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {cat.subcategories.map((sub) => (
                            <div
                              key={sub.id}
                              className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm flex flex-col justify-between space-y-2 hover:border-stone-300 transition-colors"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-mono text-stone-400">
                                      #{sub.displayOrder}
                                    </span>
                                    <span className="font-semibold text-stone-900 text-xs">{sub.name}</span>
                                  </div>
                                  <span className="text-[10px] font-mono text-stone-400 block mt-0.5">
                                    /{sub.slug}
                                  </span>
                                </div>
                                <span
                                  className={`text-[8px] font-bold px-1 py-0.2 rounded uppercase ${
                                    sub.isActive
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                      : "bg-stone-100 text-stone-500 border border-stone-200"
                                  }`}
                                >
                                  {sub.isActive ? "ACTIVE" : "INACTIVE"}
                                </span>
                              </div>

                              {sub.description && (
                                <p className="text-[11px] text-stone-500 line-clamp-2">{sub.description}</p>
                              )}

                              <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-stone-100">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditSubcategory(cat.id, sub)}
                                  className="text-[10px] font-semibold text-stone-600 hover:text-stone-900 hover:underline"
                                >
                                  Edit Subcategory
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Root Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-stone-200">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <h3 className="font-serif font-bold text-stone-900 text-sm">
                {editingCategory ? `Edit Category: ${editingCategory.name}` : "Create New Root Category"}
              </h3>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-5 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => {
                    setCatName(e.target.value);
                    if (!editingCategory) {
                      setCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
                    }
                  }}
                  placeholder="e.g. Kashmiri Specialties"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-emerald-700 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                  URL Slug * (Lowercase alphanumeric with hyphens)
                </label>
                <input
                  type="text"
                  required
                  value={catSlug}
                  onChange={(e) => setCatSlug(e.target.value)}
                  placeholder="e.g. kashmiri-specialties"
                  className="w-full px-3 py-2 font-mono bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-emerald-700 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={catDescription}
                  onChange={(e) => setCatDescription(e.target.value)}
                  placeholder="Editorial description displayed on storefront and category banner..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-emerald-700 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                    Display Sequence Order
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={catDisplayOrder}
                    onChange={(e) => setCatDisplayOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={catIsActive}
                      onChange={(e) => setCatIsActive(e.target.checked)}
                      className="rounded text-emerald-800 focus:ring-emerald-700 h-4 w-4"
                    />
                    <span className="text-xs font-semibold text-stone-800">Publish on Storefront</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                  SEO Meta Title
                </label>
                <input
                  type="text"
                  value={catMetaTitle}
                  onChange={(e) => setCatMetaTitle(e.target.value)}
                  placeholder="e.g. Pure Kashmiri Saffron & Gourmet Specialties | M/S Fruits & Nuts"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-emerald-700 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                  SEO Meta Description
                </label>
                <input
                  type="text"
                  value={catMetaDescription}
                  onChange={(e) => setCatMetaDescription(e.target.value)}
                  placeholder="Meta description for search engine rich snippets..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-emerald-700 focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-stone-100 text-stone-700 hover:bg-stone-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#102C21] hover:bg-[#1a4434] text-white transition-colors"
                >
                  {isSubmitting ? "Saving..." : editingCategory ? "Update Category" : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subcategory Modal */}
      {isSubcategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full flex flex-col shadow-2xl overflow-hidden border border-stone-200">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <h3 className="font-serif font-bold text-stone-900 text-sm">
                {editingSubcategory ? `Edit Subcategory: ${editingSubcategory.name}` : "Create New Subcategory"}
              </h3>
              <button
                type="button"
                onClick={() => setIsSubcategoryModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSubcategory} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                  Subcategory Name *
                </label>
                <input
                  type="text"
                  required
                  value={subName}
                  onChange={(e) => {
                    setSubName(e.target.value);
                    if (!editingSubcategory) {
                      setSubSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
                    }
                  }}
                  placeholder="e.g. Almonds & Kernels"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-emerald-700 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                  URL Slug *
                </label>
                <input
                  type="text"
                  required
                  value={subSlug}
                  onChange={(e) => setSubSlug(e.target.value)}
                  placeholder="e.g. almonds-kernels"
                  className="w-full px-3 py-2 font-mono bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-emerald-700 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={subDescription}
                  onChange={(e) => setSubDescription(e.target.value)}
                  placeholder="Subcategory description..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-emerald-700 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={subDisplayOrder}
                    onChange={(e) => setSubDisplayOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={subIsActive}
                      onChange={(e) => setSubIsActive(e.target.checked)}
                      className="rounded text-emerald-800 focus:ring-emerald-700 h-4 w-4"
                    />
                    <span className="text-xs font-semibold text-stone-800">Active</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsSubcategoryModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-stone-100 text-stone-700 hover:bg-stone-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#102C21] hover:bg-[#1a4434] text-white transition-colors"
                >
                  {isSubmitting ? "Saving..." : editingSubcategory ? "Update Subcategory" : "Create Subcategory"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
