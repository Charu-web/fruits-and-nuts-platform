"use client";

import React, { useEffect, useState, useCallback, useTransition } from "react";
import Link from "next/link";

interface CustomerAddress {
  id: string;
  recipientName: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  isDefaultShipping: boolean;
}

interface CustomerItem {
  id: string;
  email: string | null;
  phone: string | null;
  roleId: string;
  isActive: boolean;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  createdAt: string;
  lastLoginAt?: string | null;
  totalOrders: number;
  totalSpend: number;
  primaryCity?: string | null;
  primaryState?: string | null;
  primaryPincode?: string | null;
  addresses?: CustomerAddress[];
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Search & Filter
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE" | "VERIFIED">("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Detail Modal
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isToggling, startToggling] = useTransition();

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      params.set("page", page.toString());
      params.set("limit", "20");

      const res = await fetch(`/api/v1/admin/customers?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to load customers (HTTP ${res.status})`);
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setCustomers(data.data);
        if (data.meta) {
          setTotalPages(data.meta.totalPages || 1);
          setTotalCount(data.meta.total || data.data.length);
        }
      } else {
        throw new Error(data.error?.message || "Failed to load customer list");
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch customer data");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleToggleStatus = async (customer: CustomerItem) => {
    const nextState = !customer.isActive;
    const confirmMsg = nextState
      ? `Reactivate account for ${customer.name}?`
      : `Deactivate / suspend account for ${customer.name}? Customer will not be able to log in.`;

    if (!window.confirm(confirmMsg)) return;

    startToggling(async () => {
      try {
        const res = await fetch("/api/v1/admin/customers", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: customer.id, isActive: nextState }),
        });
        const data = await res.json();
        if (data.success) {
          setSuccessMessage(`Account status updated for ${customer.name}.`);
          setTimeout(() => setSuccessMessage(null), 4000);
          fetchCustomers();
          if (selectedCustomer?.id === customer.id) {
            setSelectedCustomer({ ...selectedCustomer, isActive: nextState });
          }
        } else {
          alert(data.error?.message || "Failed to update account status");
        }
      } catch (err: any) {
        alert(err.message || "Network error while updating status");
      }
    });
  };

  const handleExportCSV = () => {
    if (customers.length === 0) return;
    const headers = ["ID", "Name", "Email", "Phone", "Status", "City", "State", "Orders", "Spend_INR", "Registered_At"];
    const rows = customers.map((c) => [
      `"${c.id}"`,
      `"${c.name}"`,
      `"${c.email || ""}"`,
      `"${c.phone || ""}"`,
      `"${c.isActive ? "ACTIVE" : "INACTIVE"}"`,
      `"${c.primaryCity || ""}"`,
      `"${c.primaryState || ""}"`,
      c.totalOrders,
      c.totalSpend,
      `"${new Date(c.createdAt).toLocaleDateString("en-IN")}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `fruits_nuts_customers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // KPI Calculations
  const verifiedCount = customers.filter((c) => c.isPhoneVerified || c.isEmailVerified).length;
  const activeCount = customers.filter((c) => c.isActive).length;
  const totalLtv = customers.reduce((acc, c) => acc + (c.totalSpend || 0), 0);
  const avgSpend = customers.length > 0 ? Math.round(totalLtv / customers.length) : 0;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">👥</span>
            <h1 className="text-2xl font-serif font-bold text-stone-900 tracking-tight">
              Customer Directory & Relationship Management
            </h1>
          </div>
          <p className="text-sm text-stone-500 mt-1">
            Registered clientele, delivery locations, order velocity, and customer lifetime value (CLV).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={customers.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 transition-colors disabled:opacity-50"
          >
            <span>📥</span> Export CSV
          </button>
          <button
            type="button"
            onClick={() => fetchCustomers()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[#102C21] hover:bg-[#1a4434] text-white transition-colors shadow-sm"
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
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-900 font-bold">
            ✕
          </button>
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
          <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider block">Total Registered</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-stone-900 font-mono">{totalCount}</span>
            <span className="text-xs text-stone-400 font-medium">accounts</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider block">Verified Profiles</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-emerald-700 font-mono">{verifiedCount}</span>
            <span className="text-xs text-emerald-600 font-medium">
              ({totalCount > 0 ? Math.round((verifiedCount / totalCount) * 100) : 0}%)
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider block">Cumulative LTV</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-stone-900 font-mono">
              ₹{totalLtv.toLocaleString("en-IN")}
            </span>
            <span className="text-xs text-stone-400 font-medium">realized</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider block">Avg Spend / User</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-[#B99A58] font-mono">
              ₹{avgSpend.toLocaleString("en-IN")}
            </span>
            <span className="text-xs text-stone-400 font-medium">per client</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-2.5 text-stone-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Search by customer name, email, 10-digit mobile, or city..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-emerald-700 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto bg-stone-100 p-1 rounded-xl text-xs font-medium text-stone-600">
            {(["ALL", "ACTIVE", "INACTIVE", "VERIFIED"] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => {
                  setStatusFilter(status);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                  statusFilter === status
                    ? "bg-white text-stone-900 shadow-sm font-semibold"
                    : "hover:text-stone-900 text-stone-500"
                }`}
              >
                {status === "ALL" && "All Clientele"}
                {status === "ACTIVE" && "Active Only"}
                {status === "INACTIVE" && "Suspended"}
                {status === "VERIFIED" && "Verified Contacts"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Customers Data Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-stone-400 text-xs">
            <div className="w-7 h-7 border-2 border-emerald-800 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading customer profiles and purchase metrics...
          </div>
        ) : customers.length === 0 ? (
          <div className="p-16 text-center text-stone-400 text-xs space-y-2">
            <span className="text-3xl block">👤</span>
            <p className="text-sm font-medium text-stone-700">No customer profiles match your search criteria.</p>
            <p className="text-stone-400">Try adjusting your filters or search keywords.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4 font-semibold">Client</th>
                  <th className="py-3 px-4 font-semibold">Contact & Verification</th>
                  <th className="py-3 px-4 font-semibold">Primary Region</th>
                  <th className="py-3 px-4 font-semibold text-center">Orders</th>
                  <th className="py-3 px-4 font-semibold text-right">Lifetime Spend</th>
                  <th className="py-3 px-4 font-semibold">Registered</th>
                  <th className="py-3 px-4 font-semibold text-center">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {customers.map((c) => {
                  const initials = c.name
                    ? c.name
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()
                    : "CU";

                  return (
                    <tr key={c.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#FAF7F0] border border-[#B99A58]/30 text-[#102C21] font-bold text-xs flex items-center justify-center flex-shrink-0">
                            {initials}
                          </div>
                          <div>
                            <span className="font-semibold text-stone-900 block">{c.name}</span>
                            <span className="text-[11px] text-stone-400 font-mono">{c.id.slice(0, 14)}...</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-stone-800">{c.phone || "No phone"}</span>
                            {c.isPhoneVerified && (
                              <span className="inline-flex items-center px-1.5 py-0.2 text-[9px] font-bold rounded bg-emerald-100 text-emerald-800">
                                OTP ✓
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-stone-500 block truncate max-w-[180px]">
                            {c.email || "No email"}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-stone-600">
                        {c.primaryCity ? (
                          <div>
                            <span className="font-medium text-stone-900">{c.primaryCity}</span>
                            <span className="text-[11px] text-stone-400 block">{c.primaryState || ""}</span>
                          </div>
                        ) : (
                          <span className="text-stone-400 italic">Not set</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-stone-100 text-stone-700 border border-stone-200">
                          {c.totalOrders} {c.totalOrders === 1 ? "order" : "orders"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <span className="font-mono font-bold text-stone-900">
                          ₹{c.totalSpend.toLocaleString("en-IN")}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-stone-500">
                        {new Date(c.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                            c.isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {c.isActive ? "Active" : "Suspended"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCustomer(c);
                              setIsDetailModalOpen(true);
                            }}
                            className="px-2.5 py-1 text-[11px] font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors border border-stone-200"
                          >
                            Details
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(c)}
                            disabled={isToggling}
                            className={`px-2 py-1 text-[11px] font-semibold rounded-lg transition-colors border ${
                              c.isActive
                                ? "text-rose-700 hover:bg-rose-50 border-rose-200"
                                : "text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                            }`}
                          >
                            {c.isActive ? "Suspend" : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs text-stone-600">
            <span>
              Showing Page {page} of {totalPages} ({totalCount} total clientele)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1 rounded bg-white border border-stone-300 disabled:opacity-40 font-semibold"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1 rounded bg-white border border-stone-300 disabled:opacity-40 font-semibold"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Customer Detail Drawer / Modal */}
      {isDetailModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-stone-200">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div className="flex items-center gap-2">
                <span className="text-xl">👤</span>
                <h3 className="font-serif font-bold text-stone-900 text-sm">
                  Client Profile: {selectedCustomer.name}
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

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Customer Stats Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
                  <span className="text-[10px] uppercase font-bold text-stone-500 block">Total Orders</span>
                  <span className="text-lg font-bold text-stone-900 mt-1 block">
                    {selectedCustomer.totalOrders}
                  </span>
                </div>
                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
                  <span className="text-[10px] uppercase font-bold text-stone-500 block">Lifetime Spend</span>
                  <span className="text-lg font-bold text-stone-900 font-mono mt-1 block">
                    ₹{selectedCustomer.totalSpend.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
                  <span className="text-[10px] uppercase font-bold text-stone-500 block">Account Status</span>
                  <span
                    className={`text-xs font-bold mt-1 inline-block uppercase ${
                      selectedCustomer.isActive ? "text-emerald-700" : "text-rose-700"
                    }`}
                  >
                    {selectedCustomer.isActive ? "Active" : "Suspended"}
                  </span>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-2">
                <h4 className="font-bold text-stone-800 text-[11px] uppercase tracking-wider">
                  Contact Information
                </h4>
                <div className="grid grid-cols-2 gap-2 text-stone-600">
                  <div>
                    <span className="text-[10px] text-stone-400 block">Email Address</span>
                    <span className="font-medium text-stone-900">{selectedCustomer.email || "None"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 block">Mobile Phone</span>
                    <span className="font-medium text-stone-900">{selectedCustomer.phone || "None"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 block">Member Since</span>
                    <span className="font-medium text-stone-900">
                      {new Date(selectedCustomer.createdAt).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 block">Last Active</span>
                    <span className="font-medium text-stone-900">
                      {selectedCustomer.lastLoginAt
                        ? new Date(selectedCustomer.lastLoginAt).toLocaleDateString("en-IN")
                        : "Never"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Delivery Address Book */}
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-2">
                <h4 className="font-bold text-stone-800 text-[11px] uppercase tracking-wider">
                  Primary Delivery Destination
                </h4>
                {selectedCustomer.addresses && selectedCustomer.addresses.length > 0 ? (
                  selectedCustomer.addresses.map((addr) => (
                    <div key={addr.id} className="bg-white p-3 rounded-lg border border-stone-200 text-stone-700 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-stone-900">{addr.recipientName}</span>
                        {addr.isDefaultShipping && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                            DEFAULT
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-500">
                        {addr.addressLine1}
                        {addr.addressLine2 ? `, ${addr.addressLine2}` : ""}
                      </p>
                      <p className="text-[11px] text-stone-600 font-medium">
                        {addr.city}, {addr.state} - {addr.postalCode}
                      </p>
                      <p className="text-[10px] text-stone-400">Phone: {addr.phone}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-stone-400 italic text-[11px]">
                    {selectedCustomer.primaryCity
                      ? `${selectedCustomer.primaryCity}, ${selectedCustomer.primaryState || ""} (PIN: ${selectedCustomer.primaryPincode || ""})`
                      : "No delivery address registered yet."}
                  </div>
                )}
              </div>

              {/* Direct Link to Orders */}
              <div className="flex gap-2 pt-2">
                <Link
                  href={`/admin/orders?search=${encodeURIComponent(selectedCustomer.phone || selectedCustomer.email || "")}`}
                  className="flex-1 py-2 text-center text-xs font-semibold rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 transition-colors"
                >
                  View Order History →
                </Link>
                <button
                  type="button"
                  onClick={() => handleToggleStatus(selectedCustomer)}
                  className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-colors ${
                    selectedCustomer.isActive
                      ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                      : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
                  }`}
                >
                  {selectedCustomer.isActive ? "Suspend Customer" : "Reactivate Account"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
