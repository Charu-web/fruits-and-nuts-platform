"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Package, Calendar, Receipt, Ban, AlertCircle, Truck } from "lucide-react";
import { formatPrice, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface OrderItem {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  createdAt: string;
  shipment?: {
    courierName?: string | null;
    awbNumber?: string | null;
    estimatedDeliveryDate?: string | null;
  } | null;
  items: {
    id: string;
    quantity: number;
    totalPrice: number;
    variant: {
      weightGrams: number;
      product: {
        name: string;
      };
    };
  }[];
}

export default function AccountOrdersPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [cancelModalOrderId, setCancelModalOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("Order created by mistake");
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/v1/orders?limit=20");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setOrders(json.data.items || []);
        }
      }
    } catch (err) {
      console.error("Failed to fetch orders", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancelOrder = async () => {
    if (!cancelModalOrderId) return;

    try {
      setCancellingOrderId(cancelModalOrderId);
      setActionError(null);
      const res = await fetch(`/api/v1/orders/${cancelModalOrderId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setCancelModalOrderId(null);
        await fetchOrders();
      } else {
        setActionError(json.error?.message || "Failed to cancel order.");
      }
    } catch {
      setActionError("Failed to cancel order. Please try again later.");
    } finally {
      setCancellingOrderId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-[#DCE5D8] p-6 shadow-xs space-y-4">
        <h3 className="font-serif font-bold text-[#173D2C] text-xl border-b border-[#DCE5D8]/70 pb-3">
          My Order History & Live Tracking
        </h3>

        {actionError && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-28 bg-[#FAF7F0] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : orders.length > 0 ? (
          <div className="space-y-4 divide-y divide-[#DCE5D8]/70">
            {orders.map((order) => {
              const canCancel = order.status === "PENDING" || order.status === "CONFIRMED";

              return (
                <div key={order.id} className="pt-4 first:pt-0 space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-[#173D2C]">#{order.orderNumber}</span>
                        <Badge
                          variant={
                            order.status === "DELIVERED"
                              ? "sage"
                              : order.status === "CANCELLED"
                              ? "outline"
                              : "gold"
                          }
                          className="uppercase text-[10px]"
                        >
                          {order.status}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-stone-500 mt-0.5">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Placed on {formatDate(order.createdAt)}
                        </span>
                        {order.shipment?.courierName && (
                          <span className="inline-flex items-center gap-1 text-[#173D2C] font-medium">
                            • <Truck className="w-3 h-3 text-[#B89453]" />
                            {order.shipment.courierName}
                            {order.shipment.awbNumber ? ` (${order.shipment.awbNumber})` : ""}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-bold text-[#173D2C] text-base mr-1">
                        {formatPrice(order.totalAmount)}
                      </span>
                      <Link
                        href={`/account/orders/${order.id}/track`}
                        className="px-3 py-1.5 bg-[#173D2C] hover:bg-[#123123] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                      >
                        <Truck className="w-3.5 h-3.5 text-[#B89453]" />
                        <span>Track Order</span>
                      </Link>
                      {canCancel && (
                        <button
                          type="button"
                          onClick={() => setCancelModalOrderId(order.id)}
                          className="px-3 py-1.5 border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          Cancel Order
                        </button>
                      )}
                      <Link
                        href={`/checkout/success/${order.id}`}
                        className="px-3 py-1.5 bg-[#FAF7F0] hover:bg-[#DCE5D8] text-stone-700 text-xs font-semibold rounded-lg transition-colors border border-[#DCE5D8] flex items-center gap-1"
                      >
                        <Receipt className="w-3 h-3" />
                        <span>Receipt</span>
                      </Link>
                    </div>
                  </div>

                  {/* Order items list */}
                  <div className="p-3 bg-[#FAF7F0] rounded-xl space-y-1.5 text-xs border border-[#DCE5D8]/60">
                    {order.items?.map((item) => (
                      <div key={item.id} className="flex justify-between text-stone-700">
                        <span>
                          {item.quantity}x {item.variant?.product?.name} ({item.variant?.weightGrams}g)
                        </span>
                        <span className="font-medium text-stone-900">{formatPrice(item.totalPrice)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 space-y-3">
            <Package className="w-12 h-12 text-stone-400 mx-auto" />
            <p className="text-stone-500 text-xs">You have no order history yet.</p>
            <Link
              href="/shop"
              className="inline-block px-5 py-2.5 bg-[#173D2C] hover:bg-[#123123] text-white text-xs font-semibold rounded-xl"
            >
              Start Shopping &rarr;
            </Link>
          </div>
        )}
      </div>

      {/* Cancellation Confirmation Modal */}
      {cancelModalOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs" onClick={() => setCancelModalOrderId(null)} />
          <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl z-10 space-y-4 border border-[#DCE5D8]">
            <h4 className="font-serif font-bold text-[#173D2C] text-lg">Cancel Order</h4>
            <p className="text-xs text-stone-600">
              Are you sure you want to cancel this order? Any reserved inventory will be instantly restocked.
            </p>

            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">Reason for Cancellation</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-[#FAF7F0] border border-[#DCE5D8] rounded-lg text-stone-800"
              >
                <option value="Order created by mistake">Order created by mistake</option>
                <option value="Need to change delivery address">Need to change delivery address</option>
                <option value="Want to change items/weights">Want to change items/weights</option>
                <option value="Found a better gift alternative">Found a better gift alternative</option>
              </select>
            </div>

            <div className="pt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCancelModalOrderId(null)}
                className="px-4 py-2 border border-[#DCE5D8] text-stone-600 text-xs font-semibold rounded-lg hover:bg-[#FAF7F0] cursor-pointer"
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={handleCancelOrder}
                disabled={cancellingOrderId !== null}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg disabled:opacity-40 cursor-pointer"
              >
                {cancellingOrderId ? "Cancelling..." : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
