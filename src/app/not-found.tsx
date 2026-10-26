import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[65vh] flex items-center justify-center px-4 py-16 bg-[#F6F0E5]">
      <div className="max-w-md w-full text-center space-y-6 bg-white/95 backdrop-blur-sm p-8 sm:p-10 rounded-3xl border border-[#D7C8AF] shadow-xl">
        <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#8C6D37]">
          404 Not Found
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#123D30]">
          Harvest Not Found
        </h1>
        <p className="text-xs sm:text-sm text-[#4E6258] leading-relaxed">
          The artisanal product, page, or regional terroir you are looking for does not exist or has been relocated.
        </p>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#123D30] text-[#FAF7F0] text-xs font-bold uppercase tracking-wider hover:bg-[#0B261E] transition-all shadow-md"
          >
            Return Home
          </Link>
          <Link
            href="/shop"
            className="w-full sm:w-auto px-6 py-3 rounded-full border border-[#D7C8AF] text-[#123D30] text-xs font-bold uppercase tracking-wider hover:bg-[#EFE8DC] transition-all text-center"
          >
            Explore Shop
          </Link>
        </div>
      </div>
    </div>
  );
}
