"use client";

import React, { useEffect, useState, useCallback, useTransition } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface OrderDetail {
  id: string;
  orderNumber: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  shippingAddressLine1: string;
  shippingAddressLine2: string | null;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  shippingCountry: string;
  orderStatus: "PENDING" | "CONFIRMED" | "PROCESSING" | "PACKED" | "SHIPPED" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED" | "RETURNED" | "REFUNDED";
  paymentStatus: "PENDING" | "AUTHORIZED" | "PAID" | "FAILED" | "REFUNDED" | "PARTIALLY_REFUNDED";
  paymentMethod: "ONLINE" | "COD";
  gatewayPaymentId: string | null;
  gatewayOrderId: string | null;
  subtotalAmount: number;
  discountAmount: number;
  shippingFee: number;
  giftWrapFee: number;
  taxAmount: number;
  finalPayableAmount: number;
  isGiftWrap: boolean;
  giftMessage: string | null;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: string;
    variantId: string | null;
    productNameSnapshot: string;
    skuSnapshot: string;
    weightGramsSnapshot: number;
    unitPriceSnapshot: number;
    quantity: number;
    gstRateSnapshot: number;
    lineTotalSnapshot: number;
  }>;
  shipments: Array<{
    id: string;
    provider: string;
    awbNumber: string;
    courierName: string;
    trackingUrl?: string | null;
    shippingLabelUrl: string | null;
    manifestId: string | null;
    status: string;
    estimatedDeliveryDate?: string | null;
    actualDeliveryDate?: string | null;
    createdAt: string;
  }>;
  couponUsages: Array<{
    coupon: {
      code: string;
      discountType: string;
      discountValue: number;
    };
  }>;
  statusHistory: Array<{
    id: string;
    previousStatus: string;
    newStatus: string;
    reason: string | null;
    createdAt: string;
    changedBy?: {
      email: string;
      roleId: string;
    } | null;
  }>;
}

export default function AdminOrderDetailPage() {
  const params = useParams();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [userRole, setUserRole] = useState<string>("CUSTOMER");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Status transition form state
  const [targetStatus, setTargetStatus] = useState<string>("PROCESSING");
  const [statusReason, setStatusReason] = useState("");
  const [isUpdatingStatus, startUpdatingStatus] = useTransition();

  // Shipment form state
  const [courierName, setCourierName] = useState("Blue Dart Express");
  const [provider, setProvider] = useState("BLUEDART");
  const [awbNumber, setAwbNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState("");
  const [manifestId, setManifestId] = useState("");
  const [isEditingTracking, setIsEditingTracking] = useState(false);
  const [isSubmittingShipment, startSubmittingShipment] = useTransition();

  // Cancellation form state
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, startCancelling] = useTransition();

  // Fetch authenticated admin
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

  // Fetch Order Details
  const fetchOrderDetails = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/admin/orders/${orderId}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || "Order not found");
      }
      const data = await res.json();
      setOrder(data.data);
      // Pre-set next logical status
      if (data.data?.orderStatus === "PENDING") setTargetStatus("CONFIRMED");
      else if (data.data?.orderStatus === "CONFIRMED") setTargetStatus("PROCESSING");
      else if (data.data?.orderStatus === "PROCESSING") setTargetStatus("PACKED");
      else if (data.data?.orderStatus === "PACKED") setTargetStatus("SHIPPED");
      else if (data.data?.orderStatus === "SHIPPED") setTargetStatus("OUT_FOR_DELIVERY");
      else if (data.data?.orderStatus === "OUT_FOR_DELIVERY") setTargetStatus("DELIVERED");

      // Pre-fill tracking form from latest shipment if available
      const existingShip = data.data?.shipments?.[0];
      if (existingShip) {
        if (existingShip.courierName) setCourierName(existingShip.courierName);
        if (existingShip.provider) setProvider(existingShip.provider);
        if (existingShip.awbNumber) setAwbNumber(existingShip.awbNumber);
        setTrackingUrl(existingShip.trackingUrl || existingShip.shippingLabelUrl || "");
        setManifestId(existingShip.manifestId || "");
        if (existingShip.estimatedDeliveryDate) {
          setEstimatedDeliveryDate(String(existingShip.estimatedDeliveryDate).slice(0, 10));
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load order details");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  // Handle Status Update
  const handleStatusTransition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    startUpdatingStatus(async () => {
      setError(null);
      try {
        const res = await fetch(`/api/v1/admin/orders/${order.id}/status`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            newStatus: targetStatus,
            reason: statusReason.trim() || `Status updated to ${targetStatus}`,
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error?.message || "Status update failed");
        }

        setSuccessMessage(`Order status successfully transitioned to ${targetStatus}!`);
        setStatusReason("");
        fetchOrderDetails();
        setTimeout(() => setSuccessMessage(null), 5000);
      } catch (err: any) {
        setError(err.message || "Failed to update order status");
      }
    });
  };

  // Handle Shipment Manifestation or Tracking Update
  const handleCreateShipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    const hasExistingShipment = order.shipments && order.shipments.length > 0;
    if (!hasExistingShipment && !awbNumber.trim()) {
      setError("AWB Tracking Number is required for dispatch");
      return;
    }

    startSubmittingShipment(async () => {
      setError(null);
      try {
        const method = hasExistingShipment ? "PUT" : "POST";
        const payload: Record<string, any> = {
          provider,
          courierName: courierName.trim(),
          awbNumber: awbNumber.trim(),
          trackingUrl: trackingUrl.trim() || null,
          estimatedDeliveryDate: estimatedDeliveryDate
            ? new Date(estimatedDeliveryDate).toISOString()
            : null,
          manifestId: manifestId.trim() || `MAN-${Date.now().toString().slice(-6)}`,
        };

        const res = await fetch(`/api/v1/admin/orders/${order.id}/shipment`, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error?.message || "Shipment tracking update failed");
        }

        setSuccessMessage(
          hasExistingShipment
            ? `Tracking details updated! Courier: ${courierName} • AWB: ${awbNumber}`
            : `Shipment manifested successfully! AWB: ${awbNumber}`
        );
        setIsEditingTracking(false);
        fetchOrderDetails();
        setTimeout(() => setSuccessMessage(null), 5000);
      } catch (err: any) {
        setError(err.message || "Failed to save shipment tracking");
      }
    });
  };

  // Handle Admin Cancellation
  const handleCancelOrder = () => {
    if (!order) return;
    const confirmCancel = window.confirm(
      `Are you sure you want to cancel order ${order.orderNumber}? This will automatically restore and restock all reserved inventory items.`
    );
    if (!confirmCancel) return;

    startCancelling(async () => {
      setError(null);
      try {
        const res = await fetch(`/api/v1/admin/orders/${order.id}/cancel`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reason: cancelReason.trim() || "Administrative order cancellation",
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error?.message || "Cancellation failed");
        }

        setSuccessMessage(`Order ${order.orderNumber} successfully cancelled and restocked.`);
        fetchOrderDetails();
        setTimeout(() => setSuccessMessage(null), 5000);
      } catch (err: any) {
        setError(err.message || "Failed to cancel order");
      }
    });
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <svg className="mx-auto h-8 w-8 animate-spin text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <p className="mt-3 text-sm text-neutral-500">Loading order fulfillment details...</p>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <svg className="mx-auto h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 className="mt-2 font-bold text-red-900">{error}</h3>
        <Link
          href="/admin/orders"
          className="mt-4 inline-block rounded-lg bg-white px-4 py-2 text-sm font-semibold text-neutral-700 shadow-sm hover:bg-neutral-50"
        >
          ← Back to Orders Queue
        </Link>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="space-y-8">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <Link href="/admin/orders" className="hover:text-neutral-900">
              Orders Queue
            </Link>
            <span>/</span>
            <span className="font-mono font-semibold text-neutral-900">{order.orderNumber}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl font-mono">
              {order.orderNumber}
            </h1>

            {/* Status Pills */}
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800 ring-1 ring-inset ring-blue-600/20">
              Status: {order.orderStatus}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                order.paymentStatus === "PAID"
                  ? "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-600/20"
                  : "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/20"
              }`}
            >
              Payment: {order.paymentStatus} ({order.paymentMethod})
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
          >
            ← Back to Orders
          </Link>
          <button
            onClick={() => window.print()}
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
          >
            Print Invoice / Slip
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
          {successMessage}
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
          {error}
        </div>
      )}

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* LEFT COLUMN: Line Items & State Station (2 Cols) */}
        <div className="space-y-8 lg:col-span-2">
          {/* Order Items Table */}
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
            <div className="border-b border-neutral-200 bg-neutral-50 px-6 py-4">
              <h2 className="text-base font-bold text-neutral-900">
                Order Items & Packaging Breakdown ({order.items.length} SKUs)
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200 text-left text-sm text-neutral-600">
                <thead className="bg-neutral-50/50 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  <tr>
                    <th className="px-6 py-3">Product / SKU</th>
                    <th className="px-6 py-3 text-right">Unit Price</th>
                    <th className="px-6 py-3 text-center">Qty</th>
                    <th className="px-6 py-3 text-center">GST %</th>
                    <th className="px-6 py-3 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 bg-white">
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-neutral-900">{item.productNameSnapshot}</div>
                        <div className="text-xs text-neutral-500 font-mono">
                          SKU: {item.skuSnapshot} • {item.weightGramsSnapshot}g
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-mono">
                        ₹{item.unitPriceSnapshot.toLocaleString("en-IN")}
                      </td>
                      <td className="px-6 py-4 text-center font-mono font-bold text-neutral-900">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 text-center font-mono text-xs text-neutral-500">
                        {item.gstRateSnapshot}%
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-neutral-900">
                        ₹{item.lineTotalSnapshot.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Fulfillment & Shipment Station */}
          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-neutral-900">3PL Shipment & Dispatch Manifest</h2>
                <p className="text-xs text-neutral-500">
                  Attach or update courier partner, AWB tracking number, tracking URL, and estimated delivery date.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {order.shipments.length > 0 && canMutate && (
                  <button
                    type="button"
                    onClick={() => setIsEditingTracking((prev) => !prev)}
                    className="rounded-lg border border-neutral-300 bg-white px-3 py-1 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                  >
                    {isEditingTracking ? "Cancel Edit" : "Edit Tracking Details"}
                  </button>
                )}
                <span className="rounded bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                  {order.shipments.length > 0 ? "MANIFESTED" : "UNASSIGNED"}
                </span>
              </div>
            </div>

            {order.shipments.length > 0 && !isEditingTracking ? (
              <div className="mt-4 space-y-3">
                {order.shipments.map((ship) => {
                  const resolvedTrackingUrl = ship.trackingUrl || ship.shippingLabelUrl;
                  return (
                    <div key={ship.id} className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                        <div>
                          <span className="block text-xs text-neutral-500">Courier Partner</span>
                          <span className="font-semibold text-neutral-900">{ship.courierName || "—"}</span>
                        </div>
                        <div>
                          <span className="block text-xs text-neutral-500">AWB Tracking #</span>
                          <span className="font-mono font-bold text-blue-600">{ship.awbNumber || "—"}</span>
                        </div>
                        <div>
                          <span className="block text-xs text-neutral-500">Estimated Delivery</span>
                          <span className="font-semibold text-emerald-700">
                            {ship.estimatedDeliveryDate
                              ? new Date(ship.estimatedDeliveryDate).toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "Not set"}
                          </span>
                        </div>
                        <div>
                          <span className="block text-xs text-neutral-500">Manifest Date</span>
                          <span className="text-xs text-neutral-700">
                            {new Date(ship.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                          </span>
                        </div>
                      </div>

                      {resolvedTrackingUrl && (
                        <div className="border-t border-neutral-200/70 pt-2.5 flex items-center justify-between text-xs">
                          <span className="text-neutral-500">Shipment Tracking URL:</span>
                          <a
                            href={resolvedTrackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono font-semibold text-blue-600 hover:underline truncate max-w-md"
                          >
                            {resolvedTrackingUrl}
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : canMutate ? (
              <form onSubmit={handleCreateShipment} className="mt-4 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700">Courier Partner</label>
                    <input
                      type="text"
                      list="courier-partner-options"
                      value={courierName}
                      onChange={(e) => {
                        setCourierName(e.target.value);
                        if (e.target.value.includes("Blue")) setProvider("BLUEDART");
                        else if (e.target.value.includes("Delhivery")) setProvider("DELHIVERY");
                        else setProvider("SHIPROCKET");
                      }}
                      placeholder="e.g. Blue Dart Express"
                      required
                      className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none"
                    />
                    <datalist id="courier-partner-options">
                      <option value="Blue Dart Express" />
                      <option value="Delhivery Surface" />
                      <option value="Shiprocket Air Express" />
                      <option value="India Post SpeedPost" />
                      <option value="DTDC Priority" />
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700">AWB Tracking Number</label>
                    <input
                      type="text"
                      value={awbNumber}
                      onChange={(e) => setAwbNumber(e.target.value)}
                      placeholder="e.g. BD-994827104"
                      required={order.shipments.length === 0}
                      className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-mono font-semibold text-neutral-900 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700">Estimated Delivery Date</label>
                    <input
                      type="date"
                      value={estimatedDeliveryDate}
                      onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700">
                      Shipment Tracking URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={trackingUrl}
                      onChange={(e) => setTrackingUrl(e.target.value)}
                      placeholder="https://www.bluedart.com/tracking?awb=..."
                      className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700">Manifest / Batch Code</label>
                    <input
                      type="text"
                      value={manifestId}
                      onChange={(e) => setManifestId(e.target.value)}
                      placeholder="e.g. MAN-2026-Q4-01"
                      className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  {order.shipments.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsEditingTracking(false)}
                      className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
                    >
                      Cancel
                    </button>
                  )}
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
                    {order.shipments.length > 0
                      ? "Save Tracking Updates"
                      : "Generate Dispatch Manifest & Mark Shipped"}
                  </button>
                </div>
              </form>
            ) : (
              <p className="mt-4 text-xs text-neutral-500">Shipment not manifested yet.</p>
            )}
          </div>

          {/* State Machine Transition Station */}
          {canMutate && order.orderStatus !== "DELIVERED" && order.orderStatus !== "CANCELLED" && (
            <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-bold text-neutral-900">Order State Transition Station</h2>
              <p className="text-xs text-neutral-500">
                Enforce authoritative order status advancements with audit reason logs.
              </p>

              <form onSubmit={handleStatusTransition} className="mt-4 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700">Advance To Status</label>
                    <select
                      value={targetStatus}
                      onChange={(e) => setTargetStatus(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold text-neutral-900 focus:border-amber-500 focus:outline-none"
                    >
                      <option value="CONFIRMED">CONFIRMED (Order Verified)</option>
                      <option value="PROCESSING">PROCESSING (Picking Started)</option>
                      <option value="PACKED">PACKED (QC Verified & Box Sealed)</option>
                      <option value="SHIPPED">SHIPPED (In-Transit)</option>
                      <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY (Out for Doorstep Delivery)</option>
                      <option value="DELIVERED">DELIVERED (Handover Complete)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700">Audit Notes</label>
                    <input
                      type="text"
                      value={statusReason}
                      onChange={(e) => setStatusReason(e.target.value)}
                      placeholder="e.g. Scanned at Kashmir sorting hub"
                      className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={handleCancelOrder}
                    disabled={isCancelling}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-800"
                  >
                    Cancel Order & Restock Inventory
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
                    Advance Order Status
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Audit Timeline / Status History */}
          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-neutral-900">Order Audit History & State Logs</h2>
            <div className="mt-4 space-y-4">
              {order.statusHistory.length === 0 ? (
                <p className="text-xs text-neutral-500">No transition history logged.</p>
              ) : (
                order.statusHistory.map((hist, index) => (
                  <div key={hist.id} className="relative flex gap-4 pl-2">
                    <div className="flex flex-col items-center">
                      <div className="h-2.5 w-2.5 rounded-full bg-amber-500 ring-4 ring-amber-100" />
                      {index < order.statusHistory.length - 1 && <div className="h-full w-0.5 bg-neutral-200 my-1" />}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-neutral-900">
                          {hist.previousStatus} → <span className="text-amber-600">{hist.newStatus}</span>
                        </span>
                        <span className="font-mono text-neutral-400">
                          {new Date(hist.createdAt).toLocaleString("en-IN", {
                            timeZone: "Asia/Kolkata",
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-neutral-600">{hist.reason || "Automatic state progression"}</p>
                      {hist.changedBy?.email && (
                        <span className="mt-0.5 inline-block text-[11px] text-neutral-400">
                          By: {hist.changedBy.email}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Customer, Shipping & Financial Summary (1 Col) */}
        <div className="space-y-6">
          {/* Customer & Shipping Card */}
          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500">Customer & Shipping</h3>
            <div className="mt-4 space-y-3 text-sm">
              <div>
                <span className="block text-xs text-neutral-400">Recipient Name</span>
                <span className="font-semibold text-neutral-900">{order.customerName}</span>
              </div>
              <div>
                <span className="block text-xs text-neutral-400">Phone & Email</span>
                <span className="font-mono text-neutral-700">{order.customerPhone}</span>
                <span className="block text-xs text-neutral-500">{order.customerEmail}</span>
              </div>
              <div>
                <span className="block text-xs text-neutral-400">Shipping Address</span>
                <p className="text-neutral-700">
                  {order.shippingAddressLine1}
                  {order.shippingAddressLine2 && `, ${order.shippingAddressLine2}`}
                  <br />
                  {order.shippingCity}, {order.shippingState} -{" "}
                  <span className="font-mono font-bold text-neutral-900">{order.shippingPostalCode}</span>
                  <br />
                  {order.shippingCountry}
                </p>
              </div>

              {order.isGiftWrap && (
                <div className="rounded-lg bg-pink-50 p-3 text-xs text-pink-900">
                  <span className="font-bold">🎁 Gift Wrapped Order:</span>
                  <p className="mt-1 italic">"{order.giftMessage || "Standard Premium Gift Wrapping"}"</p>
                </div>
              )}
            </div>
          </div>

          {/* Financials & Settlement Card */}
          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500">Financial Breakdown</h3>
            <div className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal MRP:</span>
                <span className="font-mono">₹{order.subtotalAmount.toLocaleString("en-IN")}</span>
              </div>

              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Coupon Savings:</span>
                  <span className="font-mono">-₹{order.discountAmount.toLocaleString("en-IN")}</span>
                </div>
              )}

              <div className="flex justify-between text-neutral-600">
                <span>GST Tax Breakdown:</span>
                <span className="font-mono">₹{order.taxAmount.toLocaleString("en-IN")}</span>
              </div>

              <div className="flex justify-between text-neutral-600">
                <span>Shipping & Delivery:</span>
                <span className="font-mono">
                  {order.shippingFee === 0 ? "FREE" : `₹${order.shippingFee.toLocaleString("en-IN")}`}
                </span>
              </div>

              {order.giftWrapFee > 0 && (
                <div className="flex justify-between text-neutral-600">
                  <span>Gift Packaging:</span>
                  <span className="font-mono">₹{order.giftWrapFee.toLocaleString("en-IN")}</span>
                </div>
              )}

              <div className="border-t border-neutral-200 pt-3 flex justify-between text-base font-bold text-neutral-900">
                <span>Final Payable:</span>
                <span className="font-mono text-amber-700">
                  ₹{order.finalPayableAmount.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <div className="mt-5 border-t border-neutral-100 pt-4 text-xs text-neutral-500">
              <span className="block font-semibold text-neutral-700">Payment Metadata</span>
              <div className="mt-1 space-y-1 font-mono">
                <div>Method: {order.paymentMethod}</div>
                {order.gatewayOrderId && <div>Gateway Order: {order.gatewayOrderId}</div>}
                {order.gatewayPaymentId && <div>Payment ID: {order.gatewayPaymentId}</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
