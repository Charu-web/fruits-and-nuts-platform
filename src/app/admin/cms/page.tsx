"use client";

import React, { useEffect, useState, useCallback, useTransition } from "react";
import Link from "next/link";

export interface CMSSectionRecord {
  id: string;
  sectionKey: string;
  title: string | null;
  contentJson: any;
  isPublished: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface HeroSlideItem {
  id?: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  badge: string;
  bgGradient: string;
  imageUrl?: string;
  startDate?: string;
  endDate?: string;
}

export interface AnnouncementBarContent {
  tagText: string;
  mainText: string;
  promoCode?: string;
  promoDiscount?: string;
  ctaLabel?: string;
  ctaLink?: string;
  bgColor?: string;
  textColor?: string;
  isDismissable?: boolean;
}

export interface PromoBannerItem {
  id?: string;
  title: string;
  subtitle: string;
  badge?: string;
  ctaLabel: string;
  ctaLink: string;
  imageUrl?: string;
  bgGradient: string;
}

const GRADIENT_PRESETS = [
  { label: "Imperial Forest", value: "from-[#142B23] via-[#1A382E] to-[#0E1F19]" },
  { label: "Royal Amber Velvet", value: "from-[#2A1810] via-[#3D2318] to-[#1F120C]" },
  { label: "High Himalaya Midnight", value: "from-[#1E293B] via-[#0F172A] to-[#020617]" },
  { label: "Kashmir Saffron Glow", value: "from-[#78350F] via-[#92400E] to-[#451A03]" },
  { label: "Ruby Pomegranate", value: "from-[#4C0519] via-[#881337] to-[#1E0208]" },
  { label: "Coorg Emerald Mist", value: "from-[#064E3B] via-[#047857] to-[#022C22]" },
];

export default function AdminCMSPage() {
  const [activeTab, setActiveTab] = useState<"hero" | "announcement" | "banners" | "all">("hero");
  const [sections, setSections] = useState<CMSSectionRecord[]>([]);
  const [userRole, setUserRole] = useState<string>("CUSTOMER");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Hero Carousel State
  const [heroSlides, setHeroSlides] = useState<HeroSlideItem[]>([
    {
      title: "Handpicked Imperial Dry Fruits & Wild-Harvested Nuts",
      subtitle: "Directly sourced from high-altitude Himalayan orchards and certified organic estates across India.",
      ctaText: "Shop Royal Harvests",
      ctaLink: "/shop",
      badge: "100% Single-Origin Guaranteed",
      bgGradient: "from-[#142B23] via-[#1A382E] to-[#0E1F19]",
    },
    {
      title: "Artisanal Gifting & Bespoke Festive Hampers",
      subtitle: "Curate your custom royal box with luxury sleeves, wax-sealed greetings, and gourmet selections.",
      ctaText: "Build Your Own Box",
      ctaLink: "/build-your-own-box",
      badge: "Bespoke Occasion Gifting",
      bgGradient: "from-[#2A1810] via-[#3D2318] to-[#1F120C]",
    },
    {
      title: "Journey Through India's Geographical Terroirs",
      subtitle: "Explore our interactive Taste Map tracing Kashmiri Snow Walnuts, Mamra Almonds, and Coorg Spices.",
      ctaText: "Explore Taste Map",
      ctaLink: "/taste-map",
      badge: "Terroir & Heritage",
      bgGradient: "from-[#1E293B] via-[#0F172A] to-[#020617]",
    },
  ]);
  const [heroIsPublished, setHeroIsPublished] = useState(true);
  const [heroPreviewSlide, setHeroPreviewSlide] = useState(0);

  // Announcement Bar State
  const [announcementContent, setAnnouncementContent] = useState<AnnouncementBarContent>({
    tagText: "✨ FESTIVE HARVESTS",
    mainText: "Free Shipping on Orders Above ₹999 Across India",
    promoCode: "ROYAL10",
    promoDiscount: "for 10% Off",
    ctaLabel: "Explore Now →",
    ctaLink: "/shop",
    bgColor: "#142B23",
    textColor: "#F5EFE6",
    isDismissable: true,
  });
  const [announcementIsPublished, setAnnouncementIsPublished] = useState(true);

  // Promotional Banners State
  const [promoBanners, setPromoBanners] = useState<PromoBannerItem[]>([
    {
      title: "Festive Gifting Suites",
      subtitle: "Luxury handcrafted wooden boxes with single-origin selections",
      badge: "Limited Edition",
      ctaLabel: "Configure Hamper",
      ctaLink: "/build-your-own-box",
      bgGradient: "from-[#2A1810] via-[#3D2318] to-[#1F120C]",
    },
    {
      title: "Kashmiri Kagzi Walnuts",
      subtitle: "Fresh harvest soft-shell walnuts direct from Gurez Valley",
      badge: "Winter Fresh",
      ctaLabel: "Order Harvest",
      ctaLink: "/shop",
      bgGradient: "from-[#142B23] via-[#1A382E] to-[#0E1F19]",
    },
  ]);
  const [promoIsPublished, setPromoIsPublished] = useState(true);

  // Raw Section Editor Modal State
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<CMSSectionRecord | null>(null);
  const [modalKey, setModalKey] = useState("");
  const [modalTitle, setModalTitle] = useState("");
  const [modalJsonText, setModalJsonText] = useState("{}");
  const [modalIsPublished, setModalIsPublished] = useState(true);
  const [modalDisplayOrder, setModalDisplayOrder] = useState(0);

  const [isSubmitting, startSubmitting] = useTransition();

  // Fetch Current User Context
  useEffect(() => {
    async function fetchMe() {
      try {
        const res = await fetch("/api/v1/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.data?.role) {
            setUserRole(data.data.role.name || data.data.role);
          }
        }
      } catch (err) {
        console.error("Failed to fetch user context", err);
      }
    }
    fetchMe();
  }, []);

  const canMutate = ["SUPER_ADMIN", "CONTENT_MGR"].includes(userRole);

  // Fetch all CMS sections
  const fetchSections = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/admin/cms/sections");
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || "Failed to load CMS sections");
      }
      const data = await res.json();
      const items: CMSSectionRecord[] = data.data || [];
      setSections(items);

      // Hydrate Hero Carousel if found
      const heroSec = items.find((s) => s.sectionKey === "HOMEPAGE_HERO");
      if (heroSec) {
        setHeroIsPublished(heroSec.isPublished);
        if (heroSec.contentJson && Array.isArray(heroSec.contentJson.slides)) {
          setHeroSlides(heroSec.contentJson.slides);
        }
      }

      // Hydrate Announcement Bar if found
      const annSec = items.find((s) => s.sectionKey === "ANNOUNCEMENT_BAR");
      if (annSec) {
        setAnnouncementIsPublished(annSec.isPublished);
        if (annSec.contentJson && typeof annSec.contentJson === "object") {
          setAnnouncementContent((prev) => ({ ...prev, ...annSec.contentJson }));
        }
      }

      // Hydrate Promo Banners if found
      const promoSec = items.find((s) => s.sectionKey === "PROMOTIONAL_BANNER");
      if (promoSec) {
        setPromoIsPublished(promoSec.isPublished);
        if (promoSec.contentJson && Array.isArray(promoSec.contentJson.banners)) {
          setPromoBanners(promoSec.contentJson.banners);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load CMS sections");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  const showFeedback = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // -------------------------------------------------------------
  // HERO CAROUSEL HANDLERS
  // -------------------------------------------------------------
  const handleAddSlide = () => {
    setHeroSlides((prev) => [
      ...prev,
      {
        title: "New Imperial Collection",
        subtitle: "Finest quality gourmet harvest directly from certified regional estates.",
        ctaText: "Discover More",
        ctaLink: "/shop",
        badge: "Special Harvest",
        bgGradient: GRADIENT_PRESETS[0].value,
      },
    ]);
  };

  const handleRemoveSlide = (index: number) => {
    if (heroSlides.length <= 1) {
      alert("At least one slide must remain in the hero carousel.");
      return;
    }
    setHeroSlides((prev) => prev.filter((_, i) => i !== index));
    if (heroPreviewSlide >= heroSlides.length - 1) {
      setHeroPreviewSlide(Math.max(0, heroSlides.length - 2));
    }
  };

  const handleMoveSlide = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= heroSlides.length) return;
    setHeroSlides((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
    setHeroPreviewSlide(targetIndex);
  };

  const handleUpdateSlide = (index: number, field: keyof HeroSlideItem, value: string) => {
    setHeroSlides((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSaveHero = () => {
    startSubmitting(async () => {
      setError(null);
      try {
        const payload = {
          title: "Homepage Hero Carousel",
          contentJson: { slides: heroSlides },
          isPublished: heroIsPublished,
          displayOrder: 1,
        };

        const res = await fetch("/api/v1/admin/cms/sections/HOMEPAGE_HERO", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error?.message || "Failed to save Hero Carousel");
        }

        showFeedback("Hero Carousel saved and published successfully!");
        fetchSections();
      } catch (err: any) {
        setError(err.message || "Failed to update Hero Carousel");
      }
    });
  };

  // -------------------------------------------------------------
  // ANNOUNCEMENT BAR HANDLERS
  // -------------------------------------------------------------
  const handleSaveAnnouncement = () => {
    startSubmitting(async () => {
      setError(null);
      try {
        const payload = {
          title: "Top Announcement Strip",
          contentJson: announcementContent,
          isPublished: announcementIsPublished,
          displayOrder: 0,
        };

        const res = await fetch("/api/v1/admin/cms/sections/ANNOUNCEMENT_BAR", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error?.message || "Failed to save Announcement Bar");
        }

        showFeedback("Announcement Bar updated and live on storefront!");
        fetchSections();
      } catch (err: any) {
        setError(err.message || "Failed to update Announcement Bar");
      }
    });
  };

  // -------------------------------------------------------------
  // PROMOTIONAL BANNERS HANDLERS
  // -------------------------------------------------------------
  const handleAddBanner = () => {
    setPromoBanners((prev) => [
      ...prev,
      {
        title: "Seasonal Harvest Spotlight",
        subtitle: "Direct estate sourcing with guaranteed freshness",
        badge: "Special Edition",
        ctaLabel: "Explore Now",
        ctaLink: "/shop",
        bgGradient: GRADIENT_PRESETS[1].value,
      },
    ]);
  };

  const handleRemoveBanner = (index: number) => {
    setPromoBanners((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateBanner = (index: number, field: keyof PromoBannerItem, value: string) => {
    setPromoBanners((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSaveBanners = () => {
    startSubmitting(async () => {
      setError(null);
      try {
        const payload = {
          title: "Promotional Banner Cards",
          contentJson: { banners: promoBanners },
          isPublished: promoIsPublished,
          displayOrder: 2,
        };

        const res = await fetch("/api/v1/admin/cms/sections/PROMOTIONAL_BANNER", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error?.message || "Failed to save Promotional Banners");
        }

        showFeedback("Promotional Banners saved successfully!");
        fetchSections();
      } catch (err: any) {
        setError(err.message || "Failed to update Promotional Banners");
      }
    });
  };

  // -------------------------------------------------------------
  // SECTION MODAL & RAW JSON ACTIONS
  // -------------------------------------------------------------
  const handleOpenNewSectionModal = () => {
    setEditingSection(null);
    setModalKey("CUSTOM_BANNER_SECTION");
    setModalTitle("Custom Promotional Strip");
    setModalJsonText(JSON.stringify({ heading: "Special Announcement", items: [] }, null, 2));
    setModalIsPublished(true);
    setModalDisplayOrder(10);
    setIsSectionModalOpen(true);
  };

  const handleOpenEditSectionModal = (sec: CMSSectionRecord) => {
    setEditingSection(sec);
    setModalKey(sec.sectionKey);
    setModalTitle(sec.title || "");
    setModalJsonText(JSON.stringify(sec.contentJson, null, 2));
    setModalIsPublished(sec.isPublished);
    setModalDisplayOrder(sec.displayOrder);
    setIsSectionModalOpen(true);
  };

  const handleSaveModalSection = () => {
    let parsedJson: any;
    try {
      parsedJson = JSON.parse(modalJsonText);
    } catch {
      alert("Invalid JSON format in Content Editor. Please fix syntax errors before saving.");
      return;
    }

    startSubmitting(async () => {
      setError(null);
      try {
        const payload = {
          title: modalTitle,
          contentJson: parsedJson,
          isPublished: modalIsPublished,
          displayOrder: modalDisplayOrder,
        };

        const res = await fetch(`/api/v1/admin/cms/sections/${modalKey}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error?.message || "Failed to save CMS section");
        }

        showFeedback(`CMS Section '${modalKey}' saved successfully.`);
        setIsSectionModalOpen(false);
        fetchSections();
      } catch (err: any) {
        setError(err.message || "Failed to save section");
      }
    });
  };

  const handleTogglePublish = async (sec: CMSSectionRecord) => {
    if (!canMutate) return;
    try {
      const res = await fetch(`/api/v1/admin/cms/sections/${sec.sectionKey}/publish`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !sec.isPublished }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || "Failed to toggle status");
      }

      showFeedback(`Publication status for '${sec.sectionKey}' updated.`);
      fetchSections();
    } catch (err: any) {
      setError(err.message || "Failed to update publish status");
    }
  };

  const handleDeleteSection = async (sec: CMSSectionRecord) => {
    if (!canMutate) return;
    if (!confirm(`Are you sure you want to permanently delete CMS section '${sec.sectionKey}'?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/v1/admin/cms/sections/${sec.sectionKey}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || "Failed to delete section");
      }

      showFeedback(`CMS section '${sec.sectionKey}' deleted.`);
      fetchSections();
    } catch (err: any) {
      setError(err.message || "Failed to delete section");
    }
  };

  const currentPreviewSlideItem = heroSlides[heroPreviewSlide] || heroSlides[0];

  return (
    <div className="space-y-8 pb-16">
      {/* 1. HEADER & ACTION STRIP */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎨</span>
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
                CMS & Dynamic Content Manager
              </h1>
              <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
                Manage hero carousels, announcement bars, seasonal promotional cards, and visual content layout.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchSections}
            className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
            title="Refresh from Database"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>Sync</span>
          </button>

          {canMutate && (
            <button
              type="button"
              onClick={handleOpenNewSectionModal}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow transition-colors flex items-center gap-1.5"
            >
              <span>➕</span>
              <span>Create Custom Section</span>
            </button>
          )}
        </div>
      </div>

      {/* FEEDBACK & ALERTS */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs sm:text-sm flex items-center gap-3 shadow-xs">
          <span className="text-lg">✅</span>
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs sm:text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-lg">⚠️</span>
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-800 text-xs font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* 2. OVERVIEW METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">Total CMS Modules</span>
          <div className="text-2xl font-serif font-bold text-stone-900 mt-1">{sections.length}</div>
          <span className="text-[10px] text-stone-500 mt-0.5 block">Configured in Database</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 block">Live Published</span>
          <div className="text-2xl font-serif font-bold text-emerald-700 mt-1">
            {sections.filter((s) => s.isPublished).length}
          </div>
          <span className="text-[10px] text-emerald-600 mt-0.5 block">Active on Storefront</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 block">Hero Slides</span>
          <div className="text-2xl font-serif font-bold text-amber-700 mt-1">{heroSlides.length}</div>
          <span className="text-[10px] text-stone-500 mt-0.5 block">Active Carousel Deck</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">RBAC Permission</span>
          <div className="text-sm font-bold text-stone-800 mt-1.5 flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${canMutate ? "bg-emerald-500" : "bg-stone-400"}`} />
            <span>{canMutate ? "Full CMS Publisher" : "Read-Only Viewer"}</span>
          </div>
          <span className="text-[10px] text-stone-400 mt-0.5 block">{userRole}</span>
        </div>
      </div>

      {/* 3. NAVIGATION TABS */}
      <div className="flex border-b border-stone-200 gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveTab("hero")}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-colors flex items-center gap-2 ${
            activeTab === "hero"
              ? "bg-white border-t-2 border-x border-stone-200 border-t-amber-600 text-amber-700 shadow-xs"
              : "text-stone-500 hover:text-stone-900 hover:bg-stone-100"
          }`}
        >
          <span>🎠</span>
          <span>Hero Carousel (`HOMEPAGE_HERO`)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("announcement")}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-colors flex items-center gap-2 ${
            activeTab === "announcement"
              ? "bg-white border-t-2 border-x border-stone-200 border-t-amber-600 text-amber-700 shadow-xs"
              : "text-stone-500 hover:text-stone-900 hover:bg-stone-100"
          }`}
        >
          <span>📢</span>
          <span>Announcement Bar (`ANNOUNCEMENT_BAR`)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("banners")}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-colors flex items-center gap-2 ${
            activeTab === "banners"
              ? "bg-white border-t-2 border-x border-stone-200 border-t-amber-600 text-amber-700 shadow-xs"
              : "text-stone-500 hover:text-stone-900 hover:bg-stone-100"
          }`}
        >
          <span>🏷️</span>
          <span>Promotional Banners (`PROMOTIONAL_BANNER`)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-colors flex items-center gap-2 ${
            activeTab === "all"
              ? "bg-white border-t-2 border-x border-stone-200 border-t-amber-600 text-amber-700 shadow-xs"
              : "text-stone-500 hover:text-stone-900 hover:bg-stone-100"
          }`}
        >
          <span>📑</span>
          <span>All Modules & Raw JSON</span>
        </button>
      </div>

      {/* ============================================================= */}
      {/* TAB 1: HERO CAROUSEL MANAGER */}
      {/* ============================================================= */}
      {activeTab === "hero" && (
        <div className="space-y-6">
          {/* Live Interactive Preview Card */}
          <div className="bg-stone-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl overflow-hidden relative border border-stone-800">
            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-mono tracking-wider uppercase text-stone-400">
                  Live Hero Slide #{heroPreviewSlide + 1} Preview
                </span>
              </div>
              <div className="flex items-center gap-2">
                {heroSlides.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setHeroPreviewSlide(idx)}
                    className={`h-2 rounded-full transition-all ${
                      heroPreviewSlide === idx ? "w-6 bg-amber-400" : "w-2 bg-white/30 hover:bg-white/60"
                    }`}
                    aria-label={`Slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>

            {currentPreviewSlideItem && (
              <div
                className={`p-6 sm:p-10 rounded-2xl bg-gradient-to-r ${currentPreviewSlideItem.bgGradient} transition-all duration-500`}
              >
                <div className="max-w-2xl space-y-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/30 text-amber-300 text-xs font-semibold uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    {currentPreviewSlideItem.badge}
                  </span>

                  <h2 className="font-serif text-2xl sm:text-4xl font-bold text-white leading-tight">
                    {currentPreviewSlideItem.title}
                  </h2>

                  <p className="text-stone-300 text-xs sm:text-sm font-light leading-relaxed">
                    {currentPreviewSlideItem.subtitle}
                  </p>

                  <div className="flex items-center gap-3 pt-2">
                    <span className="px-6 py-2.5 bg-amber-500 text-stone-950 font-bold rounded-lg text-xs shadow-md">
                      {currentPreviewSlideItem.ctaText} &rarr;
                    </span>
                    <span className="text-[11px] text-stone-400 font-mono">
                      Link: {currentPreviewSlideItem.ctaLink}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Hero Actions & Status Strip */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={heroIsPublished}
                  onChange={(e) => setHeroIsPublished(e.target.checked)}
                  disabled={!canMutate}
                  className="rounded border-stone-300 text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <span className="text-xs font-bold text-stone-800">
                  {heroIsPublished ? "🟢 Hero Carousel is PUBLISHED" : "⚪ Hero Carousel is DRAFT"}
                </span>
              </label>
              <span className="text-stone-300">|</span>
              <span className="text-xs text-stone-500 font-mono">{heroSlides.length} Slide(s) Configured</span>
            </div>

            <div className="flex items-center gap-2">
              {canMutate && (
                <>
                  <button
                    type="button"
                    onClick={handleAddSlide}
                    className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                  >
                    <span>➕</span>
                    <span>Add New Slide</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveHero}
                    disabled={isSubmitting}
                    className="px-5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span className="animate-spin text-sm">⏳</span>
                    ) : (
                      <span>💾</span>
                    )}
                    <span>Save Carousel Changes</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Slide Deck Cards */}
          <div className="space-y-4">
            {heroSlides.map((slide, idx) => (
              <div
                key={idx}
                className={`bg-white rounded-2xl border transition-all p-5 shadow-xs ${
                  heroPreviewSlide === idx ? "border-amber-500 ring-2 ring-amber-100" : "border-stone-200"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-stone-100 text-stone-700 font-mono font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <h3 className="text-sm font-bold text-stone-800">
                      Slide {idx + 1}: {slide.badge || "Slide"}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setHeroPreviewSlide(idx)}
                      className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded text-xs font-semibold transition-colors"
                    >
                      👁️ Preview This
                    </button>
                    {canMutate && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleMoveSlide(idx, "up")}
                          disabled={idx === 0}
                          className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded text-xs disabled:opacity-30"
                          title="Move Up"
                        >
                          ⬆️
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveSlide(idx, "down")}
                          disabled={idx === heroSlides.length - 1}
                          className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded text-xs disabled:opacity-30"
                          title="Move Down"
                        >
                          ⬇️
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveSlide(idx)}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded text-xs font-semibold transition-colors"
                          title="Delete Slide"
                        >
                          🗑️ Remove
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-3">
                    <div>
                      <label className="font-bold text-stone-700 block mb-1">Headline / Title</label>
                      <input
                        type="text"
                        value={slide.title}
                        onChange={(e) => handleUpdateSlide(idx, "title", e.target.value)}
                        disabled={!canMutate}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-amber-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-stone-700 block mb-1">Subtitle / Description</label>
                      <textarea
                        rows={2}
                        value={slide.subtitle}
                        onChange={(e) => handleUpdateSlide(idx, "subtitle", e.target.value)}
                        disabled={!canMutate}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-amber-500 font-light"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-stone-700 block mb-1">Badge Tag Label</label>
                      <input
                        type="text"
                        value={slide.badge}
                        onChange={(e) => handleUpdateSlide(idx, "badge", e.target.value)}
                        disabled={!canMutate}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="font-bold text-stone-700 block mb-1">CTA Button Label</label>
                        <input
                          type="text"
                          value={slide.ctaText}
                          onChange={(e) => handleUpdateSlide(idx, "ctaText", e.target.value)}
                          disabled={!canMutate}
                          className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-stone-700 block mb-1">CTA Destination Link</label>
                        <input
                          type="text"
                          value={slide.ctaLink}
                          onChange={(e) => handleUpdateSlide(idx, "ctaLink", e.target.value)}
                          disabled={!canMutate}
                          className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-stone-700 block mb-1">Background Gradient Theme</label>
                      <select
                        value={slide.bgGradient}
                        onChange={(e) => handleUpdateSlide(idx, "bgGradient", e.target.value)}
                        disabled={!canMutate}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-amber-500 text-xs font-mono"
                      >
                        {GRADIENT_PRESETS.map((p, pIdx) => (
                          <option key={pIdx} value={p.value}>
                            {p.label} ({p.value.slice(0, 24)}...)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-stone-700 block mb-1">Custom CSS Gradient / Class</label>
                      <input
                        type="text"
                        value={slide.bgGradient}
                        onChange={(e) => handleUpdateSlide(idx, "bgGradient", e.target.value)}
                        disabled={!canMutate}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-amber-500 font-mono text-[11px]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 2: ANNOUNCEMENT BAR MANAGER */}
      {/* ============================================================= */}
      {activeTab === "announcement" && (
        <div className="space-y-6">
          {/* Live Announcement Bar Preview */}
          <div className="bg-stone-900 p-6 rounded-3xl text-white shadow-xl border border-stone-800 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-mono tracking-wider uppercase text-stone-400">
                Live Storefront Top Bar Preview
              </span>
              <span className="text-[11px] text-amber-400 font-bold">
                {announcementIsPublished ? "🟢 Active & Visible" : "⚪ Disabled / Hidden"}
              </span>
            </div>

            {/* Rendered Bar */}
            <aside
              style={{ backgroundColor: announcementContent.bgColor || "#142B23" }}
              className="text-white text-xs font-medium tracking-wide py-2.5 px-4 rounded-xl shadow-inner border border-white/10 flex items-center justify-between"
            >
              <div className="flex-1 text-center flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
                <span className="font-bold text-amber-400">{announcementContent.tagText}</span>
                <span className="text-white/30 hidden sm:inline">|</span>
                <span>{announcementContent.mainText}</span>
                {announcementContent.promoCode && (
                  <>
                    <span className="text-white/30 hidden md:inline">|</span>
                    <span className="hidden md:inline text-amber-300">
                      Use Code:{" "}
                      <strong className="text-white bg-white/20 px-1.5 py-0.5 rounded tracking-wider font-mono">
                        {announcementContent.promoCode}
                      </strong>{" "}
                      {announcementContent.promoDiscount}
                    </span>
                  </>
                )}
                {announcementContent.ctaLabel && (
                  <span className="underline underline-offset-4 text-amber-300 font-semibold cursor-pointer">
                    {announcementContent.ctaLabel}
                  </span>
                )}
              </div>
              {announcementContent.isDismissable && (
                <span className="text-white/50 text-xs px-1.5 py-0.5 rounded hover:bg-white/10 cursor-pointer">
                  ✕
                </span>
              )}
            </aside>
          </div>

          {/* Announcement Form */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={announcementIsPublished}
                  onChange={(e) => setAnnouncementIsPublished(e.target.checked)}
                  disabled={!canMutate}
                  className="rounded border-stone-300 text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <span className="text-xs font-bold text-stone-800">
                  Enable Announcement Bar on Storefront
                </span>
              </label>

              {canMutate && (
                <button
                  type="button"
                  onClick={handleSaveAnnouncement}
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? <span className="animate-spin">⏳</span> : <span>💾</span>}
                  <span>Save Announcement Bar</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Highlight Badge / Prefix</label>
                <input
                  type="text"
                  value={announcementContent.tagText}
                  onChange={(e) =>
                    setAnnouncementContent((prev) => ({ ...prev, tagText: e.target.value }))
                  }
                  disabled={!canMutate}
                  placeholder="e.g. ✨ FESTIVE HARVESTS"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-amber-500 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Main Announcement Message</label>
                <input
                  type="text"
                  value={announcementContent.mainText}
                  onChange={(e) =>
                    setAnnouncementContent((prev) => ({ ...prev, mainText: e.target.value }))
                  }
                  disabled={!canMutate}
                  placeholder="e.g. Free Shipping on Orders Above ₹999 Across India"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-amber-500 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Coupon / Promo Code (Optional)</label>
                <input
                  type="text"
                  value={announcementContent.promoCode || ""}
                  onChange={(e) =>
                    setAnnouncementContent((prev) => ({ ...prev, promoCode: e.target.value }))
                  }
                  disabled={!canMutate}
                  placeholder="e.g. ROYAL10"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Promo Discount Note</label>
                <input
                  type="text"
                  value={announcementContent.promoDiscount || ""}
                  onChange={(e) =>
                    setAnnouncementContent((prev) => ({ ...prev, promoDiscount: e.target.value }))
                  }
                  disabled={!canMutate}
                  placeholder="e.g. for 10% Off"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Action Link Label</label>
                <input
                  type="text"
                  value={announcementContent.ctaLabel || ""}
                  onChange={(e) =>
                    setAnnouncementContent((prev) => ({ ...prev, ctaLabel: e.target.value }))
                  }
                  disabled={!canMutate}
                  placeholder="e.g. Explore Now →"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Action Link Destination</label>
                <input
                  type="text"
                  value={announcementContent.ctaLink || ""}
                  onChange={(e) =>
                    setAnnouncementContent((prev) => ({ ...prev, ctaLink: e.target.value }))
                  }
                  disabled={!canMutate}
                  placeholder="e.g. /shop"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Background Hex Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={announcementContent.bgColor || "#142B23"}
                    onChange={(e) =>
                      setAnnouncementContent((prev) => ({ ...prev, bgColor: e.target.value }))
                    }
                    disabled={!canMutate}
                    className="w-8 h-8 rounded border border-stone-300 p-0 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={announcementContent.bgColor || "#142B23"}
                    onChange={(e) =>
                      setAnnouncementContent((prev) => ({ ...prev, bgColor: e.target.value }))
                    }
                    disabled={!canMutate}
                    className="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg font-mono text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={announcementContent.isDismissable ?? true}
                    onChange={(e) =>
                      setAnnouncementContent((prev) => ({ ...prev, isDismissable: e.target.checked }))
                    }
                    disabled={!canMutate}
                    className="rounded border-stone-300 text-amber-600 focus:ring-amber-500 w-4 h-4"
                  />
                  <span className="font-bold text-stone-700">Allow customers to dismiss banner</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 3: PROMOTIONAL BANNERS MANAGER */}
      {/* ============================================================= */}
      {activeTab === "banners" && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-2xl border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={promoIsPublished}
                  onChange={(e) => setPromoIsPublished(e.target.checked)}
                  disabled={!canMutate}
                  className="rounded border-stone-300 text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <span className="text-xs font-bold text-stone-800">
                  {promoIsPublished ? "🟢 Promotional Banners are PUBLISHED" : "⚪ Promotional Banners are DRAFT"}
                </span>
              </label>
              <span className="text-stone-300">|</span>
              <span className="text-xs text-stone-500 font-mono">{promoBanners.length} Banner Card(s)</span>
            </div>

            <div className="flex items-center gap-2">
              {canMutate && (
                <>
                  <button
                    type="button"
                    onClick={handleAddBanner}
                    className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                  >
                    <span>➕</span>
                    <span>Add Banner Card</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveBanners}
                    disabled={isSubmitting}
                    className="px-5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isSubmitting ? <span className="animate-spin">⏳</span> : <span>💾</span>}
                    <span>Save Banners</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Banner Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {promoBanners.map((card, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
                {/* Live Card Preview */}
                <div
                  className={`p-5 rounded-xl bg-gradient-to-r ${card.bgGradient} text-white shadow-md flex flex-col justify-between min-h-[140px]`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-white/20 rounded-full">
                      {card.badge || "Featured"}
                    </span>
                    <span className="text-lg">✨</span>
                  </div>
                  <div>
                    <h4 className="font-serif text-lg font-bold text-white leading-snug">{card.title}</h4>
                    <p className="text-stone-300 text-xs mt-1 leading-relaxed">{card.subtitle}</p>
                  </div>
                  <div className="pt-2 text-[11px] font-bold text-amber-400">
                    {card.ctaLabel} &rarr; ({card.ctaLink})
                  </div>
                </div>

                {/* Edit Form */}
                <div className="space-y-3 text-xs pt-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-700">Card #{idx + 1} Configuration</span>
                    {canMutate && (
                      <button
                        type="button"
                        onClick={() => handleRemoveBanner(idx)}
                        className="text-rose-600 hover:text-rose-800 text-[11px] font-bold"
                      >
                        Remove Card
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="font-semibold text-stone-600 block mb-0.5">Card Headline</label>
                    <input
                      type="text"
                      value={card.title}
                      onChange={(e) => handleUpdateBanner(idx, "title", e.target.value)}
                      disabled={!canMutate}
                      className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-stone-600 block mb-0.5">Card Subtitle</label>
                    <input
                      type="text"
                      value={card.subtitle}
                      onChange={(e) => handleUpdateBanner(idx, "subtitle", e.target.value)}
                      disabled={!canMutate}
                      className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-semibold text-stone-600 block mb-0.5">CTA Label</label>
                      <input
                        type="text"
                        value={card.ctaLabel}
                        onChange={(e) => handleUpdateBanner(idx, "ctaLabel", e.target.value)}
                        disabled={!canMutate}
                        className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-stone-600 block mb-0.5">CTA Link</label>
                      <input
                        type="text"
                        value={card.ctaLink}
                        onChange={(e) => handleUpdateBanner(idx, "ctaLink", e.target.value)}
                        disabled={!canMutate}
                        className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-stone-600 block mb-0.5">Theme Gradient</label>
                    <select
                      value={card.bgGradient}
                      onChange={(e) => handleUpdateBanner(idx, "bgGradient", e.target.value)}
                      disabled={!canMutate}
                      className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-mono"
                    >
                      {GRADIENT_PRESETS.map((p, pIdx) => (
                        <option key={pIdx} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 4: ALL MODULES & RAW JSON EDITOR */}
      {/* ============================================================= */}
      {activeTab === "all" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-stone-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-800">
                Database-Backed CMS Sections (`CMSSection` Model)
              </h3>
              <span className="text-xs text-stone-400 font-mono">{sections.length} Records</span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-stone-400 text-xs">
                <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Loading CMS Sections from Database...
              </div>
            ) : sections.length === 0 ? (
              <div className="p-12 text-center text-stone-500 text-xs">
                No custom CMS sections found. Click &quot;Create Custom Section&quot; or save default Hero/Announcement.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider font-semibold border-b border-stone-100">
                    <tr>
                      <th className="py-3 px-4">Section Key</th>
                      <th className="py-3 px-4">Title</th>
                      <th className="py-3 px-4 text-center">Order</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4">Last Updated</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-medium text-stone-700">
                    {sections.map((sec) => (
                      <tr key={sec.id} className="hover:bg-stone-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-amber-800">
                          {sec.sectionKey}
                        </td>
                        <td className="py-3 px-4 text-stone-900">{sec.title || "—"}</td>
                        <td className="py-3 px-4 text-center font-mono">{sec.displayOrder}</td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleTogglePublish(sec)}
                            disabled={!canMutate}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase transition-colors ${
                              sec.isPublished
                                ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                : "bg-stone-200 text-stone-600 hover:bg-stone-300"
                            }`}
                          >
                            {sec.isPublished ? "Published" : "Draft"}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-stone-400 text-[11px]">
                          {new Date(sec.updatedAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditSectionModal(sec)}
                            className="text-amber-700 hover:text-amber-900 font-bold"
                          >
                            Edit JSON
                          </button>
                          {canMutate && (
                            <button
                              type="button"
                              onClick={() => handleDeleteSection(sec)}
                              className="text-rose-600 hover:text-rose-800 font-bold"
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* SECTION MODAL (CREATE / EDIT RAW JSON) */}
      {/* ============================================================= */}
      {isSectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-stone-200 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-serif font-bold text-lg text-stone-900">
                {editingSection ? `Edit CMS Section: ${editingSection.sectionKey}` : "Create New CMS Section"}
              </h3>
              <button
                type="button"
                onClick={() => setIsSectionModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto pr-1 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    Section Key <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={modalKey}
                    onChange={(e) => setModalKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))}
                    disabled={!!editingSection || !canMutate}
                    placeholder="e.g. HOMEPAGE_HERO"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg font-mono text-xs focus:bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Module Title</label>
                  <input
                    type="text"
                    value={modalTitle}
                    onChange={(e) => setModalTitle(e.target.value)}
                    disabled={!canMutate}
                    placeholder="e.g. Hero Carousel"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Display Order</label>
                  <input
                    type="number"
                    value={modalDisplayOrder}
                    onChange={(e) => setModalDisplayOrder(parseInt(e.target.value) || 0)}
                    disabled={!canMutate}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                  />
                </div>

                <div className="flex items-center pt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={modalIsPublished}
                      onChange={(e) => setModalIsPublished(e.target.checked)}
                      disabled={!canMutate}
                      className="rounded border-stone-300 text-amber-600 focus:ring-amber-500 w-4 h-4"
                    />
                    <span className="font-bold text-stone-700">Published Live</span>
                  </label>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-stone-700 block">
                    Content JSON <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        const parsed = JSON.parse(modalJsonText);
                        setModalJsonText(JSON.stringify(parsed, null, 2));
                      } catch {
                        alert("Cannot format: Invalid JSON syntax.");
                      }
                    }}
                    className="text-[11px] text-amber-700 hover:underline font-semibold"
                  >
                    Format JSON
                  </button>
                </div>
                <textarea
                  rows={10}
                  value={modalJsonText}
                  onChange={(e) => setModalJsonText(e.target.value)}
                  disabled={!canMutate}
                  className="w-full px-3 py-2 bg-stone-900 text-amber-300 font-mono text-[11px] rounded-xl border border-stone-700 focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setIsSectionModalOpen(false)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              {canMutate && (
                <button
                  type="button"
                  onClick={handleSaveModalSection}
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? <span className="animate-spin">⏳</span> : <span>💾</span>}
                  <span>Save CMS Section</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
