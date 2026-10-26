"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CheckCircle2, PackageCheck, Truck, ShieldCheck, ArrowRight, Printer } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  subtotalAmount: number;
  discountAmount: number;
  shippingAmount: number;
  createdAt: string;
  shippingAddress: {
    recipientName: string;
    phone: string;
    addressLine1: string;
    city: string;
    state: string;
    postalCode: string;
  };
  items: {
    id: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    variant: {
      weightGrams: number;
      product: {
        name: string;
      };
    };
  }[];
}

const ORDER_STEPS = [
  { key: "PENDING", label: "Order Placed" },
  { key: "PROCESSING", label: "Graded & Packed" },
  { key: "SHIPPED", label: "Shipped in Transit" },
  { key: "DELIVERED", label: "Delivered" },
];

export default function OrderSuccessPage() {
  const params = useParams();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      if (!orderId) return;
      try {
        setIsLoading(true);
        const res = await fetch(`/api/v1/orders/${orderId}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setOrder(json.data);
          }
        }
      } catch (err) {
        console.error("Failed to load order receipt", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadOrder();
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="bg-[#FAF7F0] min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#173D2C] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-stone-600 text-sm">Generating your order receipt...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FAF7F0] min-h-screen py-12 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Success Banner */}
        <div className="bg-white rounded-3xl border border-[#DCE5D8] p-8 sm:p-10 shadow-xs text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center mx-auto border border-emerald-200 shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#B89453]">
            {order?.paymentStatus === "PENDING" || (order as any)?.paymentMethod === "COD"
              ? "Cash on Delivery Order Confirmed"
              : "Payment Verified"}
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#173D2C]">
            Thank You For Your Order!
          </h1>
          <p className="text-stone-600 text-sm max-w-md mx-auto leading-relaxed">
            Your order has been confirmed. Our master curators are vacuum-packing your fresh harvest for dispatch.
          </p>

          <div className="inline-flex items-center gap-2 bg-[#FAF7F0] px-4 py-2 rounded-xl border border-[#DCE5D8]">
            <span className="text-xs text-stone-500 font-medium">Order Number: </span>
            <span className="text-sm font-bold text-[#173D2C] font-mono">
              #{order?.orderNumber || orderId}
            </span>
          </div>
        </div>

        {/* Milestone Progress Tracker */}
        <div className="bg-white rounded-2xl border border-[#DCE5D8] p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <h3 className="font-serif font-bold text-[#173D2C] text-base">Delivery Milestone Status</h3>
            <Link
              href={`/account/orders/${order?.id || orderId}/track`}
              className="text-xs font-semibold text-[#173D2C] hover:text-[#B89453] inline-flex items-center gap-1 transition-colors"
            >
              <Truck className="w-3.5 h-3.5 text-[#B89453]" />
              <span>View Full Tracking Timeline &rarr;</span>
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {ORDER_STEPS.map((step, idx) => {
              const currentStatus = (order?.status || (order as any)?.orderStatus || "PENDING").toUpperCase();
              const activeStepIndex =
                currentStatus === "DELIVERED"
                  ? 3
                  : currentStatus === "SHIPPED" || currentStatus === "OUT_FOR_DELIVERY"
                  ? 2
                  : currentStatus === "PROCESSING" || currentStatus === "PACKED"
                  ? 1
                  : 0;
              const isCompletedOrActive = currentStatus !== "CANCELLED" && idx <= activeStepIndex;
              const isCurrent = currentStatus !== "CANCELLED" && idx === activeStepIndex;

              return (
                <div key={step.key} className="flex flex-col items-center text-center space-y-2">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                      isCompletedOrActive
                        ? isCurrent
                          ? "bg-[#173D2C] text-white shadow-xs ring-4 ring-[#173D2C]/10"
                          : "bg-[#173D2C] text-white"
                        : "bg-[#FAF7F0] text-stone-400 border border-[#DCE5D8]"
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <span
                    className={`text-xs font-semibold ${
                      isCompletedOrActive ? "text-[#173D2C]" : "text-stone-500"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Items & Shipping Breakdown */}
        {order && (
          <div className="bg-white rounded-2xl border border-[#DCE5D8] p-6 sm:p-8 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Items */}
            <div className="space-y-4">
              <h4 className="font-serif font-bold text-[#173D2C] text-base border-b border-[#DCE5D8]/70 pb-2">
                Purchased Harvests
              </h4>
              <div className="space-y-3 divide-y divide-[#DCE5D8]/70">
                {order.items?.map((item) => (
                  <div key={item.id} className="pt-2 first:pt-0 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-[#173D2C] block">{item.variant?.product?.name}</span>
                      <span className="text-stone-500 text-[11px]">
                        Qty: {item.quantity} • {item.variant?.weightGrams}g
                      </span>
                    </div>
                    <span className="font-bold text-[#173D2C]">{formatPrice(item.totalPrice)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-[#DCE5D8] text-xs space-y-1.5 text-stone-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatPrice(order.subtotalAmount)}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-800">
                    <span>Discount</span>
                    <span>-{formatPrice(order.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-[#173D2C] text-sm pt-2 border-t border-[#DCE5D8]/70">
                  <span>
                    {order.paymentStatus === "PENDING" || (order as any).paymentMethod === "COD"
                      ? "Total Payable (COD)"
                      : "Total Paid"}
                  </span>
                  <span className="text-[#173D2C]">{formatPrice(order.totalAmount)}</span>
                </div>
                {order.paymentStatus === "PENDING" && (
                  <div className="flex justify-between text-[11px] text-[#8C733E] pt-1">
                    <span>Payment Status</span>
                    <span className="font-semibold uppercase tracking-wider">Unpaid • Due on Delivery</span>
                  </div>
                )}
              </div>
            </div>

            {/* Shipping Details */}
            <div className="space-y-4">
              <h4 className="font-serif font-bold text-[#173D2C] text-base border-b border-[#DCE5D8]/70 pb-2">
                Shipping Address
              </h4>
              <div className="p-4 bg-[#FAF7F0] rounded-xl border border-[#DCE5D8] text-xs text-stone-700 space-y-1">
                <span className="font-bold text-[#173D2C] block">{order.shippingAddress?.recipientName}</span>
                <p>{order.shippingAddress?.addressLine1}</p>
                <p>
                  {order.shippingAddress?.city}, {order.shippingAddress?.state} — {order.shippingAddress?.postalCode}
                </p>
                <p className="pt-2 text-stone-500 font-mono">Phone: {order.shippingAddress?.phone}</p>
              </div>

              <div className="p-4 bg-[#FAF7F0] rounded-xl text-xs text-stone-600 space-y-1.5 border border-[#DCE5D8]">
                <div className="flex items-center gap-1.5 font-bold text-[#173D2C]">
                  <Truck className="w-3.5 h-3.5 text-[#B89453]" />
                  <span>Estimated Delivery Window:</span>
                </div>
                <p className="text-[11px] text-stone-500">
                  2 – 4 Business Days via express cold-chain logistics.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Return Home / Account Link */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
          <Link
            href={`/account/orders/${order?.id || orderId}/track`}
            className="px-6 py-3 bg-[#173D2C] hover:bg-[#123123] text-white rounded-xl text-xs font-semibold shadow-xs text-center transition-colors border border-[#B89453]/30 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Truck className="w-3.5 h-3.5 text-[#B89453]" />
            <span>Track Your Order</span>
          </Link>
          <Link
            href="/account/orders"
            className="px-6 py-3 bg-[#FAF7F0] hover:bg-[#DCE5D8] text-[#173D2C] border border-[#DCE5D8] rounded-xl text-xs font-semibold shadow-xs text-center transition-colors cursor-pointer"
          >
            Track in Account Dashboard
          </Link>
          <Link
            href="/shop"
            className="px-6 py-3 bg-white hover:bg-[#FAF7F0] text-[#173D2C] border border-[#DCE5D8] rounded-xl text-xs font-semibold shadow-xs text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>Continue Shopping</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
