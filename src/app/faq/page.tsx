"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronDown, HelpCircle, Sparkles, ShieldCheck, Truck, Gift, CreditCard, Search } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
  category: "PURITY" | "PACKAGING" | "SHIPPING" | "GIFTING" | "PAYMENTS";
}

const FAQS: FAQItem[] = [
  // Purity & Terroir
  {
    category: "PURITY",
    question: "What makes Kashmiri Mamra Almonds different from regular California almonds?",
    answer:
      "Kashmiri Mamra almonds are celebrated globally as the royalty of almonds. Unlike California almonds, which undergo industrial hybrid scaling and oil extraction, Kashmiri Mamra are 100% natural and grown in high-altitude Himalayan orchards with glacier meltwater. They retain up to 50% natural almond oil content, feature a distinct concave boat curve, and provide superior crunch and cognitive nourishment.",
  },
  {
    category: "PURITY",
    question: "Are your dry fruits chemically bleached or polished?",
    answer:
      "Never. We maintain a zero-tolerance policy against chemical polishing, sulfur bleaching, and synthetic glucose glazing. Every batch retains its authentic earthy hue, natural oils, and unadulterated botanical fragrance.",
  },
  {
    category: "PURITY",
    question: "Are Fruits & Nuts products certified under FSSAI food safety regulations?",
    answer:
      "Yes. All packaging, processing, and handling procedures comply rigorously with Food Safety and Standards Authority of India (FSSAI) guidelines. Every harvest is tested for aflatoxins, microbial safety, and moisture standards.",
  },

  // Packaging & Storage
  {
    category: "PACKAGING",
    question: "What is nitrogen-flushed packaging and why is it important?",
    answer:
      "Dry fruits and nuts are rich in delicate polyunsaturated fatty acids that oxidize and turn rancid when exposed to ambient atmospheric oxygen. Our state-of-the-art packaging extracts oxygen and introduces inert food-grade nitrogen, sealing in crispness, flavor, and nutrition for months without artificial chemical preservatives.",
  },
  {
    category: "PACKAGING",
    question: "How should I store my dry fruits and dates at home after opening?",
    answer:
      "After breaking the hermetic nitrogen seal, reseal the supplied airtight jar immediately. Store in a cool, dry place away from direct sunlight. In warm or humid Indian summers, we recommend refrigerating almonds, walnuts, and dates below 15°C to preserve their natural oil profile and crispness.",
  },
  {
    category: "PACKAGING",
    question: "What is the shelf life of Fruits & Nuts harvests?",
    answer:
      "Unopened nitrogen-flushed tins and jars retain optimal freshness for 9 to 12 months from the packaging date. Detailed batch and expiry dates are printed on the regulatory statutory label.",
  },

  // Shipping & Delivery
  {
    category: "SHIPPING",
    question: "What are your shipping rates and how do I qualify for free delivery?",
    answer:
      "We offer complimentary express delivery across India on all orders of ₹999 and above. For orders under ₹999, a nominal flat express shipping charge of ₹99 is calculated at checkout.",
  },
  {
    category: "SHIPPING",
    question: "How long will it take for my order to arrive?",
    answer:
      "Orders placed before 2:00 PM IST are dispatched on the same business day from our climate-controlled fulfillment hub. Metro cities (Delhi-NCR, Mumbai, Bangalore, Hyderabad) typically receive delivery within 2 to 3 business days. Non-metro and regional PIN codes arrive within 4 to 6 business days.",
  },
  {
    category: "SHIPPING",
    question: "Can I track my order in real-time?",
    answer:
      "Yes. As soon as your shipment is dispatched, you will receive an SMS and email notification with an authoritative Air Waybill (AWB) carrier tracking link. You can also view live delivery milestones directly in your Customer Account order history.",
  },

  // Gifting & Customization
  {
    category: "GIFTING",
    question: "Can I customize my own gift hamper with 'Build Your Own Box'?",
    answer:
      "Absolutely. Our interactive 'Build Your Own Box' (BYOB) feature lets you choose from Royal Duo (2 jars), Imperial Quartet (4 jars), or Sovereign (6 jars) handcrafted presentation boxes, pick your preferred harvests, and include a personalized calligraphy greeting card.",
  },
  {
    category: "GIFTING",
    question: "Do you handle corporate bulk orders and wedding favor inquiries?",
    answer:
      "Yes. We specialize in corporate Diwali, New Year, and luxury wedding gifting. We offer bespoke sleeve printing, custom wax seals, company branding, and multi-address nationwide distribution. Reach out to our concierge at +91-8368301495 or via the Contact page.",
  },

  // Payments & Returns
  {
    category: "PAYMENTS",
    question: "What payment methods are supported on the storefront?",
    answer:
      "We accept all major payment modes via Razorpay secure gateway—including UPI (Google Pay, PhonePe, Paytm), Credit & Debit Cards (Visa, Mastercard, RuPay, Amex), Net Banking across 50+ Indian banks, and Cash on Delivery (COD) for orders up to ₹5,000 (with a ₹50 cash handling surcharge).",
  },
  {
    category: "PAYMENTS",
    question: "What is your refund or replacement policy if my parcel is damaged?",
    answer:
      "In the unlikely event of transit damage or seal breakage, please share photos with our concierge at customersupport@fruitsandnuts.co.in within 48 hours of receipt. We provide an immediate free replacement dispatch or full refund to your original payment method.",
  },
];

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFaqs = FAQS.filter((faq) => {
    const matchesCategory = activeCategory === "ALL" || faq.category === activeCategory;
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="bg-[#F6F0E5] min-h-screen text-[#123D30]">
      {/* Header */}
      <section className="bg-[#173D2C] text-[#F6F0E5] py-16 px-4 sm:px-6 lg:px-8 text-center space-y-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1B4D3E] border border-[#B99553]/40 text-[#D4B679] text-xs uppercase font-bold tracking-widest">
          <HelpCircle className="w-3.5 h-3.5" />
          Connoisseurs Knowledge Base
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-[#FAF7F0]">
          Frequently Asked Questions
        </h1>
        <p className="text-xs sm:text-sm text-[#ECE2D0]/85 max-w-xl mx-auto leading-relaxed">
          Everything you need to know about our single-origin terroirs, nitrogen preservation packaging, order tracking, and bespoke gifting.
        </p>

        {/* Search Bar */}
        <div className="max-w-md mx-auto pt-4">
          <div className="relative">
            <Search className="w-4 h-4 text-[#8C6D37] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by topic, e.g. Mamra, shipping, storage..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-10 pr-4 py-3 rounded-full bg-white/95 text-[#123D30] placeholder:text-[#5F6D65] focus:outline-none shadow-md"
            />
          </div>
        </div>
      </section>

      {/* Categories & Accordion */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {[
            { id: "ALL", label: "All Questions" },
            { id: "PURITY", label: "Harvest Purity & Grading" },
            { id: "PACKAGING", label: "Nitrogen & Storage" },
            { id: "SHIPPING", label: "Shipping & Tracking" },
            { id: "GIFTING", label: "Gifting & BYOB" },
            { id: "PAYMENTS", label: "Payments & Refunds" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                setOpenIndex(null);
              }}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeCategory === cat.id
                  ? "bg-[#123D30] text-[#FAF7F0] shadow-sm"
                  : "bg-white/80 text-[#4E6258] border border-[#D7C8AF] hover:bg-white"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, idx) => {
              const isOpen = openIndex === idx;
              return (
                <div
                  key={faq.question}
                  className="bg-white/90 backdrop-blur-xs rounded-2xl border border-[#D7C8AF] overflow-hidden shadow-xs transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-[#FAF7F0]/60 transition-colors"
                  >
                    <span className="font-serif text-sm sm:text-base font-bold text-[#123D30] leading-snug">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-[#8C6D37] shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[#4E6258] leading-relaxed border-t border-[#D7C8AF]/50 bg-[#FAF7F0]/40">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-[#D7C8AF] p-8 space-y-2">
              <p className="text-xs text-[#5F6D65]">No matching answers found for &ldquo;{searchQuery}&rdquo;.</p>
              <button
                onClick={() => setSearchQuery("")}
                className="text-xs font-bold text-[#123D30] underline"
              >
                Clear Search Query
              </button>
            </div>
          )}
        </div>

        {/* Still Have Questions Box */}
        <div className="p-8 bg-white/90 backdrop-blur-xs rounded-3xl border border-[#D7C8AF] shadow-md text-center space-y-4">
          <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#123D30]">
            Still have questions about our harvests?
          </h3>
          <p className="text-xs sm:text-sm text-[#4E6258] max-w-md mx-auto leading-relaxed">
            Our connoisseur team is ready to assist with custom advice, batch harvesting queries, or bulk gifting requirements.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/contact"
              className="px-6 py-2.5 rounded-full bg-[#123D30] text-[#FAF7F0] text-xs font-bold uppercase tracking-wider hover:bg-[#0B261E] transition-all shadow-md"
            >
              Contact Concierge Team
            </Link>
            <a
              href="tel:+918368301495"
              className="px-6 py-2.5 rounded-full border border-[#D7C8AF] text-[#123D30] text-xs font-bold uppercase tracking-wider hover:bg-[#EFE8DC] transition-all"
            >
              Call +91-8368301495
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
