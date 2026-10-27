"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  User,
  Heart,
  ShoppingBag,
  Menu,
  X,
  ChevronDown,
  Sparkles,
  MapPin,
  Gift,
} from "lucide-react";
import { useCart } from "../cart/cart-context";
import { MegaMenu } from "./mega-menu";
import { SearchModal } from "@/components/search/search-modal";

const MAIN_NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Shop All", href: "/shop" },
  { label: "Dry Fruits", href: "/category/dry-fruits" },
  { label: "Dates", href: "/category/dates-khajoor" },
  { label: "Tea", href: "/category/tea" },
  { label: "Chocolates", href: "/category/chocolates" },
  { label: "Seeds", href: "/category/seeds" },
  { label: "Mouth Fresheners", href: "/category/mouth-fresheners" },
  { label: "Combos & Gift Packs", href: "/category/combos" },
  { label: "Gift Finder", href: "/gifting" },
  { label: "Our Stores", href: "/stores" },
];

export function Header() {
  const pathname = usePathname();
  const { summary, toggleDrawer } = useCart();
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Global Keyboard shortcut: Ctrl+K / Cmd+K to open search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchModalOpen(true);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsMegaMenuOpen(false);
  }, [pathname]);

  // Prevent background scroll and support Escape key when mobile navigation drawer is open
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    }
    if (isMobileMenuOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  // Do not render storefront header on administrative consoles
  if (pathname?.startsWith("/admin")) return null;

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E5DEC9] transition-all">
        {/* Main Header Bar */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Left: Mobile Menu Trigger */}
            <div className="flex items-center lg:hidden shrink-0">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle navigation menu"
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-navigation-drawer"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 text-[#173D2C] hover:text-[#B89453] focus:outline-none transition-colors cursor-pointer rounded-lg hover:bg-[#FAF7F0] touch-manipulation"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>

            {/* Center-Left: Brand Logo & Wordmark */}
            <div className="flex items-center min-w-0">
              <Link href="/" className="flex flex-col items-center group">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <img
                    src="/images/logo.jpg"
                    alt="Fruits & Nuts Official Logo"
                    className="h-7 sm:h-9 w-auto object-contain rounded-md bg-white px-1 py-0.5 border border-[#B89453]/60 shadow-xs group-hover:border-[#B89453] group-hover:scale-105 transition-all"
                  />
                  <span className="font-serif text-base sm:text-xl font-bold tracking-[0.06em] sm:tracking-[0.08em] text-[#173D2C] group-hover:text-[#987B3E] transition-colors leading-none whitespace-nowrap">
                    FRUITS &amp; NUTS
                  </span>
                </div>
                <span className="text-[8.5px] sm:text-[10.5px] tracking-[0.16em] sm:tracking-[0.2em] text-[#7E5E1E] font-bold text-center w-full pt-1 truncate">
                  Nutrition with an Emotion
                </span>
              </Link>
            </div>

            {/* Center: Desktop Navigation Quick Highlights */}
            <div className="hidden xl:flex items-center gap-6">
              <Link
                href="/build-your-own-box"
                className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#173D2C] hover:text-[#987B3E] px-3 py-1.5 rounded-full bg-[#FAF7F0] border border-[#B89453]/40 hover:border-[#B89453] transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#B89453]" />
                <span>Bespoke Box</span>
                <span className="text-[9px] bg-[#B89453] text-[#173D2C] px-1.5 py-0.2 rounded font-bold uppercase">
                  BYOB
                </span>
              </Link>

              <Link
                href="/gifting"
                className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#173D2C] hover:text-[#987B3E] px-3 py-1.5 rounded-full bg-[#FAF7F0] border border-[#B89453]/40 hover:border-[#B89453] transition-all"
              >
                <Gift className="w-3.5 h-3.5 text-[#B89453]" />
                <span>Gift Finder</span>
              </Link>

              <Link
                href="/taste-map"
                className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#173D2C] hover:text-[#B89453] transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-[#B89453]" />
                <span>India Taste Map</span>
              </Link>

              <button
                type="button"
                onMouseEnter={() => setIsMegaMenuOpen(true)}
                onClick={() => setIsMegaMenuOpen(!isMegaMenuOpen)}
                aria-expanded={isMegaMenuOpen}
                aria-haspopup="true"
                className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#173D2C] hover:text-[#B89453] transition-colors cursor-pointer py-1"
              >
                <span>Curated Reserve</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#987B3E] transition-transform duration-200 ${
                    isMegaMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>

            {/* Right: Utility Actions (Search, Account, Wishlist, Cart) */}
            <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
              {/* AI Sommelier Quick Trigger */}
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("open-sommelier"))}
                className="hidden md:inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#FAF7F0] bg-[#173D2C] hover:bg-[#102C21] px-3 py-1.5 rounded-full border border-[#B89453]/60 transition-all cursor-pointer shadow-xs"
                title="Consult Royal Gourmet Sommelier AI Concierge"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#B89453]" />
                <span>Ask Sommelier</span>
              </button>

              {/* Search Trigger Button with shortcut pill */}
              <button
                type="button"
                onClick={() => setIsSearchModalOpen(true)}
                aria-label="Search gourmet harvests"
                className="min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] flex items-center justify-center gap-1.5 sm:gap-2 p-1.5 sm:px-3 sm:py-1.5 text-[#173D2C] hover:text-[#B89453] rounded-full hover:bg-[#FAF7F0] transition-colors cursor-pointer border border-transparent sm:border-[#E5DEC9] touch-manipulation"
              >
                <Search className="w-4 h-4 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline text-xs text-[#5F6D65]">Search...</span>
                <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 text-[9px] font-mono text-[#5F6D65] bg-[#FAF7F0] border border-[#E5DEC9] rounded">
                  ⌘K
                </kbd>
              </button>

              {/* Customer Account */}
              <Link
                href="/login"
                aria-label="Customer Account"
                className="min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] flex items-center justify-center p-1.5 sm:p-2 text-[#173D2C] hover:text-[#B89453] transition-colors rounded-full hover:bg-[#FAF7F0] cursor-pointer touch-manipulation"
              >
                <User className="w-5 h-5" />
              </Link>

              {/* Wishlist */}
              <Link
                href="/shop"
                aria-label="Saved Wishlist Items"
                className="p-2 text-[#173D2C] hover:text-[#B89453] transition-colors rounded-full hover:bg-[#FAF7F0] hidden sm:inline-flex cursor-pointer"
              >
                <Heart className="w-5 h-5" />
              </Link>

              {/* Shopping Bag Trigger */}
              <button
                type="button"
                onClick={toggleDrawer}
                aria-label={`Open shopping cart with ${summary.itemCount} items`}
                className="min-h-[40px] sm:min-h-[44px] flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 bg-[#173D2C] text-[#FAF7F0] rounded-full hover:bg-[#102C21] border border-[#B89453]/40 transition-all shadow-xs group cursor-pointer ml-0.5 touch-manipulation"
              >
                <ShoppingBag className="w-4 h-4 text-[#D4B776]" />
                <span className="text-xs font-bold text-[#D4B776]">{summary.itemCount}</span>
                {summary.subtotal > 0 && (
                  <span className="hidden sm:inline text-xs font-medium border-l border-white/20 pl-2 text-[#FAF7F0]">
                    ₹{summary.subtotal.toLocaleString("en-IN")}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Category Navigation Strip (Visible on large screens) */}
        <nav
          aria-label="Primary Category Navigation"
          className="hidden lg:block border-t border-[#E5DEC9] bg-[#FAF7F0]/95"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ul className="flex items-center justify-between py-2 overflow-x-auto text-[11px] font-bold uppercase tracking-[0.16em] text-[#173D2C]">
              {MAIN_NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.label} className="shrink-0">
                    <Link
                      href={item.href}
                      className={`relative px-3 py-1.5 transition-colors duration-200 inline-block ${
                        isActive
                          ? "text-[#173D2C] font-extrabold after:content-[''] after:absolute after:bottom-0 after:left-3 after:right-3 after:h-[2px] after:bg-[#B89453]"
                          : "text-[#173D2C]/90 hover:text-[#987B3E] after:content-[''] after:absolute after:bottom-0 after:left-3 after:right-3 after:h-[2px] after:bg-[#B89453] after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-250 after:origin-center"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Mega Menu Dropdown */}
        <MegaMenu isOpen={isMegaMenuOpen} onClose={() => setIsMegaMenuOpen(false)} />
      </header>

      {/* Mobile Navigation Drawer (Rendered outside <header> so it is never trapped by backdrop-filter) */}
      {isMobileMenuOpen && (
        <div
          id="mobile-navigation-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation Menu"
          className="lg:hidden fixed inset-0 z-50 bg-[#173D2C]/60 backdrop-blur-xs flex animate-fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="w-4/5 max-w-sm h-full bg-[#FAF7F0] border-r border-[#E5DEC9] p-5 shadow-2xl overflow-y-auto flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#E5DEC9]">
                <div className="flex items-center gap-2">
                  <img
                    src="/images/logo.jpg"
                    alt="Fruits & Nuts Official Logo"
                    className="h-8 w-auto object-contain rounded bg-white px-1 py-0.5 border border-[#B89453]/50"
                  />
                  <div className="flex flex-col">
                    <span className="font-serif text-sm font-bold text-[#173D2C]">
                      M/S Fruits & Nuts
                    </span>
                    <span className="text-[8px] tracking-[0.12em] text-[#987B3E] font-medium">
                      Nutrition with an Emotion
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-label="Close navigation menu"
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-[#5F6D65] hover:text-[#173D2C] cursor-pointer rounded-lg hover:bg-neutral-200/50 touch-manipulation"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Action Sommelier Card */}
              <div className="my-3 p-3 rounded-xl bg-[#173D2C] text-[#FAF7F0] border border-[#B89453]/60 shadow-xs">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    window.dispatchEvent(new CustomEvent("open-sommelier"));
                  }}
                  className="w-full flex items-center justify-between text-xs font-bold text-[#FAF7F0] cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#B89453]" />
                    <span>Ask Royal Sommelier</span>
                  </span>
                  <span className="text-[9px] bg-[#B89453] text-[#173D2C] px-1.5 py-0.5 rounded font-bold uppercase">
                    AI Concierge
                  </span>
                </button>
              </div>

              {/* Quick Action BYOB Card */}
              <div className="mb-4 p-3 rounded-xl bg-white border border-[#B89453]/40 shadow-xs">
                <Link
                  href="/build-your-own-box"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between text-xs font-bold text-[#173D2C]"
                >
                  <span className="flex items-center gap-1.5">
                    <Gift className="w-4 h-4 text-[#B89453]" />
                    <span>Build Your Own Box</span>
                  </span>
                  <span className="text-[9px] bg-[#B89453] text-[#173D2C] px-1.5 py-0.5 rounded font-bold uppercase">
                    BYOB
                  </span>
                </Link>
              </div>

              {/* Navigation Links */}
              <nav className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#987B3E] px-3 py-2">
                  Harvest Categories
                </p>
                {MAIN_NAV_ITEMS.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[#173D2C] rounded-lg hover:bg-white hover:text-[#B89453] transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}

                <div className="pt-4 border-t border-[#E5DEC9] mt-4 space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#987B3E] px-3 py-2">
                    Experience & Concierge
                  </p>
                  <Link
                    href="/gifting"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#173D2C] rounded-lg hover:bg-white transition-colors"
                  >
                    <Gift className="w-4 h-4 text-[#B89453]" />
                    <span>Intelligent Gift Finder</span>
                  </Link>
                  <Link
                    href="/taste-map"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#173D2C] rounded-lg hover:bg-white transition-colors"
                  >
                    <MapPin className="w-4 h-4 text-[#B89453]" />
                    <span>The India Taste Map</span>
                  </Link>
                  <Link
                    href="/stores"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#173D2C] rounded-lg hover:bg-white transition-colors"
                  >
                    <span>📍</span>
                    <span>Boutique Locations</span>
                  </Link>
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#173D2C] rounded-lg hover:bg-white transition-colors"
                  >
                    <User className="w-4 h-4 text-[#B89453]" />
                    <span>Customer Account & Orders</span>
                  </Link>
                </div>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Global Interactive Search Modal */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />
    </>
  );
}
