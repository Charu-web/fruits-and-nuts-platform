"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Truck,
  Package,
  MapPin,
  ExternalLink,
  AlertCircle,
  Ban,
  Receipt,
  Calendar,
  ShieldCheck,
} from "lucide-react";
import { formatPrice, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface TrackingMilestone {
  key: string;
  label: string;
  description: string;
  state: "COMPLETED" | "CURRENT" | "UPCOMING";
  completed: boolean;
  current: boolean;
  timestamp: string | null;
  note: string | null;
}

interface OrderTrackingPayload {
  orderId: string;
  orderNumber: string;
  orderDate: string;
  currentStatus: string;
  currentStatusLabel: string;
  statusHeadline: string;
  statusSubtext: string;
  paymentStatus: string;
  paymentMethod: string;
  totalAmount: number;
  isCancelled: boolean;
  cancelledAt: string | null;
  cancelReason: string | null;
  isShipped: boolean;
  isOutForDelivery: boolean;
  isDelivered: boolean;
  trackingInfoAvailable: boolean;
  courierName: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  estimatedDeliveryDate: string | null;
  actualDeliveryDate: string | null;
  shippingAddress: {
    recipientName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    state: string;
    postalCode: string;
  } | null;
  items: {
    id: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    variant: {
      sku: string;
      weightGrams: number;
      product: {
        name: string;
        slug: string;
      };
    };
  }[];
  milestones: TrackingMilestone[];
}

function formatDateTime(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CustomerOrderTrackingPage() {
  const params = useParams();
  const orderId = params?.id as string;

  const [tracking, setTracking] = useState<OrderTrackingPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<number | null>(null);

  useEffect(() => {
    async function fetchTracking() {
      if (!orderId) return;
      try {
        setIsLoading(true);
        setErrorMsg(null);
        const res = await fetch(`/api/v1/orders/${orderId}/tracking`);
        const json = await res.json();
        if (res.ok && json.success && json.data) {
          setTracking(json.data);
        } else {
          setErrorCode(res.status);
          setErrorMsg(
            json.error?.message ||
              (res.status === 403
                ? "You do not have permission to view tracking for this order."
                : "Unable to load order tracking details.")
          );
        }
      } catch (err) {
        console.error("Failed to fetch order tracking:", err);
        setErrorMsg("Unable to connect to tracking service. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchTracking();
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-[#DCE5D8] p-6 shadow-xs space-y-4">
          <div className="h-8 w-56 bg-[#FAF7F0] rounded-lg animate-pulse" />
          <div className="h-28 bg-[#FAF7F0] rounded-xl animate-pulse" />
          <div className="h-64 bg-[#FAF7F0] rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (errorMsg || !tracking) {
    return (
      <div className="bg-white rounded-2xl border border-[#DCE5D8] p-8 shadow-xs text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="font-serif font-bold text-[#173D2C] text-xl">
          {errorCode === 403 ? "Access Restricted" : "Order Tracking Unavailable"}
        </h3>
        <p className="text-xs text-stone-600 max-w-md mx-auto leading-relaxed">
          {errorMsg || "We could not locate tracking details for this order."}
        </p>
        <div className="pt-2">
          <Link
            href="/account/orders"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#173D2C] hover:bg-[#123123] text-white text-xs font-semibold rounded-xl transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to My Orders</span>
          </Link>
        </div>
      </div>
    );
  }

  const formattedExpectedDate = tracking.estimatedDeliveryDate
    ? formatDate(tracking.estimatedDeliveryDate)
    : null;
  const formattedDeliveredDate = tracking.actualDeliveryDate
    ? formatDateTime(tracking.actualDeliveryDate)
    : null;

  return (
    <div className="space-y-6">
      {/* Top Navigation & Order Header Card */}
      <div className="bg-white rounded-2xl border border-[#DCE5D8] p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#DCE5D8]/70 pb-4">
          <div className="space-y-1">
            <Link
              href="/account/orders"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-[#173D2C] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to My Orders</span>
            </Link>
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <h2 className="font-serif font-bold text-[#173D2C] text-xl sm:text-2xl">
                Order #{tracking.orderNumber}
              </h2>
              <Badge
                variant={
                  tracking.isDelivered
                    ? "sage"
                    : tracking.isCancelled
                    ? "outline"
                    : "gold"
                }
                className="uppercase text-[10px]"
              >
                {tracking.currentStatusLabel}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500">
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#B89453]" />
                Placed on {formatDate(tracking.orderDate)}
              </span>
              <span>•</span>
              <span>
                Total: <strong className="text-[#173D2C]">{formatPrice(tracking.totalAmount)}</strong>
              </span>
              <span>•</span>
              <span>
                Payment:{" "}
                <strong className="text-stone-700">
                  {tracking.paymentMethod === "COD" ? "Cash on Delivery" : tracking.paymentStatus}
                </strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-center">
            <Link
              href={`/checkout/success/${tracking.orderId}`}
              className="px-3.5 py-2 bg-[#FAF7F0] hover:bg-[#DCE5D8] text-[#173D2C] text-xs font-semibold rounded-xl border border-[#DCE5D8] inline-flex items-center gap-1.5 transition-colors"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>View Receipt</span>
            </Link>
          </div>
        </div>

        {/* Status Banner */}
        {tracking.isCancelled ? (
          <div className="p-4 sm:p-5 rounded-2xl bg-rose-50/90 border border-rose-200 flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 border border-rose-200">
              <Ban className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-serif font-bold text-rose-900 text-base">
                  {tracking.statusHeadline}
                </h3>
                {tracking.cancelledAt && (
                  <span className="text-[11px] font-mono text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">
                    {formatDateTime(tracking.cancelledAt)}
                  </span>
                )}
              </div>
              <p className="text-xs text-rose-800 leading-relaxed">{tracking.statusSubtext}</p>
            </div>
          </div>
        ) : (
          <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF7F0] border border-[#DCE5D8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                  tracking.isDelivered
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-[#173D2C] text-[#B89453] border-[#B89453]/30"
                }`}
              >
                {tracking.isDelivered ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : tracking.isShipped ? (
                  <Truck className="w-5 h-5" />
                ) : (
                  <Package className="w-5 h-5" />
                )}
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#B89453] block">
                  Current Delivery Status
                </span>
                <h3 className="font-serif font-bold text-[#173D2C] text-base sm:text-lg">
                  {tracking.statusHeadline}
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">{tracking.statusSubtext}</p>
              </div>
            </div>

            {formattedDeliveredDate ? (
              <div className="sm:text-right bg-emerald-50/80 border border-emerald-200 rounded-xl px-4 py-2.5 shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-800 block">
                  Delivered On
                </span>
                <span className="text-xs font-bold text-emerald-950 font-mono">
                  {formattedDeliveredDate}
                </span>
              </div>
            ) : formattedExpectedDate ? (
              <div className="sm:text-right bg-white border border-[#DCE5D8] rounded-xl px-4 py-2.5 shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#B89453] block">
                  Expected Delivery
                </span>
                <span className="text-sm font-serif font-bold text-[#173D2C]">
                  {formattedExpectedDate}
                </span>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* 6-Milestone Visual Delivery Timeline */}
      <div className="bg-white rounded-2xl border border-[#DCE5D8] p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#DCE5D8]/70 pb-3">
          <div>
            <h3 className="font-serif font-bold text-[#173D2C] text-lg">
              Shipment Tracking Timeline
            </h3>
            <p className="text-xs text-stone-500">
              Real-time progression from harvest grading to doorstep delivery
            </p>
          </div>
          <span className="text-[11px] font-mono text-stone-500">
            Status: <strong className="text-[#173D2C]">{tracking.currentStatusLabel}</strong>
          </span>
        </div>

        <div className="relative pl-2 sm:pl-4">
          {tracking.milestones.map((milestone, index) => {
            const isLast = index === tracking.milestones.length - 1;
            const formattedTime = formatDateTime(milestone.timestamp);
            const isCompleted = milestone.completed;
            const isCurrent = milestone.current;

            return (
              <div key={milestone.key} className="relative flex gap-4 pb-7 last:pb-0">
                {/* Vertical connector line */}
                {!isLast && (
                  <div
                    className={`absolute left-[15px] top-8 bottom-0 w-0.5 transition-colors ${
                      isCompleted && !isCurrent ? "bg-[#173D2C]" : "bg-[#DCE5D8]"
                    }`}
                  />
                )}

                {/* Milestone Node */}
                <div className="relative z-10 shrink-0 mt-0.5">
                  {isCompleted ? (
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        isCurrent
                          ? "bg-[#173D2C] text-[#B89453] ring-4 ring-[#173D2C]/15 shadow-sm"
                          : "bg-[#173D2C] text-white"
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#FAF7F0] border-2 border-[#DCE5D8] text-stone-400 flex items-center justify-center">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                {/* Milestone Content */}
                <div
                  className={`flex-1 rounded-xl p-3.5 sm:p-4 border transition-colors ${
                    isCurrent
                      ? "bg-[#FAF7F0] border-[#173D2C]/30 shadow-2xs"
                      : isCompleted
                      ? "bg-white border-[#DCE5D8]"
                      : "bg-[#FAF7F0]/40 border-[#DCE5D8]/60 opacity-70"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <h4
                        className={`text-sm font-bold ${
                          isCompleted ? "text-[#173D2C]" : "text-stone-500"
                        }`}
                      >
                        {milestone.label}
                      </h4>
                      {isCurrent && !tracking.isCancelled && (
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#173D2C] text-[#B89453] rounded-md">
                          {tracking.isDelivered ? "Completed" : "Current Stage"}
                        </span>
                      )}
                    </div>

                    {isCompleted && formattedTime && (
                      <span className="text-[11px] font-mono text-stone-500">
                        {formattedTime}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                    {milestone.description}
                  </p>

                  {isCompleted && milestone.note && (
                    <p className="text-[11px] text-[#173D2C] bg-white/80 border border-[#DCE5D8] rounded-lg px-2.5 py-1 mt-2 inline-block">
                      Update note: {milestone.note}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Courier / Shipment Information & Destination Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Courier & Tracking Details Card */}
        <div className="bg-white rounded-2xl border border-[#DCE5D8] p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#DCE5D8]/70 pb-3">
            <Truck className="w-4 h-4 text-[#B89453]" />
            <h3 className="font-serif font-bold text-[#173D2C] text-base">
              Courier & Shipment Information
            </h3>
          </div>

          {tracking.trackingInfoAvailable ? (
            <div className="space-y-3 text-xs">
              {tracking.courierName && (
                <div className="flex justify-between items-center py-2 border-b border-[#DCE5D8]/50">
                  <span className="text-stone-500">Delivery Partner / Courier</span>
                  <span className="font-bold text-[#173D2C]">{tracking.courierName}</span>
                </div>
              )}

              {tracking.trackingNumber && (
                <div className="flex justify-between items-center py-2 border-b border-[#DCE5D8]/50">
                  <span className="text-stone-500">Tracking / AWB Number</span>
                  <span className="font-mono font-bold text-[#173D2C] bg-[#FAF7F0] px-2.5 py-1 rounded-md border border-[#DCE5D8]">
                    {tracking.trackingNumber}
                  </span>
                </div>
              )}

              {formattedExpectedDate && !tracking.isDelivered && !tracking.isCancelled && (
                <div className="flex justify-between items-center py-2 border-b border-[#DCE5D8]/50">
                  <span className="text-stone-500">Expected Delivery Date</span>
                  <span className="font-bold text-emerald-800">{formattedExpectedDate}</span>
                </div>
              )}

              {formattedDeliveredDate && (
                <div className="flex justify-between items-center py-2 border-b border-[#DCE5D8]/50">
                  <span className="text-stone-500">Delivered On</span>
                  <span className="font-mono font-bold text-emerald-800">
                    {formattedDeliveredDate}
                  </span>
                </div>
              )}

              {tracking.trackingUrl && (
                <div className="pt-2">
                  <a
                    href={tracking.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full px-4 py-2.5 bg-[#173D2C] hover:bg-[#123123] text-white text-xs font-semibold rounded-xl inline-flex items-center justify-center gap-2 transition-colors shadow-2xs"
                  >
                    <span>Track Shipment on Courier Website</span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#B89453]" />
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-[#FAF7F0] border border-[#DCE5D8] space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#173D2C]">
                <Clock className="w-4 h-4 text-[#B89453] shrink-0" />
                <span>
                  {tracking.isCancelled
                    ? "Order Cancelled Before Dispatch"
                    : "Tracking Information Not Yet Available"}
                </span>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                {tracking.isCancelled
                  ? "This order was cancelled before a courier shipment was dispatched."
                  : "Your order is being prepared at our fulfillment facility. Courier partner, AWB tracking number, and live tracking link will appear here once your shipment is handed over."}
              </p>
            </div>
          )}
        </div>

        {/* Shipping Destination & Items Summary Card */}
        <div className="bg-white rounded-2xl border border-[#DCE5D8] p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#DCE5D8]/70 pb-3">
            <MapPin className="w-4 h-4 text-[#B89453]" />
            <h3 className="font-serif font-bold text-[#173D2C] text-base">
              Delivery Destination & Items
            </h3>
          </div>

          {tracking.shippingAddress && (
            <div className="p-3.5 bg-[#FAF7F0] rounded-xl border border-[#DCE5D8] text-xs text-stone-700 space-y-1">
              <span className="font-bold text-[#173D2C] block">
                {tracking.shippingAddress.recipientName}
              </span>
              <p>{tracking.shippingAddress.addressLine1}</p>
              {tracking.shippingAddress.addressLine2 && (
                <p>{tracking.shippingAddress.addressLine2}</p>
              )}
              <p>
                {tracking.shippingAddress.city}, {tracking.shippingAddress.state} —{" "}
                {tracking.shippingAddress.postalCode}
              </p>
              <p className="pt-1 text-stone-500 font-mono">
                Phone: {tracking.shippingAddress.phone}
              </p>
            </div>
          )}

          <div className="space-y-2 pt-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">
              Items in this Shipment ({tracking.items?.length || 0})
            </span>
            <div className="divide-y divide-[#DCE5D8]/60 text-xs">
              {tracking.items?.map((item) => (
                <div key={item.id} className="py-2 first:pt-0 flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-[#173D2C]">
                      {item.quantity}x {item.variant?.product?.name}
                    </span>
                    <span className="text-stone-500 ml-1.5">
                      ({item.variant?.weightGrams}g)
                    </span>
                  </div>
                  <span className="font-bold text-stone-800">
                    {formatPrice(item.totalPrice)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
