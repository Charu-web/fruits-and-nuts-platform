"use client";

import React, { useEffect, useState, useCallback, useTransition } from "react";
import Link from "next/link";

export interface CouponItem {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FLAT_AMOUNT";
  discountValue: number;
  maxDiscountAmount: number | null;
  minOrderAmount: number;
  usageLimitTotal: number | null;
  usageLimitPerUser: number;
  totalUsages: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isExpired: boolean;
  createdAt: string;
}

export interface CouponUsageDetail {
  id: string;
  discountApplied: number;
  createdAt: string;
  user: { id: string; email: string | null; phone: string | null };
  order: { id: string; orderNumber: string; finalPayableAmount: number };
}

export interface CouponDetailResponse extends CouponItem {
  usages: CouponUsageDetail[];
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [userRole, setUserRole] = useState<string>("CUSTOMER");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE" | "EXPIRED">("ALL");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "PERCENTAGE" | "FLAT_AMOUNT">("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal State for Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponItem | null>(null);

  // Form Fields
  const [formCode, setFormCode] = useState("");
  const [formDiscountType, setFormDiscountType] = useState<"PERCENTAGE" | "FLAT_AMOUNT">("PERCENTAGE");
  const [formDiscountValue, setFormDiscountValue] = useState<string>("10");
  const [formMaxDiscount, setFormMaxDiscount] = useState<string>("");
  const [formMinOrder, setFormMinOrder] = useState<string>("999");
  const [formUsageLimitTotal, setFormUsageLimitTotal] = useState<string>("");
  const [formUsageLimitPerUser, setFormUsageLimitPerUser] = useState<string>("1");
  const [formStartDate, setFormStartDate] = useState<string>("");
  const [formEndDate, setFormEndDate] = useState<string>("");
  const [formIsActive, setFormIsActive] = useState<boolean>(true);

  // Details / Usages Modal State
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<CouponDetailResponse | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [isSubmitting, startSubmitting] = useTransition();

  // Fetch Current User
  useEffect(() => {
    async function fetchMe() {
      try {
        const res = await fetch("/api/v1/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.data?.role) {
            setUserRole(data.data.role.name || data.data.role);
          }
        }
      } catch (err) {
        console.error("Failed to fetch user context", err);
      }
    }
    fetchMe();
  }, []);

  const canMutate = ["SUPER_ADMIN", "CONTENT_MGR"].includes(userRole);

  // Fetch Coupons
  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        status: statusFilter,
      });
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/v1/admin/coupons?${params.toString()}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || "Failed to load coupons");
      }
      const data = await res.json();
      setCoupons(data.data || []);
      setTotalPages(data.meta?.totalPages || 1);
      setTotalCount(data.meta?.total || 0);
    } catch (err: any) {
      setError(err.message || "Failed to load coupon records");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const showFeedback = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // Open Create Modal with default fresh dates
  const handleOpenCreateModal = () => {
    setEditingCoupon(null);
    setFormCode("");
    setFormDiscountType("PERCENTAGE");
    setFormDiscountValue("15");
    setFormMaxDiscount("500");
    setFormMinOrder("999");
    setFormUsageLimitTotal("1000");
    setFormUsageLimitPerUser("1");

    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + 30);

    setFormStartDate(now.toISOString().slice(0, 16));
    setFormEndDate(future.toISOString().slice(0, 16));
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  // Open Edit Modal with existing coupon data
  const handleOpenEditModal = (coupon: CouponItem) => {
    setEditingCoupon(coupon);
    setFormCode(coupon.code);
    setFormDiscountType(coupon.discountType);
    setFormDiscountValue(coupon.discountValue.toString());
    setFormMaxDiscount(coupon.maxDiscountAmount ? coupon.maxDiscountAmount.toString() : "");
    setFormMinOrder(coupon.minOrderAmount.toString());
    setFormUsageLimitTotal(coupon.usageLimitTotal ? coupon.usageLimitTotal.toString() : "");
    setFormUsageLimitPerUser(coupon.usageLimitPerUser.toString());
    setFormStartDate(new Date(coupon.startDate).toISOString().slice(0, 16));
    setFormEndDate(new Date(coupon.endDate).toISOString().slice(0, 16));
    setFormIsActive(coupon.isActive);
    setIsModalOpen(true);
  };

  // Open Coupon Details Modal
  const handleOpenDetails = async (id: string) => {
    setLoadingDetail(true);
    setIsDetailModalOpen(true);
    try {
      const res = await fetch(`/api/v1/admin/coupons/${id}`);
      if (!res.ok) throw new Error("Failed to load coupon details");
      const json = await res.json();
      setSelectedDetail(json.data);
    } catch (err: any) {
      setError(err.message || "Failed to load coupon analytics");
      setIsDetailModalOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Submit Create or Edit Form
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim()) {
      alert("Coupon code is required");
      return;
    }

    const val = parseFloat(formDiscountValue);
    if (isNaN(val) || val <= 0) {
      alert("Valid positive discount value is required");
      return;
    }
    if (formDiscountType === "PERCENTAGE" && val > 100) {
      alert("Percentage discount cannot exceed 100%");
      return;
    }

    const start = new Date(formStartDate);
    const end = new Date(formEndDate);
    if (end <= start) {
      alert("Expiry date must be after start date");
      return;
    }

    startSubmitting(async () => {
      setError(null);
      try {
        const payload: any = {
          code: formCode.trim().toUpperCase(),
          discountType: formDiscountType,
          discountValue: val,
          minOrderAmount: parseFloat(formMinOrder) || 0,
          usageLimitPerUser: parseInt(formUsageLimitPerUser) || 1,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          isActive: formIsActive,
        };

        if (formMaxDiscount.trim()) {
          payload.maxDiscountAmount = parseFloat(formMaxDiscount);
        } else {
          payload.maxDiscountAmount = null;
        }

        if (formUsageLimitTotal.trim()) {
          payload.usageLimitTotal = parseInt(formUsageLimitTotal);
        } else {
          payload.usageLimitTotal = null;
        }

        const url = editingCoupon
          ? `/api/v1/admin/coupons/${editingCoupon.id}`
          : "/api/v1/admin/coupons";
        const method = editingCoupon ? "PUT" : "POST";

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error?.message || "Failed to save coupon");
        }

        showFeedback(
          editingCoupon
            ? `Coupon '${payload.code}' updated successfully.`
            : `Coupon '${payload.code}' created successfully.`
        );
        setIsModalOpen(false);
        fetchCoupons();
      } catch (err: any) {
        setError(err.message || "Failed to save coupon");
      }
    });
  };

  // Toggle Active Status
  const handleToggleActive = async (coupon: CouponItem) => {
    if (!canMutate) return;
    try {
      const res = await fetch(`/api/v1/admin/coupons/${coupon.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !coupon.isActive }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || "Failed to update status");
      }

      showFeedback(`Coupon '${coupon.code}' is now ${!coupon.isActive ? "Active" : "Inactive"}.`);
      fetchCoupons();
    } catch (err: any) {
      setError(err.message || "Failed to update coupon status");
    }
  };

  // Delete / Deactivate Coupon
  const handleDeleteCoupon = async (coupon: CouponItem) => {
    if (!canMutate) return;
    if (!confirm(`Are you sure you want to delete or deactivate coupon '${coupon.code}'?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/v1/admin/coupons/${coupon.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || "Failed to delete coupon");
      }

      const json = await res.json();
      showFeedback(json.data?.message || `Coupon '${coupon.code}' deleted.`);
      fetchCoupons();
    } catch (err: any) {
      setError(err.message || "Failed to delete coupon");
    }
  };

  // Filter coupons locally if type filter is applied
  const filteredCoupons = coupons.filter((c) => {
    if (typeFilter !== "ALL" && c.discountType !== typeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-8 pb-16">
      {/* 1. HEADER & ACTION STRIP */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏷️</span>
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
                Coupons & Promotional Campaigns
              </h1>
              <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
                Manage promotional discount codes, minimum basket thresholds, usage caps, and redemption analytics.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchCoupons}
            className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
            title="Refresh from Database"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>Sync</span>
          </button>

          {canMutate && (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow transition-colors flex items-center gap-1.5"
            >
              <span>➕</span>
              <span>Create Coupon</span>
            </button>
          )}
        </div>
      </div>

      {/* FEEDBACK & ALERTS */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs sm:text-sm flex items-center gap-3 shadow-xs">
          <span className="text-lg">✅</span>
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs sm:text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-lg">⚠️</span>
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-800 text-xs font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* 2. OVERVIEW METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">Total Campaigns</span>
          <div className="text-2xl font-serif font-bold text-stone-900 mt-1">{totalCount}</div>
          <span className="text-[10px] text-stone-500 mt-0.5 block">Configured in Database</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 block">Active Promos</span>
          <div className="text-2xl font-serif font-bold text-emerald-700 mt-1">
            {coupons.filter((c) => c.isActive && !c.isExpired).length}
          </div>
          <span className="text-[10px] text-emerald-600 mt-0.5 block">Live for Checkout</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 block">Total Redemptions</span>
          <div className="text-2xl font-serif font-bold text-amber-700 mt-1">
            {coupons.reduce((sum, c) => sum + (c.totalUsages || 0), 0)}
          </div>
          <span className="text-[10px] text-stone-500 mt-0.5 block">Orders Applied</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">RBAC Permission</span>
          <div className="text-sm font-bold text-stone-800 mt-1.5 flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${canMutate ? "bg-emerald-500" : "bg-stone-400"}`} />
            <span>{canMutate ? "Full Campaign Manager" : "Read-Only Viewer"}</span>
          </div>
          <span className="text-[10px] text-stone-400 mt-0.5 block">{userRole}</span>
        </div>
      </div>

      {/* 3. SEARCH & FILTERS BAR */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1 w-full flex items-center gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by coupon code (e.g. ROYAL10, WELCOME)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono uppercase focus:bg-white focus:ring-1 focus:ring-amber-500"
            />
            <span className="absolute left-3 top-2.5 text-stone-400 text-xs">🔍</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
            <option value="EXPIRED">Expired</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-700"
          >
            <option value="ALL">All Types</option>
            <option value="PERCENTAGE">Percentage (%)</option>
            <option value="FLAT_AMOUNT">Flat Amount (₹)</option>
          </select>
        </div>
      </div>

      {/* 4. COUPONS TABLE */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-stone-400 text-xs">
            <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading Coupons from PostgreSQL Database...
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="p-12 text-center text-stone-500 text-xs space-y-2">
            <p>No coupons found matching your criteria.</p>
            {canMutate && (
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="text-amber-700 hover:underline font-bold"
              >
                Click here to create your first promotional coupon.
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider font-semibold border-b border-stone-100">
                <tr>
                  <th className="py-3 px-4">Coupon Code</th>
                  <th className="py-3 px-4">Discount</th>
                  <th className="py-3 px-4">Min. Basket</th>
                  <th className="py-3 px-4">Max. Cap</th>
                  <th className="py-3 px-4 text-center">Usages / Limit</th>
                  <th className="py-3 px-4">Valid Period</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium text-stone-700">
                {filteredCoupons.map((c) => (
                  <tr key={c.id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-stone-900 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded text-[11px] tracking-wider">
                          {c.code}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-amber-800">
                      {c.discountType === "PERCENTAGE" ? `${c.discountValue}% OFF` : `₹${c.discountValue} FLAT`}
                    </td>
                    <td className="py-3 px-4 font-mono text-stone-600">
                      {c.minOrderAmount > 0 ? `₹${c.minOrderAmount}` : "None"}
                    </td>
                    <td className="py-3 px-4 font-mono text-stone-600">
                      {c.maxDiscountAmount ? `₹${c.maxDiscountAmount}` : "No Cap"}
                    </td>
                    <td className="py-3 px-4 text-center font-mono">
                      <span className="font-bold text-stone-900">{c.totalUsages}</span>
                      <span className="text-stone-400 text-[10px]">
                        {" "}
                        / {c.usageLimitTotal !== null ? c.usageLimitTotal : "∞"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[11px] text-stone-500">
                      <div>{new Date(c.startDate).toLocaleDateString()}</div>
                      <div className="text-[10px] text-stone-400">
                        to {new Date(c.endDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(c)}
                        disabled={!canMutate}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase transition-colors ${
                          c.isExpired
                            ? "bg-rose-100 text-rose-700"
                            : c.isActive
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-stone-200 text-stone-600 hover:bg-stone-300"
                        }`}
                      >
                        {c.isExpired ? "Expired" : c.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => handleOpenDetails(c.id)}
                        className="text-stone-600 hover:text-stone-900 font-bold"
                        title="View Analytics & Usages"
                      >
                        Analytics
                      </button>
                      {canMutate && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(c)}
                            className="text-amber-700 hover:text-amber-900 font-bold"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCoupon(c)}
                            className="text-rose-600 hover:text-rose-800 font-bold"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span>
              Showing Page {page} of {totalPages} ({totalCount} total coupons)
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 bg-stone-100 hover:bg-stone-200 rounded disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 bg-stone-100 hover:bg-stone-200 rounded disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================= */}
      {/* 5. CREATE / EDIT COUPON MODAL */}
      {/* ============================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-serif font-bold text-lg text-stone-900">
                {editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : "Create New Promotional Coupon"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 flex-1 overflow-y-auto pr-1 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    Coupon Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) =>
                      setFormCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))
                    }
                    placeholder="e.g. ROYAL10"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg font-mono text-xs uppercase focus:bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Discount Type</label>
                  <select
                    value={formDiscountType}
                    onChange={(e) => setFormDiscountType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FLAT_AMOUNT">Flat Amount (₹)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    {formDiscountType === "PERCENTAGE" ? "Discount Percentage (%)" : "Flat Discount (₹)"}{" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={formDiscountType === "PERCENTAGE" ? "100" : undefined}
                    required
                    value={formDiscountValue}
                    onChange={(e) => setFormDiscountValue(e.target.value)}
                    placeholder={formDiscountType === "PERCENTAGE" ? "10" : "200"}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    Max Discount Cap (₹) {formDiscountType === "FLAT_AMOUNT" && "(N/A)"}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    disabled={formDiscountType === "FLAT_AMOUNT"}
                    value={formMaxDiscount}
                    onChange={(e) => setFormMaxDiscount(e.target.value)}
                    placeholder="e.g. 500 (Optional)"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs disabled:opacity-40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Min. Order Amount (MOV ₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formMinOrder}
                    onChange={(e) => setFormMinOrder(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Per-User Usage Limit</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formUsageLimitPerUser}
                    onChange={(e) => setFormUsageLimitPerUser(e.target.value)}
                    placeholder="1"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Total Global Usage Limit</label>
                  <input
                    type="number"
                    min="1"
                    value={formUsageLimitTotal}
                    onChange={(e) => setFormUsageLimitTotal(e.target.value)}
                    placeholder="e.g. 1000 (Empty = Unlimited)"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsActive}
                      onChange={(e) => setFormIsActive(e.target.checked)}
                      className="rounded border-stone-300 text-amber-600 focus:ring-amber-500 w-4 h-4"
                    />
                    <span className="font-bold text-stone-700">Campaign is Active</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    Start Date & Time <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    Expiry Date & Time <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? <span className="animate-spin">⏳</span> : <span>💾</span>}
                  <span>{editingCoupon ? "Update Coupon" : "Create Coupon"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* 6. COUPON ANALYTICS & USAGE DRAWER / MODAL */}
      {/* ============================================================= */}
      {isDetailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-stone-200 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">📊</span>
                <h3 className="font-serif font-bold text-lg text-stone-900">
                  Coupon Analytics: {selectedDetail?.code}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {loadingDetail || !selectedDetail ? (
              <div className="p-12 text-center text-stone-400 text-xs">
                <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Loading Analytics & Order Redemptions...
              </div>
            ) : (
              <div className="space-y-4 flex-1 overflow-y-auto text-xs">
                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
                    <span className="text-[10px] uppercase font-bold text-stone-500 block">Total Redemptions</span>
                    <span className="text-xl font-bold text-stone-900 mt-1 block">
                      {selectedDetail.totalUsages}
                    </span>
                  </div>
                  <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
                    <span className="text-[10px] uppercase font-bold text-stone-500 block">Global Limit</span>
                    <span className="text-xl font-bold text-stone-900 mt-1 block">
                      {selectedDetail.usageLimitTotal !== null ? selectedDetail.usageLimitTotal : "Unlimited"}
                    </span>
                  </div>
                  <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
                    <span className="text-[10px] uppercase font-bold text-stone-500 block">Per-Customer Limit</span>
                    <span className="text-xl font-bold text-stone-900 mt-1 block">
                      {selectedDetail.usageLimitPerUser}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                {selectedDetail.usageLimitTotal && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-stone-600 font-semibold">
                      <span>Redemption Capacity</span>
                      <span>
                        {Math.round((selectedDetail.totalUsages / selectedDetail.usageLimitTotal) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden border border-stone-200">
                      <div
                        style={{
                          width: `${Math.min(
                            100,
                            (selectedDetail.totalUsages / selectedDetail.usageLimitTotal) * 100
                          )}%`,
                        }}
                        className="bg-amber-500 h-full rounded-full transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* Recent Redemptions Table */}
                <div className="space-y-2 pt-2">
                  <h4 className="font-bold text-stone-800 text-xs">Recent Order Usages</h4>
                  {selectedDetail.usages?.length === 0 ? (
                    <p className="text-stone-400 text-xs italic py-4 text-center bg-stone-50 rounded-xl">
                      No customer redemptions recorded for this coupon yet.
                    </p>
                  ) : (
                    <div className="border border-stone-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-stone-50 text-stone-500 uppercase font-semibold border-b border-stone-100">
                          <tr>
                            <th className="py-2 px-3">Order Number</th>
                            <th className="py-2 px-3">Customer</th>
                            <th className="py-2 px-3">Discount Given</th>
                            <th className="py-2 px-3">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {selectedDetail.usages?.map((u) => (
                            <tr key={u.id}>
                              <td className="py-2 px-3 font-mono font-bold text-amber-800">
                                <Link
                                  href={`/admin/orders/${u.order.id}`}
                                  className="hover:underline"
                                >
                                  {u.order.orderNumber}
                                </Link>
                              </td>
                              <td className="py-2 px-3 text-stone-600">
                                {u.user.email || u.user.phone || "Customer"}
                              </td>
                              <td className="py-2 px-3 font-bold text-emerald-700">
                                ₹{u.discountApplied}
                              </td>
                              <td className="py-2 px-3 text-stone-400 text-[10px]">
                                {new Date(u.createdAt).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
