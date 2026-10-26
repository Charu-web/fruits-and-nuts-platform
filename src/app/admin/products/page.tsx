"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface AdminProductSummary {
  id: string;
  name: string;
  slug: string;
  skuBase: string;
  category: { id: number; name: string; slug: string };
  subcategory?: { id: number; name: string; slug: string } | null;
  isActive: boolean;
  isFeatured: boolean;
  isByobEligible: boolean;
  priceRange: {
    minSellingPrice: number;
    maxSellingPrice: number;
    minMrp: number;
    maxMrp: number;
    discountPercentage: number;
  };
  stockStatus: string;
  variantsCount: number;
  primaryImage?: { imageUrl: string; altText: string } | null;
  createdAt: string;
}

interface CategoryOption {
  id: number;
  name: string;
  slug: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProductSummary[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Load categories for filter dropdown
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch("/api/v1/categories");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setCategories(json.data);
          }
        }
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    }
    loadCategories();
  }, []);

  // Fetch admin products list
  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (selectedCategory) params.set("categoryId", selectedCategory);
      if (statusFilter === "ACTIVE") params.set("isActive", "true");
      if (statusFilter === "INACTIVE") params.set("isActive", "false");
      params.set("page", String(currentPage));
      params.set("limit", "15");

      const res = await fetch(`/api/v1/admin/products?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        const rawItems = Array.isArray(json.data) ? json.data : (json.data?.items || []);
        if (json.success && rawItems) {
          setProducts(rawItems);
          const total = json.meta?.total ?? json.data?.pagination?.total ?? rawItems.length;
          setTotalCount(total);
          setTotalPages(Math.max(1, Math.ceil(total / (json.meta?.limit || 15))));
        }
      }
    } catch (err) {
      console.error("Failed to fetch admin products", err);
    } finally {
      setIsLoading(false);
    }
  }, [search, selectedCategory, statusFilter, currentPage]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!window.confirm(`Are you sure you want to deactivate/delete product "${productName}"?`)) {
      return;
    }
    setDeletingId(productId);
    try {
      const res = await fetch(`/api/v1/admin/products/${productId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchProducts();
      } else {
        const err = await res.json();
        alert(err.error?.message || "Failed to delete product.");
      }
    } catch {
      alert("Error deleting product.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleProductStatus = async (productId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/v1/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      if (res.ok) {
        await fetchProducts();
      }
    } catch (err) {
      console.error("Failed to toggle product status", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-stone-200 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-amber-600">Product Management</span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-0.5">
            Catalog & Master Products
          </h1>
        </div>

        <Link
          href="/admin/products/new"
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-98 text-stone-950 text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
        >
          <span>+</span>
          <span>Create New Master Product</span>
        </Link>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-4 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex-1 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search by product name, SKU base, or slug..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="flex-1 text-xs px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-amber-500"
          />

          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-medium focus:outline-none focus:border-amber-500"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-medium focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>
        </div>

        <span className="text-xs text-stone-500 font-medium whitespace-nowrap self-end md:self-center">
          Total: <strong className="text-stone-900">{totalCount}</strong> Products
        </span>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="h-12 bg-stone-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-stone-400 font-bold uppercase tracking-wider bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="p-3.5">Product</th>
                  <th className="p-3.5">SKU Base</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Price Range</th>
                  <th className="p-3.5">Variants</th>
                  <th className="p-3.5">Stock Status</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="p-3.5 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center text-lg flex-shrink-0 overflow-hidden border border-stone-200">
                        {product.primaryImage?.imageUrl ? (
                          <img
                            src={product.primaryImage.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>🥜</span>
                        )}
                      </div>
                      <div>
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="font-bold text-stone-900 hover:text-amber-600 transition-colors block line-clamp-1"
                        >
                          {product.name}
                        </Link>
                        <span className="text-[10px] text-stone-400 font-mono">/{product.slug}</span>
                      </div>
                    </td>

                    <td className="p-3.5 font-mono font-semibold text-stone-700">{product.skuBase}</td>

                    <td className="p-3.5">
                      <span className="font-medium text-stone-800">{product.category?.name || "—"}</span>
                    </td>

                    <td className="p-3.5 font-semibold text-stone-900">
                      ₹{product.priceRange?.minSellingPrice?.toLocaleString("en-IN") || 0}
                      {product.priceRange?.maxSellingPrice > product.priceRange?.minSellingPrice && (
                        <span> - ₹{product.priceRange.maxSellingPrice.toLocaleString("en-IN")}</span>
                      )}
                    </td>

                    <td className="p-3.5 text-stone-600 font-medium">{product.variantsCount} Variants</td>

                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          product.stockStatus === "IN_STOCK"
                            ? "bg-emerald-100 text-emerald-800"
                            : product.stockStatus === "LOW_STOCK"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {product.stockStatus || "IN_STOCK"}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <button
                        type="button"
                        onClick={() => handleToggleProductStatus(product.id, product.isActive)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                          product.isActive
                            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                        }`}
                      >
                        {product.isActive ? "● Active" : "○ Inactive"}
                      </button>
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/product/${product.slug}`}
                          target="_blank"
                          className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"
                          title="View on Storefront"
                        >
                          👁️
                        </Link>
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="px-3 py-1 bg-[#173D2C] hover:bg-[#102C21] text-[#FAF7F0] font-bold rounded-lg transition-colors inline-block"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(product.id, product.name)}
                          disabled={deletingId === product.id}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg border border-rose-200 transition-colors disabled:opacity-50"
                          title="Deactivate / Delete Product"
                        >
                          {deletingId === product.id ? "..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-stone-400 text-xs space-y-2">
            <span className="text-3xl block">🔍</span>
            <p>No master products match your active search or filter criteria.</p>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-stone-200 flex justify-between items-center text-xs">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 border border-stone-200 text-stone-600 rounded-lg disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-stone-500">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 border border-stone-200 text-stone-600 rounded-lg disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
