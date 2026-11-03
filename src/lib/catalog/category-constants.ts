export interface SubcategoryOption {
  id: number;
  categoryId: number;
  name: string;
  slug: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface CategoryOption {
  id: number;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  displayOrder?: number;
  isActive?: boolean;
  subcategories: SubcategoryOption[];
  _count?: { products: number };
}

export const INITIAL_TAXONOMY_CATEGORIES: CategoryOption[] = [
  {
    id: 1,
    name: "Fruits & Nuts",
    slug: "fruits-and-nuts",
    description: "Whole, sliced, roasted, and flavored specialty nuts.",
    subcategories: [
      { id: 1, categoryId: 1, name: "Raw / Natural Nuts", slug: "raw-natural-nuts" },
      { id: 2, categoryId: 1, name: "Roasted & Salted Nuts", slug: "roasted-salted-nuts" },
      { id: 3, categoryId: 1, name: "Flavored Gourmet Nuts", slug: "flavored-gourmet-nuts" },
    ],
  },
  {
    id: 2,
    name: "Dry Fruits",
    slug: "dry-fruits",
    description: "Premium almonds, cashews, walnuts, pistachios, and figs.",
    subcategories: [
      { id: 4, categoryId: 2, name: "Almonds / Badam", slug: "almonds-badam" },
      { id: 5, categoryId: 2, name: "Cashews / Kaju", slug: "cashews-kaju" },
      { id: 6, categoryId: 2, name: "Walnuts / Akhrot", slug: "walnuts-akhrot" },
      { id: 7, categoryId: 2, name: "Pistachios / Pista", slug: "pistachios-pista" },
      { id: 8, categoryId: 2, name: "Raisins / Kishmish", slug: "raisins-kishmish" },
      { id: 9, categoryId: 2, name: "Figs / Anjeer", slug: "figs-anjeer" },
      { id: 10, categoryId: 2, name: "Berries & Prunes", slug: "berries-prunes" },
    ],
  },
  {
    id: 3,
    name: "Dates / Khajoor",
    slug: "dates-khajoor",
    description: "Artisanal Medjool, Ajwa, Mabroom, and stuffed dates.",
    subcategories: [
      { id: 11, categoryId: 3, name: "Premium Cultivars", slug: "premium-cultivars" },
      { id: 12, categoryId: 3, name: "Stuffed Gourmet Dates", slug: "stuffed-gourmet-dates" },
      { id: 13, categoryId: 3, name: "Chocolate Dipped Dates", slug: "chocolate-dipped-dates" },
    ],
  },
  {
    id: 4,
    name: "Super Seeds",
    slug: "seeds",
    description: "Raw and slow-roasted chia, flax, pumpkin, and sunflower seeds.",
    subcategories: [
      { id: 14, categoryId: 4, name: "Raw Single Varietals", slug: "raw-single-varietals" },
      { id: 15, categoryId: 4, name: "Roasted Superfood Mixes", slug: "roasted-superfood-mixes" },
    ],
  },
  {
    id: 5,
    name: "Artisan Tea",
    slug: "tea",
    description: "Specialty whole leaf orthodox, CTC, green, and floral herbal infusions.",
    subcategories: [
      { id: 16, categoryId: 5, name: "Orthodox Whole Leaf", slug: "orthodox-whole-leaf" },
      { id: 17, categoryId: 5, name: "CTC Black Teas", slug: "ctc-black-teas" },
      { id: 18, categoryId: 5, name: "Green Teas", slug: "green-teas" },
      { id: 19, categoryId: 5, name: "Herbal & Wellness Infusions", slug: "herbal-wellness-infusions" },
      { id: 20, categoryId: 5, name: "Kashmiri Kahwa & Spiced", slug: "kahwa-spiced" },
    ],
  },
  {
    id: 6,
    name: "Gourmet Chocolates",
    slug: "chocolates",
    description: "Handcrafted dark chocolates, nut clusters, and dragées.",
    subcategories: [
      { id: 21, categoryId: 6, name: "Artisan Dark Chocolate Bars", slug: "artisan-dark-bars" },
      { id: 22, categoryId: 6, name: "Nut Clusters & Dragées", slug: "nut-clusters-dragees" },
      { id: 23, categoryId: 6, name: "Chocolate Dipped Dry Fruits", slug: "chocolate-dipped-dry-fruits" },
    ],
  },
  {
    id: 7,
    name: "Royal Mouth Fresheners",
    slug: "mouth-fresheners",
    description: "Heritage paan blends, silver-coated cardamom, and digestive mukhwas (100% Tobacco-free).",
    subcategories: [
      { id: 24, categoryId: 7, name: "Heritage Paan Confections", slug: "heritage-paan-confections" },
      { id: 25, categoryId: 7, name: "Roasted Digestive Seeds", slug: "roasted-digestive-seeds" },
      { id: 26, categoryId: 7, name: "Amla & Fruit Digestives", slug: "amla-fruit-digestives" },
    ],
  },
  {
    id: 8,
    name: "Value Combos",
    slug: "combos",
    description: "Curated daily nutrition bundles and family packs.",
    subcategories: [
      { id: 27, categoryId: 8, name: "Daily Health Packs", slug: "daily-health-packs" },
      { id: 28, categoryId: 8, name: "Multi-Pack Bundles", slug: "multi-pack-bundles" },
    ],
  },
  {
    id: 9,
    name: "Luxury Gifting",
    slug: "gifting",
    description: "Bespoke wooden caskets, velvet trays, and festive gift boxes.",
    subcategories: [
      { id: 29, categoryId: 9, name: "Classic Wooden Keepsake Boxes", slug: "wooden-keepsake-boxes" },
      { id: 30, categoryId: 9, name: "Royal Velvet Presentation Trays", slug: "royal-velvet-trays" },
      { id: 31, categoryId: 9, name: "Heritage Metal Tin Hampers", slug: "heritage-tin-hampers" },
      { id: 32, categoryId: 9, name: "Build Your Own Box (BYOB)", slug: "byob-gift-boxes" },
    ],
  },
  {
    id: 10,
    name: "Specialty Products",
    slug: "specialty",
    description: "Kashmiri Grade-A saffron, organic honey, and cold-pressed nut oils.",
    subcategories: [
      { id: 33, categoryId: 10, name: "Kashmiri Saffron", slug: "kashmiri-saffron" },
      { id: 34, categoryId: 10, name: "Organic Honey & Spreads", slug: "organic-honey-spreads" },
      { id: 35, categoryId: 10, name: "Cold-Pressed Nut Oils", slug: "cold-pressed-nut-oils" },
    ],
  },
];
