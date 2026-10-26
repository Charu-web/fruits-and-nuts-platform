import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { Sparkles, ShieldCheck, Mountain, Leaf, Award, Compass, HeartHandshake } from "lucide-react";

export const metadata: Metadata = {
  title: "About Our Royal Harvests | M/S Fruits & Nuts",
  description:
    "Discover the heritage and sourcing philosophy of M/S Fruits & Nuts. Handpicked single-origin harvests from Kashmir, Jordan, and the world's royal terroirs.",
};

export default function AboutPage() {
  return (
    <div className="bg-[#F6F0E5] min-h-screen text-[#123D30]">
      {/* Hero Section */}
      <section className="relative bg-[#173D2C] text-[#F6F0E5] py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-5xl mx-auto text-center space-y-4 relative z-10">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1B4D3E] border border-[#B99553]/40 text-[#D4B679] text-xs uppercase font-bold tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            Our Heritage &amp; Terroir Sourcing
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-[#FAF7F0] max-w-3xl mx-auto leading-tight">
            Pure Harvests. Royal Terroirs. Zero Compromise.
          </h1>
          <p className="text-sm sm:text-base text-[#ECE2D0]/85 max-w-2xl mx-auto leading-relaxed">
            Founded on the conviction that gourmet dry fruits should be celebrated like vintage wines—shaped by altitude, glacier water, and generational orchard stewardship.
          </p>
        </div>
      </section>

      {/* Main Story & Sourcing Philosophy */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-[0.22em] text-[#8C6D37]">
              The Provenance Promise
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#123D30]">
              From High-Altitude Orchards to Discerning Tables
            </h2>
            <p className="text-xs sm:text-sm text-[#4E6258] leading-relaxed">
              Every harvest at <strong>M/S Fruits &amp; Nuts</strong> originates from verified geographical regions celebrated for exceptional fruit and nut cultivation. From the mineral-rich alpine slopes of Pampore and Pulwama in Kashmir to the historic date groves of the Jordan Valley, we reject mass-market consolidation in favor of single-origin traceability.
            </p>
            <p className="text-xs sm:text-sm text-[#4E6258] leading-relaxed">
              Our Kashmiri Mamra almonds retain up to 50% natural almond oil content, boasting the quintessential concave boat curve and rich crunch. We strictly forbid artificial glucose glazing, sulfur bleaching, and chemical polishing.
            </p>
          </div>

          <div className="bg-white/90 backdrop-blur-xs p-8 rounded-3xl border border-[#D7C8AF] shadow-md space-y-4">
            <h3 className="font-serif text-xl font-bold text-[#123D30]">The Fruits &amp; Nuts Standard</h3>
            <ul className="space-y-3 text-xs sm:text-sm text-[#4E6258]">
              <li className="flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-[#8C6D37] shrink-0 mt-0.5" />
                <span><strong>Zero Chemical Treatments:</strong> 100% natural harvests, unbleached and chemical-free.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Mountain className="w-5 h-5 text-[#8C6D37] shrink-0 mt-0.5" />
                <span><strong>True Terroir Authenticity:</strong> Verified geographical provenance mapped on our India Taste Map.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Leaf className="w-5 h-5 text-[#8C6D37] shrink-0 mt-0.5" />
                <span><strong>Nitrogen-Flushed Airtight Packaging:</strong> Packed at source to seal in natural aroma and crunch.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Award className="w-5 h-5 text-[#8C6D37] shrink-0 mt-0.5" />
                <span><strong>FSSAI Certified:</strong> Rigorously tested for purity, aflatoxins, and moisture compliance.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Core Pillars */}
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-[0.22em] text-[#8C6D37]">
              Four Pillars of Excellence
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#123D30]">
              How We Deliver Royal Goodness
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/80 p-6 rounded-2xl border border-[#D7C8AF] shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#EFE8DC] flex items-center justify-center text-[#123D30]">
                <Compass className="w-5 h-5 text-[#8C6D37]" />
              </div>
              <h4 className="font-serif font-bold text-base text-[#123D30]">Direct Orchard Sourcing</h4>
              <p className="text-xs text-[#4E6258] leading-relaxed">
                Direct partnerships with generational growers in Kashmir, Jordan, and the Deccan plateau ensure peak harvest selection.
              </p>
            </div>

            <div className="bg-white/80 p-6 rounded-2xl border border-[#D7C8AF] shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#EFE8DC] flex items-center justify-center text-[#123D30]">
                <ShieldCheck className="w-5 h-5 text-[#8C6D37]" />
              </div>
              <h4 className="font-serif font-bold text-base text-[#123D30]">Laser Optical Grading</h4>
              <p className="text-xs text-[#4E6258] leading-relaxed">
                Graded by weight, size, and kernel density. Eliminating shriveled pieces and ensuring consistent jumbo caliber.
              </p>
            </div>

            <div className="bg-white/80 p-6 rounded-2xl border border-[#D7C8AF] shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#EFE8DC] flex items-center justify-center text-[#123D30]">
                <Sparkles className="w-5 h-5 text-[#8C6D37]" />
              </div>
              <h4 className="font-serif font-bold text-base text-[#123D30]">Nitrogen Sealed Freshness</h4>
              <p className="text-xs text-[#4E6258] leading-relaxed">
                Oxygen is extracted and replaced with food-grade nitrogen to preserve essential fatty acids and crunch without synthetic preservatives.
              </p>
            </div>

            <div className="bg-white/80 p-6 rounded-2xl border border-[#D7C8AF] shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#EFE8DC] flex items-center justify-center text-[#123D30]">
                <HeartHandshake className="w-5 h-5 text-[#8C6D37]" />
              </div>
              <h4 className="font-serif font-bold text-base text-[#123D30]">Artisanal Bespoke Gifting</h4>
              <p className="text-xs text-[#4E6258] leading-relaxed">
                Handcrafted reusable pine wood and imperial velvet gift boxes, personalized with gold foil calligraphy for weddings and festive gifting.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-[#173D2C] text-[#FAF7F0] p-8 sm:p-10 rounded-3xl border border-[#B99553]/40 text-center space-y-4">
          <h3 className="font-serif text-2xl sm:text-3xl font-bold">
            Experience the Royal Reserve Today
          </h3>
          <p className="text-xs sm:text-sm text-[#ECE2D0]/85 max-w-xl mx-auto leading-relaxed">
            Taste the difference of true geographical single-origin dry fruits, dates, and artisanal estate teas delivered express to your doorstep across India.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/shop"
              className="px-6 py-3 rounded-full bg-[#B99553] text-[#123D30] text-xs font-bold uppercase tracking-wider hover:bg-[#A38144] transition-all shadow-md"
            >
              Explore Royal Shop
            </Link>
            <Link
              href="/taste-map"
              className="px-6 py-3 rounded-full border border-[#D7C8AF] text-[#FAF7F0] text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-all"
            >
              Explore India Taste Map
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
