import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Food Safety & Quality Compliance | M/S Fruits & Nuts",
  description: "FSSAI compliance standards and laboratory safety protocols.",
};

export default function FoodSafetyCompliancePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="bg-white rounded-3xl border border-[#E5DDD0] p-8 sm:p-12 shadow-xs space-y-6">
        <h1 className="font-serif text-3xl font-bold text-[#123D30]">Food Safety & FSSAI Standards</h1>
        <p className="text-xs text-[#5F6D65]">Statutory Governance & Quality Benchmarks</p>

        <div className="text-xs sm:text-sm text-[#3E4D45] space-y-4 leading-relaxed">
          <p>
            M/S Fruits and Nuts operates strictly under standard regulatory compliances governed by the Food Safety and
            Standards Authority of India (FSSAI).
          </p>

          <h3 className="font-serif font-bold text-[#123D30] text-base">1. Lab-Tested Batch Purity</h3>
          <p>
            Every batch of incoming harvests undergoes rigorous testing for moisture levels, aflatoxins, microbial
            limits, and heavy metals at NABL-accredited food laboratories.
          </p>

          <h3 className="font-serif font-bold text-[#123D30] text-base">2. Nitrogen Flushing & Packaging</h3>
          <p>
            To eliminate oxidation without artificial chemicals, our products are vacuum-sealed in multi-layer food-grade
            barrier pouches with inert nitrogen flushing, ensuring raw crispness for up to 9 months.
          </p>

          <h3 className="font-serif font-bold text-[#123D30] text-base">3. Allergen Advisory</h3>
          <p>
            All products are processed in dedicated facilities that handle tree nuts (almonds, walnuts, pistachios,
            cashews).
          </p>
        </div>
      </div>
    </div>
  );
}
