"use client";

import React, { useEffect } from "react";
import Link from "next/link";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Storefront error caught:", error);
  }, [error]);

  return (
    <div className="min-h-[65vh] flex items-center justify-center px-4 py-16 bg-[#F6F0E5]">
      <div className="max-w-md w-full text-center space-y-6 bg-white/95 backdrop-blur-sm p-8 sm:p-10 rounded-3xl border border-[#D7C8AF] shadow-xl">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[#EFE8DC] border border-[#D7C8AF] flex items-center justify-center text-[#123D30]">
          <svg
            className="w-7 h-7"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#8C6D37]">
            M/S Fruits &amp; Nuts
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#123D30]">
            We Encountered an Issue
          </h2>
          <p className="text-xs sm:text-sm text-[#4E6258] leading-relaxed">
            Our team has been alerted. Please try refreshing this section or navigate back to the catalogue.
          </p>
        </div>

        {error?.digest && (
          <p className="text-[11px] text-[#86968E] font-mono bg-[#F6F0E5] py-1 px-3 rounded-md inline-block">
            Error ID: {error.digest}
          </p>
        )}

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            type="button"
            className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#123D30] text-[#FAF7F0] text-xs font-bold uppercase tracking-wider hover:bg-[#0B261E] transition-all shadow-md active:scale-95"
          >
            Reload Section
          </button>
          <Link
            href="/shop"
            className="w-full sm:w-auto px-6 py-3 rounded-full border border-[#D7C8AF] text-[#123D30] text-xs font-bold uppercase tracking-wider hover:bg-[#EFE8DC] transition-all text-center"
          >
            Browse Catalogue
          </Link>
        </div>
      </div>
    </div>
  );
}
