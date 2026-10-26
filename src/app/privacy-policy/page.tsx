import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | M/S Fruits & Nuts",
  description: "Privacy Policy and data governance compliance for M/S Fruits & Nuts.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="bg-white rounded-3xl border border-[#E5DDD0] p-8 sm:p-12 shadow-xs space-y-6">
        <h1 className="font-serif text-3xl font-bold text-[#123D30]">Privacy Policy</h1>
        <p className="text-xs text-[#5F6D65]">Last Updated: October 2026</p>

        <div className="text-xs sm:text-sm text-[#3E4D45] space-y-4 leading-relaxed">
          <p>
            M/S Fruits and Nuts Private Limited (&ldquo;Company&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) is committed to protecting
            the privacy, confidentiality, and security of all personal data provided by visitors and registered
            customers across our digital platforms.
          </p>

          <h3 className="font-serif font-bold text-[#123D30] text-base">1. Information We Collect</h3>
          <p>
            We collect personal identification information including your name, contact phone number, email address,
            shipping/billing addresses, and transaction metadata necessary to process orders, comply with statutory tax
            reporting, and fulfill cold-chain logistics.
          </p>

          <h3 className="font-serif font-bold text-[#123D30] text-base">2. Payment Security</h3>
          <p>
            We do not store or process payment card numbers, CVVs, or NetBanking credentials on our servers. All
            monetary transactions are processed securely through PCI-DSS Level 1 compliant gateway partners (Razorpay).
          </p>

          <h3 className="font-serif font-bold text-[#123D30] text-base">3. Data Retention & Protection</h3>
          <p>
            All customer data is encrypted in transit using 256-bit TLS/SSL and maintained in secure cloud databases
            under strict role-based access control (RBAC).
          </p>
        </div>
      </div>
    </div>
  );
}
