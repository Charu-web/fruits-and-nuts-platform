import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions | M/S Fruits & Nuts",
  description: "Terms and conditions of sale and platform usage.",
};

export default function TermsConditionsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="bg-white rounded-3xl border border-[#E5DDD0] p-8 sm:p-12 shadow-xs space-y-6">
        <h1 className="font-serif text-3xl font-bold text-[#123D30]">Terms & Conditions</h1>
        <p className="text-xs text-[#5F6D65]">Last Updated: October 2026</p>

        <div className="text-xs sm:text-sm text-[#3E4D45] space-y-4 leading-relaxed">
          <p>
            Welcome to the official online boutique of M/S Fruits and Nuts Private Limited. By accessing or using our
            website, you agree to be bound by these Terms of Service.
          </p>

          <h3 className="font-serif font-bold text-[#123D30] text-base">1. Orders & Pricing</h3>
          <p>
            All products listed on our platform are subject to harvest availability. Prices are stated in Indian Rupees
            (₹ INR) and are inclusive of all applicable Goods and Services Tax (GST). We reserve the right to revise
            pricing based on agricultural market fluctuations.
          </p>

          <h3 className="font-serif font-bold text-[#123D30] text-base">2. Product Descriptions & Quality</h3>
          <p>
            We take extreme care to accurately describe and grade dry fruits and nuts. As natural agricultural produce,
            minor variations in kernel size, color nuance, and shape naturally occur across distinct seasonal harvests.
          </p>
        </div>
      </div>
    </div>
  );
}
