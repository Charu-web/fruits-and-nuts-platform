"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Package, Crown, Truck, ArrowRight, Headphones, Calendar } from "lucide-react";
import { formatPrice, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function AccountOverviewPage() {
  const [ordersCount, setOrdersCount] = useState(0);
  const [recentOrder, setRecentOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadOverview() {
      try {
        const res = await fetch("/api/v1/orders?limit=1");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setOrdersCount(json.data.pagination?.total || 0);
            if (json.data.items && json.data.items.length > 0) {
              setRecentOrder(json.data.items[0]);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch order summary", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadOverview();
  }, []);

  return (
    <div className="space-y-6">
      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-[#DCE5D8] p-5 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-[#FAF7F0] text-[#173D2C] flex items-center justify-center">
            <Package className="w-5 h-5 text-[#173D2C]" />
          </div>
          <div>
            <span className="text-xs text-stone-500 font-medium block">Total Orders</span>
            <span className="text-2xl font-bold text-[#173D2C]">{ordersCount}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#DCE5D8] p-5 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-[#FAF7F0] text-[#B89453] flex items-center justify-center">
            <Crown className="w-5 h-5 text-[#B89453]" />
          </div>
          <div>
            <span className="text-xs text-stone-500 font-medium block">Tier Status</span>
            <span className="text-2xl font-bold text-[#B89453]">Imperial Gold</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#DCE5D8] p-5 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-[#FAF7F0] text-emerald-700 flex items-center justify-center">
            <Truck className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <span className="text-xs text-stone-500 font-medium block">Express Shipping</span>
            <span className="text-2xl font-bold text-emerald-700">Privileged</span>
          </div>
        </div>
      </div>

      {/* Recent Order Preview */}
      <div className="bg-white rounded-2xl border border-[#DCE5D8] p-6 shadow-xs space-y-4">
        <div className="flex justify-between items-center border-b border-[#DCE5D8]/70 pb-3">
          <h3 className="font-serif font-bold text-[#173D2C] text-base">Latest Order</h3>
          <Link
            href="/account/orders"
            className="text-xs text-[#B89453] hover:text-[#173D2C] font-semibold inline-flex items-center gap-1 transition-colors"
          >
            <span>View All Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="h-20 bg-stone-50 rounded-xl animate-pulse" />
        ) : recentOrder ? (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-[#FAF7F0] rounded-xl border border-[#DCE5D8]">
            <div className="space-y-1">
              <span className="font-mono font-bold text-xs text-[#173D2C] block">
                #{recentOrder.orderNumber}
              </span>
              <div className="flex items-center gap-2 text-xs text-stone-500">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  Placed on {formatDate(recentOrder.createdAt)} • {recentOrder.items?.length || 1} items
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className="uppercase text-[10px]">
                {recentOrder.status}
              </Badge>
              <span className="font-bold text-[#173D2C] text-sm">
                {formatPrice(recentOrder.totalAmount)}
              </span>
              <Link
                href={`/account/orders/${recentOrder.id}/track`}
                className="px-3 py-1.5 bg-[#173D2C] hover:bg-[#123123] text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 transition-colors"
              >
                <Truck className="w-3.5 h-3.5 text-[#B89453]" />
                <span>Track Order</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-stone-400 space-y-2">
            <p>No orders placed yet. Explore our Royal Harvest Catalogue.</p>
            <Link
              href="/shop"
              className="inline-block px-4 py-2 bg-[#173D2C] text-white text-xs font-semibold rounded-lg hover:bg-[#123123]"
            >
              Browse Catalogue
            </Link>
          </div>
        )}
      </div>

      {/* Concierge Gifting & Support */}
      <div className="bg-[#173D2C] text-[#FAF7F0] rounded-2xl border border-[#B89453]/30 p-6 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#B89453]">
          <Headphones className="w-4 h-4" />
          Personal Concierge Desk
        </div>
        <h4 className="font-serif font-bold text-xl">Need Assistance with a Large Order or Custom Gifting?</h4>
        <p className="text-xs text-stone-300 max-w-xl">
          Our private gifting concierge is available Monday to Saturday (9:30 AM – 7:30 PM IST) for corporate bulk orders, custom laser engravings, and delivery coordination.
        </p>
        <div className="pt-2 flex flex-wrap gap-4 items-center">
          <a
            href="mailto:customersupport@fruitsandnuts.co.in"
            className="text-xs font-bold text-[#B89453] hover:underline"
          >
            customersupport@fruitsandnuts.co.in
          </a>
          <span className="text-stone-400 text-xs">•</span>
          <a
            href="tel:+918368301495"
            className="text-xs font-mono font-medium text-stone-300 hover:text-white"
          >
            +91-8368301495
          </a>
        </div>
      </div>
    </div>
  );
}
