"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

interface DashboardMetrics {
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  totalProducts: number;
  lowStockItems: number;
  pendingReviews: number;
  recentOrders: any[];
}

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    lowStockItems: 0,
    pendingReviews: 0,
    recentOrders: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardMetrics() {
      try {
        setIsLoading(true);
        // Load orders, inventory, products, and reviews in parallel
        const [ordersRes, inventoryRes, productsRes, reviewsRes] = await Promise.all([
          fetch("/api/v1/admin/orders?limit=5"),
          fetch("/api/v1/admin/inventory?limit=50"),
          fetch("/api/v1/admin/products?limit=1"),
          fetch("/api/v1/admin/reviews?status=PENDING_MODERATION&limit=1"),
        ]);

        let totalOrders = 0;
        let pendingOrders = 0;
        let totalRevenue = 0;
        let recentOrders: any[] = [];
        let totalProducts = 0;
        let lowStockItems = 0;
        let pendingReviews = 0;

        if (ordersRes.ok) {
          const ordersJson = await ordersRes.json();
          if (ordersJson.success && ordersJson.data) {
            const rawOrders = Array.isArray(ordersJson.data) ? ordersJson.data : (ordersJson.data.items || []);
            totalOrders = ordersJson.meta?.total || ordersJson.data.pagination?.total || rawOrders.length;
            recentOrders = rawOrders.slice(0, 5);
            // Calculate pending and revenue
            pendingOrders = rawOrders.filter(
              (o: any) => {
                const s = o.orderStatus || o.status;
                return s === "PENDING" || s === "CONFIRMED" || s === "PROCESSING";
              }
            ).length;
            totalRevenue = rawOrders.reduce((sum: number, o: any) => sum + (o.finalPayableAmount || o.totalAmount || 0), 0);
          }
        }

        if (inventoryRes.ok) {
          const invJson = await inventoryRes.json();
          if (invJson.success && invJson.data) {
            const items = Array.isArray(invJson.data) ? invJson.data : (invJson.data.items || []);
            lowStockItems = items.filter(
              (i: any) => i.stockAvailable <= (i.safetyBufferThreshold || 10)
            ).length;
          }
        }

        if (productsRes.ok) {
          const prodJson = await productsRes.json();
          if (prodJson.success && prodJson.data) {
            const rawProds = Array.isArray(prodJson.data) ? prodJson.data : (prodJson.data.items || []);
            totalProducts = prodJson.meta?.total || prodJson.data.pagination?.total || rawProds.length;
          }
        }

        if (reviewsRes.ok) {
          const revJson = await reviewsRes.json();
          if (revJson.success && revJson.data) {
            const rawRevs = Array.isArray(revJson.data) ? revJson.data : (revJson.data.items || []);
            pendingReviews = revJson.meta?.total || revJson.data.pagination?.total || rawRevs.length;
          }
        }

        setMetrics({
          totalOrders,
          pendingOrders,
          totalRevenue,
          totalProducts,
          lowStockItems,
          pendingReviews,
          recentOrders,
        });
      } catch (err) {
        console.error("Failed to load admin metrics", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardMetrics();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#B89453]">Executive Console</span>
          <h1 className="font-serif text-3xl font-bold text-[#123D30] mt-1">Operations Overview</h1>
          <p className="text-xs text-stone-500 mt-0.5">Live store activity, order pipeline & inventory metrics</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/products"
            className="px-4 py-2.5 bg-[#123D30] hover:bg-[#173D2C] text-[#F6F0E5] text-xs font-bold rounded-xl shadow-xs transition-all border border-[#B89453]/30 flex items-center gap-1.5"
          >
            <span>+</span> Add Product
          </Link>
          <Link
            href="/admin/orders"
            className="px-4 py-2.5 bg-[#B89453] hover:bg-[#A37F3E] text-white text-xs font-bold rounded-xl shadow-xs transition-all"
          >
            Fulfillment Queue
          </Link>
          <Link
            href="/admin/inventory?tab=insights"
            className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
          >
            <span>📈</span>
            <span>AI Velocity Insights</span>
          </Link>
        </div>
      </div>

      {/* KPI Tiles Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Revenue */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Gross Orders Volume</span>
            <span className="w-8 h-8 rounded-xl bg-[#FAF7F2] text-[#B89453] border border-[#B89453]/20 flex items-center justify-center text-sm font-bold">
              ₹
            </span>
          </div>
          <div>
            <span className="text-3xl font-bold text-[#123D30]">
              {isLoading ? "..." : `₹${metrics.totalRevenue.toLocaleString("en-IN")}`}
            </span>
            <span className="text-[11px] text-stone-400 block mt-0.5">
              From {metrics.totalOrders} total recorded orders
            </span>
          </div>
          <Link href="/admin/orders" className="text-xs font-bold text-[#B89453] hover:underline pt-2 border-t border-stone-100 block">
            Inspect All Transactions &rarr;
          </Link>
        </div>

        {/* Pending Orders */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Pending Fulfillment</span>
            <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center text-sm font-bold">
              🚚
            </span>
          </div>
          <div>
            <span className="text-3xl font-bold text-[#123D30]">
              {isLoading ? "..." : metrics.pendingOrders}
            </span>
            <span className="text-[11px] text-stone-400 block mt-0.5">
              Requires warehouse processing
            </span>
          </div>
          <Link href="/admin/orders" className="text-xs font-bold text-[#B89453] hover:underline pt-2 border-t border-stone-100 block">
            Open Fulfillment Queue &rarr;
          </Link>
        </div>

        {/* Active Products */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Active Products</span>
            <span className="w-8 h-8 rounded-xl bg-emerald-50 text-[#123D30] flex items-center justify-center text-sm font-bold">
              🥜
            </span>
          </div>
          <div>
            <span className="text-3xl font-bold text-[#123D30]">
              {isLoading ? "..." : metrics.totalProducts}
            </span>
            <span className="text-[11px] text-stone-400 block mt-0.5">Catalog master products</span>
          </div>
          <Link href="/admin/products" className="text-xs font-bold text-[#B89453] hover:underline pt-2 border-t border-stone-100 block">
            Manage Catalog &rarr;
          </Link>
        </div>

        {/* Low Stock Warnings */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Low Stock SKUs</span>
            <span className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center text-sm font-bold">
              ⚠️
            </span>
          </div>
          <div>
            <span className={`text-3xl font-bold ${metrics.lowStockItems > 0 ? "text-rose-600" : "text-[#123D30]"}`}>
              {isLoading ? "..." : metrics.lowStockItems}
            </span>
            <span className="text-[11px] text-stone-400 block mt-0.5">Items near safety threshold</span>
          </div>
          <Link href="/admin/inventory" className="text-xs font-bold text-[#B89453] hover:underline pt-2 border-t border-stone-100 block">
            Inspect Inventory Ledger &rarr;
          </Link>
        </div>
      </div>

      {/* Quick Launch Control Hub */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-xs space-y-4">
        <h3 className="font-serif font-bold text-[#123D30] text-lg border-b border-stone-100 pb-3">
          Operational Control Station
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link
            href="/admin/orders"
            className="p-4 bg-[#FAF7F2] hover:bg-[#F6F0E5] border border-[#B89453]/20 rounded-xl transition-all group text-center"
          >
            <span className="text-2xl block mb-2 group-hover:scale-110 transition-transform">🚚</span>
            <span className="font-bold text-xs text-[#123D30] block">Order Processing</span>
            <span className="text-[10px] text-stone-500">Dispatch & AWB assignments</span>
          </Link>

          <Link
            href="/admin/products"
            className="p-4 bg-[#FAF7F2] hover:bg-[#F6F0E5] border border-[#B89453]/20 rounded-xl transition-all group text-center"
          >
            <span className="text-2xl block mb-2 group-hover:scale-110 transition-transform">🥜</span>
            <span className="font-bold text-xs text-[#123D30] block">Catalog & SKUs</span>
            <span className="text-[10px] text-stone-500">Add, edit & organize catalog</span>
          </Link>

          <Link
            href="/admin/inventory"
            className="p-4 bg-[#FAF7F2] hover:bg-[#F6F0E5] border border-[#B89453]/20 rounded-xl transition-all group text-center"
          >
            <span className="text-2xl block mb-2 group-hover:scale-110 transition-transform">📦</span>
            <span className="font-bold text-xs text-[#123D30] block">Stock Control</span>
            <span className="text-[10px] text-stone-500">Receipts & audit adjustments</span>
          </Link>

          <Link
            href="/admin/taste-map"
            className="p-4 bg-[#FAF7F2] hover:bg-[#F6F0E5] border border-[#B89453]/20 rounded-xl transition-all group text-center"
          >
            <span className="text-2xl block mb-2 group-hover:scale-110 transition-transform">📍</span>
            <span className="font-bold text-xs text-[#123D30] block">Taste Map Terroir</span>
            <span className="text-[10px] text-stone-500">Pins & provenance stories</span>
          </Link>
        </div>
      </div>

      {/* Recent Orders Table Preview */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-xs space-y-4">
        <div className="flex justify-between items-center border-b border-stone-100 pb-3">
          <div>
            <h3 className="font-serif font-bold text-[#123D30] text-lg">Recent Order Transactions</h3>
            <p className="text-xs text-stone-500">Real-time orders placed via customer storefront & checkout</p>
          </div>
          <Link href="/admin/orders" className="text-xs font-bold text-[#B89453] hover:underline">
            View All Orders &rarr;
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-12 bg-stone-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : metrics.recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-stone-400 font-bold uppercase tracking-wider bg-[#FAF7F2] border-b border-stone-100">
                <tr>
                  <th className="p-3">Order Number</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Payment</th>
                  <th className="p-3">Total Amount</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {metrics.recentOrders.map((order) => {
                  const status = order.orderStatus || order.status || "PENDING";
                  const amount = order.finalPayableAmount ?? order.totalAmount ?? 0;
                  const customer = order.customerName || order.shippingAddress?.recipientName || "Customer";
                  const phone = order.customerPhone || order.shippingAddress?.phone || "";

                  return (
                    <tr key={order.id} className="hover:bg-[#FAF7F2]/60 transition-colors">
                      <td className="p-3 font-mono font-bold text-[#123D30]">#{order.orderNumber}</td>
                      <td className="p-3">
                        <span className="font-medium text-stone-800 block">
                          {customer}
                        </span>
                        {phone && <span className="text-[10px] text-stone-400">{phone}</span>}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            status === "DELIVERED"
                              ? "bg-emerald-100 text-emerald-800"
                              : status === "CANCELLED"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-[#B89453]/20 text-[#123D30]"
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-stone-600 font-medium">{order.paymentMethod || "COD"}</span>
                      </td>
                      <td className="p-3 font-bold text-[#123D30]">
                        ₹{amount.toLocaleString("en-IN")}
                      </td>
                      <td className="p-3 text-right">
                        <Link
                          href={`/admin/orders`}
                          className="px-3 py-1 bg-[#123D30] hover:bg-[#173D2C] text-[#F6F0E5] font-bold rounded-lg transition-colors inline-block text-[11px]"
                        >
                          Inspect →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-stone-400">
            No recent orders recorded in the system.
          </div>
        )}
      </div>
    </div>
  );
}
