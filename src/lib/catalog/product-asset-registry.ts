/**
 * Authoritative Product Asset Registry for M/S Fruits & Nuts
 *
 * Enforces zero-tolerance against unverified stock photos, mismatched foods,
 * or fabricated imagery. Manages authentic client asset URLs and provides
 * structured metadata for intentional luxury placeholders until approved
 * client photography is delivered.
 *
 * Incorporates complete client handwritten product sheet (Teas, Dry Fruits,
 * Dates, Seeds, Bites, Ghee, and Mouth Fresheners).
 */

export type AssetVerificationStatus = "VERIFIED_CLIENT_ASSET" | "CURATED_TEMPORARY_ASSET" | "CLIENT_ASSET_PENDING";

export interface ProductAssetEntry {
  productId: string;
  slug: string;
  name: string;
  shortName: string;
  categorySlug: string;
  categoryName: string;
  assetStatus: AssetVerificationStatus;
  verifiedImageUrl: string | null;
  isTemporaryAsset: boolean;
  altText: string;
  aspectRatio: "1:1";
  sourceNotes: string;
  photographySpecs: {
    minimumResolution: string;
    preferredBackdrop: string;
    lighting: string;
    packagingRequirement: string;
  };
}

export const PRODUCT_ASSET_REGISTRY: Record<string, ProductAssetEntry> = {
  // --- DRY FRUITS & NUTS ---
  "kashmiri-mamra-almonds": {
    productId: "prod-mamra-01",
    slug: "kashmiri-mamra-almonds",
    name: "Kashmiri Imperial Mamra Almonds (Grade A+)",
    shortName: "Imperial Mamra Almonds",
    categorySlug: "dry-fruits",
    categoryName: "Dry Fruits & Royal Nuts",
    assetStatus: "CURATED_TEMPORARY_ASSET",
    verifiedImageUrl: "/images/products/kashmiri-mamra-almonds.jpg",
    isTemporaryAsset: true,
    altText: "Kashmiri Imperial Mamra Almonds (Grade A+) - Royal Gourmet Reserve",
    aspectRatio: "1:1",
    sourceNotes: "Curated raw Mamra almond photography. Awaiting client studio packshots.",
    photographySpecs: {
      minimumResolution: "1200x1200px (300 DPI)",
      preferredBackdrop: "Warm ivory / raw linen (#FAF7F0)",
      lighting: "Soft directional daylight highlighting natural boat curl and rich oil sheen",
      packagingRequirement: "Studio packshot in airtight luxury gold-stamped nitrogen tin and loose natural kernels",
    },
  },
  "king-cashews-w180": {
    productId: "prod-cashew-03",
    slug: "king-cashews-w180",
    name: "King Cashews W180 Jumbo (Goan Red Soil)",
    shortName: "King Cashews W180",
    categorySlug: "dry-fruits",
    categoryName: "Dry Fruits & Royal Nuts",
    assetStatus: "VERIFIED_CLIENT_ASSET",
    verifiedImageUrl: "/images/products/king-cashews-w180.jpg",
    isTemporaryAsset: false,
    altText: "King Cashews W180 Jumbo (Goan Red Soil) - Royal Gourmet Reserve",
    aspectRatio: "1:1",
    sourceNotes: "Verified client product asset (product2.jpeg / gallery1(45).jpeg).",
    photographySpecs: {
      minimumResolution: "1200x1200px (300 DPI)",
      preferredBackdrop: "Warm ivory (#FAF7F0)",
      lighting: "Even studio softbox highlighting pale ivory curvature and pristine whole grade",
      packagingRequirement: "Airtight nitrogen glass canister with scale reference highlighting massive W180 kernel size",
    },
  },
  "kashmir-snow-walnuts": {
    productId: "prod-walnut-05",
    slug: "kashmir-snow-walnuts",
    name: "Kashmir Valley Snow Walnuts (Thin Shell Kagzi)",
    shortName: "Kashmir Snow Walnuts",
    categorySlug: "dry-fruits",
    categoryName: "Dry Fruits & Royal Nuts",
    assetStatus: "VERIFIED_CLIENT_ASSET",
    verifiedImageUrl: "/images/products/kashmir-snow-walnuts.jpg",
    isTemporaryAsset: false,
    altText: "Kashmir Valley Snow Walnuts (Thin Shell Kagzi) - Royal Gourmet Reserve",
    aspectRatio: "1:1",
    sourceNotes: "Verified client product asset (product6.jpeg / gallery1(42).jpeg).",
    photographySpecs: {
      minimumResolution: "1200x1200px (300 DPI)",
      preferredBackdrop: "Warm ivory (#FAF7F0)",
      lighting: "High-contrast clean lighting capturing pale butterfly halves and fragile thin Kagzi shell",
      packagingRequirement: "Nitrogen sealed vacuum pouch with whole undamaged unbroken extra-light halves",
    },
  },
  "pista-salted": {
    productId: "prod-pista-28",
    slug: "pista-salted",
    name: "Iranian Jumbo Roasted Salted Pistachios",
    shortName: "Roasted Pistachios",
    categorySlug: "dry-fruits",
    categoryName: "Dry Fruits & Royal Nuts",
    assetStatus: "VERIFIED_CLIENT_ASSET",
    verifiedImageUrl: "/images/products/pista-salted.jpg",
    isTemporaryAsset: false,
    altText: "Iranian Jumbo Roasted Salted Pistachios - Royal Gourmet Reserve",
    aspectRatio: "1:1",
    sourceNotes: "Verified client product asset (product3.jpeg / gallery1(44).jpeg).",
    photographySpecs: {
      minimumResolution: "1200x1200px",
      preferredBackdrop: "Warm ivory",
      lighting: "Studio rim lighting on open green kernels",
      packagingRequirement: "Nitrogen-flushed standup pouch",
    },
  },
  "roasted-pista": {
    productId: "prod-pista-28",
    slug: "pista-salted",
    name: "Iranian Jumbo Roasted Salted Pistachios",
    shortName: "Roasted Pistachios",
    categorySlug: "dry-fruits",
    categoryName: "Dry Fruits & Royal Nuts",
    assetStatus: "VERIFIED_CLIENT_ASSET",
    verifiedImageUrl: "/images/products/pista-salted.jpg",
    isTemporaryAsset: false,
    altText: "Iranian Jumbo Roasted Salted Pistachios - Royal Gourmet Reserve",
    aspectRatio: "1:1",
    sourceNotes: "Verified client product asset (product3.jpeg / gallery1(44).jpeg).",
    photographySpecs: {
      minimumResolution: "1200x1200px",
      preferredBackdrop: "Warm ivory",
      lighting: "Studio rim lighting on open green kernels",
      packagingRequirement: "Nitrogen-flushed standup pouch",
    },
  },

  // --- DATES / KHAJOOR ---
  "jumbo-medjool-dates": {
    productId: "prod-medjool-02",
    slug: "jumbo-medjool-dates",
    name: "Jordan Valley Jumbo Medjool Dates (Single Estate)",
    shortName: "Jumbo Medjool Dates",
    categorySlug: "dates-khajoor",
    categoryName: "Royal Dates & Khajoor",
    assetStatus: "VERIFIED_CLIENT_ASSET",
    verifiedImageUrl: "/images/products/jumbo-medjool-dates.jpg",
    isTemporaryAsset: false,
    altText: "Jordan Valley Jumbo Medjool Dates (Single Estate) - Royal Gourmet Reserve",
    aspectRatio: "1:1",
    sourceNotes: "Verified client product asset (product4.jpeg / gallery1(47).jpeg).",
    photographySpecs: {
      minimumResolution: "1200x1200px (300 DPI)",
      preferredBackdrop: "Warm ivory / natural sand (#FAF7F0)",
      lighting: "Gentle warm rim light accentuating moist wrinkling and rich mahogany luster",
      packagingRequirement: "Packshot in royal presentation casket alongside cross-section showing juicy amber pulp",
    },
  },
  "ajwa-dates": {
    productId: "prod-ajwa-10",
    slug: "ajwa-dates",
    name: "Holy Medina Ajwa Dates (Grade A+)",
    shortName: "Medina Ajwa Dates",
    categorySlug: "dates-khajoor",
    categoryName: "Royal Dates & Khajoor",
    assetStatus: "VERIFIED_CLIENT_ASSET",
    verifiedImageUrl: "/images/products/ajwa-dates.jpg",
    isTemporaryAsset: false,
    altText: "Holy Medina Ajwa Dates - Royal Gourmet Reserve",
    aspectRatio: "1:1",
    sourceNotes: "Verified high-resolution photography of Medina Ajwa dates.",
    photographySpecs: {
      minimumResolution: "1200x1200px",
      preferredBackdrop: "Warm ivory",
      lighting: "Soft lighting on dark matte ribbed skin",
      packagingRequirement: "Rigid luxury keepsake casket",
    },
  },
  "kimia-dates": {
    productId: "prod-kimia-11",
    slug: "kimia-dates",
    name: "Fresh Bam Kimia Dates (Soft & Juicy)",
    shortName: "Fresh Kimia Dates",
    categorySlug: "dates-khajoor",
    categoryName: "Royal Dates & Khajoor",
    assetStatus: "VERIFIED_CLIENT_ASSET",
    verifiedImageUrl: "/images/products/kimia-dates.jpg",
    isTemporaryAsset: false,
    altText: "Fresh Bam Kimia Dates - Royal Gourmet Reserve",
    aspectRatio: "1:1",
    sourceNotes: "Verified high-resolution photography of fresh Mazafati Kimia dates.",
    photographySpecs: {
      minimumResolution: "1200x1200px",
      preferredBackdrop: "Warm ivory",
      lighting: "Soft ambient lighting",
      packagingRequirement: "Sealed tray box",
    },
  },

  // --- ARTISANAL TEAS (FROM CLIENT HANDWRITTEN NOTES) ---
  "tea-everest": {
    productId: "prod-tea-everest",
    slug: "tea-everest",
    name: "Tea Everest (Strong Mountain CTC Blend)",
    shortName: "Tea Everest",
    categorySlug: "tea",
    categoryName: "Artisanal Estate Teas",
    assetStatus: "VERIFIED_CLIENT_ASSET",
    verifiedImageUrl: "/images/products/tea-everest.jpg",
    isTemporaryAsset: false,
    altText: "Tea Everest - Royal Gourmet Reserve",
    aspectRatio: "1:1",
    sourceNotes: "Verified client asset: authentic Baikunth mountain CTC black tea canister packaging.",
    photographySpecs: {
      minimumResolution: "1200x1200px",
      preferredBackdrop: "Warm ivory",
      lighting: "Warm directional lighting on gold tea tin",
      packagingRequirement: "Fruits & Nuts branded airtight tea tin",
    },
  },
  "tea-supreme": {
    productId: "prod-tea-supreme",
    slug: "tea-supreme",
    name: "Tea Supreme (High Elevation Assam Orthodox)",
    shortName: "Tea Supreme",
    categorySlug: "tea",
    categoryName: "Artisanal Estate Teas",
    assetStatus: "VERIFIED_CLIENT_ASSET",
    verifiedImageUrl: "/images/products/tea-supreme.jpg",
    isTemporaryAsset: false,
    altText: "Tea Supreme - Royal Gourmet Reserve",
    aspectRatio: "1:1",
    sourceNotes: "Verified client asset: authentic Baikunth Assam orthodox natural kraft aroma-valve pouch packaging.",
    photographySpecs: {
      minimumResolution: "1200x1200px",
      preferredBackdrop: "Warm ivory",
      lighting: "Clean daylight studio lighting",
      packagingRequirement: "Airtight vacuum pouch & canister",
    },
  },
  "tea-hotel-blend": {
    productId: "prod-tea-hotel",
    slug: "tea-hotel-blend",
    name: "Tea Hotel Blend Luxury (Rich Golden Liquor)",
    shortName: "Tea Hotel Blend Luxury",
    categorySlug: "tea",
    categoryName: "Artisanal Estate Teas",
    assetStatus: "VERIFIED_CLIENT_ASSET",
    verifiedImageUrl: "/images/products/tea-hotel-blend.jpg",
    isTemporaryAsset: false,
    altText: "Tea Hotel Blend Luxury - Royal Gourmet Reserve",
    aspectRatio: "1:1",
    sourceNotes: "Verified client asset: authentic Baikunth tea standup barrier pouch packaging.",
    photographySpecs: {
      minimumResolution: "1200x1200px",
      preferredBackdrop: "Warm ivory",
      lighting: "Studio softbox",
      packagingRequirement: "Gold embossed tea caddy",
    },
  },
  "bombay-cutting": {
    productId: "prod-tea-bombay",
    slug: "bombay-cutting",
    name: "Bombay Cutting Special Chai (Street Spice Infusion)",
    shortName: "Bombay Cutting Chai",
    categorySlug: "tea",
    categoryName: "Artisanal Estate Teas",
    assetStatus: "VERIFIED_CLIENT_ASSET",
    verifiedImageUrl: "/images/products/bombay-cutting.jpg",
    isTemporaryAsset: false,
    altText: "Bombay Cutting Special Chai - Royal Gourmet Reserve",
    aspectRatio: "1:1",
    sourceNotes: "Verified client asset: authentic Baikunth kraft pouch kadak tea packaging.",
    photographySpecs: {
      minimumResolution: "1200x1200px",
      preferredBackdrop: "Warm ivory",
      lighting: "Warm directional lighting",
      packagingRequirement: "Artisanal glass jar with spice blend",
    },
  },
  "chocolate-tea": {
    productId: "prod-tea-choc",
    slug: "chocolate-tea",
    name: "Chocolate Tea (Belgian Cocoa & Orthodox Black)",
    shortName: "Chocolate Tea",
    categorySlug: "tea",
    categoryName: "Artisanal Estate Teas",
    assetStatus: "VERIFIED_CLIENT_ASSET",
    verifiedImageUrl: "/images/products/chocolate-tea.jpg",
    isTemporaryAsset: false,
    altText: "Chocolate Tea - Royal Gourmet Reserve",
    aspectRatio: "1:1",
    sourceNotes: "Verified client product asset (gallery1(32).jpeg).",
    photographySpecs: {
      minimumResolution: "1200x1200px",
      preferredBackdrop: "Warm ivory",
      lighting: "Soft studio lighting",
      packagingRequirement: "Airtight tin canister",
    },
  },
  "power-elaichi": {
    productId: "prod-tea-elaichi",
    slug: "power-elaichi",
    name: "Power Elaichi Chai (Mysore Green Cardamom Infusion)",
    shortName: "Power Elaichi Chai",
    categorySlug: "tea",
    categoryName: "Artisanal Estate Teas",
    assetStatus: "VERIFIED_CLIENT_ASSET",
    verifiedImageUrl: "/images/products/power-elaichi.jpg",
    isTemporaryAsset: false,
    altText: "Power Elaichi Chai - Royal Gourmet Reserve",
    aspectRatio: "1:1",
    sourceNotes: "Verified client asset: authentic Baikunth Ginger Elaichi Tea tin canister packaging (gallery1(31).jpeg).",
    photographySpecs: {
      minimumResolution: "1200x1200px",
      preferredBackdrop: "Warm ivory",
      lighting: "Bright overhead daylight",
      packagingRequirement: "Airtight tin caddy",
    },
  },
  "elaichi-adrak": {
    productId: "prod-tea-el-adrak",
    slug: "elaichi-adrak",
    name: "Elaichi Adraki Chai (Cardamom & Sun-Dried Ginger)",
    shortName: "Elaichi Adrak Chai",
    categorySlug: "tea",
    categoryName: "Artisanal Estate Teas",
    assetStatus: "VERIFIED_CLIENT_ASSET",
    verifiedImageUrl: "/images/products/elaichi-adrak.jpg",
    isTemporaryAsset: false,
    altText: "Elaichi Adraki Chai - Royal Gourmet Reserve",
    aspectRatio: "1:1",
    sourceNotes: "Verified client product asset (gallery1(31).jpeg).",
    photographySpecs: {
      minimumResolution: "1200x1200px",
      preferredBackdrop: "Warm ivory",
      lighting: "Warm directional studio light",
      packagingRequirement: "Sealed gold foil pouch",
    },
  },
  "paan-chai": {
    productId: "prod-tea-paan",
    slug: "paan-chai",
    name: "Paan Chai (Heritage Betel Leaf & Gulkand Blend)",
    shortName: "Paan Chai",
    categorySlug: "tea",
    categoryName: "Artisanal Estate Teas",
    assetStatus: "VERIFIED_CLIENT_ASSET",
    verifiedImageUrl: "/images/products/paan-chai.jpg",
    isTemporaryAsset: false,
    altText: "Paan Chai - Royal Gourmet Reserve",
    aspectRatio: "1:1",
    sourceNotes: "Verified client product asset (gallery1(29).jpeg).",
    photographySpecs: {
      minimumResolution: "1200x1200px",
      preferredBackdrop: "Warm ivory",
      lighting: "Vibrant diffuse lighting",
      packagingRequirement: "Luxury royal tea canister",
    },
  },
  "irani-chai": {
    productId: "prod-tea-irani",
    slug: "irani-chai",
    name: "Irani Chai (Slow-Brew Dum Royal Blend)",
    shortName: "Irani Chai",
    categorySlug: "tea",
    categoryName: "Artisanal Estate Teas",
    assetStatus: "VERIFIED_CLIENT_ASSET",
    verifiedImageUrl: "/images/products/irani-chai.jpg",
    isTemporaryAsset: false,
    altText: "Irani Chai - Royal Gourmet Reserve",
    aspectRatio: "1:1",
    sourceNotes: "Verified client asset: authentic Baikunth specialty blend tea tin canister.",
    photographySpecs: {
      minimumResolution: "1200x1200px",
      preferredBackdrop: "Warm ivory",
      lighting: "Warm ambient studio lighting",
      packagingRequirement: "Airtight container",
    },
  },
  "tulsi-adrak": {
    productId: "prod-tea-tulsi",
    slug: "tulsi-adrak",
    name: "Tulsi Adraki Chai (Holy Basil & Spiced Ginger)",
    shortName: "Tulsi Adrak Chai",
    categorySlug: "tea",
    categoryName: "Artisanal Estate Teas",
    assetStatus: "VERIFIED_CLIENT_ASSET",
    verifiedImageUrl: "/images/products/tulsi-adrak.jpg",
    isTemporaryAsset: false,
    altText: "Tulsi Adraki Chai - Royal Gourmet Reserve",
    aspectRatio: "1:1",
    sourceNotes: "Verified client product asset (gallery1(28).jpeg).",
    photographySpecs: {
      minimumResolution: "1200x1200px",
      preferredBackdrop: "Warm ivory",
      lighting: "Natural soft daylight",
      packagingRequirement: "Nitrogen flushed tin",
    },
  },
  "kesariya-chai": {
    productId: "prod-tea-kesar",
    slug: "kesariya-chai",
    name: "Kesariya Chai (Kashmiri Saffron Mongra Infused)",
    shortName: "Kesariya Saffron Chai",
    categorySlug: "tea",
    categoryName: "Artisanal Estate Teas",
    assetStatus: "VERIFIED_CLIENT_ASSET",
    verifiedImageUrl: "/images/products/kesariya-chai.jpg",
    isTemporaryAsset: false,
    altText: "Kesariya Chai - Royal Gourmet Reserve",
    aspectRatio: "1:1",
    sourceNotes: "Verified client product asset (gallery1(33).jpeg).",
    photographySpecs: {
      minimumResolution: "1200x1200px",
      preferredBackdrop: "Warm ivory",
      lighting: "Rich warm lighting highlighting red saffron threads",
      packagingRequirement: "Handcrafted wooden caddy with velvet inlay",
    },
  },
  "rose-chai": {
    productId: "prod-tea-rose",
    slug: "rose-chai",
    name: "Rose Chai (Damascus Rose Petals & Golden Tips)",
    shortName: "Rose Chai",
    categorySlug: "tea",
    categoryName: "Artisanal Estate Teas",
    assetStatus: "VERIFIED_CLIENT_ASSET",
    verifiedImageUrl: "/images/products/rose-chai.jpg",
    isTemporaryAsset: false,
    altText: "Rose Chai - Royal Gourmet Reserve",
    aspectRatio: "1:1",
    sourceNotes: "Verified client product asset (gallery1(30).jpeg).",
    photographySpecs: {
      minimumResolution: "1200x1200px",
      preferredBackdrop: "Warm ivory",
      lighting: "Soft ambient diffused illumination",
      packagingRequirement: "Clear glass vial or airtight tin caddy",
    },
  },
  "kashmiri-shahi-kahwa": {
    productId: "prod-kahwa-04",
    slug: "kashmiri-shahi-kahwa",
    name: "Shahi Kashmiri Saffron Kahwa (Artisanal Green Tea)",
    shortName: "Shahi Saffron Kahwa",
    categorySlug: "tea",
    categoryName: "Artisanal Estate Teas",
    assetStatus: "VERIFIED_CLIENT_ASSET",
    verifiedImageUrl: "/images/products/kashmiri-shahi-kahwa.jpg",
    isTemporaryAsset: false,
    altText: "Shahi Kashmiri Saffron Kahwa (Artisanal Green Tea) - Royal Gourmet Reserve",
    aspectRatio: "1:1",
    sourceNotes: "Verified client asset: authentic Baikunth emerald green tea caddy tin & cup packaging.",
    photographySpecs: {
      minimumResolution: "1200x1200px (300 DPI)",
      preferredBackdrop: "Neutral ivory / antique brass platter (#FAF7F0)",
      lighting: "Soft ambient diffused illumination showing whole green tea leaves, red saffron threads, and crushed cardamom",
      packagingRequirement: "Royal gold caddy packaging alongside clear glass samovar presentation showing golden amber infusion",
    },
  },

  // --- SUPER SEEDS & BERRIES ---
  "flax-seeds": {
    productId: "prod-flax-12",
    slug: "flax-seeds",
    name: "Roasted Organic Flax Seeds (Alsi)",
    shortName: "Roasted Flax Seeds",
    categorySlug: "seeds",
    categoryName: "Super Seeds & Berries",
    assetStatus: "VERIFIED_CLIENT_ASSET",
    verifiedImageUrl: "/images/products/flax-seeds.jpg",
    isTemporaryAsset: false,
    altText: "Roasted Organic Flax Seeds - Royal Gourmet Reserve",
    aspectRatio: "1:1",
    sourceNotes: "Verified high-resolution photography of roasted organic golden flax seeds (alsi).",
    photographySpecs: {
      minimumResolution: "1200x1200px",
      preferredBackdrop: "Warm ivory",
      lighting: "Clean high-contrast studio light",
      packagingRequirement: "Resealable barrier pouch",
    },
  },
  "chia-seeds": {
    productId: "prod-chia-13",
    slug: "chia-seeds",
    name: "Raw Organic Chia Seeds (High Fiber)",
    shortName: "Raw Chia Seeds",
    categorySlug: "seeds",
    categoryName: "Super Seeds & Berries",
    assetStatus: "VERIFIED_CLIENT_ASSET",
    verifiedImageUrl: "/images/products/chia-seeds.jpg",
    isTemporaryAsset: false,
    altText: "Raw Organic Chia Seeds - Royal Gourmet Reserve",
    aspectRatio: "1:1",
    sourceNotes: "Verified high-resolution photography of raw organic chia seeds reserve.",
    photographySpecs: {
      minimumResolution: "1200x1200px",
      preferredBackdrop: "Warm ivory",
      lighting: "Studio diffuse lighting",
      packagingRequirement: "Resealable craft pouch with clear window",
    },
  },
  "pumpkin-seeds": {
    productId: "prod-pumpkin-14",
    slug: "pumpkin-seeds",
    name: "Raw Himalayan Pumpkin Seeds (AAA Grade)",
    shortName: "Raw Pumpkin Seeds",
    categorySlug: "seeds",
    categoryName: "Super Seeds & Berries",
    assetStatus: "VERIFIED_CLIENT_ASSET",
    verifiedImageUrl: "/images/products/pumpkin-seeds.jpg",
    isTemporaryAsset: false,
    altText: "Raw Himalayan Pumpkin Seeds - Royal Gourmet Reserve",
    aspectRatio: "1:1",
    sourceNotes: "Verified high-resolution photography of raw Himalayan AAA pumpkin seeds.",
    photographySpecs: {
      minimumResolution: "1200x1200px",
      preferredBackdrop: "Warm ivory",
      lighting: "Clean daylight studio lighting",
      packagingRequirement: "Airtight vacuum pouch",
    },
  },
  "basil-seeds": {
    productId: "prod-basil-15",
    slug: "basil-seeds",
    name: "Organic Basil Seeds / Sabja (Pure Dietary Fiber)",
    shortName: "Organic Basil Seeds",
    categorySlug: "seeds",
    categoryName: "Super Seeds & Berries",
    assetStatus: "VERIFIED_CLIENT_ASSET",
    verifiedImageUrl: "/images/products/basil-seeds.jpg",
    isTemporaryAsset: false,
    altText: "Organic Basil Seeds (Sabja) - Royal Gourmet Reserve",
    aspectRatio: "1:1",
    sourceNotes: "Verified high-resolution photography of organic sabja basil seeds.",
    photographySpecs: {
      minimumResolution: "1200x1200px",
      preferredBackdrop: "Warm ivory",
      lighting: "Macro studio illumination",
      packagingRequirement: "Airtight barrier pouch",
    },
  },
  "wild-berries-reserve": {
    productId: "prod-berries-06",
    slug: "wild-berries-reserve",
    name: "Wild Dried Cranberries & Blueberries Reserve",
    shortName: "Wild Dried Berries",
    categorySlug: "seeds",
    categoryName: "Super Seeds & Berries",
    assetStatus: "VERIFIED_CLIENT_ASSET",
    verifiedImageUrl: "/images/products/wild-berries-reserve.jpg",
    isTemporaryAsset: false,
    altText: "Wild Dried Cranberries & Blueberries Reserve - Royal Gourmet Reserve",
    aspectRatio: "1:1",
    sourceNotes: "Verified high-resolution photography of wild dried cranberries & blueberries reserve.",
    photographySpecs: {
      minimumResolution: "1200x1200px (300 DPI)",
      preferredBackdrop: "Warm ivory (#FAF7F0)",
      lighting: "Macro illumination showing deep ruby cranberries and indigo blueberries with natural moisture",
      packagingRequirement: "Clear window artisanal resealable pouch",
    },
  },

  // --- GOURMET BITES & CONFECTIONS ---
  "anjeer-bites": {
    productId: "prod-anjeer-bites",
    slug: "anjeer-bites",
    name: "Artisanal Anjeer Bites (Natural Fig & Almond Confection)",
    shortName: "Anjeer Bites",
    categorySlug: "chocolates",
    categoryName: "Gourmet Chocolates & Bites",
    assetStatus: "VERIFIED_CLIENT_ASSET",
    verifiedImageUrl: "/images/products/anjeer-bites.jpg",
    isTemporaryAsset: false,
    altText: "Artisanal Anjeer Bites - Royal Gourmet Reserve",
    aspectRatio: "1:1",
    sourceNotes: "Verified client product asset (gallery1(46).jpeg).",
    photographySpecs: {
      minimumResolution: "1200x1200px",
      preferredBackdrop: "Warm ivory",
      lighting: "Studio warm lighting on fig-nut cubes",
      packagingRequirement: "Gold embossed presentation ballotin",
    },
  },
  "dates-bites": {
    productId: "prod-dates-bites",
    slug: "dates-bites",
    name: "Royal Dates Bites (Handcrafted Date & Pistachio Confection)",
    shortName: "Dates Bites",
    categorySlug: "chocolates",
    categoryName: "Gourmet Chocolates & Bites",
    assetStatus: "VERIFIED_CLIENT_ASSET",
    verifiedImageUrl: "/images/products/dates-bites.jpg",
    isTemporaryAsset: false,
    altText: "Royal Dates Bites - Royal Gourmet Reserve (Dry Fruit Date Magic)",
    aspectRatio: "1:1",
    sourceNotes: "Verified client product asset from official brand upload (Dry Fruit Date Magic packshot).",
    photographySpecs: {
      minimumResolution: "1200x1200px",
      preferredBackdrop: "Warm ivory",
      lighting: "Warm directional studio light",
      packagingRequirement: "Luxury rigid gift pack",
    },
  },
  "chocolate-almond-dragees": {
    productId: "prod-choc-07",
    slug: "chocolate-almond-dragees",
    name: "Dark Belgian Chocolate Almond Dragées",
    shortName: "Chocolate Almond Dragées",
    categorySlug: "chocolates",
    categoryName: "Gourmet Chocolates & Bites",
    assetStatus: "VERIFIED_CLIENT_ASSET",
    verifiedImageUrl: "/images/products/chocolate-almond-dragees.jpg",
    isTemporaryAsset: false,
    altText: "Dark Belgian Chocolate Almond Dragées - Royal Gourmet Reserve",
    aspectRatio: "1:1",
    sourceNotes: "Verified high-resolution photography of dark Belgian chocolate almond dragées.",
    photographySpecs: {
      minimumResolution: "1200x1200px (300 DPI)",
      preferredBackdrop: "Warm ivory (#FAF7F0)",
      lighting: "Subtle specular highlight showcasing glossy tempered 70% dark Belgian coating",
      packagingRequirement: "Rigid gold-embossed ballotin confectionery box",
    },
  },

  // --- MOUTH FRESHENERS ---
  "shahi-paan-mukhwas": {
    productId: "prod-paan-08",
    slug: "shahi-paan-mukhwas",
    name: "Heritage Shahi Paan Digestive Mukhwas (Tobacco-Free)",
    shortName: "Heritage Shahi Paan",
    categorySlug: "mouth-fresheners",
    categoryName: "Royal Mouth Fresheners",
    assetStatus: "VERIFIED_CLIENT_ASSET",
    verifiedImageUrl: "/images/products/shahi-paan-mukhwas.jpg",
    isTemporaryAsset: false,
    altText: "Heritage Shahi Paan Digestive Mukhwas (Tobacco-Free) - Royal Gourmet Reserve",
    aspectRatio: "1:1",
    sourceNotes: "Verified client product asset (banner3.jpeg / gallery1(36).jpeg).",
    photographySpecs: {
      minimumResolution: "1200x1200px (300 DPI)",
      preferredBackdrop: "Warm ivory (#FAF7F0)",
      lighting: "Vibrant high-color-rendering daylight showing betel leaf shreds, gulkand, and silver vark pearls",
      packagingRequirement: "Airtight heritage glass vial with wax seal stamp",
    },
  },

  // --- SPECIALTY / DESI GHEE ---
  "desi-ghee": {
    productId: "prod-ghee-16",
    slug: "desi-ghee",
    name: "Traditional A2 Bilona Cow Desi Ghee (Cultured Pure Butter)",
    shortName: "A2 Desi Cow Ghee",
    categorySlug: "specialty",
    categoryName: "Specialty Pantry",
    assetStatus: "VERIFIED_CLIENT_ASSET",
    verifiedImageUrl: "/images/products/desi-ghee.jpg",
    isTemporaryAsset: false,
    altText: "Traditional A2 Bilona Cow Desi Ghee - Royal Gourmet Reserve (Baikunth A2 Gir Cow Ghee)",
    aspectRatio: "1:1",
    sourceNotes: "Verified client product asset from official brand upload (Baikunth Taste the Divine Purity A2 Gir Cow Ghee).",
    photographySpecs: {
      minimumResolution: "1200x1200px",
      preferredBackdrop: "Warm ivory",
      lighting: "Warm directional studio light showing golden granular texture",
      packagingRequirement: "Airtight glass mason jar",
    },
  },

  // --- LUXURY GIFTING ---
  "bespoke-gift-box": {
    productId: "prod-gift-01",
    slug: "bespoke-gift-box",
    name: "Bespoke Royal Festive Gift Box (Custom Hamper Atelier)",
    shortName: "Bespoke Royal Hamper",
    categorySlug: "gifting",
    categoryName: "Luxury Gifting",
    assetStatus: "VERIFIED_CLIENT_ASSET",
    verifiedImageUrl: "/images/products/bespoke-gift-box.jpg",
    isTemporaryAsset: false,
    altText: "Bespoke Royal Festive Gift Box - Royal Gourmet Reserve",
    aspectRatio: "1:1",
    sourceNotes: "Verified high-resolution photography of Fruits & Nuts royal imperial hamper gift box.",
    photographySpecs: {
      minimumResolution: "1200x1200px",
      preferredBackdrop: "Warm ivory",
      lighting: "Warm studio lighting showcasing teak wood and velvet",
      packagingRequirement: "Handcrafted pine or teak box with ribbon and seal",
    },
  },
  "royal-silk-duo-box": {
    productId: "prod-box-duo-02",
    slug: "royal-silk-duo-box",
    name: "Royal Silk Duo Box Packaging",
    shortName: "Royal Silk Duo Box",
    categorySlug: "gifting",
    categoryName: "Luxury Gifting",
    assetStatus: "VERIFIED_CLIENT_ASSET",
    verifiedImageUrl: "/images/products/royal-silk-duo-box.jpg",
    isTemporaryAsset: false,
    altText: "Royal Silk Duo Box Packaging - Royal Gourmet Reserve",
    aspectRatio: "1:1",
    sourceNotes: "Verified high-resolution photography of handcrafted royal silk duo gift packaging.",
    photographySpecs: {
      minimumResolution: "1200x1200px",
      preferredBackdrop: "Warm ivory",
      lighting: "Studio softbox on silk fabric texture",
      packagingRequirement: "Handcrafted rigid silk box with 2 glass jars",
    },
  },
  "imperial-pine-box": {
    productId: "prod-box-pine-04",
    slug: "imperial-pine-box",
    name: "Imperial Pine 4-Jar Wooden Casket",
    shortName: "Imperial Pine Casket",
    categorySlug: "gifting",
    categoryName: "Luxury Gifting",
    assetStatus: "VERIFIED_CLIENT_ASSET",
    verifiedImageUrl: "/images/products/imperial-pine-box.jpg",
    isTemporaryAsset: false,
    altText: "Imperial Pine 4-Jar Wooden Casket - Royal Gourmet Reserve",
    aspectRatio: "1:1",
    sourceNotes: "Verified high-resolution photography of handcrafted imperial pine wooden casket.",
    photographySpecs: {
      minimumResolution: "1200x1200px",
      preferredBackdrop: "Warm ivory",
      lighting: "Natural directional studio lighting highlighting pine grain",
      packagingRequirement: "Natural pine box with 4 glass canisters",
    },
  },
  "sovereign-heritage-trunk": {
    productId: "prod-box-trunk-06",
    slug: "sovereign-heritage-trunk",
    name: "Sovereign Heritage Teak Trunk",
    shortName: "Sovereign Teak Trunk",
    categorySlug: "gifting",
    categoryName: "Luxury Gifting",
    assetStatus: "VERIFIED_CLIENT_ASSET",
    verifiedImageUrl: "/images/products/sovereign-heritage-trunk.jpg",
    isTemporaryAsset: false,
    altText: "Sovereign Heritage Teak Trunk - Royal Gourmet Reserve",
    aspectRatio: "1:1",
    sourceNotes: "Verified high-resolution photography of sovereign heritage antique teak trunk.",
    photographySpecs: {
      minimumResolution: "1200x1200px",
      preferredBackdrop: "Warm ivory",
      lighting: "Dramatic warm lighting capturing rich teak luster",
      packagingRequirement: "Solid teak trunk with 6 glass canisters",
    },
  },

  // --- PANTRY, SPICES & ALLIED (CLIENT SHEET ITEMS) ---
  "afghan-raisins-kishmish": {
    productId: "prod-raisins-29",
    slug: "afghan-raisins-kishmish",
    name: "Golden Afghan Kishmish Raisins (Sundried Long Seedless)",
    shortName: "Afghan Golden Raisins",
    categorySlug: "dry-fruits",
    categoryName: "Dry Fruits & Royal Nuts",
    assetStatus: "VERIFIED_CLIENT_ASSET",
    verifiedImageUrl: "/images/products/afghan-raisins-kishmish.jpg",
    isTemporaryAsset: false,
    altText: "Golden Afghan Kishmish Raisins - Royal Gourmet Reserve",
    aspectRatio: "1:1",
    sourceNotes: "Verified high-resolution photography of golden sundried Afghan kishmish raisins.",
    photographySpecs: {
      minimumResolution: "1200x1200px",
      preferredBackdrop: "Warm ivory",
      lighting: "Soft directional light on translucent golden raisins",
      packagingRequirement: "Resealable barrier pouch",
    },
  },
  "afghan-khumani": {
    productId: "prod-khumani-22",
    slug: "afghan-khumani",
    name: "Sundried Afghan Khumani Apricots (Unsulfured Whole)",
    shortName: "Sundried Afghan Khumani",
    categorySlug: "dry-fruits",
    categoryName: "Dry Fruits & Royal Nuts",
    assetStatus: "VERIFIED_CLIENT_ASSET",
    verifiedImageUrl: "/images/products/afghan-khumani.jpg",
    isTemporaryAsset: false,
    altText: "Sundried Afghan Khumani Apricots - Royal Gourmet Reserve",
    aspectRatio: "1:1",
    sourceNotes: "Verified high-resolution photography of sundried Royal Afghan khumani apricots.",
    photographySpecs: {
      minimumResolution: "1200x1200px",
      preferredBackdrop: "Warm ivory",
      lighting: "Warm studio lighting on golden orange dried apricots",
      packagingRequirement: "Nitrogen flushed pouch",
    },
  },
  "green-cardamom-elaichi": {
    productId: "prod-spc-cardamom-23",
    slug: "green-cardamom-elaichi",
    name: "Imperial Green Cardamom / Chhoti Elaichi (8mm Bold)",
    shortName: "Green Cardamom Elaichi",
    categorySlug: "specialty",
    categoryName: "Specialty Pantry",
    assetStatus: "VERIFIED_CLIENT_ASSET",
    verifiedImageUrl: "/images/products/green-cardamom-elaichi.jpg",
    isTemporaryAsset: false,
    altText: "Imperial Green Cardamom - Royal Gourmet Reserve",
    aspectRatio: "1:1",
    sourceNotes: "Verified high-resolution photography of whole imperial green cardamom (8mm+ bold).",
    photographySpecs: {
      minimumResolution: "1200x1200px",
      preferredBackdrop: "Warm ivory",
      lighting: "Macro studio light on vibrant green 8mm pods",
      packagingRequirement: "Airtight glass vial",
    },
  },
  "organic-cloves-laung": {
    productId: "prod-spc-cloves-24",
    slug: "organic-cloves-laung",
    name: "Zanzibar Whole Cloves / Laung (High Oil Head Intact)",
    shortName: "Whole Cloves Laung",
    categorySlug: "specialty",
    categoryName: "Specialty Pantry",
    assetStatus: "VERIFIED_CLIENT_ASSET",
    verifiedImageUrl: "/images/products/organic-cloves-laung.jpg",
    isTemporaryAsset: false,
    altText: "Zanzibar Whole Cloves - Royal Gourmet Reserve",
    aspectRatio: "1:1",
    sourceNotes: "Verified high-resolution photography of Zanzibar whole cloves / laung with intact head.",
    photographySpecs: {
      minimumResolution: "1200x1200px",
      preferredBackdrop: "Warm ivory",
      lighting: "Macro lighting on dark clove heads",
      packagingRequirement: "Airtight canister",
    },
  },
  "jaiphal-nutmeg": {
    productId: "prod-spc-nutmeg-25",
    slug: "jaiphal-nutmeg",
    name: "Kerala Whole Nutmeg with Mace / Jaiphal",
    shortName: "Whole Nutmeg Jaiphal",
    categorySlug: "specialty",
    categoryName: "Specialty Pantry",
    assetStatus: "VERIFIED_CLIENT_ASSET",
    verifiedImageUrl: "/images/products/jaiphal-nutmeg.jpg",
    isTemporaryAsset: false,
    altText: "Kerala Whole Nutmeg - Royal Gourmet Reserve",
    aspectRatio: "1:1",
    sourceNotes: "Verified high-resolution photography of Kerala whole nutmeg with red mace / jaiphal.",
    photographySpecs: {
      minimumResolution: "1200x1200px",
      preferredBackdrop: "Warm ivory",
      lighting: "Directional light on textured whole nutmeg seed",
      packagingRequirement: "Airtight glass container",
    },
  },
  "pure-hing-asafoetida": {
    productId: "prod-spc-hing-26",
    slug: "pure-hing-asafoetida",
    name: "Himalayan Compounded Asafoetida / Pure Shahi Hing",
    shortName: "Pure Shahi Hing",
    categorySlug: "specialty",
    categoryName: "Specialty Pantry",
    assetStatus: "VERIFIED_CLIENT_ASSET",
    verifiedImageUrl: "/images/products/pure-hing-asafoetida.jpg",
    isTemporaryAsset: false,
    altText: "Pure Shahi Hing - Royal Gourmet Reserve",
    aspectRatio: "1:1",
    sourceNotes: "Verified high-resolution photography of pure artisanal compounded hing.",
    photographySpecs: {
      minimumResolution: "1200x1200px",
      preferredBackdrop: "Warm ivory",
      lighting: "Soft ambient lighting",
      packagingRequirement: "Small heritage seal container",
    },
  },
  "pure-lakadong-turmeric": {
    productId: "prod-spc-turmeric-31",
    slug: "pure-lakadong-turmeric",
    name: "Pure Lakadong High-Curcumin Turmeric / Haldi (7-9% Curcumin)",
    shortName: "Lakadong Haldi Turmeric",
    categorySlug: "specialty",
    categoryName: "Specialty Pantry",
    assetStatus: "VERIFIED_CLIENT_ASSET",
    verifiedImageUrl: "/images/products/pure-lakadong-turmeric.jpg",
    isTemporaryAsset: false,
    altText: "Pure Lakadong Turmeric Haldi - Royal Gourmet Reserve",
    aspectRatio: "1:1",
    sourceNotes: "Verified high-resolution photography of pure Lakadong high-curcumin turmeric root and powder.",
    photographySpecs: {
      minimumResolution: "1200x1200px",
      preferredBackdrop: "Warm ivory",
      lighting: "Vibrant daylight on deep golden-yellow powder and roots",
      packagingRequirement: "Airtight nitrogen pouch or glass jar",
    },
  },
  "methi-khakhra": {
    productId: "prod-snk-khakhra-27",
    slug: "methi-khakhra",
    name: "Artisanal Whole Wheat Methi Khakhra (Vacuum Crisps)",
    shortName: "Artisanal Methi Khakhra",
    categorySlug: "specialty",
    categoryName: "Specialty Pantry",
    assetStatus: "VERIFIED_CLIENT_ASSET",
    verifiedImageUrl: "/images/products/methi-khakhra.jpg",
    isTemporaryAsset: false,
    altText: "Artisanal Methi Khakhra - Royal Gourmet Reserve",
    aspectRatio: "1:1",
    sourceNotes: "Verified high-resolution photography of artisanal whole wheat methi khakhra crisp rounds.",
    photographySpecs: {
      minimumResolution: "1200x1200px",
      preferredBackdrop: "Warm ivory",
      lighting: "Even studio lighting on crisp golden wafer rounds",
      packagingRequirement: "Vacuum-sealed tray pack",
    },
  },
};

/**
 * Retrieve asset metadata by product slug or product ID.
 */
export function getProductAsset(slugOrId: string): ProductAssetEntry | undefined {
  if (PRODUCT_ASSET_REGISTRY[slugOrId]) {
    return PRODUCT_ASSET_REGISTRY[slugOrId];
  }
  return Object.values(PRODUCT_ASSET_REGISTRY).find(
    (entry) => entry.productId === slugOrId || entry.slug === slugOrId
  );
}

/**
 * Return all registered product assets.
 */
export function getAllProductAssets(): ProductAssetEntry[] {
  return Object.values(PRODUCT_ASSET_REGISTRY);
}

/**
 * Check if a product has an approved, authentic client asset.
 */
export function hasVerifiedAsset(slugOrId: string): boolean {
  const asset = getProductAsset(slugOrId);
  return Boolean(asset && asset.assetStatus === "VERIFIED_CLIENT_ASSET" && asset.verifiedImageUrl);
}

/**
 * List all products currently awaiting client assets.
 */
export function getPendingClientAssetSlugs(): string[] {
  return Object.values(PRODUCT_ASSET_REGISTRY)
    .filter((entry) => entry.assetStatus === "CLIENT_ASSET_PENDING")
    .map((entry) => entry.slug);
}

/**
 * List all products with verified client assets.
 */
export function getVerifiedAssetSlugs(): string[] {
  return Object.values(PRODUCT_ASSET_REGISTRY)
    .filter((entry) => entry.assetStatus === "VERIFIED_CLIENT_ASSET")
    .map((entry) => entry.slug);
}

/**
 * List all products currently utilizing curated temporary assets.
 */
export function getTemporaryAssetSlugs(): string[] {
  return Object.values(PRODUCT_ASSET_REGISTRY)
    .filter((entry) => entry.assetStatus === "CURATED_TEMPORARY_ASSET")
    .map((entry) => entry.slug);
}

/**
 * Get active image URL for a product (verified client asset, curated temporary, or product-specific placeholder).
 */
export function getProductImageUrl(slugOrId: string): string | null {
  const asset = getProductAsset(slugOrId);
  if (asset?.verifiedImageUrl) {
    return asset.verifiedImageUrl;
  }
  if (asset?.slug) {
    return `/images/products/placeholders/${asset.slug}.svg`;
  }
  return null;
}
