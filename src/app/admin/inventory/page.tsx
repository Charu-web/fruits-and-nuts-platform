"use client";

import React, { useEffect, useState, useTransition, useCallback } from "react";
import Link from "next/link";
import { InventoryInsightsView } from "@/components/admin/inventory-insights-view";

interface InventoryItem {
  variantId: string;
  sku: string;
  productName: string;
  productSlug: string;
  categoryName: string;
  weightGrams: number;
  unit: string;
  packageType: string;
  mrp: number;
  sellingPrice: number;
  isActive: boolean;
  stockAvailable: number;
  stockReserved: number;
  safetyBufferThreshold: number;
  stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
  updatedAt: string;
}

interface InventoryTransaction {
  id: string;
  variantId: string;
  transactionType: "RESTOCK" | "ORDER_HOLD" | "ORDER_DEDUCT" | "CANCEL_RESTORE" | "AUDIT_ADJUST";
  quantityDelta: number;
  stockAfter: number;
  referenceType: string | null;
  referenceId: string | null;
  notes: string | null;
  createdAt: string;
  variant?: {
    sku: string;
    product: {
      id: string;
      name: string;
      slug: string;
    };
  };
  actor?: {
    id: string;
    email: string;
    roleId: string;
  } | null;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

export default function AdminInventoryPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "ledger" | "insights">("overview");
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [userRole, setUserRole] = useState<string>("CUSTOMER");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters for Overview
  const [search, setSearch] = useState("");
  const [stockStatusFilter, setStockStatusFilter] = useState("ALL");
  const [overviewPage, setOverviewPage] = useState(1);
  const [overviewTotalPages, setOverviewTotalPages] = useState(1);
  const [overviewTotal, setOverviewTotal] = useState(0);

  // Filters for Ledger
  const [ledgerVariantFilter, setLedgerVariantFilter] = useState<string>("");
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState<string>("ALL");
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerTotalPages, setLedgerTotalPages] = useState(1);
  const [ledgerTotal, setLedgerTotal] = useState(0);

  // Modals state
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);

  // Stock Receipt Form State
  const [receiptVariantId, setReceiptVariantId] = useState("");
  const [receiptQuantity, setReceiptQuantity] = useState<number>(100);
  const [receiptRefNo, setReceiptRefNo] = useState("");
  const [receiptSupplier, setReceiptSupplier] = useState("Direct Producer Hub (Pampore, J&K)");
  const [receiptBatch, setReceiptBatch] = useState("");
  const [receiptNotes, setReceiptNotes] = useState("Standard batch stock inward verification");
  const [receiptBuffer, setReceiptBuffer] = useState<number>(10);
  const [isSubmittingReceipt, startSubmittingReceipt] = useTransition();

  // Stock Adjustment Form State
  const [adjustVariantId, setAdjustVariantId] = useState("");
  const [adjustDirection, setAdjustDirection] = useState<"ADD" | "DEDUCT">("ADD");
  const [adjustQuantity, setAdjustQuantity] = useState<number>(10);
  const [adjustReason, setAdjustReason] = useState("AUDIT_DISCREPANCY");
  const [adjustRefId, setAdjustRefId] = useState("");
  const [adjustNotes, setAdjustNotes] = useState("");
  const [adjustBuffer, setAdjustBuffer] = useState<number>(10);
  const [isSubmittingAdjust, startSubmittingAdjust] = useTransition();

  // Fetch Current User & Categories
  useEffect(() => {
    async function init() {
      try {
        const [meRes, catRes] = await Promise.all([
          fetch("/api/v1/auth/me"),
          fetch("/api/v1/categories"),
        ]);
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.data?.role) {
            setUserRole(meData.data.role.name || meData.data.role);
          }
        }
        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData.data || []);
        }
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          if (params.get("tab") === "insights") {
            setActiveTab("insights");
          }
        }
      } catch (err) {
        console.error("Failed to initialize inventory user context", err);
      }
    }
    init();
  }, []);

  const canMutate = ["SUPER_ADMIN", "INVENTORY_MGR"].includes(userRole);

  // Fetch Inventory Overview
  const fetchOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: overviewPage.toString(),
        limit: "20",
        stockStatus: stockStatusFilter,
      });
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/v1/admin/inventory?${params.toString()}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || "Failed to load inventory");
      }
      const data = await res.json();
      setItems(data.data || []);
      if (data.meta) {
        setOverviewTotal(data.meta.total || 0);
        setOverviewTotalPages(Math.ceil((data.meta.total || 1) / (data.meta.limit || 20)));
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch inventory overview");
    } finally {
      setLoading(false);
    }
  }, [overviewPage, search, stockStatusFilter]);

  // Fetch Inventory Ledger
  const fetchLedger = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: ledgerPage.toString(),
        limit: "20",
      });
      if (ledgerTypeFilter !== "ALL") params.set("transactionType", ledgerTypeFilter);
      if (ledgerVariantFilter.trim()) params.set("variantId", ledgerVariantFilter.trim());

      const res = await fetch(`/api/v1/admin/inventory/transactions?${params.toString()}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || "Failed to load transaction ledger");
      }
      const data = await res.json();
      setTransactions(data.data || []);
      if (data.meta) {
        setLedgerTotal(data.meta.total || 0);
        setLedgerTotalPages(Math.ceil((data.meta.total || 1) / (data.meta.limit || 20)));
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch transactions");
    } finally {
      setLoading(false);
    }
  }, [ledgerPage, ledgerTypeFilter, ledgerVariantFilter]);

  useEffect(() => {
    if (activeTab === "overview") {
      fetchOverview();
    } else {
      fetchLedger();
    }
  }, [activeTab, fetchOverview, fetchLedger]);

  // Aggregate KPI metrics
  const totalAvailableStock = items.reduce((acc, curr) => acc + curr.stockAvailable, 0);
  const totalReservedStock = items.reduce((acc, curr) => acc + curr.stockReserved, 0);
  const lowStockCount = items.filter((i) => i.stockStatus === "LOW_STOCK").length;
  const outOfStockCount = items.filter((i) => i.stockStatus === "OUT_OF_STOCK").length;

  // Handle Stock Receipt Submission
  const handleStockReceiptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptVariantId) {
      setError("Please select a valid variant for stock receipt");
      return;
    }
    if (receiptQuantity <= 0) {
      setError("Receipt quantity must be greater than zero");
      return;
    }

    startSubmittingReceipt(async () => {
      setError(null);
      try {
        const payload = {
          variantId: receiptVariantId,
          transactionType: "RESTOCK",
          quantityDelta: Number(receiptQuantity),
          safetyBufferThreshold: Number(receiptBuffer),
          referenceType: "STOCK_RECEIPT",
          referenceId: receiptRefNo.trim() || `GRN-${Date.now().toString().slice(-6)}`,
          notes: `Supplier: ${receiptSupplier} | Batch: ${receiptBatch || "N/A"} | ${receiptNotes}`,
        };

        const res = await fetch("/api/v1/admin/inventory/adjust", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error?.message || "Stock receipt failed");
        }

        setSuccessMessage(`Stock receipt recorded successfully! Added ${receiptQuantity} units to SKU.`);
        setIsReceiptModalOpen(false);
        fetchOverview();
        fetchLedger();
        setTimeout(() => setSuccessMessage(null), 5000);
      } catch (err: any) {
        setError(err.message || "Failed to process stock receipt");
      }
    });
  };

  // Handle Stock Adjustment Submission
  const handleStockAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustVariantId) {
      setError("Please select a valid variant for stock adjustment");
      return;
    }
    if (adjustQuantity <= 0) {
      setError("Adjustment quantity must be greater than zero");
      return;
    }
    if (!adjustNotes || adjustNotes.trim().length < 3) {
      setError("Audit notes are mandatory for stock adjustments (minimum 3 characters)");
      return;
    }

    const delta = adjustDirection === "ADD" ? Number(adjustQuantity) : -Number(adjustQuantity);

    startSubmittingAdjust(async () => {
      setError(null);
      try {
        const payload = {
          variantId: adjustVariantId,
          transactionType: "AUDIT_ADJUST",
          quantityDelta: delta,
          safetyBufferThreshold: Number(adjustBuffer),
          referenceType: "MANUAL_ADJUSTMENT",
          referenceId: adjustRefId.trim() || `AUDIT-${Date.now().toString().slice(-6)}`,
          notes: `[Reason: ${adjustReason}] ${adjustNotes.trim()}`,
        };

        const res = await fetch("/api/v1/admin/inventory/adjust", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error?.message || "Stock adjustment failed");
        }

        setSuccessMessage(`Inventory adjustment recorded successfully! Delta: ${delta > 0 ? `+${delta}` : delta} units.`);
        setIsAdjustModalOpen(false);
        fetchOverview();
        fetchLedger();
        setTimeout(() => setSuccessMessage(null), 5000);
      } catch (err: any) {
        setError(err.message || "Failed to process stock adjustment");
      }
    });
  };

  const openReceiptForVariant = (variant: InventoryItem) => {
    setReceiptVariantId(variant.variantId);
    setReceiptBuffer(variant.safetyBufferThreshold);
    setReceiptRefNo(`GRN-${Date.now().toString().slice(-6)}`);
    setReceiptBatch(`BATCH-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}`);
    setIsReceiptModalOpen(true);
  };

  const openAdjustForVariant = (variant: InventoryItem) => {
    setAdjustVariantId(variant.variantId);
    setAdjustBuffer(variant.safetyBufferThreshold);
    setAdjustRefId(`AUDIT-${Date.now().toString().slice(-6)}`);
    setIsAdjustModalOpen(true);
  };

  const openLedgerForVariant = (variantId: string) => {
    setLedgerVariantFilter(variantId);
    setActiveTab("ledger");
    setLedgerPage(1);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner & Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
              Inventory & Warehouse Ledger
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-600/20">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              FSSAI Central Hub
            </span>
          </div>
          <p className="mt-1 text-sm text-neutral-500">
            Live stock tracking, multi-channel reservation monitors, warehouse stock receipts, and immutable transaction audit ledger.
          </p>
        </div>

        {/* Global Action Triggers */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              if (items.length > 0) openReceiptForVariant(items[0]);
            }}
            disabled={!canMutate}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold shadow-sm transition ${
              canMutate
                ? "bg-amber-600 text-white hover:bg-amber-700"
                : "cursor-not-allowed bg-neutral-100 text-neutral-400"
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            Record Stock Receipt
          </button>

          <button
            onClick={() => {
              if (items.length > 0) openAdjustForVariant(items[0]);
            }}
            disabled={!canMutate}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition ${
              canMutate
                ? "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
                : "cursor-not-allowed border-neutral-200 bg-neutral-50 text-neutral-400"
            }`}
          >
            <svg className="h-4 w-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            Stock Adjustment
          </button>

          <button
            onClick={() => (activeTab === "overview" ? fetchOverview() : fetchLedger())}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white p-2.5 text-neutral-600 hover:bg-neutral-50"
            title="Refresh Inventory"
          >
            <svg className={`h-4 w-4 ${loading ? "animate-spin text-amber-600" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Role Notice if Read-Only */}
      {!canMutate && (
        <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          <svg className="h-5 w-5 flex-shrink-0 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <strong>Read-Only View:</strong> Your role ({userRole}) has view-only permissions for inventory. Restock and stock adjustments require <code className="font-mono font-semibold">SUPER_ADMIN</code> or <code className="font-mono font-semibold">INVENTORY_MGR</code> authorization.
          </div>
        </div>
      )}

      {/* Success Banner */}
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

      {/* Error Banner */}
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

      {/* KPI Stats Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Total Monitored SKUs</span>
            <svg className="h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <p className="mt-3 text-2xl font-bold text-neutral-900">{overviewTotal || items.length}</p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-neutral-500">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" /> Across all catalog categories
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Available Stock</span>
            <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="mt-3 text-2xl font-bold text-neutral-900">{totalAvailableStock.toLocaleString()}</p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600">
            <span>Ready for storefront dispatch</span>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Reserved / On Hold</span>
            <svg className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="mt-3 text-2xl font-bold text-neutral-900">{totalReservedStock.toLocaleString()}</p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600">
            <span>Active checkout / payment holds</span>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Low Stock Alerts</span>
            <svg className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="mt-3 text-2xl font-bold text-amber-600">{lowStockCount}</p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-neutral-500">
            <span>≤ safety buffer threshold</span>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Out of Stock</span>
            <svg className="h-5 w-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="mt-3 text-2xl font-bold text-rose-600">{outOfStockCount}</p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-neutral-500">
            <span>Requires immediate restocking</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation Switcher */}
      <div className="border-b border-neutral-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-semibold transition ${
              activeTab === "overview"
                ? "border-amber-600 text-amber-600"
                : "border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700"
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Stock Overview & Variant Balances
            <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-600">
              {overviewTotal || items.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("ledger")}
            className={`flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-semibold transition ${
              activeTab === "ledger"
                ? "border-amber-600 text-amber-600"
                : "border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700"
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Warehouse Transaction Ledger
            <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-600">
              {ledgerTotal || transactions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("insights")}
            className={`flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-semibold transition cursor-pointer ${
              activeTab === "insights"
                ? "border-amber-600 text-amber-600"
                : "border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700"
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Runout Velocity &amp; Reorder Insights
            <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-xs font-bold">
              AI Insights
            </span>
          </button>
        </nav>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: STOCK OVERVIEW & VARIANT TABLE */}
      {/* ========================================================================= */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by SKU, product name..."
                className="w-full rounded-lg border border-neutral-300 bg-white py-2 pl-9 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-neutral-500">Status:</span>
                <select
                  value={stockStatusFilter}
                  onChange={(e) => {
                    setStockStatusFilter(e.target.value);
                    setOverviewPage(1);
                  }}
                  className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 focus:border-amber-500 focus:outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="IN_STOCK">In Stock</option>
                  <option value="LOW_STOCK">Low Stock (≤ Buffer)</option>
                  <option value="OUT_OF_STOCK">Out of Stock (0)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200 text-left text-sm text-neutral-600">
                <thead className="bg-neutral-50 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  <tr>
                    <th className="px-6 py-3.5">Product & SKU</th>
                    <th className="px-6 py-3.5">Category</th>
                    <th className="px-6 py-3.5 text-right">Available</th>
                    <th className="px-6 py-3.5 text-right">Reserved</th>
                    <th className="px-6 py-3.5 text-right">Total On Hand</th>
                    <th className="px-6 py-3.5 text-center">Safety Buffer</th>
                    <th className="px-6 py-3.5">Location</th>
                    <th className="px-6 py-3.5">Stock Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-neutral-500">
                        <svg className="mx-auto h-6 w-6 animate-spin text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span className="mt-2 block text-xs">Loading warehouse inventory balances...</span>
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-neutral-500">
                        <svg className="mx-auto h-8 w-8 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        <span className="mt-2 block font-medium">No inventory records found.</span>
                        <span className="text-xs text-neutral-400">Try adjusting your search or filters.</span>
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => {
                      const totalOnHand = item.stockAvailable + item.stockReserved;
                      return (
                        <tr key={item.variantId} className="hover:bg-neutral-50/70 transition">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                              </div>
                              <div>
                                <Link
                                  href={`/admin/products`}
                                  className="font-semibold text-neutral-900 hover:text-amber-600 hover:underline"
                                >
                                  {item.productName}
                                </Link>
                                <div className="flex items-center gap-2 text-xs text-neutral-500">
                                  <span className="font-mono text-neutral-600">{item.sku}</span>
                                  <span>•</span>
                                  <span>
                                    {item.weightGrams >= 1000 ? `${item.weightGrams / 1000} kg` : `${item.weightGrams}g`} (
                                    {item.packageType})
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <span className="rounded-md bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700">
                              {item.categoryName}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-right">
                            <span
                              className={`font-semibold font-mono text-base ${
                                item.stockAvailable <= 0
                                  ? "text-rose-600"
                                  : item.stockAvailable <= item.safetyBufferThreshold
                                  ? "text-amber-600"
                                  : "text-neutral-900"
                              }`}
                            >
                              {item.stockAvailable.toLocaleString()}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-right">
                            <span className="font-mono text-sm text-neutral-500">
                              {item.stockReserved.toLocaleString()}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-right">
                            <span className="font-mono text-sm font-semibold text-neutral-900">
                              {totalOnHand.toLocaleString()}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-mono text-neutral-600">
                              {item.safetyBufferThreshold} units
                            </span>
                          </td>

                          <td className="px-6 py-4 text-xs text-neutral-500">
                            <div className="flex items-center gap-1.5">
                              <svg className="h-3.5 w-3.5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              <span>Central Hub - DC1</span>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            {item.stockStatus === "IN_STOCK" && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                In Stock
                              </span>
                            )}
                            {item.stockStatus === "LOW_STOCK" && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20">
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                Low Stock
                              </span>
                            )}
                            {item.stockStatus === "OUT_OF_STOCK" && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 ring-1 ring-inset ring-rose-600/20">
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Out of Stock
                              </span>
                            )}
                          </td>

                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openReceiptForVariant(item)}
                                disabled={!canMutate}
                                title="Inward Stock Receipt"
                                className={`rounded px-2 py-1 text-xs font-semibold ${
                                  canMutate
                                    ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                                    : "cursor-not-allowed bg-neutral-100 text-neutral-400"
                                }`}
                              >
                                Restock
                              </button>

                              <button
                                onClick={() => openAdjustForVariant(item)}
                                disabled={!canMutate}
                                title="Stock Audit Adjustment"
                                className={`rounded px-2 py-1 text-xs font-semibold ${
                                  canMutate
                                    ? "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                                    : "cursor-not-allowed bg-neutral-100 text-neutral-400"
                                }`}
                              >
                                Adjust
                              </button>

                              <button
                                onClick={() => openLedgerForVariant(item.variantId)}
                                title="View Ledger for SKU"
                                className="rounded px-2 py-1 text-xs font-semibold text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                              >
                                Ledger
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

            {/* Pagination Bar */}
            <div className="flex items-center justify-between border-t border-neutral-200 bg-white px-6 py-3 text-xs text-neutral-500">
              <div>
                Showing page <span className="font-semibold">{overviewPage}</span> of{" "}
                <span className="font-semibold">{overviewTotalPages}</span> ({overviewTotal} total items)
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOverviewPage((p) => Math.max(1, p - 1))}
                  disabled={overviewPage <= 1 || loading}
                  className="inline-flex items-center gap-1 rounded border border-neutral-200 bg-white px-2.5 py-1 font-medium hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>
                <button
                  onClick={() => setOverviewPage((p) => Math.min(overviewTotalPages, p + 1))}
                  disabled={overviewPage >= overviewTotalPages || loading}
                  className="inline-flex items-center gap-1 rounded border border-neutral-200 bg-white px-2.5 py-1 font-medium hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: WAREHOUSE TRANSACTION AUDIT LEDGER */}
      {/* ========================================================================= */}
      {activeTab === "ledger" && (
        <div className="space-y-4">
          {/* Ledger Filter Controls */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-neutral-500">Transaction Type:</span>
                <select
                  value={ledgerTypeFilter}
                  onChange={(e) => {
                    setLedgerTypeFilter(e.target.value);
                    setLedgerPage(1);
                  }}
                  className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 focus:border-amber-500 focus:outline-none"
                >
                  <option value="ALL">All Transactions</option>
                  <option value="RESTOCK">RESTOCK (Inward Receipt)</option>
                  <option value="ORDER_HOLD">ORDER_HOLD (Checkout Reservation)</option>
                  <option value="ORDER_DEDUCT">ORDER_DEDUCT (Confirmed Dispatch)</option>
                  <option value="CANCEL_RESTORE">CANCEL_RESTORE (Return / Release)</option>
                  <option value="AUDIT_ADJUST">AUDIT_ADJUST (Manual Audit Delta)</option>
                </select>
              </div>

              {ledgerVariantFilter && (
                <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-300">
                  <span>Filtered to Variant: {ledgerVariantFilter.slice(0, 8)}...</span>
                  <button
                    onClick={() => {
                      setLedgerVariantFilter("");
                      setLedgerPage(1);
                    }}
                    className="ml-1 text-amber-600 hover:text-amber-900"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <svg className="h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Immutable Ledger: Direct UI edit or deletion is cryptographically prohibited.</span>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200 text-left text-sm text-neutral-600">
                <thead className="bg-neutral-50 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  <tr>
                    <th className="px-6 py-3.5">Timestamp (IST)</th>
                    <th className="px-6 py-3.5">Product & SKU</th>
                    <th className="px-6 py-3.5">Transaction Type</th>
                    <th className="px-6 py-3.5 text-right">Delta Qty</th>
                    <th className="px-6 py-3.5 text-right">Stock After</th>
                    <th className="px-6 py-3.5">Reference ID</th>
                    <th className="px-6 py-3.5">Reason & Audit Notes</th>
                    <th className="px-6 py-3.5">Actor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-neutral-500">
                        <svg className="mx-auto h-6 w-6 animate-spin text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span className="mt-2 block text-xs">Loading ledger entries...</span>
                      </td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-neutral-500">
                        <svg className="mx-auto h-8 w-8 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="mt-2 block font-medium">No ledger transactions recorded yet.</span>
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => {
                      const isPositive = tx.quantityDelta > 0;
                      return (
                        <tr key={tx.id} className="hover:bg-neutral-50/70 transition">
                          <td className="px-6 py-4 text-xs font-mono text-neutral-500 whitespace-nowrap">
                            {new Date(tx.createdAt).toLocaleString("en-IN", {
                              timeZone: "Asia/Kolkata",
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                          </td>

                          <td className="px-6 py-4">
                            <div className="font-medium text-neutral-900">
                              {tx.variant?.product?.name || "Catalog Product"}
                            </div>
                            <div className="font-mono text-xs text-neutral-500">
                              {tx.variant?.sku || tx.variantId.slice(0, 8)}
                            </div>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            {tx.transactionType === "RESTOCK" && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-600/20">
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                </svg>
                                RESTOCK
                              </span>
                            )}
                            {tx.transactionType === "ORDER_HOLD" && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-600/20">
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                ORDER_HOLD
                              </span>
                            )}
                            {tx.transactionType === "ORDER_DEDUCT" && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-800 ring-1 ring-inset ring-blue-600/20">
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                </svg>
                                ORDER_DEDUCT
                              </span>
                            )}
                            {tx.transactionType === "CANCEL_RESTORE" && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-800 ring-1 ring-inset ring-purple-600/20">
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                CANCEL_RESTORE
                              </span>
                            )}
                            {tx.transactionType === "AUDIT_ADJUST" && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-semibold text-orange-800 ring-1 ring-inset ring-orange-600/20">
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                </svg>
                                AUDIT_ADJUST
                              </span>
                            )}
                          </td>

                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <span
                              className={`font-mono font-semibold text-sm ${
                                isPositive ? "text-emerald-600" : "text-rose-600"
                              }`}
                            >
                              {isPositive ? `+${tx.quantityDelta}` : tx.quantityDelta}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <span className="font-mono font-bold text-sm text-neutral-900">
                              {tx.stockAfter.toLocaleString()}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-xs font-mono text-neutral-600">
                            {tx.referenceId ? (
                              <span className="rounded bg-neutral-100 px-2 py-0.5 font-semibold text-neutral-700">
                                {tx.referenceId}
                              </span>
                            ) : (
                              <span className="text-neutral-400">—</span>
                            )}
                          </td>

                          <td className="px-6 py-4 text-xs text-neutral-600 max-w-xs truncate" title={tx.notes || ""}>
                            {tx.notes || "System balance synchronization"}
                          </td>

                          <td className="px-6 py-4 text-xs text-neutral-500 whitespace-nowrap">
                            {tx.actor?.email ? (
                              <span className="text-neutral-700 font-medium">{tx.actor.email}</span>
                            ) : (
                              <span className="text-neutral-400">System Bot / Cron</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Bar */}
            <div className="flex items-center justify-between border-t border-neutral-200 bg-white px-6 py-3 text-xs text-neutral-500">
              <div>
                Showing page <span className="font-semibold">{ledgerPage}</span> of{" "}
                <span className="font-semibold">{ledgerTotalPages}</span> ({ledgerTotal} total transactions)
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLedgerPage((p) => Math.max(1, p - 1))}
                  disabled={ledgerPage <= 1 || loading}
                  className="inline-flex items-center gap-1 rounded border border-neutral-200 bg-white px-2.5 py-1 font-medium hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>
                <button
                  onClick={() => setLedgerPage((p) => Math.min(ledgerTotalPages, p + 1))}
                  disabled={ledgerPage >= ledgerTotalPages || loading}
                  className="inline-flex items-center gap-1 rounded border border-neutral-200 bg-white px-2.5 py-1 font-medium hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: RUNOUT VELOCITY & AI INSIGHTS */}
      {/* ========================================================================= */}
      {activeTab === "insights" && (
        <InventoryInsightsView items={items} />
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: STOCK RECEIPT (RESTOCK / INWARD) */}
      {/* ========================================================================= */}
      {isReceiptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-neutral-900">Record Stock Receipt (Inward)</h3>
                  <p className="text-xs text-neutral-500">Record verified physical stock arrival at warehouse.</p>
                </div>
              </div>
              <button
                onClick={() => setIsReceiptModalOpen(false)}
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleStockReceiptSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700">Select Variant</label>
                <select
                  value={receiptVariantId}
                  onChange={(e) => {
                    setReceiptVariantId(e.target.value);
                    const selected = items.find((i) => i.variantId === e.target.value);
                    if (selected) setReceiptBuffer(selected.safetyBufferThreshold);
                  }}
                  required
                  className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-amber-500 focus:outline-none"
                >
                  <option value="" disabled>
                    -- Select SKU / Variant --
                  </option>
                  {items.map((i) => (
                    <option key={i.variantId} value={i.variantId}>
                      {i.productName} ({i.sku}) - {i.weightGrams}g [{i.stockAvailable} available]
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700">Receipt Quantity (Units)</label>
                  <input
                    type="number"
                    min={1}
                    value={receiptQuantity}
                    onChange={(e) => setReceiptQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    required
                    className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold text-neutral-900 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700">Safety Buffer Threshold</label>
                  <input
                    type="number"
                    min={0}
                    value={receiptBuffer}
                    onChange={(e) => setReceiptBuffer(Math.max(0, parseInt(e.target.value) || 0))}
                    className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold text-neutral-900 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700">Reference / GRN Number</label>
                  <input
                    type="text"
                    value={receiptRefNo}
                    onChange={(e) => setReceiptRefNo(e.target.value)}
                    placeholder="e.g. GRN-2026-081"
                    className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700">Batch / Lot Code</label>
                  <input
                    type="text"
                    value={receiptBatch}
                    onChange={(e) => setReceiptBatch(e.target.value)}
                    placeholder="e.g. BATCH-20261008"
                    className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700">Supplier / Source Facility</label>
                <input
                  type="text"
                  value={receiptSupplier}
                  onChange={(e) => setReceiptSupplier(e.target.value)}
                  placeholder="e.g. Kashmir Valley Direct Producers Hub"
                  className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700">Mandatory Audit Notes</label>
                <textarea
                  rows={2}
                  value={receiptNotes}
                  onChange={(e) => setReceiptNotes(e.target.value)}
                  placeholder="Notes on packaging integrity, seal verification, temperature logs..."
                  className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsReceiptModalOpen(false)}
                  className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReceipt}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {isSubmittingReceipt && (
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                  Confirm Stock Inward
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: STOCK AUDIT ADJUSTMENT */}
      {/* ========================================================================= */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-neutral-900">Inventory Audit Adjustment</h3>
                  <p className="text-xs text-neutral-500">Record controlled manual delta changes with mandatory audit notes.</p>
                </div>
              </div>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleStockAdjustSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700">Select Variant</label>
                <select
                  value={adjustVariantId}
                  onChange={(e) => {
                    setAdjustVariantId(e.target.value);
                    const selected = items.find((i) => i.variantId === e.target.value);
                    if (selected) setAdjustBuffer(selected.safetyBufferThreshold);
                  }}
                  required
                  className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-amber-500 focus:outline-none"
                >
                  <option value="" disabled>
                    -- Select SKU / Variant --
                  </option>
                  {items.map((i) => (
                    <option key={i.variantId} value={i.variantId}>
                      {i.productName} ({i.sku}) - {i.weightGrams}g [{i.stockAvailable} available]
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700">Adjustment Type</label>
                  <div className="mt-1 flex rounded-lg border border-neutral-300 p-1">
                    <button
                      type="button"
                      onClick={() => setAdjustDirection("ADD")}
                      className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition ${
                        adjustDirection === "ADD"
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "text-neutral-600 hover:bg-neutral-100"
                      }`}
                    >
                      + Add Stock
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustDirection("DEDUCT")}
                      className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition ${
                        adjustDirection === "DEDUCT"
                          ? "bg-rose-600 text-white shadow-sm"
                          : "text-neutral-600 hover:bg-neutral-100"
                      }`}
                    >
                      - Deduct Stock
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700">Adjustment Delta (Units)</label>
                  <input
                    type="number"
                    min={1}
                    value={adjustQuantity}
                    onChange={(e) => setAdjustQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    required
                    className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold text-neutral-900 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700">Reason Code</label>
                  <select
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="AUDIT_DISCREPANCY">Physical Count Discrepancy</option>
                    <option value="DAMAGED_IN_TRANSIT">Damaged in Transit / Warehouse</option>
                    <option value="EXPIRED_DISCARD">Quality Check / Expired Discard</option>
                    <option value="SAMPLE_TESTING">Lab Testing / Sample Allotment</option>
                    <option value="CUSTOMER_RETURN_MANUAL">Manual Customer Return Inward</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700">Safety Buffer Threshold</label>
                  <input
                    type="number"
                    min={0}
                    value={adjustBuffer}
                    onChange={(e) => setAdjustBuffer(Math.max(0, parseInt(e.target.value) || 0))}
                    className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold text-neutral-900 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700">Audit / Reference ID</label>
                <input
                  type="text"
                  value={adjustRefId}
                  onChange={(e) => setAdjustRefId(e.target.value)}
                  placeholder="e.g. AUDIT-2026-Q4-01"
                  className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700">Mandatory Audit Explanation</label>
                <textarea
                  rows={2}
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  required
                  placeholder="Detailed justification for manual inventory mutation..."
                  className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdjust}
                  className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  {isSubmittingAdjust && (
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                  Apply Stock Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
