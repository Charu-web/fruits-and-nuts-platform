"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState<string | null>(null);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setNewsletterStatus("Thank you for joining our Connoisseurs Harvest Journal.");
      setNewsletterEmail("");
    }
  };

  // Do not render storefront footer on administrative consoles
  if (pathname?.startsWith("/admin")) return null;

  return (
    <footer className="bg-[#123D30] text-[#F6F0E5] pt-16 pb-12 border-t-2 border-[#B99553]/40 mt-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/10">
          {/* Brand & Registered Office Vision */}
          <div className="lg:col-span-2 space-y-4">
            <div className="inline-flex flex-col items-center sm:items-start">
              <div className="flex items-center gap-3">
                <img
                  src="/images/logo.jpg"
                  alt="M/S Fruits & Nuts Official Logo"
                  className="h-11 w-auto object-contain rounded-md bg-white px-1.5 py-0.5 border border-[#B99553]/60 shadow-xs"
                />
                <div>
                  <span className="font-serif text-xl sm:text-2xl font-bold tracking-wider text-[#F6F0E5] block">
                    M/S FRUITS & NUTS
                  </span>
                </div>
              </div>
              <span className="text-[10px] sm:text-[11px] tracking-[0.22em] text-[#D4B679] font-semibold text-center w-full pt-1.5">
                Nutrition with an Emotion
              </span>
            </div>

            <p className="text-xs text-[#ECE2D0]/85 leading-relaxed max-w-sm">
              India&apos;s and the world&apos;s finest single-origin harvests — carefully sourced, nitrogen-flushed, hygienically packed, and presented in luxury packaging for discerning connoisseurs.
            </p>

            {/* Official Registered & Operational Addresses */}
            <div className="space-y-2 text-xs text-[#ECE2D0]/80 pt-1">
              <div className="flex items-start gap-2">
                <span className="text-[#D4B679] shrink-0 font-bold">📍 Registered Office:</span>
                <span>K-12 Sapphire 90 Mall, Sector 90, Gurgaon, PIN 122505</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#D4B679] shrink-0 font-bold">📍 Regional Center:</span>
                <span>Sant Tower, Pindi Street, Ludhiana, Punjab</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#D4B679] shrink-0 font-bold">📞 Concierge:</span>
                <a href="tel:+918368301495" className="hover:text-[#D4B679] transition-colors font-medium">
                  +91-8368301495
                </a>
                <span className="text-white/30">|</span>
                <a href="tel:+917633080180" className="hover:text-[#D4B679] transition-colors font-medium">
                  +91-7633080180
                </a>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#D4B679] shrink-0 font-bold">✉️ Support:</span>
                <a href="mailto:customersupport@fruitsandnuts.co.in" className="hover:text-[#D4B679] transition-colors font-medium">
                  customersupport@fruitsandnuts.co.in
                </a>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#D4B679] bg-[#1B4D3E] px-2.5 py-1 rounded border border-[#B99553]/30 uppercase tracking-wider">
                <span>🛡️</span> FSSAI Certified
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#D4B679] bg-[#1B4D3E] px-2.5 py-1 rounded border border-[#B99553]/30 uppercase tracking-wider">
                <span>🏔️</span> Single-Origin Terroir
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#D4B679] bg-[#1B4D3E] px-2.5 py-1 rounded border border-[#B99553]/30 uppercase tracking-wider">
                <span>✨</span> Nitrogen Sealed
              </span>
            </div>
          </div>

          {/* Curated Harvests */}
          <div className="space-y-3">
            <p className="font-serif text-xs font-bold text-[#D4B679] tracking-widest uppercase">
              Curated Harvests
            </p>
            <ul className="space-y-2 text-xs text-[#ECE2D0]/85">
              <li><Link href="/shop" className="hover:text-[#D4B679] transition-colors">All Royal Harvests</Link></li>
              <li><Link href="/category/dry-fruits" className="hover:text-[#D4B679] transition-colors">Dry Fruits & Jumbo Nuts</Link></li>
              <li><Link href="/category/dates-khajoor" className="hover:text-[#D4B679] transition-colors">Royal Dates & Khajoor</Link></li>
              <li><Link href="/category/tea" className="hover:text-[#D4B679] transition-colors">Artisanal Estate Teas</Link></li>
              <li><Link href="/category/chocolates" className="hover:text-[#D4B679] transition-colors">Gourmet Belgian Chocolates</Link></li>
              <li><Link href="/category/seeds" className="hover:text-[#D4B679] transition-colors">Super Seeds & Berries</Link></li>
              <li><Link href="/category/mouth-fresheners" className="hover:text-[#D4B679] transition-colors">Royal Mouth Fresheners (Mukhwas)</Link></li>
              <li><Link href="/gifting" className="hover:text-[#D4B679] transition-colors">Festive Gift Hampers</Link></li>
              <li><Link href="/build-your-own-box" className="hover:text-[#D4B679] transition-colors text-[#D4B679] font-bold">✨ Build Your Own Box (BYOB)</Link></li>
            </ul>
          </div>

          {/* Provenance & Boutiques */}
          <div className="space-y-3">
            <p className="font-serif text-xs font-bold text-[#D4B679] tracking-widest uppercase">
              Provenance & Outlets
            </p>
            <ul className="space-y-2 text-xs text-[#ECE2D0]/85">
              <li><Link href="/about" className="hover:text-[#D4B679] transition-colors">About Our Terroirs</Link></li>
              <li><Link href="/taste-map" className="hover:text-[#D4B679] transition-colors">The India Taste Map</Link></li>
              <li><Link href="/stores" className="hover:text-[#D4B679] transition-colors">Flagship Boutiques (Gurgaon & Ludhiana)</Link></li>
              <li><Link href="/contact" className="hover:text-[#D4B679] transition-colors">Customer Concierge & Inquiries</Link></li>
              <li><Link href="/faq" className="hover:text-[#D4B679] transition-colors">Frequently Asked Questions (FAQ)</Link></li>
              <li><Link href="/gifting" className="hover:text-[#D4B679] transition-colors">Corporate & Wedding Gifting</Link></li>
              <li><Link href="/account" className="hover:text-[#D4B679] transition-colors">Customer Account & Orders</Link></li>
            </ul>
          </div>

          {/* Harvest Journal Newsletter */}
          <div className="space-y-3">
            <p className="font-serif text-xs font-bold text-[#D4B679] tracking-widest uppercase">
              Harvest Journal
            </p>
            <p className="text-xs text-[#ECE2D0]/75 leading-relaxed">
              Receive private invitations for limited seasonal reserve batches and royal festive curations.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="space-y-2 pt-1">
              <input
                type="email"
                required
                aria-label="Email address for Connoisseurs Harvest Journal newsletter"
                placeholder="Enter email address"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white/10 text-white rounded-lg border border-white/20 focus:border-[#B99553] focus:outline-none placeholder:text-white/40"
              />
              <button
                type="submit"
                className="w-full py-2 bg-[#B99553] hover:bg-[#967438] text-[#123D30] text-xs font-bold rounded-lg transition-all uppercase tracking-wider shadow-sm cursor-pointer"
              >
                Join Connoisseurs Club
              </button>
            </form>
            {newsletterStatus && (
              <p role="status" aria-live="polite" className="text-[11px] text-[#D4B679] mt-1 font-medium">{newsletterStatus}</p>
            )}
          </div>
        </div>

        {/* Middle Statutory Legal & Disclaimer Block */}
        <div className="py-6 border-b border-white/10 text-[11px] text-[#ECE2D0]/65 space-y-2.5 leading-relaxed">
          <p>
            <strong className="text-[#D4B679]">Statutory Disclaimer:</strong> While M/S Fruits & Nuts strives for absolute purity and authenticity in every harvest detail, natural estate batches may exhibit subtle variations in color, natural oil profile, and grain across harvest seasons. All health and wellness statements adhere strictly to FSSAI guidelines for nutritional awareness and do not constitute clinical treatment claims.
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2 text-xs font-medium">
            <Link href="/about" className="hover:text-[#D4B679] transition-colors">About Us</Link>
            <Link href="/contact" className="hover:text-[#D4B679] transition-colors">Contact Concierge</Link>
            <Link href="/faq" className="hover:text-[#D4B679] transition-colors">FAQs</Link>
            <Link href="/terms-and-conditions" className="hover:text-[#D4B679] transition-colors">Terms & Conditions</Link>
            <Link href="/privacy-policy" className="hover:text-[#D4B679] transition-colors">Privacy Policy</Link>
            <Link href="/shipping-policy" className="hover:text-[#D4B679] transition-colors">Shipping & Delivery Policy</Link>
            <Link href="/refund-policy" className="hover:text-[#D4B679] transition-colors">Refund & Return Policy</Link>
            <Link href="/food-safety-compliance" className="hover:text-[#D4B679] transition-colors">FSSAI Compliance</Link>
          </div>
        </div>

        {/* Bottom Copyright & Guarantee */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#ECE2D0]/65 gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
            <span>© 2026 M/S Fruits & Nuts (fruitsandnuts.co.in)</span>
            <span className="hidden sm:inline text-white/30">•</span>
            <span>Develop and design by |ENCODER| |8969170707|</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-[#D4B679] font-semibold bg-[#1B4D3E] px-3 py-1 rounded-full border border-[#B99553]/30">
              ✨ Nitrogen-Flushed Purity Guarantee
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
