"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/components/cart/cart-context";
import Link from "next/link";
import { ProductImageFrame } from "@/components/catalog/product-image-frame";
import { getProductImageUrl } from "@/lib/catalog/product-asset-registry";

interface BoxType {
  id: string;
  variantId: string;
  name: string;
  capacity: number;
  basePrice: number;
  description: string;
  material: string;
  emoji: string;
}

interface OccasionSleeve {
  id: string;
  name: string;
  price: number;
  themeColor: string;
  tag: string;
}

interface ByobProduct {
  id: string;
  name: string;
  slug: string;
  category?: { name: string };
  primaryImage?: { imageUrl: string; altText?: string } | null;
  variants: {
    id: string;
    weightGrams: number;
    sellingPrice: number;
    mrp: number;
  }[];
}

const BOX_OPTIONS: BoxType[] = [
  {
    id: "box-2",
    variantId: "var-box-duo-2",
    name: "Royal Silk Duo Box",
    capacity: 2,
    basePrice: 350,
    description: "Compact handcrafted silk-lined luxury box with gold foil stamping.",
    material: "Handcrafted Rigid Silk Box",
    emoji: "🎁",
  },
  {
    id: "box-4",
    variantId: "var-box-pine-4",
    name: "Imperial Pine 4-Jar Box",
    capacity: 4,
    basePrice: 650,
    description: "Our signature natural pine wood casket with brass latches.",
    material: "Solid Natural Pine Wood",
    emoji: "📦",
  },
  {
    id: "box-6",
    variantId: "var-box-trunk-6",
    name: "Sovereign Heritage Trunk",
    capacity: 6,
    basePrice: 950,
    description: "Grand wooden trunk with antique brass hardware and bespoke velvet partitions.",
    material: "Heritage Teak Finish Wood",
    emoji: "👑",
  },
];

const OCCASION_SLEEVES: OccasionSleeve[] = [
  { id: "sleeve-classic", name: "Imperial Botanical Green", price: 0, themeColor: "#102C21", tag: "Complimentary" },
  { id: "sleeve-diwali", name: "Royal Festive Gold", price: 50, themeColor: "#B99A58", tag: "Festive Exclusive" },
  { id: "sleeve-wedding", name: "Heritage Velvet Crimson", price: 75, themeColor: "#6B1D28", tag: "Wedding Special" },
  { id: "sleeve-corporate", name: "Executive Prestige Slate", price: 50, themeColor: "#334155", tag: "Corporate Crest" },
];

const FALLBACK_BYOB_PRODUCTS: ByobProduct[] = [
  {
    id: "prod-mamra-01",
    name: "Kashmiri Imperial Mamra Almonds",
    slug: "kashmiri-mamra-almonds",
    category: { name: "Dry Fruits & Royal Nuts" },
    primaryImage: {
      imageUrl: "/images/products/kashmiri-mamra-almonds.jpg",
      altText: "Kashmiri Imperial Mamra Almonds",
    },
    variants: [
      { id: "var-mamra-250", weightGrams: 250, sellingPrice: 1250, mrp: 1450 },
    ],
  },
  {
    id: "prod-medjool-02",
    name: "Jordan Valley Jumbo Medjool Dates",
    slug: "jumbo-medjool-dates",
    category: { name: "Royal Dates & Khajoor" },
    primaryImage: {
      imageUrl: "/images/products/jumbo-medjool-dates.jpg",
      altText: "Jordan Valley Jumbo Medjool Dates",
    },
    variants: [
      { id: "var-medjool-500", weightGrams: 500, sellingPrice: 899, mrp: 1050 },
    ],
  },
  {
    id: "prod-cashew-03",
    name: "King Cashews W180 Jumbo",
    slug: "king-cashews-w180",
    category: { name: "Dry Fruits & Royal Nuts" },
    primaryImage: {
      imageUrl: "/images/products/king-cashews-w180.jpg",
      altText: "King Cashews W180 Jumbo",
    },
    variants: [
      { id: "var-csh-250", weightGrams: 250, sellingPrice: 650, mrp: 750 },
    ],
  },
  {
    id: "prod-walnut-05",
    name: "Kashmir Valley Snow Walnuts",
    slug: "kashmir-snow-walnuts",
    category: { name: "Dry Fruits & Royal Nuts" },
    primaryImage: {
      imageUrl: "/images/products/kashmir-snow-walnuts.jpg",
      altText: "Kashmir Valley Snow Walnuts",
    },
    variants: [
      { id: "var-wln-250", weightGrams: 250, sellingPrice: 780, mrp: 900 },
    ],
  },
  {
    id: "prod-berries-06",
    name: "Wild Dried Cranberries & Blueberries",
    slug: "wild-berries-reserve",
    category: { name: "Super Seeds & Berries" },
    primaryImage: null,
    variants: [
      { id: "var-ber-250", weightGrams: 250, sellingPrice: 520, mrp: 600 },
    ],
  },
  {
    id: "prod-kahwa-04",
    name: "Shahi Kashmiri Saffron Kahwa",
    slug: "kashmiri-shahi-kahwa",
    category: { name: "Artisanal Estate Teas" },
    primaryImage: null,
    variants: [
      { id: "var-khw-100", weightGrams: 100, sellingPrice: 480, mrp: 550 },
    ],
  },
  {
    id: "prod-choc-07",
    name: "Dark Belgian Chocolate Almond Dragées",
    slug: "chocolate-almond-dragees",
    category: { name: "Gourmet Chocolates" },
    primaryImage: null,
    variants: [
      { id: "var-choc-200", weightGrams: 200, sellingPrice: 650, mrp: 750 },
    ],
  },
  {
    id: "prod-paan-08",
    name: "Heritage Shahi Paan Digestive Mukhwas",
    slug: "shahi-paan-mukhwas",
    category: { name: "Royal Mouth Fresheners" },
    primaryImage: {
      imageUrl: "/images/products/shahi-paan-mukhwas.jpg",
      altText: "Heritage Shahi Paan Digestive Mukhwas",
    },
    variants: [
      { id: "var-paan-200", weightGrams: 200, sellingPrice: 380, mrp: 450 },
    ],
  },
];

function BuildYourOwnBoxContent() {
  const { addItem, isCartLoading, openDrawer, toggleGiftWrap } = useCart();
  const searchParams = useSearchParams();

  // Query parameter presets
  const urlBoxId = searchParams.get("box");
  const urlOccasionId = searchParams.get("occasion");

  // Initial selection from URL parameters
  const initialBox = (urlBoxId && BOX_OPTIONS.find((b) => b.id === urlBoxId)) || BOX_OPTIONS[1];
  const initialSleeve = (urlOccasionId && OCCASION_SLEEVES.find((s) => s.id === urlOccasionId)) || OCCASION_SLEEVES[0];

  // BYOB State
  const [selectedBox, setSelectedBox] = useState<BoxType>(initialBox);
  const [selectedSlots, setSelectedSlots] = useState<(ByobProduct | null)[]>(new Array(initialBox.capacity).fill(null));
  const [selectedSleeve, setSelectedSleeve] = useState<OccasionSleeve>(initialSleeve);
  const [greetingRecipient, setGreetingRecipient] = useState("");
  const [greetingSender, setGreetingSender] = useState("");
  const [greetingMessage, setGreetingMessage] = useState("");

  // Product Catalogue for Filling
  const [availableProducts, setAvailableProducts] = useState<ByobProduct[]>(FALLBACK_BYOB_PRODUCTS);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [activeFillingSlotIndex, setActiveFillingSlotIndex] = useState<number>(0);

  // Submission State
  const [isAddingHamper, setIsAddingHamper] = useState(false);
  const [hamperAddedSuccess, setHamperAddedSuccess] = useState(false);

  // Sync when URL parameters change dynamically or restore localStorage draft
  useEffect(() => {
    if (urlBoxId) {
      const foundBox = BOX_OPTIONS.find((b) => b.id === urlBoxId);
      if (foundBox && foundBox.id !== selectedBox.id) {
        setSelectedBox(foundBox);
        setSelectedSlots(new Array(foundBox.capacity).fill(null));
      }
    }
    if (urlOccasionId) {
      const foundSleeve = OCCASION_SLEEVES.find((s) => s.id === urlOccasionId);
      if (foundSleeve && foundSleeve.id !== selectedSleeve.id) {
        setSelectedSleeve(foundSleeve);
      }
    }

    if (!urlBoxId && !urlOccasionId && typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("fn_byob_draft");
        if (saved) {
          const draft = JSON.parse(saved);
          if (draft.boxId) {
            const b = BOX_OPTIONS.find((x) => x.id === draft.boxId);
            if (b) {
              setSelectedBox(b);
              setSelectedSlots(new Array(b.capacity).fill(null));
            }
          }
          if (draft.sleeveId) {
            const s = OCCASION_SLEEVES.find((x) => x.id === draft.sleeveId);
            if (s) setSelectedSleeve(s);
          }
          if (draft.greetingRecipient) setGreetingRecipient(draft.greetingRecipient);
          if (draft.greetingSender) setGreetingSender(draft.greetingSender);
          if (draft.greetingMessage) setGreetingMessage(draft.greetingMessage);
        }
      } catch {}
    }
  }, [urlBoxId, urlOccasionId]);

  // Persist draft selections to localStorage
  useEffect(() => {
    try {
      const draft = {
        boxId: selectedBox.id,
        sleeveId: selectedSleeve.id,
        greetingRecipient,
        greetingSender,
        greetingMessage,
      };
      localStorage.setItem("fn_byob_draft", JSON.stringify(draft));
    } catch {}
  }, [selectedBox.id, selectedSleeve.id, greetingRecipient, greetingSender, greetingMessage]);

  // Fetch BYOB eligible products in background
  useEffect(() => {
    async function loadByobProducts() {
      try {
        const res = await fetch("/api/v1/products?limit=24");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data?.items && json.data.items.length > 0) {
            const enrichedItems = json.data.items.map((item: ByobProduct) => {
              const verifiedUrl = getProductImageUrl(item.slug);
              if (verifiedUrl && !item.primaryImage?.imageUrl) {
                return {
                  ...item,
                  primaryImage: { imageUrl: verifiedUrl, altText: item.name },
                };
              }
              return item;
            });
            setAvailableProducts(enrichedItems);
          }
        }
      } catch (err) {
        // Silently preserve authoritative fallback products
      }
    }
    loadByobProducts();
  }, []);

  // When box capacity changes, adjust slots array
  const handleSelectBox = (box: BoxType) => {
    setSelectedBox(box);
    setSelectedSlots((prev) => {
      const newSlots = new Array(box.capacity).fill(null);
      for (let i = 0; i < Math.min(prev.length, box.capacity); i++) {
        newSlots[i] = prev[i];
      }
      return newSlots;
    });
  };

  const handleFillSlot = (product: ByobProduct) => {
    const nextSlots = [...selectedSlots];
    nextSlots[activeFillingSlotIndex] = product;
    setSelectedSlots(nextSlots);

    // Auto move to next empty slot if available
    const nextEmptyIndex = nextSlots.findIndex((s) => s === null);
    if (nextEmptyIndex !== -1) {
      setActiveFillingSlotIndex(nextEmptyIndex);
    }
  };

  const handleRemoveSlot = (index: number) => {
    const nextSlots = [...selectedSlots];
    nextSlots[index] = null;
    setSelectedSlots(nextSlots);
    setActiveFillingSlotIndex(index);
  };

  // Price Calculations
  const filledProducts = selectedSlots.filter((s): s is ByobProduct => s !== null);
  const itemsPriceSum = filledProducts.reduce((sum, p) => {
    const variantPrice = p.variants?.[0]?.sellingPrice || 399;
    return sum + variantPrice;
  }, 0);

  const totalHamperPrice = selectedBox.basePrice + itemsPriceSum + selectedSleeve.price;
  const isBoxFull = filledProducts.length === selectedBox.capacity;

  const handleAddHamperToCart = async () => {
    if (!isBoxFull || isAddingHamper) return;

    setIsAddingHamper(true);
    try {
      // 1. Add luxury box container packaging item to cart
      if (selectedBox.variantId) {
        await addItem(selectedBox.variantId, 1);
      }

      // 2. Add each filled jar variant to cart
      for (const prod of filledProducts) {
        const variantId = prod.variants?.[0]?.id;
        if (variantId) {
          await addItem(variantId, 1);
        }
      }

      // 3. Format personalized gift greeting note
      const noteParts = [
        greetingRecipient.trim() ? `To: ${greetingRecipient.trim()}` : "",
        greetingSender.trim() ? `From: ${greetingSender.trim()}` : "",
        selectedSleeve ? `Sleeve: ${selectedSleeve.name}` : "",
        greetingMessage.trim() ? `"${greetingMessage.trim()}"` : "",
      ].filter(Boolean);
      const fullGiftMessage = noteParts.join(" | ");

      // 4. Activate luxury gift wrap & greeting note in cart
      await toggleGiftWrap(true, fullGiftMessage || undefined);

      // 5. Clear draft
      try {
        localStorage.removeItem("fn_byob_draft");
      } catch {}

      // 6. Open cart drawer and notify customer
      openDrawer();
      setHamperAddedSuccess(true);
      setTimeout(() => setHamperAddedSuccess(false), 4000);
    } catch (err) {
      console.error("Failed to add hamper to cart", err);
    } finally {
      setIsAddingHamper(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <span className="text-xs font-bold uppercase tracking-widest text-[#987B3E]">Bespoke Artisan Gifting</span>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#102C21] mt-2">
          Build Your Own Royal Hamper
        </h1>
        <p className="text-[#4A4E46] text-sm sm:text-base mt-3 leading-relaxed">
          Create a personalized gourmet gift box in 4 easy steps. Choose your luxury box, select pure single-origin jar fillings, customize the theme sleeve, and include a wax-sealed greeting note.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT 8 COLS: CONFIGURATOR STEPS */}
        <div className="lg:col-span-8 space-y-10">
          {/* STEP 1: SELECT BOX CAPACITY & MATERIAL */}
          <div className="bg-white rounded-2xl border border-[#E5DEC9] p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-3 border-b border-[#E5DEC9]/70 pb-4 mb-6">
              <span className="w-7 h-7 rounded-full bg-[#102C21] text-white flex items-center justify-center font-bold text-xs">
                1
              </span>
              <div>
                <h3 className="font-serif text-lg font-bold text-[#102C21]">Choose Box Style & Capacity</h3>
                <p className="text-xs text-[#5F6D65]">Select container size and premium outer material</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {BOX_OPTIONS.map((box) => (
                <button
                  key={box.id}
                  type="button"
                  onClick={() => handleSelectBox(box)}
                  className={`p-5 rounded-xl border-2 text-left transition-all flex flex-col justify-between cursor-pointer ${
                    selectedBox.id === box.id
                      ? "border-[#102C21] bg-[#FAF7F0] shadow-xs ring-1 ring-[#102C21]"
                      : "border-[#E5DEC9] hover:border-[#B99A58] bg-white"
                  }`}
                >
                  <div>
                    <span className="text-3xl mb-2 block">{box.emoji}</span>
                    <h4 className="font-serif font-bold text-[#102C21] text-base">{box.name}</h4>
                    <span className="text-[11px] font-bold text-[#987B3E] uppercase tracking-wider block mt-0.5">
                      {box.capacity} Jars Capacity
                    </span>
                    <p className="text-xs text-[#5F6D65] mt-2 line-clamp-2">{box.description}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#E5DEC9]/70 flex justify-between items-baseline">
                    <span className="text-xs text-[#5F6D65]">Base Box Price</span>
                    <span className="font-bold text-[#102C21] text-sm">₹{box.basePrice}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* STEP 2: FILL THE JARS (SLOT SELECTION) */}
          <div className="bg-white rounded-2xl border border-[#E5DEC9] p-6 sm:p-8 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#E5DEC9]/70 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-[#102C21] text-white flex items-center justify-center font-bold text-xs">
                  2
                </span>
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#102C21]">Select Gourmet Jar Fillings</h3>
                  <p className="text-xs text-[#5F6D65]">
                    Filled {filledProducts.length} of {selectedBox.capacity} slots
                  </p>
                </div>
              </div>
              {filledProducts.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedSlots(new Array(selectedBox.capacity).fill(null))}
                  className="text-xs text-[#5F6D65] hover:text-[#102C21] cursor-pointer"
                >
                  Empty Slots
                </button>
              )}
            </div>

            {/* Active Box Slots Display */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 p-4 bg-[#FAF7F0] rounded-xl border border-[#E5DEC9]">
              {selectedSlots.map((slot, idx) => (
                <div
                  key={idx}
                  data-byob-slot="true"
                  onClick={() => setActiveFillingSlotIndex(idx)}
                  className={`p-3 rounded-xl border-2 transition-all cursor-pointer text-center relative ${
                    activeFillingSlotIndex === idx
                      ? "border-[#102C21] bg-white shadow-xs ring-1 ring-[#102C21]"
                      : slot
                      ? "border-[#E5DEC9] bg-white"
                      : "border-dashed border-[#DDD2BF] bg-[#FAF7F0]"
                  }`}
                >
                  {slot ? (
                    <div>
                      <span className="text-2xl block mb-1">🥜</span>
                      <h5 className="font-bold text-xs text-[#102C21] line-clamp-1">{slot.name}</h5>
                      <span className="text-[10px] text-[#102C21] font-semibold">
                        ₹{slot.variants?.[0]?.sellingPrice || 399}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveSlot(idx);
                        }}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-[#102C21] text-white rounded-full text-[10px] font-bold flex items-center justify-center hover:bg-rose-700 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="py-2">
                      <span className="text-xl text-[#5F6D65]/40 block mb-1">+</span>
                      <span className="text-xs font-bold text-[#5F6D65]">Slot {idx + 1}</span>
                      <span className="text-[10px] text-[#5F6D65] block">Click to fill</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Available Products Picker */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#102C21] mb-3">
                Click a gourmet harvest to assign to Slot {activeFillingSlotIndex + 1}:
              </h4>
              {isLoadingProducts ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div key={n} className="h-24 bg-[#FAF7F0] rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1">
                  {availableProducts.map((prod) => (
                    <button
                      key={prod.id}
                      type="button"
                      data-byob-fill-button="true"
                      onClick={() => handleFillSlot(prod)}
                      className="p-3 bg-white hover:bg-[#FAF7F0] border border-[#E5DEC9] rounded-xl text-left transition-all hover:border-[#B99A58] flex items-center gap-3 cursor-pointer shadow-xs"
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-[#E5DEC9]">
                        <ProductImageFrame
                          src={prod.primaryImage?.imageUrl || getProductImageUrl(prod.slug)}
                          alt={prod.name}
                          productName={prod.name}
                          categoryName={prod.category?.name}
                          size="sm"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h5 className="font-semibold text-xs text-[#102C21] truncate">{prod.name}</h5>
                        <span className="text-xs font-bold text-[#102C21] block">
                          ₹{prod.variants?.[0]?.sellingPrice || 399}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* STEP 3: OCCASION SLEEVE */}
          <div className="bg-white rounded-2xl border border-[#E5DEC9] p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-3 border-b border-[#E5DEC9]/70 pb-4 mb-6">
              <span className="w-7 h-7 rounded-full bg-[#102C21] text-white flex items-center justify-center font-bold text-xs">
                3
              </span>
              <div>
                <h3 className="font-serif text-lg font-bold text-[#102C21]">Occasion Theme & Sleeve</h3>
                <p className="text-xs text-[#5F6D65]">Wrap your box with festive or bespoke occasion ribbons</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {OCCASION_SLEEVES.map((sleeve) => (
                <button
                  key={sleeve.id}
                  type="button"
                  onClick={() => setSelectedSleeve(sleeve)}
                  className={`p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between cursor-pointer ${
                    selectedSleeve.id === sleeve.id
                      ? "border-[#102C21] bg-[#FAF7F0] shadow-xs ring-1 ring-[#102C21]"
                      : "border-[#E5DEC9] hover:border-[#B99A58] bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full border border-white shadow-xs flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: sleeve.themeColor }}
                    >
                      🎀
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-[#102C21]">{sleeve.name}</h5>
                      <span className="text-[10px] text-[#5F6D65]">{sleeve.tag}</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#102C21]">
                    {sleeve.price === 0 ? "FREE" : `+₹${sleeve.price}`}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* STEP 4: GREETING MESSAGE */}
          <div className="bg-white rounded-2xl border border-[#E5DEC9] p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-3 border-b border-[#E5DEC9]/70 pb-4 mb-6">
              <span className="w-7 h-7 rounded-full bg-[#102C21] text-[#FAF7F0] flex items-center justify-center font-bold text-xs">
                4
              </span>
              <div>
                <h3 className="font-serif text-lg font-bold text-[#102C21]">Wax-Sealed Greeting Note</h3>
                <p className="text-xs text-[#5F6D65]">Personalized card printed on handmade textured cotton paper</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#102C21] block mb-1">
                    Recipient Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Charu Verma"
                    value={greetingRecipient}
                    onChange={(e) => setGreetingRecipient(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-[#FAF7F0] border border-[#E5DEC9] rounded-lg focus:outline-none focus:border-[#102C21] text-[#102C21]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#102C21] block mb-1">
                    Sender Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., The Sharma Family"
                    value={greetingSender}
                    onChange={(e) => setGreetingSender(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-[#FAF7F0] border border-[#E5DEC9] rounded-lg focus:outline-none focus:border-[#102C21] text-[#102C21]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#102C21] block mb-1">
                  Custom Message (Max 200 characters)
                </label>
                <textarea
                  rows={3}
                  maxLength={200}
                  placeholder="Wishing you health, prosperity, and joyous celebrations with purest royal delights..."
                  value={greetingMessage}
                  onChange={(e) => setGreetingMessage(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-[#FAF7F0] border border-[#E5DEC9] rounded-lg focus:outline-none focus:border-[#102C21] text-[#102C21]"
                />
                <span className="text-[10px] text-[#5F6D65] block text-right">
                  {greetingMessage.length}/200 characters
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT 4 COLS: LIVE HAMPER SUMMARY STICKY CARD */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-[#E5DEC9] p-6 shadow-xl sticky top-24 space-y-6">
          <div className="border-b border-[#E5DEC9]/70 pb-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#987B3E]">Bespoke Summary</span>
            <h3 className="font-serif text-xl font-bold text-[#102C21] mt-1">Your Custom Hamper</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between text-[#3E4D45]">
              <span>Box: {selectedBox.name}</span>
              <span className="font-semibold text-[#102C21]">₹{selectedBox.basePrice}</span>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-[#E5DEC9]/70">
              <span className="font-bold text-[#102C21] block">
                Selected Fillings ({filledProducts.length}/{selectedBox.capacity}):
              </span>
              {selectedSlots.map((slot, i) => (
                <div key={i} className="flex justify-between text-[#5F6D65] pl-2">
                  <span className="truncate max-w-[180px]">
                    {i + 1}. {slot ? slot.name : "(Empty Slot)"}
                  </span>
                  <span>{slot ? `₹${slot.variants?.[0]?.sellingPrice || 399}` : "—"}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between text-[#3E4D45] pt-2 border-t border-[#E5DEC9]/70">
              <span>Sleeve: {selectedSleeve.name}</span>
              <span className="font-semibold text-[#102C21]">
                {selectedSleeve.price === 0 ? "FREE" : `₹${selectedSleeve.price}`}
              </span>
            </div>

            {greetingMessage && (
              <div className="p-3 bg-[#FAF7F0] rounded-lg text-[#3E4D45] text-[11px] italic border border-[#E5DEC9]">
                &ldquo;{greetingMessage}&rdquo;
              </div>
            )}
          </div>

          {/* Grand Total */}
          <div className="pt-4 border-t border-[#E5DEC9]">
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-sm font-bold text-[#102C21]">Total Hamper Price</span>
              <span className="text-2xl font-bold text-[#102C21]">₹{totalHamperPrice.toLocaleString("en-IN")}</span>
            </div>
            <span className="text-[10px] text-[#5F6D65] block mb-4">
              Includes luxury packaging, customized sleeve, card, and all taxes.
            </span>

            <button
              type="button"
              data-byob-add-cart="true"
              onClick={handleAddHamperToCart}
              disabled={!isBoxFull || isAddingHamper || isCartLoading}
              className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm tracking-wide transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border border-[#B99A58]/30 ${
                hamperAddedSuccess
                  ? "bg-emerald-700 text-white"
                  : !isBoxFull
                  ? "bg-[#ECE2D0] text-[#5F6D65] cursor-not-allowed border-none"
                  : "bg-[#102C21] hover:bg-[#173D2D] text-[#FAF7F0] active:scale-98"
              }`}
            >
              {hamperAddedSuccess ? (
                <>✓ Hamper Added to Cart</>
              ) : isAddingHamper ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Adding Hamper...
                </>
              ) : !isBoxFull ? (
                `Fill remaining ${selectedBox.capacity - filledProducts.length} jars to proceed`
              ) : (
                "Add Custom Hamper to Cart"
              )}
            </button>

            {hamperAddedSuccess && (
              <Link
                href="/checkout"
                className="mt-2.5 w-full py-2.5 px-4 rounded-xl font-bold text-xs tracking-wider uppercase text-center block bg-[#B99A58] hover:bg-[#987B3E] text-[#102C21] transition-all cursor-pointer shadow-sm border border-[#B99A58]"
              >
                Proceed to Checkout &rarr;
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BuildYourOwnBoxPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-24 text-center text-[#102C21]">
          <div className="w-10 h-10 border-4 border-[#102C21]/20 border-t-[#102C21] rounded-full animate-spin mx-auto mb-4" />
          <p className="font-serif text-lg font-bold">Loading Bespoke Hamper Atelier...</p>
        </div>
      }
    >
      <BuildYourOwnBoxContent />
    </Suspense>
  );
}
