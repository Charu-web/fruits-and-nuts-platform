import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping & Cold-Chain Policy | M/S Fruits & Nuts",
  description: "Express shipping timelines and temperature-controlled delivery policies.",
};

export default function ShippingPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="bg-white rounded-3xl border border-[#E5DDD0] p-8 sm:p-12 shadow-xs space-y-6">
        <h1 className="font-serif text-3xl font-bold text-[#123D30]">Shipping & Fulfillment Policy</h1>
        <p className="text-xs text-[#5F6D65]">Last Updated: October 2026</p>

        <div className="text-xs sm:text-sm text-[#3E4D45] space-y-4 leading-relaxed">
          <h3 className="font-serif font-bold text-[#123D30] text-base">1. Dispatch Timelines</h3>
          <p>
            All confirmed orders are quality-checked, vacuum-sealed, and dispatched within 24–48 hours from our central
            temperature-controlled warehouse facility.
          </p>

          <h3 className="font-serif font-bold text-[#123D30] text-base">2. Free Shipping Threshold</h3>
          <p>
            We offer complimentary standard shipping across India on all retail orders with a cart value equal to or
            exceeding ₹999. Orders below ₹999 incur a flat express shipping fee of ₹99.
          </p>

          <h3 className="font-serif font-bold text-[#123D30] text-base">3. Estimated Transit Times</h3>
          <p>
            - Tier 1 Metro Cities: 2–3 Business Days
            <br />
            - Rest of India: 3–5 Business Days
            <br />
            - High-altitude & remote regions: 5–7 Business Days
          </p>
        </div>
      </div>
    </div>
  );
}
