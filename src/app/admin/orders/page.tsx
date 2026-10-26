"use client";

import React, { useEffect, useState, useCallback, useTransition } from "react";
import Link from "next/link";

interface OrderSummary {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  shippingCity: string;
  orderStatus: "PENDING" | "CONFIRMED" | "PROCESSING" | "PACKED" | "SHIPPED" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED" | "RETURNED" | "REFUNDED";
  paymentStatus: "PENDING" | "AUTHORIZED" | "PAID" | "FAILED" | "REFUNDED" | "PARTIALLY_REFUNDED";
  paymentMethod: "ONLINE" | "COD";
  itemCount: number;
  finalPayableAmount: number;
  createdAt: string;
  shipmentAwb: string | null;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [userRole, setUserRole] = useState<string>("CUSTOMER");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filter States
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  // Quick Action Modal States
  const [selectedOrder, setSelectedOrder] = useState<OrderSummary | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isShipModalOpen, setIsShipModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  // Quick Transition Form State
  const [newStatus, setNewStatus] = useState<string>("PROCESSING");
  const [statusReason, setStatusReason] = useState("");
  const [isUpdatingStatus, startUpdatingStatus] = useTransition();

  // Quick Shipment Form State
  const [courierName, setCourierName] = useState("Blue Dart Express");
  const [provider, setProvider] = useState("BLUEDART");
  const [awbNumber, setAwbNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState("");
  const [manifestId, setManifestId] = useState("");
  const [isSubmittingShipment, startSubmittingShipment] = useTransition();

  // Quick Cancel Form State
  const [cancelReason, setCancelReason] = useState("Customer requested cancellation before dispatch");
  const [isCancelling, startCancelling] = useTransition();

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

  const canMutate = ["SUPER_ADMIN", "ORDER_MGR"].includes(userRole);

  // Fetch Orders
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter !== "ALL") params.set("orderStatus", statusFilter);
      if (paymentFilter !== "ALL") params.set("paymentStatus", paymentFilter);
      if (methodFilter !== "ALL") params.set("paymentMethod", methodFilter);

      const res = await fetch(`/api/v1/admin/orders?${params.toString()}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || "Failed to fetch orders");
      }
      const data = await res.json();
      setOrders(data.data || []);
      if (data.meta) {
        setTotalOrders(data.meta.total || 0);
        setTotalPages(Math.ceil((data.meta.total || 1) / (data.meta.limit || 20)));
      }
    } catch (err: any) {
      setError(err.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, paymentFilter, methodFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Quick Status Update
  const handleStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    startUpdatingStatus(async () => {
      setError(null);
      try {
        const res = await fetch(`/api/v1/admin/orders/${selectedOrder.id}/status`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            newStatus,
            reason: statusReason.trim() || `Status manually advanced to ${newStatus}`,
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error?.message || "Status transition failed");
        }

        setSuccessMessage(`Order ${selectedOrder.orderNumber} successfully advanced to ${newStatus}!`);
        setIsStatusModalOpen(false);
        fetchOrders();
        setTimeout(() => setSuccessMessage(null), 5000);
      } catch (err: any) {
        setError(err.message || "Failed to update status");
      }
    });
  };

  // Quick Shipment Manifestation
  const handleShipmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    if (!awbNumber.trim()) {
      setError("AWB Tracking Number is required for dispatch");
      return;
    }

    startSubmittingShipment(async () => {
      setError(null);
      try {
        const res = await fetch(`/api/v1/admin/orders/${selectedOrder.id}/shipment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provider,
            courierName,
            awbNumber: awbNumber.trim(),
            trackingUrl: trackingUrl.trim() || null,
            estimatedDeliveryDate: estimatedDeliveryDate
              ? new Date(estimatedDeliveryDate).toISOString()
              : null,
            manifestId: manifestId.trim() || `MAN-${Date.now().toString().slice(-6)}`,
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error?.message || "Shipment creation failed");
        }

        setSuccessMessage(`Shipment manifested for Order ${selectedOrder.orderNumber}! AWB: ${awbNumber}`);
        setIsShipModalOpen(false);
        fetchOrders();
        setTimeout(() => setSuccessMessage(null), 5000);
      } catch (err: any) {
        setError(err.message || "Failed to manifest shipment");
      }
    });
  };

  // Quick Order Cancellation
  const handleCancelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    startCancelling(async () => {
      setError(null);
      try {
        const res = await fetch(`/api/v1/admin/orders/${selectedOrder.id}/cancel`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: cancelReason.trim() }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error?.message || "Order cancellation failed");
        }

        setSuccessMessage(`Order ${selectedOrder.orderNumber} cancelled and inventory restocked.`);
        setIsCancelModalOpen(false);
        fetchOrders();
        setTimeout(() => setSuccessMessage(null), 5000);
      } catch (err: any) {
        setError(err.message || "Failed to cancel order");
      }
    });
  };

  // KPI calculations
  const pendingCount = orders.filter((o) =>
    ["CONFIRMED", "PROCESSING", "PACKED"].includes(o.orderStatus)
  ).length;
  const inTransitCount = orders.filter((o) =>
    ["SHIPPED", "OUT_FOR_DELIVERY"].includes(o.orderStatus)
  ).length;
  const deliveredCount = orders.filter((o) => o.orderStatus === "DELIVERED").length;
  const cancelledCount = orders.filter((o) => o.orderStatus === "CANCELLED").length;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
              Order Fulfillment & Dispatch Center
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-800 ring-1 ring-inset ring-blue-600/20">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Live Operations
            </span>
          </div>
          <p className="mt-1 text-sm text-neutral-500">
            Real-time multi-state order processing, warehouse pick-pack workflows, 3PL shipment manifestation, and tracking.
          </p>
        </div>

        {/* Global Refresh Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 shadow-sm hover:bg-neutral-50"
          >
            <svg className={`h-4 w-4 ${loading ? "animate-spin text-amber-600" : "text-neutral-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Orders
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
            <strong>Read-Only View:</strong> Your role ({userRole}) has view-only permissions for orders. Status transitions and shipment dispatch require <code className="font-mono font-semibold">SUPER_ADMIN</code> or <code className="font-mono font-semibold">ORDER_MGR</code> authorization.
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Total Orders</span>
            <svg className="h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <p className="mt-3 text-2xl font-bold text-neutral-900">{totalOrders || orders.length}</p>
          <div className="mt-2 text-xs text-neutral-500">All registered customer orders</div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Pending Fulfillment</span>
            <svg className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="mt-3 text-2xl font-bold text-amber-600">{pendingCount}</p>
          <div className="mt-2 text-xs text-amber-600 font-medium">Pick, pack & dispatch queue</div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">In Transit</span>
            <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
          </div>
          <p className="mt-3 text-2xl font-bold text-blue-600">{inTransitCount}</p>
          <div className="mt-2 text-xs text-neutral-500">Shipped with 3PL AWB</div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Delivered</span>
            <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="mt-3 text-2xl font-bold text-emerald-600">{deliveredCount}</p>
          <div className="mt-2 text-xs text-neutral-500">Successfully completed</div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Cancelled</span>
            <svg className="h-5 w-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="mt-3 text-2xl font-bold text-rose-600">{cancelledCount}</p>
          <div className="mt-2 text-xs text-neutral-500">Restocked inventory</div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1 max-w-md">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by Order #, customer name, phone, email..."
            className="w-full rounded-lg border border-neutral-300 bg-white py-2 pl-9 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-neutral-500">Order Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 focus:border-amber-500 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">PENDING</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="PROCESSING">PROCESSING</option>
              <option value="PACKED">PACKED</option>
              <option value="SHIPPED">SHIPPED</option>
              <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
              <option value="DELIVERED">DELIVERED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-neutral-500">Payment:</span>
            <select
              value={paymentFilter}
              onChange={(e) => {
                setPaymentFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 focus:border-amber-500 focus:outline-none"
            >
              <option value="ALL">All Payments</option>
              <option value="PAID">PAID</option>
              <option value="PENDING">PENDING</option>
              <option value="AUTHORIZED">AUTHORIZED</option>
              <option value="FAILED">FAILED</option>
              <option value="REFUNDED">REFUNDED</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-neutral-500">Method:</span>
            <select
              value={methodFilter}
              onChange={(e) => {
                setMethodFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 focus:border-amber-500 focus:outline-none"
            >
              <option value="ALL">All Methods</option>
              <option value="ONLINE">ONLINE (Prepaid)</option>
              <option value="COD">COD (Cash on Delivery)</option>
            </select>
          </div>

          {(statusFilter !== "ALL" || paymentFilter !== "ALL" || methodFilter !== "ALL" || search) && (
            <button
              onClick={() => {
                setStatusFilter("ALL");
                setPaymentFilter("ALL");
                setMethodFilter("ALL");
                setSearch("");
                setPage(1);
              }}
              className="text-xs font-medium text-amber-600 hover:text-amber-800"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200 text-left text-sm text-neutral-600">
            <thead className="bg-neutral-50 text-xs font-semibold uppercase tracking-wider text-neutral-500">
              <tr>
                <th className="px-6 py-3.5">Order Number</th>
                <th className="px-6 py-3.5">Date (IST)</th>
                <th className="px-6 py-3.5">Customer & City</th>
                <th className="px-6 py-3.5">Order Status</th>
                <th className="px-6 py-3.5">Payment</th>
                <th className="px-6 py-3.5 text-center">Items</th>
                <th className="px-6 py-3.5 text-right">Total (₹)</th>
                <th className="px-6 py-3.5">Tracking / AWB</th>
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
                    <span className="mt-2 block text-xs">Loading orders & fulfillment queues...</span>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-neutral-500">
                    <svg className="mx-auto h-8 w-8 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <span className="mt-2 block font-medium">No matching orders found.</span>
                    <span className="text-xs text-neutral-400">Try adjusting your filters or search terms.</span>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-neutral-50/70 transition">
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-mono font-bold text-amber-600 hover:text-amber-700 hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                    </td>

                    <td className="px-6 py-4 text-xs font-mono text-neutral-500 whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleString("en-IN", {
                        timeZone: "Asia/Kolkata",
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-medium text-neutral-900">{order.customerName}</div>
                      <div className="text-xs text-neutral-500">
                        {order.customerPhone} • {order.shippingCity}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {order.orderStatus === "PENDING" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-semibold text-neutral-700">
                          PENDING
                        </span>
                      )}
                      {order.orderStatus === "CONFIRMED" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-800 ring-1 ring-inset ring-blue-600/20">
                          CONFIRMED
                        </span>
                      )}
                      {order.orderStatus === "PROCESSING" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-600/20">
                          PROCESSING
                        </span>
                      )}
                      {order.orderStatus === "PACKED" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-800 ring-1 ring-inset ring-indigo-600/20">
                          PACKED
                        </span>
                      )}
                      {order.orderStatus === "SHIPPED" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-800 ring-1 ring-inset ring-purple-600/20">
                          SHIPPED
                        </span>
                      )}
                      {order.orderStatus === "OUT_FOR_DELIVERY" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-800 ring-1 ring-inset ring-teal-600/20">
                          OUT FOR DELIVERY
                        </span>
                      )}
                      {order.orderStatus === "DELIVERED" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-600/20">
                          DELIVERED
                        </span>
                      )}
                      {order.orderStatus === "CANCELLED" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-800 ring-1 ring-inset ring-rose-600/20">
                          CANCELLED
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                            order.paymentStatus === "PAID"
                              ? "bg-emerald-50 text-emerald-700"
                              : order.paymentStatus === "FAILED"
                              ? "bg-rose-50 text-rose-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {order.paymentStatus}
                        </span>
                        <span className="text-[11px] font-mono text-neutral-500">{order.paymentMethod}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center font-mono text-sm text-neutral-700">
                      {order.itemCount}
                    </td>

                    <td className="px-6 py-4 text-right font-mono font-bold text-neutral-900">
                      ₹{order.finalPayableAmount.toLocaleString("en-IN")}
                    </td>

                    <td className="px-6 py-4 text-xs font-mono">
                      {order.shipmentAwb ? (
                        <span className="rounded bg-blue-50 px-2 py-0.5 font-semibold text-blue-700">
                          {order.shipmentAwb}
                        </span>
                      ) : (
                        <span className="text-neutral-400">Unassigned</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="rounded px-2 py-1 text-xs font-semibold text-neutral-700 hover:bg-neutral-100"
                        >
                          View
                        </Link>

                        {canMutate && order.orderStatus !== "DELIVERED" && order.orderStatus !== "CANCELLED" && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedOrder(order);
                                if (order.orderStatus === "PENDING") setNewStatus("CONFIRMED");
                                else if (order.orderStatus === "CONFIRMED") setNewStatus("PROCESSING");
                                else if (order.orderStatus === "PROCESSING") setNewStatus("PACKED");
                                else if (order.orderStatus === "PACKED") setNewStatus("SHIPPED");
                                else if (order.orderStatus === "SHIPPED") setNewStatus("OUT_FOR_DELIVERY");
                                else setNewStatus("DELIVERED");
                                setIsStatusModalOpen(true);
                              }}
                              className="rounded px-2 py-1 text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100"
                            >
                              Status
                            </button>

                            {!order.shipmentAwb && (
                              <button
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setAwbNumber(`BD-${Date.now().toString().slice(-6)}`);
                                  setIsShipModalOpen(true);
                                }}
                                className="rounded px-2 py-1 text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100"
                              >
                                Ship
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between border-t border-neutral-200 bg-white px-6 py-3 text-xs text-neutral-500">
          <div>
            Showing page <span className="font-semibold">{page}</span> of{" "}
            <span className="font-semibold">{totalPages}</span> ({totalOrders} total orders)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="inline-flex items-center gap-1 rounded border border-neutral-200 bg-white px-2.5 py-1 font-medium hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
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

      {/* ========================================================================= */}
      {/* MODAL 1: QUICK STATUS ADVANCEMENT */}
      {/* ========================================================================= */}
      {isStatusModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-lg font-bold text-neutral-900">
                Advance Status: {selectedOrder.orderNumber}
              </h3>
              <button
                onClick={() => setIsStatusModalOpen(false)}
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleStatusSubmit} className="mt-4 space-y-4">
              <div>
                <span className="text-xs text-neutral-500">Current Status:</span>
                <span className="ml-2 font-mono font-bold text-neutral-900">{selectedOrder.orderStatus}</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700">Target New Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold text-neutral-900 focus:border-amber-500 focus:outline-none"
                >
                  <option value="CONFIRMED">CONFIRMED (Order Verified)</option>
                  <option value="PROCESSING">PROCESSING (Picker Assigned)</option>
                  <option value="PACKED">PACKED (Sealed in Warehouse)</option>
                  <option value="SHIPPED">SHIPPED (Handed to 3PL Courier)</option>
                  <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY (Out for Delivery)</option>
                  <option value="DELIVERED">DELIVERED (Customer Confirmed)</option>
                  <option value="CANCELLED">CANCELLED (Abort & Restock)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700">Audit Reason / Transition Note</label>
                <textarea
                  rows={2}
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="e.g. Batch scanned and packed in Kashmir facility"
                  className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsStatusModalOpen(false)}
                  className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingStatus}
                  className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  {isUpdatingStatus && (
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                  Confirm Transition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: QUICK SHIPMENT MANIFESTATION */}
      {/* ========================================================================= */}
      {isShipModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-neutral-900">Manifest 3PL Shipment</h3>
                  <p className="text-xs text-neutral-500">Order: {selectedOrder.orderNumber} ({selectedOrder.customerName})</p>
                </div>
              </div>
              <button
                onClick={() => setIsShipModalOpen(false)}
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleShipmentSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700">Courier Name</label>
                  <select
                    value={courierName}
                    onChange={(e) => {
                      setCourierName(e.target.value);
                      if (e.target.value.includes("Blue")) setProvider("BLUEDART");
                      else if (e.target.value.includes("Delhivery")) setProvider("DELHIVERY");
                      else setProvider("SHIPROCKET");
                    }}
                    className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="Blue Dart Express">Blue Dart Express</option>
                    <option value="Delhivery Surface">Delhivery Surface</option>
                    <option value="Shiprocket Express">Shiprocket Air Express</option>
                    <option value="India Post SpeedPost">India Post SpeedPost</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700">Provider Code</label>
                  <input
                    type="text"
                    value={provider}
                    readOnly
                    className="mt-1 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-mono text-neutral-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700">AWB Tracking Number</label>
                <input
                  type="text"
                  value={awbNumber}
                  onChange={(e) => setAwbNumber(e.target.value)}
                  placeholder="e.g. BD-8829104819"
                  required
                  className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-mono font-semibold text-neutral-900 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700">Estimated Delivery Date</label>
                  <input
                    type="date"
                    value={estimatedDeliveryDate}
                    onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700">Manifest / Batch ID</label>
                  <input
                    type="text"
                    value={manifestId}
                    onChange={(e) => setManifestId(e.target.value)}
                    placeholder="e.g. MAN-2026-DELHI-01"
                    className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700">Tracking URL (Optional)</label>
                <input
                  type="url"
                  value={trackingUrl}
                  onChange={(e) => setTrackingUrl(e.target.value)}
                  placeholder="https://www.bluedart.com/tracking?awb=..."
                  className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-800">
                Attaching this shipment will automatically update order status to <span className="font-bold">SHIPPED</span> and trigger customer dispatch notifications.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsShipModalOpen(false)}
                  className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingShipment}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmittingShipment && (
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                  Manifest & Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
