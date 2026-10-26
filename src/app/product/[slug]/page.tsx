import { notFound } from "next/navigation";
import { Metadata } from "next";
import { ProductService } from "@/services/product.service";
import { PDPClientView, PDPProductData } from "@/components/catalog/pdp-client-view";
import { STOREFRONT_PRODUCTS } from "@/lib/catalog/storefront-catalog";
import { PRODUCT_ASSET_REGISTRY } from "@/lib/catalog/product-asset-registry";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

const FALLBACK_PDP_PRODUCTS: Record<string, PDPProductData> = {
  "kashmiri-mamra-almonds": {
    id: "prod-mamra-01",
    name: "Kashmiri Imperial Mamra Almonds (Grade A+)",
    slug: "kashmiri-mamra-almonds",
    skuBase: "FN-ALM-MAM",
    description:
      "Handpicked from high-altitude orchard estates in Kashmir. Kashmiri Mamra is celebrated worldwide for its distinct concave boat shape, 100% natural oil retention (up to 50% natural almond oil content), and crunch. Sun-dried on mountain cedar mats and nitrogen-sealed at source to prevent oxidation. Completely free from sulfur bleaching, chemical polishes, and artificial glazing.",
    ingredients: "100% Raw Kashmiri Mamra Almond Kernels (Prunus Dulcis).",
    allergenInfo: "Contains Tree Nuts (Almonds). Processed in an allergen-controlled facility that handles walnuts, cashews, and pistachios.",
    nutritionFacts: {
      "Energy (kcal)": 590,
      "Protein (g)": 21.5,
      "Dietary Fiber (g)": 12.2,
      "Natural Healthy Fats (g)": 52.4,
      "Carbohydrates (g)": 18.7,
      "Vitamin E (mg)": 25.6,
      "Magnesium (mg)": 268,
    },
    storageInstructions: "Store in a cool, dry place away from direct sunlight. Once opened, retain in the supplied airtight nitrogen-flushed container or refrigerate below 15°C for maximum crunch and natural oil freshness.",
    shelfLifeMonths: 9,
    gstPercentage: 5,
    isFeatured: true,
    isByobEligible: true,
    category: { id: 1, name: "Dry Fruits & Royal Nuts", slug: "dry-fruits" },
    subcategory: { id: 101, name: "Imperial Almonds", slug: "almonds" },
    images: [
      {
        id: "img-mamra-1",
        imageUrl: "/images/products/kashmiri-mamra-almonds.jpg",
        altText: "Kashmiri Imperial Mamra Almonds (Grade A+) - Royal Gourmet Reserve",
        isPrimary: true,
        sortOrder: 0,
      },
    ],
    variants: [
      {
        id: "var-mamra-250",
        sku: "FN-ALM-MAM-250G",
        weightGrams: 250,
        unit: "GRAMS",
        packageType: "Airtight Nitrogen Tin",
        mrp: 1450,
        sellingPrice: 1250,
        discountPercentage: 14,
        stockStatus: "IN_STOCK",
        isAvailable: true,
      },
      {
        id: "var-mamra-500",
        sku: "FN-ALM-MAM-500G",
        weightGrams: 500,
        unit: "GRAMS",
        packageType: "Imperial Glass Jar",
        mrp: 2800,
        sellingPrice: 2400,
        discountPercentage: 14,
        stockStatus: "IN_STOCK",
        isAvailable: true,
      },
    ],
  },
  "jumbo-medjool-dates": {
    id: "prod-medjool-02",
    name: "Jordan Valley Jumbo Medjool Dates (Single Estate)",
    slug: "jumbo-medjool-dates",
    skuBase: "FN-DAT-MED",
    description:
      "King of Dates hand-harvested from single-estate groves in the Jordan Valley. Known for their luscious caramel flavor, velvety melt-in-mouth texture, and high natural fiber content. Cold-chain transported and vacuum-sealed to preserve moist decadence without added glucose or syrups.",
    ingredients: "100% Natural Medjool Dates (Phoenix dactylifera).",
    allergenInfo: "Naturally allergen-free. Packed in a facility handling tree nuts.",
    nutritionFacts: {
      "Energy (kcal)": 277,
      "Protein (g)": 1.8,
      "Dietary Fiber (g)": 6.7,
      "Natural Sugars (g)": 66.5,
      "Potassium (mg)": 696,
    },
    storageInstructions: "Refrigerate at 4°C - 8°C for optimal tenderness. Best consumed within 12 months.",
    shelfLifeMonths: 12,
    gstPercentage: 12,
    isFeatured: true,
    isByobEligible: true,
    category: { id: 2, name: "Royal Dates & Khajoor", slug: "dates" },
    subcategory: { id: 102, name: "Medjool Reserve", slug: "medjool" },
    images: [
      {
        id: "img-medjool-1",
        imageUrl: "/images/products/jumbo-medjool-dates.jpg",
        altText: "Jordan Valley Jumbo Medjool Dates (Single Estate) - Royal Gourmet Reserve",
        isPrimary: true,
        sortOrder: 0,
      },
    ],
    variants: [
      {
        id: "var-medjool-500",
        sku: "FN-DAT-MED-500G",
        weightGrams: 500,
        unit: "GRAMS",
        packageType: "Luxury Gift Box",
        mrp: 1050,
        sellingPrice: 899,
        discountPercentage: 15,
        stockStatus: "IN_STOCK",
        isAvailable: true,
      },
      {
        id: "var-medjool-1000",
        sku: "FN-DAT-MED-1KG",
        weightGrams: 1000,
        unit: "KILOGRAMS",
        packageType: "Imperial Wooden Casket",
        mrp: 2100,
        sellingPrice: 1750,
        discountPercentage: 17,
        stockStatus: "IN_STOCK",
        isAvailable: true,
      },
    ],
  },
  "king-cashews-w180": {
    id: "prod-cashew-03",
    name: "King Cashews W180 Jumbo (Goan Red Soil)",
    slug: "king-cashews-w180",
    skuBase: "FN-CSH-W180",
    description:
      "The finest Grade W180 (180 kernels per pound) giant cashews hand-selected from the nutrient-rich red-soil coastal groves of Goa. Naturally creamy, sweet, and extraordinarily large.",
    ingredients: "100% Whole Jumbo Cashew Kernels (Anacardium Occidentale).",
    allergenInfo: "Contains Tree Nuts (Cashews).",
    nutritionFacts: {
      "Energy (kcal)": 553,
      "Protein (g)": 18.2,
      "Total Fat (g)": 43.8,
      "Iron (mg)": 6.7,
      "Magnesium (mg)": 292,
    },
    storageInstructions: "Store in an airtight container in a dry, cool environment.",
    shelfLifeMonths: 6,
    gstPercentage: 5,
    isFeatured: true,
    isByobEligible: true,
    category: { id: 1, name: "Dry Fruits & Royal Nuts", slug: "dry-fruits" },
    subcategory: { id: 103, name: "King Cashews", slug: "cashews" },
    images: [
      {
        id: "img-cashew-1",
        imageUrl: "/images/products/king-cashews-w180.jpg",
        altText: "King Cashews W180 Jumbo (Goan Red Soil) - Royal Gourmet Reserve",
        isPrimary: true,
        sortOrder: 0,
      },
    ],
    variants: [
      {
        id: "var-csh-250",
        sku: "FN-CSH-W180-250G",
        weightGrams: 250,
        unit: "GRAMS",
        packageType: "Sealed Pouch",
        mrp: 750,
        sellingPrice: 650,
        discountPercentage: 13,
        stockStatus: "IN_STOCK",
        isAvailable: true,
      },
      {
        id: "var-csh-500",
        sku: "FN-CSH-W180-500G",
        weightGrams: 500,
        unit: "GRAMS",
        packageType: "Airtight Nitrogen Jar",
        mrp: 1500,
        sellingPrice: 1250,
        discountPercentage: 17,
        stockStatus: "IN_STOCK",
        isAvailable: true,
      },
    ],
  },
  "kashmiri-shahi-kahwa": {
    id: "prod-kahwa-04",
    name: "Shahi Kashmiri Saffron Kahwa (Artisanal Green Tea)",
    slug: "kashmiri-shahi-kahwa",
    skuBase: "FN-TEA-KHW",
    description:
      "Traditional Kashmiri royal blend infused with whole green tea leaves, pure saffron stigma, crushed green cardamom pods, and cinnamon bark.",
    ingredients: "Green Tea Leaves, Kashmiri Mongra Saffron, Green Cardamom, Cinnamon, Crushed Almond Slivers.",
    allergenInfo: "Contains Almond slivers.",
    nutritionFacts: {
      "Energy (kcal)": 15,
      "Antioxidants (ORAC value)": "High",
      "Total Sugars": 0,
    },
    storageInstructions: "Keep in a dark, moisture-free container.",
    shelfLifeMonths: 12,
    gstPercentage: 5,
    isFeatured: true,
    isByobEligible: true,
    category: { id: 4, name: "Artisanal Estate Teas", slug: "artisan-tea" },
    subcategory: { id: 104, name: "Herbal & Spiced", slug: "kahwa" },
    images: [
      {
        id: "img-kahwa-1",
        imageUrl: "/images/products/kashmiri-shahi-kahwa.jpg",
        altText: "Shahi Kashmiri Saffron Kahwa (Artisanal Green Tea) - Baikunth Tea Tin",
        isPrimary: true,
        sortOrder: 0,
      },
      {
        id: "img-kahwa-2",
        imageUrl: "/images/tea/tea-brewing-lifestyle.jpg",
        altText: "Artisanal Tea Brewing Ritual - Steeping Infusion",
        isPrimary: false,
        sortOrder: 1,
      },
      {
        id: "img-kahwa-3",
        imageUrl: "/images/tea/baikunth-tea-logo.jpg",
        altText: "Baikunth Taste the Divine Purity - Authentic Tea Brand Seal",
        isPrimary: false,
        sortOrder: 2,
      },
    ],
    variants: [
      {
        id: "var-khw-100",
        sku: "FN-TEA-KHW-100G",
        weightGrams: 100,
        unit: "GRAMS",
        packageType: "Gold Foil Caddy",
        mrp: 550,
        sellingPrice: 480,
        discountPercentage: 12,
        stockStatus: "IN_STOCK",
        isAvailable: true,
      },
    ],
  },
  "kashmir-snow-walnuts": {
    id: "prod-walnut-05",
    name: "Kashmir Valley Snow Walnuts (Thin Shell Kagzi)",
    slug: "kashmir-snow-walnuts",
    skuBase: "FN-WLN-KGZ",
    description:
      "100% natural Kashmir Kagzi soft-shell walnuts. Crackable by hand with light cream-colored halves, packed with brain-boosting plant Omega-3 ALA.",
    ingredients: "100% Raw Kashmiri Kagzi Walnut Kernels (Juglans Regia).",
    allergenInfo: "Contains Tree Nuts (Walnuts).",
    nutritionFacts: {
      "Energy (kcal)": 654,
      "Protein (g)": 15.2,
      "Plant Omega-3 (ALA) (g)": 9.1,
      "Total Fat (g)": 65.2,
    },
    storageInstructions: "Refrigerate in an airtight container.",
    shelfLifeMonths: 9,
    gstPercentage: 5,
    isFeatured: false,
    isByobEligible: true,
    category: { id: 1, name: "Dry Fruits & Royal Nuts", slug: "dry-fruits" },
    subcategory: { id: 105, name: "Kagzi Walnuts", slug: "walnuts" },
    images: [
      {
        id: "img-walnut-1",
        imageUrl: "/images/products/kashmir-snow-walnuts.jpg",
        altText: "Kashmir Valley Snow Walnuts (Thin Shell Kagzi) - Royal Gourmet Reserve",
        isPrimary: true,
        sortOrder: 0,
      },
    ],
    variants: [
      {
        id: "var-wln-250",
        sku: "FN-WLN-KGZ-250G",
        weightGrams: 250,
        unit: "GRAMS",
        packageType: "Nitrogen Sealed Bag",
        mrp: 900,
        sellingPrice: 780,
        discountPercentage: 13,
        stockStatus: "IN_STOCK",
        isAvailable: true,
      },
    ],
  },
  "wild-berries-reserve": {
    id: "prod-berries-06",
    name: "Wild Dried Cranberries & Blueberries Reserve",
    slug: "wild-berries-reserve",
    skuBase: "FN-BER-MIX",
    description:
      "Plump, tangy, sun-infused whole wild berries. Rich in anthocyanins and natural vitamin C.",
    ingredients: "Dried Cranberries, Dried Whole Blueberries, Cold-Pressed Sunflower Oil.",
    allergenInfo: "Packed in a facility that handles tree nuts.",
    nutritionFacts: {
      "Energy (kcal)": 325,
      "Carbohydrates (g)": 78,
      "Dietary Fiber (g)": 5.8,
      "Vitamin C (mg)": 18,
    },
    storageInstructions: "Store in a cool dry pantry.",
    shelfLifeMonths: 12,
    gstPercentage: 12,
    isFeatured: false,
    isByobEligible: true,
    category: { id: 3, name: "Super Seeds & Berries", slug: "super-seeds" },
    subcategory: { id: 106, name: "Antioxidant Berries", slug: "berries" },
    images: [
      {
        id: "img-berries-1",
        imageUrl: "/images/products/wild-berries-reserve.jpg",
        altText: "Wild Dried Cranberries & Blueberries Reserve - Royal Gourmet Reserve",
        isPrimary: true,
        sortOrder: 0,
      },
    ],
    variants: [
      {
        id: "var-ber-250",
        sku: "FN-BER-MIX-250G",
        weightGrams: 250,
        unit: "GRAMS",
        packageType: "Resealable Pouch",
        mrp: 600,
        sellingPrice: 520,
        discountPercentage: 13,
        stockStatus: "IN_STOCK",
        isAvailable: true,
      },
    ],
  },
  "chocolate-almond-dragees": {
    id: "prod-choc-07",
    name: "Dark Belgian Chocolate Almond Dragées",
    slug: "chocolate-almond-dragees",
    skuBase: "FN-CHC-DRG",
    description:
      "Slow-roasted California and Kashmiri almonds double-enrobed in 70% dark Belgian couverture chocolate. Finished with an artisan gloss and delicate mineral sea salt dusting.",
    ingredients: "Dark Couverture Chocolate (Cocoa Solids, Cocoa Butter, Raw Cane Sugar, Soy Lecithin), Roasted Almonds, Cocoa Powder.",
    allergenInfo: "Contains Tree Nuts (Almonds), Soy. Made in a facility processing dairy.",
    nutritionFacts: {
      "Energy (kcal)": 540,
      "Protein (g)": 10.5,
      "Total Fat (g)": 38.2,
      "Carbohydrates (g)": 44.1,
    },
    storageInstructions: "Store between 15°C - 20°C in a dry environment away from heat sources.",
    shelfLifeMonths: 6,
    gstPercentage: 18,
    isFeatured: true,
    isByobEligible: true,
    category: { id: 5, name: "Gourmet Chocolates", slug: "chocolates" },
    subcategory: { id: 107, name: "Chocolate Dragées", slug: "dragees" },
    images: [
      {
        id: "img-choc-1",
        imageUrl: "/images/products/chocolate-almond-dragees.jpg",
        altText: "Dark Belgian Chocolate Almond Dragées - Royal Gourmet Reserve",
        isPrimary: true,
        sortOrder: 0,
      },
    ],
    variants: [
      {
        id: "var-choc-200",
        sku: "FN-CHC-DRG-200G",
        weightGrams: 200,
        unit: "GRAMS",
        packageType: "Gold Embossed Ballotin Box",
        mrp: 750,
        sellingPrice: 650,
        discountPercentage: 13,
        stockStatus: "IN_STOCK",
        isAvailable: true,
      },
    ],
  },
  "shahi-paan-mukhwas": {
    id: "prod-paan-08",
    name: "Heritage Shahi Paan Digestive Mukhwas (Tobacco-Free)",
    slug: "shahi-paan-mukhwas",
    skuBase: "FN-PAN-MKH",
    description:
      "Royal Mughal post-meal digestive mukhwas crafted from sun-cured betel leaves, hand-churned Damask rose gulkand, fennel seeds, dry dates, and silver vark pearls. 100% tobacco and supari free.",
    ingredients: "Betel Leaves (Paan Patta), Rose Gulkand, Lucknowi Fennel Seeds, Saffron, Cardamom, Edible Silver Leaf (Vark).",
    allergenInfo: "May contain trace tree nuts and sesame.",
    nutritionFacts: {
      "Energy (kcal)": 310,
      "Dietary Fiber (g)": 8.4,
      "Iron (mg)": 3.8,
    },
    storageInstructions: "Keep sealed in an airtight glass container at room temperature.",
    shelfLifeMonths: 12,
    gstPercentage: 5,
    isFeatured: false,
    isByobEligible: true,
    category: { id: 7, name: "Royal Mouth Fresheners", slug: "mouth-fresheners" },
    subcategory: { id: 108, name: "Digestive Mukhwas", slug: "mukhwas" },
    images: [
      {
        id: "img-paan-1",
        imageUrl: "/images/products/shahi-paan-mukhwas.jpg",
        altText: "Heritage Shahi Paan Digestive Mukhwas (Tobacco-Free) - Royal Gourmet Reserve",
        isPrimary: true,
        sortOrder: 0,
      },
      {
        id: "img-paan-2",
        imageUrl: "/images/products/shahi-paan-mukhwas-2.jpg",
        altText: "Heritage Shahi Paan Digestive Mukhwas - Meetha Paan Jar",
        isPrimary: false,
        sortOrder: 1,
      },
      {
        id: "img-paan-3",
        imageUrl: "/images/products/meetha-paan.jpg",
        altText: "Heritage Shahi Paan Digestive Mukhwas - Fruits & Nuts Meetha Paan Packshot",
        isPrimary: false,
        sortOrder: 2,
      },
      {
        id: "img-paan-4",
        imageUrl: "/images/products/dry-paan.jpg",
        altText: "Heritage Shahi Paan Digestive Mukhwas - Fruits & Nuts Dry Paan Packshot",
        isPrimary: false,
        sortOrder: 3,
      },
    ],
    variants: [
      {
        id: "var-paan-200",
        sku: "FN-PAN-MKH-200G",
        weightGrams: 200,
        unit: "GRAMS",
        packageType: "Heritage Glass Vial",
        mrp: 450,
        sellingPrice: 380,
        discountPercentage: 15,
        stockStatus: "IN_STOCK",
        isAvailable: true,
      },
    ],
  },
  "desi-ghee": {
    id: "prod-ghee-20",
    name: "Vedic Bilona A2 Desi Cow Ghee",
    slug: "desi-ghee",
    skuBase: "FN-DESI-GHE",
    description:
      "Traditional Bilona churned A2 Desi Cow Ghee prepared from pure whole curd of grass-fed Gir cows. Rich, granular danedar texture with high smoke point and authentic Vedic aroma.",
    ingredients: "100% Pure Vedic A2 Gir Cow Ghee (Bilona Churned Milk Fat).",
    allergenInfo: "Contains Milk Fat / Clarified Butter.",
    nutritionFacts: {
      "Energy (kcal)": 897,
      "Total Fat (g)": 99.7,
      "Saturated Fat (g)": 65,
      "Cholesterol (mg)": 256,
    },
    storageInstructions: "Store in a cool dry place. Does not require refrigeration. Keep away from direct sunlight.",
    shelfLifeMonths: 12,
    gstPercentage: 12,
    isFeatured: true,
    isByobEligible: true,
    category: { id: 7, name: "Pantry & Vedic Ghee", slug: "pantry" },
    subcategory: { id: 110, name: "Desi Cow Ghee", slug: "desi-ghee" },
    images: [
      {
        id: "img-ghee-1",
        imageUrl: "/images/products/desi-ghee.jpg",
        altText: "Vedic Bilona A2 Desi Cow Ghee - Baikunth Gir Cow Ghee Packshot",
        isPrimary: true,
        sortOrder: 0,
      },
    ],
    variants: [
      {
        id: "var-ghe-500",
        sku: "FN-GHE-500ML",
        weightGrams: 500,
        unit: "GRAMS",
        packageType: "Glass Jar",
        mrp: 850,
        sellingPrice: 750,
        discountPercentage: 12,
        stockStatus: "IN_STOCK",
        isAvailable: true,
      },
      {
        id: "var-ghe-1000",
        sku: "FN-GHE-1L",
        weightGrams: 1000,
        unit: "GRAMS",
        packageType: "Glass Jar",
        mrp: 1600,
        sellingPrice: 1400,
        discountPercentage: 13,
        stockStatus: "IN_STOCK",
        isAvailable: true,
      },
    ],
  },
  "dates-bites": {
    id: "prod-bites-dates-22",
    name: "Medjool Date & Dryfruit Bites Gift Pack",
    slug: "dates-bites",
    skuBase: "FN-DATES-BI",
    description:
      "Handcrafted luxury date magic bites made with luscious Medjool dates, cashew nut crunch, and natural pistachios. 100% natural, refined sugar-free energy confection.",
    ingredients: "Natural Dried Dates, Cashews, Almonds, Pistachios, Cardamom.",
    allergenInfo: "Contains Tree Nuts (Cashews, Almonds, Pistachios).",
    nutritionFacts: {
      "Energy (kcal)": 412,
      "Protein (g)": 8.5,
      "Dietary Fiber (g)": 7.2,
      "Natural Sugars (g)": 52.0,
    },
    storageInstructions: "Store in a cool, dry place. Keep container tightly closed.",
    shelfLifeMonths: 6,
    gstPercentage: 5,
    isFeatured: true,
    isByobEligible: true,
    category: { id: 6, name: "Gourmet Bites & Confections", slug: "chocolates" },
    subcategory: { id: 109, name: "Date Bites", slug: "bites" },
    images: [
      {
        id: "img-dates-bites-1",
        imageUrl: "/images/products/dates-bites.jpg",
        altText: "Medjool Date & Dryfruit Bites Gift Pack - Dry Fruit Date Magic Packshot",
        isPrimary: true,
        sortOrder: 0,
      },
    ],
    variants: [
      {
        id: "var-dtb-250",
        sku: "FN-BIT-DTB-250",
        weightGrams: 250,
        unit: "GRAMS",
        packageType: "Royal Gift Box",
        mrp: 350,
        sellingPrice: 300,
        discountPercentage: 14,
        stockStatus: "IN_STOCK",
        isAvailable: true,
      },
      {
        id: "var-dtb-500",
        sku: "FN-BIT-DTB-500",
        weightGrams: 500,
        unit: "GRAMS",
        packageType: "Royal Gift Box",
        mrp: 670,
        sellingPrice: 575,
        discountPercentage: 14,
        stockStatus: "IN_STOCK",
        isAvailable: true,
      },
    ],
  },
  "pista-salted": {
    id: "prod-pista-28",
    name: "Iranian Jumbo Roasted Salted Pistachios",
    slug: "pista-salted",
    skuBase: "FN-PST-SLT",
    description:
      "Giant Iranian round pistachios slow-roasted to an open-mouthed crunch and delicately sprinkled with pure mineral pink salt. High in healthy fats, protein, and dietary potassium.",
    ingredients: "100% Whole In-Shell Roasted Pistachios (Pistacia vera), Pink Himalayan Rock Salt.",
    allergenInfo: "Contains Tree Nuts (Pistachios).",
    nutritionFacts: {
      "Energy (kcal)": 562,
      "Protein (g)": 20.2,
      "Dietary Fiber (g)": 10.3,
      "Total Fat (g)": 45.3,
    },
    storageInstructions: "Store in an airtight container to preserve crispness.",
    shelfLifeMonths: 9,
    gstPercentage: 5,
    isFeatured: true,
    isByobEligible: true,
    category: { id: 1, name: "Dry Fruits & Royal Nuts", slug: "dry-fruits" },
    subcategory: { id: 103, name: "Pistachios", slug: "pistachios" },
    images: [
      {
        id: "img-pista-1",
        imageUrl: "/images/products/pista-salted.jpg",
        altText: "Iranian Jumbo Roasted Salted Pistachios - Royal Gourmet Reserve",
        isPrimary: true,
        sortOrder: 0,
      },
    ],
    variants: [
      {
        id: "var-pst-250",
        sku: "FN-PST-250",
        weightGrams: 250,
        unit: "GRAMS",
        packageType: "Nitrogen Pouch",
        mrp: 460,
        sellingPrice: 400,
        discountPercentage: 13,
        stockStatus: "IN_STOCK",
        isAvailable: true,
      },
      {
        id: "var-pst-500",
        sku: "FN-PST-500",
        weightGrams: 500,
        unit: "GRAMS",
        packageType: "Nitrogen Pouch",
        mrp: 880,
        sellingPrice: 760,
        discountPercentage: 14,
        stockStatus: "IN_STOCK",
        isAvailable: true,
      },
    ],
  },
  "anjeer-bites": {
    id: "prod-bites-anjeer-21",
    name: "Sugar-Free Royal Anjeer Fig Bites",
    slug: "anjeer-bites",
    skuBase: "FN-BIT-ANJ",
    description:
      "Artisanal sugar-free bites crafted from premium dried Himalayan figs, roasted whole cashews, almonds, and pistachios. Wholesome gourmet sweet with natural crunch.",
    ingredients: "Dried Figs (Anjeer), Almonds, Cashews, Pistachios, Cardamom.",
    allergenInfo: "Contains Tree Nuts (Almonds, Cashews, Pistachios).",
    nutritionFacts: {
      "Energy (kcal)": 395,
      "Protein (g)": 7.8,
      "Dietary Fiber (g)": 8.1,
      "Total Fat (g)": 18.4,
    },
    storageInstructions: "Store in a cool dry place.",
    shelfLifeMonths: 6,
    gstPercentage: 5,
    isFeatured: true,
    isByobEligible: true,
    category: { id: 6, name: "Gourmet Bites & Confections", slug: "chocolates" },
    subcategory: { id: 109, name: "Fig Bites", slug: "bites" },
    images: [
      {
        id: "img-anjeer-1",
        imageUrl: "/images/products/anjeer-bites.jpg",
        altText: "Sugar-Free Royal Anjeer Fig Bites - Royal Gourmet Reserve",
        isPrimary: true,
        sortOrder: 0,
      },
    ],
    variants: [
      {
        id: "var-anj-250",
        sku: "FN-BIT-ANJ-250",
        weightGrams: 250,
        unit: "GRAMS",
        packageType: "Royal Gift Box",
        mrp: 300,
        sellingPrice: 260,
        discountPercentage: 13,
        stockStatus: "IN_STOCK",
        isAvailable: true,
      },
      {
        id: "var-anj-500",
        sku: "FN-BIT-ANJ-500",
        weightGrams: 500,
        unit: "GRAMS",
        packageType: "Royal Gift Box",
        mrp: 575,
        sellingPrice: 490,
        discountPercentage: 15,
        stockStatus: "IN_STOCK",
        isAvailable: true,
      },
    ],
  },
};

function getFallbackPDPProduct(slug: string): PDPProductData | null {
  if (FALLBACK_PDP_PRODUCTS[slug]) {
    return FALLBACK_PDP_PRODUCTS[slug];
  }

  const sf = STOREFRONT_PRODUCTS.find((p) => p.slug === slug);
  if (!sf) return null;

  const asset = PRODUCT_ASSET_REGISTRY[slug];
  const isTea = sf.collectionGroup === "tea";
  const isSeed = sf.collectionGroup === "seeds";
  const isGhee = sf.slug === "desi-ghee";

  return {
    id: sf.id,
    name: sf.name,
    slug: sf.slug,
    skuBase: `FN-${sf.slug.toUpperCase().slice(0, 8)}`,
    description: asset?.sourceNotes
      ? `${sf.name}. Handpicked and freshly packed at source for the M/S Fruits & Nuts Royal Reserve. Single-origin terroir authenticity with guaranteed natural flavor and peak freshness.`
      : `${sf.name} sourced directly from pristine regional estates. Hand-graded and sealed at origin to preserve peak aroma, flavor, and crunch.`,
    ingredients: isTea
      ? "Selected High-Grown Tea Leaves & Natural Whole Indian Spices."
      : isGhee
      ? "100% Pure Vedic A2 Desi Cow Ghee (Traditional Bilona Churned)."
      : `100% Pure Natural ${sf.name}.`,
    allergenInfo: isTea
      ? "Naturally allergen free. Blended in a dedicated spice and tea facility."
      : "Packed in an allergen-controlled facility handling tree nuts.",
    nutritionFacts: isTea
      ? { "Energy (kcal)": "0-2 per cup", "Caffeine (mg)": "30-50", "Antioxidants": "High Polyphenols" }
      : isGhee
      ? { "Energy (kcal)": 897, "Total Fat (g)": 99.7, "Saturated Fat (g)": 65, "Cholesterol (mg)": 256 }
      : isSeed
      ? { "Energy (kcal)": 486, "Protein (g)": 16.5, "Dietary Fiber (g)": 34.4, "Omega-3 (g)": 17.8 }
      : { "Energy (kcal)": 580, "Protein (g)": 20.0, "Dietary Fiber (g)": 10.5, "Healthy Fats (g)": 48.0 },
    storageInstructions: isTea
      ? "Store in an airtight container in a cool, dry pantry away from spices and sunlight."
      : isGhee
      ? "Store in a dry place at room temperature. Does not require refrigeration."
      : "Store in a cool, dry place. Keep airtight to retain peak freshness and crunch.",
    shelfLifeMonths: isTea ? 12 : isGhee ? 12 : 9,
    gstPercentage: 5,
    isFeatured: !!sf.isBestseller,
    isByobEligible: true,
    category: {
      id: 10,
      name: sf.category?.name || "Royal Harvest",
      slug: sf.category?.slug || "all",
    },
    images: [
      {
        id: `img-${sf.slug}-1`,
        imageUrl: sf.primaryImage?.imageUrl || "",
        altText: sf.name,
        isPrimary: true,
        sortOrder: 0,
      },
      ...(isTea
        ? [
            {
              id: `img-${sf.slug}-2`,
              imageUrl: "/images/tea/tea-brewing-lifestyle.jpg",
              altText: `${sf.name} - Artisanal Tea Brewing Ritual`,
              isPrimary: false,
              sortOrder: 1,
            },
            {
              id: `img-${sf.slug}-3`,
              imageUrl: "/images/tea/baikunth-tea-logo.jpg",
              altText: `${sf.name} - Baikunth Tea Brand Quality Seal`,
              isPrimary: false,
              sortOrder: 2,
            },
          ]
        : []),
    ],
    variants: (sf.variants || []).map((v) => ({
      id: v.id,
      sku: v.sku,
      weightGrams: v.weightGrams,
      unit: v.unit,
      packageType: isTea ? "Airtight Tea Caddy" : isGhee ? "Glass Jar" : "Nitrogen Tin",
      mrp: v.mrp,
      sellingPrice: v.sellingPrice,
      discountPercentage: v.discountPercentage || 0,
      stockStatus: "IN_STOCK",
      isAvailable: true,
    })),
  };
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const canonicalUrl = `https://www.fruitsandnuts.co.in/product/${slug}`;

  let name = "";
  let description = "";
  let imageUrl = "";

  try {
    const product = await ProductService.getProductBySlug(slug);
    name = product.name;
    description = product.metaDescription || product.description;
    imageUrl = product.images?.[0]?.imageUrl || "";
  } catch {
    const fallback = getFallbackPDPProduct(slug);
    if (fallback) {
      name = fallback.name;
      description = fallback.description;
      imageUrl = fallback.images?.[0]?.imageUrl || "";
    }
  }

  if (!name) {
    return {
      title: "Product Detail | M/S Fruits & Nuts",
    };
  }

  const fullImageUrl = imageUrl?.startsWith("http")
    ? imageUrl
    : `https://www.fruitsandnuts.co.in${imageUrl}`;

  return {
    title: `${name} | M/S Fruits & Nuts`,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${name} | M/S Fruits & Nuts`,
      description,
      url: canonicalUrl,
      siteName: "M/S Fruits & Nuts",
      locale: "en_IN",
      type: "website",
      images: imageUrl
        ? [
            {
              url: fullImageUrl,
              width: 1200,
              height: 1200,
              alt: name,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} | M/S Fruits & Nuts`,
      description,
      images: imageUrl ? [fullImageUrl] : undefined,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  let productData: PDPProductData | null = null;

  try {
    const product = await ProductService.getProductBySlug(slug);
    productData = product as any;
  } catch {
    const fallback = getFallbackPDPProduct(slug);
    if (fallback) {
      productData = fallback;
    }
  }

  if (!productData) {
    notFound();
  }

  const canonicalUrl = `https://www.fruitsandnuts.co.in/product/${slug}`;
  const images =
    productData.images?.map((img) =>
      img.imageUrl.startsWith("http")
        ? img.imageUrl
        : `https://www.fruitsandnuts.co.in${img.imageUrl}`
    ) || [];

  const minPrice =
    productData.variants && productData.variants.length > 0
      ? Math.min(...productData.variants.map((v) => v.sellingPrice))
      : 0;
  const maxPrice =
    productData.variants && productData.variants.length > 0
      ? Math.max(...productData.variants.map((v) => v.sellingPrice))
      : 0;
  const hasInStock = productData.variants?.some(
    (v) => v.stockStatus === "IN_STOCK" || v.isAvailable
  );

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: productData.name,
    image: images,
    description: productData.description,
    sku: productData.skuBase || productData.variants?.[0]?.sku || slug,
    brand: {
      "@type": "Brand",
      name: "M/S Fruits & Nuts",
    },
    offers: {
      "@type": "AggregateOffer",
      url: canonicalUrl,
      priceCurrency: "INR",
      lowPrice: minPrice,
      highPrice: maxPrice,
      offerCount: productData.variants?.length || 1,
      availability: hasInStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: "M/S Fruits & Nuts",
      },
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://www.fruitsandnuts.co.in",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Catalogue",
        item: "https://www.fruitsandnuts.co.in/shop",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: productData.category?.name || "Dry Fruits",
        item: `https://www.fruitsandnuts.co.in/category/${productData.category?.slug || "dry-fruits"}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: productData.name,
        item: canonicalUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <PDPClientView product={productData} />
    </>
  );
}
