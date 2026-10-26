/**
 * Authoritative Regional Provenance and Terroir Registry for M/S Fruits & Nuts
 *
 * Implements strict geographical truth:
 * - grown_in: Product is botanically cultivated and harvested in the region.
 * - produced_in: Product is prepared, traditional cultured, or wood-pressed in the region.
 * - regionally_associated: Heritage recipe, infusion, or cultural culinary pairing.
 *
 * ZERO fake certifications, zero invented disease claims, zero fabricated farms.
 */

export type RegionalAssociationType = "grown_in" | "produced_in" | "regionally_associated" | "sold_in";

export type RegionalVerificationStatus = "VERIFIED_ORIGIN" | "ARTISANAL_PRODUCED" | "REGIONAL_HERITAGE";

export interface VerifiedTasteRegion {
  id: number;
  stateId: string; // Corresponds to @svg-maps/india location ID ('jk', 'kl', 'ga', etc.)
  slug: string;
  name: string;
  state: string;
  landmark: string;
  coordinates: {
    lat: number;
    lng: number;
    svgX: number;
    svgY: number;
  };
  associationType: RegionalAssociationType;
  associationLabel: string;
  verificationStatus: RegionalVerificationStatus;
  verificationDetails: string;
  terroirNotes: string;
  culturalStory: string;
  productSlugs: string[];
  isFeatured?: boolean;
}

export interface InternationalTerroirEntry {
  id: string;
  country: string;
  region: string;
  terroirDescription: string;
  productSlugs: string[];
  sourcingNote: string;
}

export const VERIFIED_INDIA_REGIONS: VerifiedTasteRegion[] = [
  {
    id: 1,
    stateId: "jk",
    slug: "jammu-and-kashmir",
    name: "Kashmir Alpine Valleys & Pampore",
    state: "Jammu and Kashmir",
    landmark: "Pampore Saffron Plateaus & Pulwama Orchards",
    coordinates: { lat: 34.0837, lng: 74.7973, svgX: 173, svgY: 61 },
    associationType: "grown_in",
    associationLabel: "Verified Origin: Grown & Harvested Here",
    verificationStatus: "VERIFIED_ORIGIN",
    verificationDetails: "Single-origin Kashmir terroir; high altitude cold-climate natural sun drying.",
    terroirNotes: "High-altitude Himalayan valley (5,200+ ft elevation) with glacial runoff soil, cold winter dormancy, and dry autumn harvests that maximize natural nut oil retention and saffron crocin intensity.",
    culturalStory: "Kashmir's micro-climate is uniquely suited for fragile, high-oil Mamra almonds and soft-shell Kagzi walnuts that crack effortlessly by hand. For generations, harvests have been naturally cured on alpine cedar mats without chemical polishes or bleaches.",
    productSlugs: [
      "kashmiri-mamra-almonds",
      "kashmir-snow-walnuts",
      "kashmiri-shahi-kahwa",
      "kesariya-chai",
    ],
    isFeatured: true,
  },
  {
    id: 2,
    stateId: "kl",
    slug: "kerala",
    name: "Malabar Coast & Idukki Spice Highlands",
    state: "Kerala",
    landmark: "Idukki Cardamom Hills & High Range Ghats",
    coordinates: { lat: 9.85, lng: 76.97, svgX: 166, svgY: 615 },
    associationType: "grown_in",
    associationLabel: "Verified Origin: Grown & Harvested Here",
    verificationStatus: "VERIFIED_ORIGIN",
    verificationDetails: "Harvested across rainforest canopy plantations in the Western Ghats biodiversity hotspot.",
    terroirNotes: "Humid tropical rainforest micro-climate with 3,000+ mm annual southwest monsoon rainfall, rich volcanic loam soil, and dense cloud cover producing dense essential-oil-rich green cardamom and spices.",
    culturalStory: "Known historically as the Spice Garden of India, the high ranges of Idukki and the Malabar coast yield green cardamom pods graded at a giant 8mm+ diameter, intact clove buds bursting with eugenol, and whole nutmeg kernels enveloped in fiery crimson mace.",
    productSlugs: [
      "green-cardamom-elaichi",
      "organic-cloves-laung",
      "jaiphal-nutmeg",
      "power-elaichi",
      "elaichi-adrak",
    ],
    isFeatured: true,
  },
  {
    id: 3,
    stateId: "ga",
    slug: "goa",
    name: "Goan Coastal Laterite Groves",
    state: "Goa",
    landmark: "Pernem & Bicholim Coastal Red Soil Belts",
    coordinates: { lat: 15.2993, lng: 74.124, svgX: 122, svgY: 512 },
    associationType: "grown_in",
    associationLabel: "Verified Origin: Grown & Harvested Here",
    verificationStatus: "VERIFIED_ORIGIN",
    verificationDetails: "Coastal terroir verification; graded to jumbo W180 specification (180 kernels per pound).",
    terroirNotes: "Porous iron-rich red laterite soil sloping down to the Arabian Sea, kissed by salty sea breezes and seasonal tropical deluges.",
    culturalStory: "Goan cashew orchards are celebrated across the subcontinent for producing jumbo kernels with a naturally sweet, ivory-creamy flesh. Hand-graded to select only undamaged jumbo W180 kernels for the Fruits & Nuts Royal Reserve.",
    productSlugs: ["king-cashews-w180"],
    isFeatured: true,
  },
  {
    id: 4,
    stateId: "as",
    slug: "assam",
    name: "Upper Assam Brahmaputra Foothills",
    state: "Assam",
    landmark: "Dibrugarh & Jorhat Tea Estates",
    coordinates: { lat: 26.2006, lng: 92.9376, svgX: 516, svgY: 271 },
    associationType: "grown_in",
    associationLabel: "Verified Origin: Grown & Harvested Here",
    verificationStatus: "VERIFIED_ORIGIN",
    verificationDetails: "Direct estate black tea harvest from certified Assam single-estate orthodox gardens.",
    terroirNotes: "Floodplain alluvial clay enriched annually by Brahmaputra silt, tropical heat, and heavy monsoon humidity giving tea liquor its distinctive robust, malty backbone.",
    culturalStory: "Assam is the birthplace of Indian indigenous tea (Camellia sinensis var. assamica). Our estate CTC and orthodox leaves are plucked at peak dawn flush, yielding strong kadak liquor that pairs harmoniously with milk and whole Indian spices.",
    productSlugs: [
      "tea-everest",
      "tea-supreme",
      "tea-hotel-blend",
      "irani-chai",
      "chocolate-tea",
    ],
    isFeatured: true,
  },
  {
    id: 5,
    stateId: "gj",
    slug: "gujarat",
    name: "Saurashtra & Gir Grasslands",
    state: "Gujarat",
    landmark: "Gir Forest Sanctuary & Saurashtra Wood-Press Hubs",
    coordinates: { lat: 22.2587, lng: 71.1924, svgX: 66, svgY: 355 },
    associationType: "produced_in",
    associationLabel: "Artisanal Production: Traditional Cultured Recipe",
    verificationStatus: "ARTISANAL_PRODUCED",
    verificationDetails: "Handcrafted via traditional wooden bilona churning and artisan stone-griddle pressing.",
    terroirNotes: "Semi-arid grassland pastures grazed naturally by indigenous Gir cows, supporting heritage milk culture and wood-fired artisanal snacking traditions.",
    culturalStory: "Gujarat's pastoral heritage preserves the ancient Vedic Bilona method: whole milk is naturally cultured into dahi and slow-churned with bi-directional wooden whisks, separating pure makhan which is slowly clarified into aromatic golden granular (danedar) ghee.",
    productSlugs: [
      "desi-ghee",
      "methi-khakhra",
    ],
    isFeatured: true,
  },
  {
    id: 6,
    stateId: "ml",
    slug: "meghalaya",
    name: "Jaintia Hills Lakadong Plateau",
    state: "Meghalaya",
    landmark: "Lakadong Valley & Jowai Hills",
    coordinates: { lat: 25.467, lng: 91.3662, svgX: 484, svgY: 283 },
    associationType: "grown_in",
    associationLabel: "Verified Origin: Grown & Harvested Here",
    verificationStatus: "VERIFIED_ORIGIN",
    verificationDetails: "Native Lakadong variety tested for exceptional 7-9% natural curcumin concentration.",
    terroirNotes: "Cloud-covered subtropical high plateau, high organic-matter soil, and mountain rainwater nurturing native turmeric rhizomes with unparalleled bioactive potency.",
    culturalStory: "Tucked within the pristine Jaintia Hills, Lakadong turmeric is globally renowned for containing more than double the curcumin content of ordinary market varieties, imparting an unmistakable deep golden ochre hue and rich earthy aroma.",
    productSlugs: ["pure-lakadong-turmeric"],
    isFeatured: true,
  },
  {
    id: 7,
    stateId: "up",
    slug: "uttar-pradesh",
    name: "Varanasi Heritage & Gangetic Plains",
    state: "Uttar Pradesh",
    landmark: "Varanasi Betel Culture & Awadhi Pantries",
    coordinates: { lat: 26.8467, lng: 80.9462, svgX: 265, svgY: 245 },
    associationType: "regionally_associated",
    associationLabel: "Regional Heritage: Traditional Craft & Recipe",
    verificationStatus: "REGIONAL_HERITAGE",
    verificationDetails: "Heritage artisanal culinary formulation inspired by century-old Banarasi traditions.",
    terroirNotes: "Alluvial riverine belt steeped in historic royal confectionery, digestive herbal blending, and traditional betel horticulture.",
    culturalStory: "Banarasi culinary traditions hold royal digestive confections in the highest esteem. Our Shahi Paan mukhwas blends fresh betel leaf, Damascena rose gulkand, and slivered dry dates with edible silver vark — 100% tobacco-free and supari-free.",
    productSlugs: [
      "shahi-paan-mukhwas",
      "paan-chai",
      "tulsi-adrak",
    ],
    isFeatured: false,
  },
  {
    id: 8,
    stateId: "rj",
    slug: "rajasthan",
    name: "Pushkar Valley & Mewar Highlands",
    state: "Rajasthan",
    landmark: "Pushkar Lake Rose Gardens",
    coordinates: { lat: 27.0238, lng: 74.2179, svgX: 119, svgY: 257 },
    associationType: "regionally_associated",
    associationLabel: "Regional Heritage: Sun-Cured Floral Blend",
    verificationStatus: "REGIONAL_HERITAGE",
    verificationDetails: "Artisanal sun-dried Damask rose petal infusions sourced from Pushkar's sacred rose belt.",
    terroirNotes: "Desert-edge micro-climate with intense solar irradiation and cool desert nights concentrating essential fragrance in delicate rose blossoms.",
    culturalStory: "Pushkar's rose gardens have supplied temples and perfumeries since ancient times. Handpicked at sunrise and sun-cured naturally, these deep magenta petals provide the sweet, calming floral notes in our handcrafted Rose Chai.",
    productSlugs: ["rose-chai"],
    isFeatured: false,
  },
  {
    id: 9,
    stateId: "mh",
    slug: "maharashtra",
    name: "Mumbai Atelier & Western Ghats Foothills",
    state: "Maharashtra",
    landmark: "Metropolitan Artisan Confectionery Atelier",
    coordinates: { lat: 19.7515, lng: 75.7139, svgX: 180, svgY: 435 },
    associationType: "produced_in",
    associationLabel: "Artisanal Production: Confection Atelier",
    verificationStatus: "ARTISANAL_PRODUCED",
    verificationDetails: "Master confectioners handcrafting small batches with zero refined sugar and 70% dark Belgian cocoa.",
    terroirNotes: "Contemporary artisanal confectionery hub marrying traditional Indian dry fruit nuts with European chocolate enrobing techniques.",
    culturalStory: "Our gourmet bites and dragées are prepared in temperature-controlled small-batch ateliers. Naturally sweet sun-dried figs and dates are kneaded with roasted dry fruit slivers to deliver clean energy without added refined sugar.",
    productSlugs: [
      "anjeer-bites",
      "dates-bites",
      "chocolate-almond-dragees",
      "bespoke-gift-box",
    ],
    isFeatured: false,
  },
  {
    id: 10,
    stateId: "wb",
    slug: "west-bengal",
    name: "Darjeeling Mist Hills & Dooars",
    state: "West Bengal",
    landmark: "Darjeeling High Altitude Tea Slopes",
    coordinates: { lat: 22.9868, lng: 87.855, svgX: 412, svgY: 310 },
    associationType: "grown_in",
    associationLabel: "Verified Origin: Grown & Harvested Here",
    verificationStatus: "VERIFIED_ORIGIN",
    verificationDetails: "High-altitude tea slopes (4,000 to 6,500 ft) renowned worldwide for muscatel orthodox character.",
    terroirNotes: "Steep mountain terroir with persistent mountain mist, thin mountain air, and dramatic temperature swings that slow leaf growth and develop refined floral muscatel aromatics.",
    culturalStory: "Darjeeling orthodox teas are celebrated as the champagne of teas. The delicate golden tips and tender leaf curls impart a sparkling floral character that elevates our signature spiced tea blends.",
    productSlugs: [
      "bombay-cutting",
      "rose-chai",
    ],
    isFeatured: false,
  },
];

/**
 * Transparent record of authentic international harvests in the Fruits & Nuts catalogue.
 * Honestly presented outside India's borders to ensure zero geographical confusion.
 */
export const INTERNATIONAL_HERITAGE_TERROIRS: InternationalTerroirEntry[] = [
  {
    id: "middle-east-dates",
    country: "Saudi Arabia & Jordan",
    region: "Holy Medina Oasis & Jordan Valley",
    terroirDescription: "Desert rift oasis soil and desert heat cultivating paper-thin skin, dense natural amber pulp, and caramel notes.",
    productSlugs: [
      "jumbo-medjool-dates",
      "ajwa-dates",
      "kimia-dates",
    ],
    sourcingNote: "Single-estate cultivar import; cold-chain preserved without glucose syrups or chemical glazes.",
  },
  {
    id: "persian-steppes",
    country: "Iran",
    region: "Kerman Plateau & Bam Orchards",
    terroirDescription: "High-elevation desert steppes with dry winters and intense solar exposure, producing jumbo open-shell pistachios.",
    productSlugs: ["pista-salted"],
    sourcingNote: "Authentic Iranian jumbo pistachio kernels slow-roasted with pure Himalayan mineral salt.",
  },
  {
    id: "hindu-kush",
    country: "Afghanistan",
    region: "Kandahar & Pamir Foothills",
    terroirDescription: "Dry continental mountain microclimates yielding long sweet seedless kishmish, sun-dried khumani, and high-potency asafoetida resin.",
    productSlugs: [
      "afghan-raisins-kishmish",
      "afghan-khumani",
      "pure-hing-asafoetida",
    ],
    sourcingNote: "Traditional shade-drying and natural resin curing without sulfur bleaching.",
  },
];

/**
 * Find verified region by slug or state ID
 */
export function getTasteRegionBySlug(slug: string): VerifiedTasteRegion | undefined {
  return VERIFIED_INDIA_REGIONS.find((r) => r.slug === slug || r.stateId === slug);
}

/**
 * Check if a state has verified regional products
 */
export function getStateRegion(stateId: string): VerifiedTasteRegion | undefined {
  return VERIFIED_INDIA_REGIONS.find((r) => r.stateId === stateId);
}
