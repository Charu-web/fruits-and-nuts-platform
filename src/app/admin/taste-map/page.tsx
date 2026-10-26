"use client";

import React, { useEffect, useState, useCallback, useTransition } from "react";
import Link from "next/link";

interface PinCoordinates {
  xPct: number;
  yPct: number;
  lat?: number;
  lng?: number;
}

interface TasteMapProduct {
  id: string;
  name: string;
  skuBase: string;
  slug: string;
}

interface TasteMapRegion {
  id: number;
  name: string;
  slug: string;
  state: string;
  pinCoordinates: PinCoordinates;
  culturalStory: string;
  verificationSource: string | null;
  bannerImageUrl: string | null;
  displayOrder: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  associations: Array<{
    product: TasteMapProduct;
  }>;
}

interface CatalogProductOption {
  id: string;
  name: string;
  skuBase: string;
}

export default function AdminTasteMapPage() {
  const [regions, setRegions] = useState<TasteMapRegion[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<CatalogProductOption[]>([]);
  const [userRole, setUserRole] = useState<string>("CUSTOMER");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Search & Filter
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PUBLISHED" | "DRAFT">("ALL");

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingRegion, setEditingRegion] = useState<TasteMapRegion | null>(null);

  // Region Form State
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formState, setFormState] = useState("Jammu & Kashmir");
  const [formXPct, setFormXPct] = useState<number>(34.2);
  const [formYPct, setFormYPct] = useState<number>(18.5);
  const [formLat, setFormLat] = useState<number>(34.08);
  const [formLng, setFormLng] = useState<number>(74.79);
  const [formStory, setFormStory] = useState("");
  const [formVerification, setFormVerification] = useState("Pending Client Verification");
  const [formBannerUrl, setFormBannerUrl] = useState("");
  const [formDisplayOrder, setFormDisplayOrder] = useState<number>(0);
  const [formIsPublished, setFormIsPublished] = useState(false);
  const [isSubmitting, startSubmitting] = useTransition();

  // Product Association Form State
  const [assocRegion, setAssocRegion] = useState<TasteMapRegion | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isSavingAssoc, startSavingAssoc] = useTransition();

  // Fetch Current User & Catalog Products
  useEffect(() => {
    async function init() {
      try {
        const [meRes, prodRes] = await Promise.all([
          fetch("/api/v1/auth/me"),
          fetch("/api/v1/admin/products?limit=100"),
        ]);
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.data?.role) {
            setUserRole(meData.data.role.name || meData.data.role);
          }
        }
        if (prodRes.ok) {
          const prodData = await prodRes.json();
          const list = prodData.data?.items || prodData.data || [];
          setCatalogProducts(
            list.map((p: any) => ({
              id: p.id,
              name: p.name,
              skuBase: p.skuBase,
            }))
          );
        }
      } catch (err) {
        console.error("Failed to initialize taste map admin context", err);
      }
    }
    init();
  }, []);

  const canMutate = ["SUPER_ADMIN", "CONTENT_MGR"].includes(userRole);

  // Fetch Regions
  const fetchRegions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/admin/taste-map");
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || "Failed to load regions");
      }
      const data = await res.json();
      setRegions(data.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch Taste Map regions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRegions();
  }, [fetchRegions]);

  // Client-side Filter
  const filteredRegions = regions.filter((r) => {
    if (statusFilter === "PUBLISHED" && !r.isPublished) return false;
    if (statusFilter === "DRAFT" && r.isPublished) return false;
    if (!search.trim()) return true;
    const query = search.toLowerCase();
    return (
      r.name.toLowerCase().includes(query) ||
      r.state.toLowerCase().includes(query) ||
      r.slug.toLowerCase().includes(query) ||
      r.culturalStory.toLowerCase().includes(query)
    );
  });

  // Open Form for Creation
  const openCreateModal = () => {
    setEditingRegion(null);
    setFormName("");
    setFormSlug("");
    setFormState("Jammu & Kashmir");
    setFormXPct(34.2);
    setFormYPct(18.5);
    setFormLat(34.08);
    setFormLng(74.79);
    setFormStory("");
    setFormVerification("Pending Client Verification");
    setFormBannerUrl("");
    setFormDisplayOrder(regions.length);
    setFormIsPublished(false);
    setIsFormModalOpen(true);
  };

  // Open Form for Editing
  const openEditModal = (region: TasteMapRegion) => {
    setEditingRegion(region);
    setFormName(region.name);
    setFormSlug(region.slug);
    setFormState(region.state);
    setFormXPct(region.pinCoordinates?.xPct ?? 34.2);
    setFormYPct(region.pinCoordinates?.yPct ?? 18.5);
    setFormLat(region.pinCoordinates?.lat ?? 34.08);
    setFormLng(region.pinCoordinates?.lng ?? 74.79);
    setFormStory(region.culturalStory || "");
    setFormVerification(region.verificationSource || "Pending Client Verification");
    setFormBannerUrl(region.bannerImageUrl || "");
    setFormDisplayOrder(region.displayOrder);
    setFormIsPublished(region.isPublished);
    setIsFormModalOpen(true);
  };

  // Auto-generate slug from name
  const handleNameChange = (val: string) => {
    setFormName(val);
    if (!editingRegion) {
      setFormSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
      );
    }
  };

  // Handle Form Submit (Create or Update)
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formSlug.trim() || !formStory.trim()) {
      setError("Please fill out all required fields (Name, Slug, Cultural Story).");
      return;
    }

    startSubmitting(async () => {
      setError(null);
      try {
        const payload = {
          name: formName.trim(),
          slug: formSlug.trim(),
          state: formState.trim(),
          pinCoordinates: {
            xPct: Number(formXPct),
            yPct: Number(formYPct),
            lat: Number(formLat),
            lng: Number(formLng),
          },
          culturalStory: formStory.trim(),
          verificationSource: formVerification.trim() || null,
          bannerImageUrl: formBannerUrl.trim() || null,
          displayOrder: Number(formDisplayOrder),
          isPublished: Boolean(formIsPublished),
        };

        let res: Response;
        if (editingRegion) {
          res = await fetch(`/api/v1/admin/taste-map/${editingRegion.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        } else {
          res = await fetch("/api/v1/admin/taste-map", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        }

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error?.message || "Failed to save region");
        }

        setSuccessMessage(
          editingRegion
            ? `Region "${formName}" updated successfully!`
            : `New region "${formName}" created successfully!`
        );
        setIsFormModalOpen(false);
        fetchRegions();
        setTimeout(() => setSuccessMessage(null), 5000);
      } catch (err: any) {
        setError(err.message || "Failed to submit region form");
      }
    });
  };

  // Fast Publish Toggle
  const handleTogglePublish = (region: TasteMapRegion) => {
    startSubmitting(async () => {
      setError(null);
      try {
        const res = await fetch(`/api/v1/admin/taste-map/${region.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isPublished: !region.isPublished }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error?.message || "Failed to toggle status");
        }

        setSuccessMessage(`Region "${region.name}" publication status updated!`);
        fetchRegions();
        setTimeout(() => setSuccessMessage(null), 5000);
      } catch (err: any) {
        setError(err.message || "Failed to toggle publish status");
      }
    });
  };

  // Open Product Association Modal
  const openProductModal = (region: TasteMapRegion) => {
    setAssocRegion(region);
    setSelectedProductIds(region.associations.map((a) => a.product.id));
    setIsProductModalOpen(true);
  };

  // Handle Product Association Sync Submit
  const handleAssocSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assocRegion) return;

    startSavingAssoc(async () => {
      setError(null);
      try {
        const res = await fetch(`/api/v1/admin/taste-map/${assocRegion.id}/products`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productIds: selectedProductIds }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error?.message || "Failed to sync products");
        }

        setSuccessMessage(`Products linked with region "${assocRegion.name}" successfully!`);
        setIsProductModalOpen(false);
        fetchRegions();
        setTimeout(() => setSuccessMessage(null), 5000);
      } catch (err: any) {
        setError(err.message || "Failed to sync product associations");
      }
    });
  };

  // Handle Delete Region
  const handleDeleteRegion = (region: TasteMapRegion) => {
    const confirmDel = window.confirm(
      `Are you sure you want to delete origin region "${region.name}"? This action is logged.`
    );
    if (!confirmDel) return;

    startSubmitting(async () => {
      setError(null);
      try {
        const res = await fetch(`/api/v1/admin/taste-map/${region.id}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error?.message || "Failed to delete region");
        }

        setSuccessMessage(`Region "${region.name}" deleted.`);
        fetchRegions();
        setTimeout(() => setSuccessMessage(null), 5000);
      } catch (err: any) {
        setError(err.message || "Failed to delete region");
      }
    });
  };

  // KPI Calculations
  const publishedCount = regions.filter((r) => r.isPublished).length;
  const draftCount = regions.filter((r) => !r.isPublished).length;
  const totalAssociatedProducts = regions.reduce((acc, curr) => acc + curr.associations.length, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
              India Taste Map & Terroir Stories
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-600/20">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Origin Terroir Engine
            </span>
          </div>
          <p className="mt-1 text-sm text-neutral-500">
            Geographical origin mapping, cultural harvest stories, FSSAI/GI verification sources, map pin positioning, and product associations.
          </p>
        </div>

        {/* Global Action Triggers */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/taste-map"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 shadow-sm"
          >
            <svg className="h-4 w-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Preview Map
          </Link>

          <button
            onClick={openCreateModal}
            disabled={!canMutate}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold shadow-sm transition ${
              canMutate
                ? "bg-amber-600 text-white hover:bg-amber-700"
                : "cursor-not-allowed bg-neutral-100 text-neutral-400"
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Origin Region
          </button>
        </div>
      </div>

      {/* Role Notice */}
      {!canMutate && (
        <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          <svg className="h-5 w-5 flex-shrink-0 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <strong>Read-Only View:</strong> Your role ({userRole}) has view-only permissions for Taste Map. Modifying regions requires <code className="font-mono font-semibold">SUPER_ADMIN</code> or <code className="font-mono font-semibold">CONTENT_MGR</code> authorization.
          </div>
        </div>
      )}

      {/* Success Notification */}
      {successMessage && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <div className="flex items-center gap-2 font-medium">
            <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {successMessage}
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <div className="flex items-center gap-2 font-medium">
            <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {error}
          </div>
          <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* KPI Stats Tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Total Origin Regions</span>
          <p className="mt-3 text-2xl font-bold text-neutral-900">{regions.length}</p>
          <div className="mt-2 text-xs text-neutral-500">Geographical clusters</div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Published (Live Map)</span>
          <p className="mt-3 text-2xl font-bold text-emerald-600">{publishedCount}</p>
          <div className="mt-2 text-xs text-emerald-600 font-medium">Rendered on SVG Taste Map</div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Draft / Pending</span>
          <p className="mt-3 text-2xl font-bold text-amber-600">{draftCount}</p>
          <div className="mt-2 text-xs text-neutral-500">Awaiting client terroir notes</div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Linked Products</span>
          <p className="mt-3 text-2xl font-bold text-blue-600">{totalAssociatedProducts}</p>
          <div className="mt-2 text-xs text-neutral-500">Catalog SKUs mapped</div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search regions by name, state, story..."
            className="w-full rounded-lg border border-neutral-300 bg-white py-2 pl-9 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-neutral-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 focus:border-amber-500 focus:outline-none"
            >
              <option value="ALL">All Regions</option>
              <option value="PUBLISHED">Published Only</option>
              <option value="DRAFT">Draft / Unpublished</option>
            </select>
          </div>
        </div>
      </div>

      {/* Regions Listing Table */}
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200 text-left text-sm text-neutral-600">
            <thead className="bg-neutral-50 text-xs font-semibold uppercase tracking-wider text-neutral-500">
              <tr>
                <th className="px-6 py-3.5">Region & State</th>
                <th className="px-6 py-3.5">Map Pin Location</th>
                <th className="px-6 py-3.5">Verification Source</th>
                <th className="px-6 py-3.5 text-center">Linked SKUs</th>
                <th className="px-6 py-3.5 text-center">Order</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-500">
                    <svg className="mx-auto h-6 w-6 animate-spin text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="mt-2 block text-xs">Loading Taste Map origin terroir data...</span>
                  </td>
                </tr>
              ) : filteredRegions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-500">
                    <svg className="mx-auto h-8 w-8 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    <span className="mt-2 block font-medium">No Taste Map regions found.</span>
                    <span className="text-xs text-neutral-400">Click "Add Origin Region" to configure a territory.</span>
                  </td>
                </tr>
              ) : (
                filteredRegions.map((region) => {
                  const coords = (region.pinCoordinates as PinCoordinates) || { xPct: 0, yPct: 0 };
                  return (
                    <tr key={region.id} className="hover:bg-neutral-50/70 transition">
                      <td className="px-6 py-4">
                        <div className="font-bold text-neutral-900">{region.name}</div>
                        <div className="text-xs text-neutral-500">
                          {region.state} • <code className="font-mono text-amber-700">{region.slug}</code>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-xs font-mono text-neutral-600">
                        <div className="flex items-center gap-1">
                          <span className="rounded bg-neutral-100 px-1.5 py-0.5">X: {coords.xPct}%</span>
                          <span className="rounded bg-neutral-100 px-1.5 py-0.5">Y: {coords.yPct}%</span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-xs text-neutral-600 max-w-xs truncate">
                        {region.verificationSource || (
                          <span className="italic text-neutral-400">Pending Verification</span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                          {region.associations.length} products
                        </span>
                      </td>

                      <td className="px-6 py-4 text-center font-mono text-xs text-neutral-500">
                        {region.displayOrder}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {region.isPublished ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-600/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Published
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-600/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            Draft
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openProductModal(region)}
                            disabled={!canMutate}
                            className={`rounded px-2 py-1 text-xs font-semibold ${
                              canMutate
                                ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                                : "cursor-not-allowed bg-neutral-100 text-neutral-400"
                            }`}
                          >
                            Products
                          </button>

                          <button
                            onClick={() => openEditModal(region)}
                            disabled={!canMutate}
                            className={`rounded px-2 py-1 text-xs font-semibold ${
                              canMutate
                                ? "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                                : "cursor-not-allowed bg-neutral-100 text-neutral-400"
                            }`}
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => handleTogglePublish(region)}
                            disabled={!canMutate}
                            title="Toggle Publication Status"
                            className={`rounded px-2 py-1 text-xs font-semibold ${
                              region.isPublished
                                ? "text-amber-700 hover:bg-amber-50"
                                : "text-emerald-700 hover:bg-emerald-50"
                            }`}
                          >
                            {region.isPublished ? "Unpublish" : "Publish"}
                          </button>

                          <button
                            onClick={() => handleDeleteRegion(region)}
                            disabled={!canMutate}
                            className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-rose-600"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE OR EDIT REGION */}
      {/* ========================================================================= */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-neutral-900">
                    {editingRegion ? `Edit Terroir: ${editingRegion.name}` : "Create New Origin Region"}
                  </h3>
                  <p className="text-xs text-neutral-500">Configure geographical coordinates, terroir stories, and certification tags.</p>
                </div>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700">Region Name</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Kashmir Valley (Pampore & Pulwama)"
                    required
                    className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700">Slug (URL identifier)</label>
                  <input
                    type="text"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="e.g. kashmir-valley"
                    required
                    className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-mono text-neutral-900 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700">State / Union Territory</label>
                  <input
                    type="text"
                    value={formState}
                    onChange={(e) => setFormState(e.target.value)}
                    placeholder="e.g. Jammu & Kashmir"
                    required
                    className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700">Display Order</label>
                  <input
                    type="number"
                    value={formDisplayOrder}
                    onChange={(e) => setFormDisplayOrder(parseInt(e.target.value) || 0)}
                    className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Coordinates Section */}
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-3">
                <span className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  Interactive Vector Map Pin Coordinates (% of Map)
                </span>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-500">X Position (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min={0}
                      max={100}
                      value={formXPct}
                      onChange={(e) => setFormXPct(parseFloat(e.target.value) || 0)}
                      required
                      className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-xs font-mono font-bold text-neutral-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-500">Y Position (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min={0}
                      max={100}
                      value={formYPct}
                      onChange={(e) => setFormYPct(parseFloat(e.target.value) || 0)}
                      required
                      className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-xs font-mono font-bold text-neutral-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-500">Latitude (optional)</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={formLat}
                      onChange={(e) => setFormLat(parseFloat(e.target.value) || 0)}
                      className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-xs font-mono text-neutral-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-500">Longitude (optional)</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={formLng}
                      onChange={(e) => setFormLng(parseFloat(e.target.value) || 0)}
                      className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-xs font-mono text-neutral-700"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700">Cultural & Harvest Terroir Story</label>
                <textarea
                  rows={4}
                  value={formStory}
                  onChange={(e) => setFormStory(e.target.value)}
                  placeholder="Authentic soil profile, climate altitude, traditional hand-harvesting techniques, and seasonal curing rituals..."
                  required
                  className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700">
                  Verification Source / GI Tag Accreditation
                </label>
                <input
                  type="text"
                  value={formVerification}
                  onChange={(e) => setFormVerification(e.target.value)}
                  placeholder="e.g. GI Registration #GI-124 / Direct Producer Partner FSSAI Verified"
                  className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700">Banner Image URL (optional)</label>
                <input
                  type="url"
                  value={formBannerUrl}
                  onChange={(e) => setFormBannerUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="formIsPublished"
                  checked={formIsPublished}
                  onChange={(e) => setFormIsPublished(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300 text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="formIsPublished" className="text-sm font-medium text-neutral-900 cursor-pointer">
                  Publish live to interactive storefront map
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {isSubmitting && (
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                  {editingRegion ? "Update Terroir Region" : "Create Terroir Region"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: PRODUCT ASSOCIATIONS SYNC */}
      {/* ========================================================================= */}
      {isProductModalOpen && assocRegion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-neutral-900">
                  Link Products: {assocRegion.name}
                </h3>
                <p className="text-xs text-neutral-500">Associate catalog products harvested in this terroir.</p>
              </div>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAssocSubmit} className="mt-4 flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {catalogProducts.length === 0 ? (
                  <p className="text-xs text-neutral-500">No catalog products found.</p>
                ) : (
                  catalogProducts.map((prod) => {
                    const isSelected = selectedProductIds.includes(prod.id);
                    return (
                      <label
                        key={prod.id}
                        className={`flex items-center justify-between p-3 rounded-lg border transition cursor-pointer ${
                          isSelected
                            ? "border-blue-500 bg-blue-50/50"
                            : "border-neutral-200 hover:bg-neutral-50"
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-neutral-900 text-sm">{prod.name}</div>
                          <div className="text-xs font-mono text-neutral-500">{prod.skuBase}</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProductIds((prev) => [...prev, prod.id]);
                            } else {
                              setSelectedProductIds((prev) => prev.filter((id) => id !== prod.id));
                            }
                          }}
                          className="h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                        />
                      </label>
                    );
                  })
                )}
              </div>

              <div className="flex items-center justify-between pt-4 mt-4 border-t border-neutral-100">
                <span className="text-xs text-neutral-500">
                  {selectedProductIds.length} products selected
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsProductModalOpen(false)}
                    className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingAssoc}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSavingAssoc && (
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    )}
                    Save Linked Products
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
