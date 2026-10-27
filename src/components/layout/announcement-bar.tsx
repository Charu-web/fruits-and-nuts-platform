"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, X, Phone } from "lucide-react";

interface AnnouncementData {
  tagText?: string;
  mainText?: string;
  promoCode?: string;
  promoDiscount?: string;
  ctaLabel?: string;
  ctaLink?: string;
  phoneContact?: string;
  bgColor?: string;
  textColor?: string;
  isDismissable?: boolean;
}

export function AnnouncementBar() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [data, setData] = useState<AnnouncementData>({
    tagText: "ROYAL HARVESTS",
    mainText: "Complimentary Express Delivery on Orders Above ₹999 Across India",
    promoCode: "ROYAL10",
    promoDiscount: "for 10% Off",
    ctaLabel: "Shop Reserve →",
    ctaLink: "/shop",
    phoneContact: "+91-8368301495",
    bgColor: "#173D2C",
    textColor: "#FAF7F0",
    isDismissable: true,
  });

  useEffect(() => {
    async function loadCMSAnnouncement() {
      try {
        const res = await fetch("/api/v1/cms/sections?keys=ANNOUNCEMENT_BAR");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data?.sectionMap?.ANNOUNCEMENT_BAR) {
            const sec = json.data.sectionMap.ANNOUNCEMENT_BAR;
            if (sec.contentJson && typeof sec.contentJson === "object") {
              setData((prev) => ({ ...prev, ...sec.contentJson }));
            }
          }
        }
      } catch {
        // Fallback to default state gracefully
      }
    }

    loadCMSAnnouncement();
  }, []);

  // Do not render storefront announcement bar on administrative consoles
  if (!isVisible || pathname?.startsWith("/admin")) return null;

  return (
    <aside
      aria-label="Promotional announcement"
      style={{ backgroundColor: data.bgColor || "#173D2C", color: data.textColor || "#FAF7F0" }}
      className="text-xs font-medium tracking-wide py-2 px-3 sm:px-4 transition-all duration-300 relative border-b border-[#B89453]/30 shadow-xs overflow-hidden"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex-1 text-center flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
          {data.tagText && (
            <span className="inline-flex items-center gap-1 font-bold tracking-widest text-[#D4B776] text-[10px] uppercase bg-[#B89453]/20 border border-[#B89453]/40 px-2 py-0.5 rounded">
              <Sparkles className="w-2.5 h-2.5 text-[#D4B776]" />
              {data.tagText}
            </span>
          )}
          <span className="hidden sm:inline text-white/20">•</span>
          <span className="text-[11px] sm:text-xs text-[#FAF7F0] font-medium">
            {data.mainText}
          </span>
          {data.promoCode && (
            <>
              <span className="hidden md:inline text-white/20">•</span>
              <span className="hidden md:inline text-[#D4B776] text-xs">
                Use Code:{" "}
                <strong className="text-white bg-[#B89453]/30 border border-[#B89453]/50 px-2 py-0.5 rounded tracking-wider font-mono text-[11px]">
                  {data.promoCode}
                </strong>{" "}
                <span className="text-[#FAF7F0]/80">{data.promoDiscount}</span>
              </span>
            </>
          )}
          {data.phoneContact && (
            <>
              <span className="hidden lg:inline text-white/20">•</span>
              <span className="hidden lg:inline text-xs text-[#FAF7F0]/80 items-center gap-1">
                <Phone className="inline w-3 h-3 text-[#D4B776] mr-0.5" />
                Concierge:{" "}
                <a
                  href={`tel:${data.phoneContact}`}
                  className="text-[#D4B776] hover:underline font-mono"
                >
                  {data.phoneContact}
                </a>
              </span>
            </>
          )}
          {data.ctaLink && (
            <Link
              href={data.ctaLink}
              className="text-[#D4B776] hover:text-white underline underline-offset-4 transition-colors ml-1 font-semibold text-xs inline-flex items-center gap-0.5"
            >
              {data.ctaLabel || "Shop Reserve →"}
            </Link>
          )}
        </div>
        {data.isDismissable !== false && (
          <button
            onClick={() => setIsVisible(false)}
            aria-label="Dismiss announcement"
            className="text-[#FAF7F0]/60 hover:text-white transition-colors p-1.5 -mr-1 cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center shrink-0 touch-manipulation"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </aside>
  );
}
