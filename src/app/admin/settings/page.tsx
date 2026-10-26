"use client";

import React, { useState } from "react";
import Link from "next/link";

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "SUPER_ADMIN" | "INVENTORY_MGR" | "ORDER_MGR" | "CONTENT_MGR";
  roleLabel: string;
  assignedAt: string;
  lastActive: string;
}

const DEFAULT_STAFF: StaffMember[] = [
  {
    id: "stf_001",
    name: "Tariq Ahmad Mir",
    email: "tariq@fruitsandnuts.co.in",
    phone: "+91 94190 12345",
    role: "SUPER_ADMIN",
    roleLabel: "Executive Director & Super Admin",
    assignedAt: "01 Aug 2026",
    lastActive: "Today at 09:42 AM",
  },
  {
    id: "stf_002",
    name: "Farooq Dar",
    email: "farooq.inventory@fruitsandnuts.co.in",
    phone: "+91 94191 67890",
    role: "INVENTORY_MGR",
    roleLabel: "Head of Cold-Chain & Warehousing",
    assignedAt: "10 Aug 2026",
    lastActive: "Yesterday at 04:15 PM",
  },
  {
    id: "stf_003",
    name: "Bilal Lone",
    email: "bilal.dispatch@fruitsandnuts.co.in",
    phone: "+91 97970 44556",
    role: "ORDER_MGR",
    roleLabel: "Logistics & Blue Dart Operations Lead",
    assignedAt: "15 Aug 2026",
    lastActive: "Today at 11:10 AM",
  },
  {
    id: "stf_004",
    name: "Zehra Batool",
    email: "zehra.merch@fruitsandnuts.co.in",
    phone: "+91 99060 88991",
    role: "CONTENT_MGR",
    roleLabel: "Editorial & Visual Merchandising Lead",
    assignedAt: "25 Aug 2026",
    lastActive: "Today at 01:30 PM",
  },
];

export default function AdminSettingsPage() {
  const [storeStatus, setStoreStatus] = useState<"ACTIVE" | "MAINTENANCE" | "HOLIDAY">("ACTIVE");
  const [freeShippingThreshold, setFreeShippingThreshold] = useState<number>(1999);
  const [standardShippingFee, setStandardShippingFee] = useState<number>(150);
  const [giftWrapFee, setGiftWrapFee] = useState<number>(350);
  const [codSurcharge, setCodSurcharge] = useState<number>(50);
  const [maxCodLimit, setMaxCodLimit] = useState<number>(5000);
  const [announcementText, setAnnouncementText] = useState(
    "Festive Special: Complimentary wax-sealed calligraphy card with every royal gift hamper."
  );

  const [staffList, setStaffList] = useState<StaffMember[]>(DEFAULT_STAFF);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚙️</span>
            <h1 className="text-2xl font-serif font-bold text-stone-900 tracking-tight">
              Store Configuration & Security Settings
            </h1>
          </div>
          <p className="text-sm text-stone-500 mt-1">
            Operational status, free delivery thresholds, COD limits, GSTIN compliance, and staff RBAC roles.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSaveSettings}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[#102C21] hover:bg-[#1a4434] text-white transition-colors shadow-sm"
          >
            <span>💾</span> Save All Settings
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold">✓</span>
            <span>Platform configurations and RBAC privileges synchronized successfully.</span>
          </div>
          <button onClick={() => setSaveSuccess(false)} className="text-emerald-600 font-bold">✕</button>
        </div>
      )}

      {/* Grid Settings Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Storefront Status & Shipping Arithmetic */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Store Operating Status */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif font-bold text-stone-900 text-base flex items-center gap-2">
                <span>🏪</span> Operating Status & Storefront Banner
              </h2>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  storeStatus === "ACTIVE"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                {storeStatus}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { status: "ACTIVE", label: "Open & Accepting Orders", icon: "🟢" },
                { status: "MAINTENANCE", label: "Scheduled Maintenance", icon: "🟡" },
                { status: "HOLIDAY", label: "Festive Holiday Dispatch Hold", icon: "🔴" },
              ].map((item) => (
                <button
                  key={item.status}
                  type="button"
                  onClick={() => setStoreStatus(item.status as any)}
                  className={`p-3 rounded-xl border text-left text-xs transition-colors ${
                    storeStatus === item.status
                      ? "bg-stone-50 border-[#102C21] ring-1 ring-[#102C21]"
                      : "border-stone-200 hover:border-stone-300"
                  }`}
                >
                  <span className="text-sm block">{item.icon}</span>
                  <span className="font-semibold text-stone-900 block mt-1">{item.label}</span>
                </button>
              ))}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                Storefront Top Marquee Announcement
              </label>
              <input
                type="text"
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-emerald-700 focus:bg-white"
              />
            </div>
          </div>

          {/* Section 2: Financial & Shipping Thresholds */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <h2 className="font-serif font-bold text-stone-900 text-base flex items-center gap-2">
              <span>🚚</span> Logistics, Surcharges & Free Delivery Rules
            </h2>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                  Free Shipping Minimum Cart Value (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-stone-400 font-mono">₹</span>
                  <input
                    type="number"
                    min={0}
                    value={freeShippingThreshold}
                    onChange={(e) => setFreeShippingThreshold(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono font-bold text-stone-800 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                  />
                </div>
                <span className="text-[10px] text-stone-400 mt-1 block">
                  Orders above this value qualify for complimentary air shipping.
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                  Standard Air Delivery Flat Fee (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-stone-400 font-mono">₹</span>
                  <input
                    type="number"
                    min={0}
                    value={standardShippingFee}
                    onChange={(e) => setStandardShippingFee(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono font-bold text-stone-800 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                  />
                </div>
                <span className="text-[10px] text-stone-400 mt-1 block">
                  Applied to carts below the free shipping threshold.
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                  COD Convenience Surcharge (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-stone-400 font-mono">₹</span>
                  <input
                    type="number"
                    min={0}
                    value={codSurcharge}
                    onChange={(e) => setCodSurcharge(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono font-bold text-stone-800 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                  />
                </div>
                <span className="text-[10px] text-stone-400 mt-1 block">
                  Courier risk fee for cash-on-delivery orders.
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                  Maximum Allowable COD Order Value (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-stone-400 font-mono">₹</span>
                  <input
                    type="number"
                    min={0}
                    value={maxCodLimit}
                    onChange={(e) => setMaxCodLimit(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono font-bold text-stone-800 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                  />
                </div>
                <span className="text-[10px] text-stone-400 mt-1 block">
                  Orders exceeding ₹5,000 mandate prepaid online settlement.
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Staff Role Directory (RBAC) */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif font-bold text-stone-900 text-base flex items-center gap-2">
                <span>🛡️</span> Administrative Access Control (RBAC Matrix)
              </h2>
              <span className="text-xs text-stone-400 font-medium">4 Verified Officers</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-500 uppercase text-[10px] tracking-wider border-b border-stone-200">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Staff Member</th>
                    <th className="py-2.5 px-3 font-semibold">Assigned Role</th>
                    <th className="py-2.5 px-3 font-semibold">Contact</th>
                    <th className="py-2.5 px-3 font-semibold">Last Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {staffList.map((stf) => (
                    <tr key={stf.id} className="hover:bg-stone-50/60">
                      <td className="py-3 px-3">
                        <span className="font-semibold text-stone-900 block">{stf.name}</span>
                        <span className="text-[10px] text-stone-400 font-mono">{stf.id}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                            stf.role === "SUPER_ADMIN"
                              ? "bg-amber-100 text-amber-800"
                              : stf.role === "INVENTORY_MGR"
                              ? "bg-blue-100 text-blue-800"
                              : stf.role === "ORDER_MGR"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {stf.role}
                        </span>
                        <span className="text-[10px] text-stone-500 block mt-0.5">{stf.roleLabel}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-medium text-stone-800 block">{stf.email}</span>
                        <span className="text-[10px] text-stone-400 font-mono">{stf.phone}</span>
                      </td>
                      <td className="py-3 px-3 text-stone-500">{stf.lastActive}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Company Legal & Tax Snapshot */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <h3 className="font-serif font-bold text-stone-900 text-sm flex items-center gap-2">
              <span>🏛️</span> Legal Entity & GST Registration
            </h3>

            <div className="space-y-3 text-xs text-stone-600">
              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
                <span className="text-[10px] uppercase font-bold text-stone-400 block">Registered Business</span>
                <span className="font-semibold text-stone-900 mt-0.5 block">
                  M/S FRUITS AND NUTS TRADING CO.
                </span>
              </div>

              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
                <span className="text-[10px] uppercase font-bold text-stone-400 block">GSTIN Number</span>
                <span className="font-mono font-bold text-stone-900 mt-0.5 block">
                  01AABCM1234F1Z5
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold block mt-1">
                  ✓ Verified Active (Jammu & Kashmir)
                </span>
              </div>

              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
                <span className="text-[10px] uppercase font-bold text-stone-400 block">FSSAI License</span>
                <span className="font-mono font-bold text-stone-900 mt-0.5 block">
                  11026001000892
                </span>
                <span className="text-[10px] text-stone-400 block mt-1">
                  Valid up to 31 Dec 2028
                </span>
              </div>

              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
                <span className="text-[10px] uppercase font-bold text-stone-400 block">Registered Office</span>
                <p className="text-[11px] text-stone-700 mt-0.5 leading-relaxed">
                  Heritage Arcade, Residency Road, Near Polo Ground, Srinagar, Jammu & Kashmir — 190001
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-3">
            <h3 className="font-serif font-bold text-stone-900 text-sm flex items-center gap-2">
              <span>💳</span> Payment Gateway Status
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-stone-50 border border-stone-200">
                <span className="font-semibold text-stone-800">Razorpay Direct</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  LIVE
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-stone-50 border border-stone-200">
                <span className="font-semibold text-stone-800">UPI AutoPay / QR</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  ENABLED
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-stone-50 border border-stone-200">
                <span className="font-semibold text-stone-800">Cash on Delivery</span>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  PIN-FILTERED
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
