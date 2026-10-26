import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund & Replacement Policy | M/S Fruits & Nuts",
  description: "Guidelines on returns, damage replacements, and refunds.",
};

export default function RefundPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="bg-white rounded-3xl border border-[#E5DDD0] p-8 sm:p-12 shadow-xs space-y-6">
        <h1 className="font-serif text-3xl font-bold text-[#123D30]">Cancellation & Refund Policy</h1>
        <p className="text-xs text-[#5F6D65]">Last Updated: October 2026</p>

        <div className="text-xs sm:text-sm text-[#3E4D45] space-y-4 leading-relaxed">
          <h3 className="font-serif font-bold text-[#123D30] text-base">1. Pre-Dispatch Order Cancellation</h3>
          <p>
            Customers may cancel any placed order directly through their Customer Account Hub prior to parcel
            dispatch. Upon pre-dispatch cancellation, 100% of the paid amount is initiated for instant refund to the
            original payment method.
          </p>

          <h3 className="font-serif font-bold text-[#123D30] text-base">2. Quality Guarantee & Replacements</h3>
          <p>
            As perishable and gourmet food items, we do not accept returns once a package is opened. However, in the
            unlikely event of package damage during transit or quality non-conformance, please notify our concierge
            within 48 hours of delivery with photographic evidence for an expedited replacement or full refund.
          </p>
        </div>
      </div>
    </div>
  );
}
