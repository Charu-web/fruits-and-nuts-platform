import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Idempotent Foundation Seeder for M/S Fruits & Nuts
 * Seeds strictly approved system roles, root category taxonomy nodes, and verified subcategories.
 * ZERO real client product prices or medical claims are synthesized.
 */
async function main() {
  console.log("🌱 Starting idempotent database seed (Phase 9C)...");

  // 1. Seed Core RBAC Roles
  const roles = [
    { id: "SUPER_ADMIN", name: "Super Administrator", description: "Unrestricted system, financial and security access" },
    { id: "INVENTORY_MGR", name: "Inventory Manager", description: "Manage catalog products, stock levels and buffers" },
    { id: "ORDER_MGR", name: "Order Fulfillment Manager", description: "Manage order queue, AWB labels, and packing slips" },
    { id: "CONTENT_MGR", name: "Content & CMS Manager", description: "Manage homepage banners, Taste Map, and reviews" },
    { id: "CUSTOMER", name: "Storefront Customer", description: "Standard registered shopping customer" },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { id: role.id },
      update: { name: role.name, description: role.description },
      create: role,
    });
  }
  console.log(`✅ Seeded ${roles.length} system RBAC roles.`);

  // 2. Seed 10 Approved Root Category Taxonomy Nodes
  const taxonomy = [
    {
      id: 1,
      name: "Fruits & Nuts",
      slug: "fruits-and-nuts",
      description: "Whole, sliced, roasted, and flavored specialty nuts.",
      displayOrder: 1,
      subcategories: [
        { name: "Raw / Natural Nuts", slug: "raw-natural-nuts", displayOrder: 1 },
        { name: "Roasted & Salted Nuts", slug: "roasted-salted-nuts", displayOrder: 2 },
        { name: "Flavored Gourmet Nuts", slug: "flavored-gourmet-nuts", displayOrder: 3 },
      ],
    },
    {
      id: 2,
      name: "Dry Fruits",
      slug: "dry-fruits",
      description: "Premium almonds, cashews, walnuts, pistachios, and figs.",
      displayOrder: 2,
      subcategories: [
        { name: "Almonds / Badam", slug: "almonds-badam", displayOrder: 1 },
        { name: "Cashews / Kaju", slug: "cashews-kaju", displayOrder: 2 },
        { name: "Walnuts / Akhrot", slug: "walnuts-akhrot", displayOrder: 3 },
        { name: "Pistachios / Pista", slug: "pistachios-pista", displayOrder: 4 },
        { name: "Raisins / Kishmish", slug: "raisins-kishmish", displayOrder: 5 },
        { name: "Figs / Anjeer", slug: "figs-anjeer", displayOrder: 6 },
        { name: "Berries & Prunes", slug: "berries-prunes", displayOrder: 7 },
      ],
    },
    {
      id: 3,
      name: "Dates / Khajoor",
      slug: "dates-khajoor",
      description: "Artisanal Medjool, Ajwa, Mabroom, and stuffed dates.",
      displayOrder: 3,
      subcategories: [
        { name: "Premium Cultivars", slug: "premium-cultivars", displayOrder: 1 },
        { name: "Stuffed Gourmet Dates", slug: "stuffed-gourmet-dates", displayOrder: 2 },
        { name: "Chocolate Dipped Dates", slug: "chocolate-dipped-dates", displayOrder: 3 },
      ],
    },
    {
      id: 4,
      name: "Super Seeds",
      slug: "seeds",
      description: "Raw and slow-roasted chia, flax, pumpkin, and sunflower seeds.",
      displayOrder: 4,
      subcategories: [
        { name: "Raw Single Varietals", slug: "raw-single-varietals", displayOrder: 1 },
        { name: "Roasted Superfood Mixes", slug: "roasted-superfood-mixes", displayOrder: 2 },
      ],
    },
    {
      id: 5,
      name: "Artisan Tea",
      slug: "tea",
      description: "Single-estate loose leaf, orthodox teas, and Kashmiri Kahwa.",
      displayOrder: 5,
      subcategories: [
        { name: "Orthodox & Loose Leaf", slug: "orthodox-loose-leaf", displayOrder: 1 },
        { name: "CTC Black Teas", slug: "ctc-black-teas", displayOrder: 2 },
        { name: "Green Teas", slug: "green-teas", displayOrder: 3 },
        { name: "Herbal & Wellness Infusions", slug: "herbal-wellness-infusions", displayOrder: 4 },
        { name: "Kashmiri Kahwa & Spiced", slug: "kahwa-spiced", displayOrder: 5 },
      ],
    },
    {
      id: 6,
      name: "Gourmet Chocolates",
      slug: "chocolates",
      description: "Handcrafted dark chocolates, nut clusters, and dragées.",
      displayOrder: 6,
      subcategories: [
        { name: "Artisan Dark Chocolate Bars", slug: "artisan-dark-bars", displayOrder: 1 },
        { name: "Nut Clusters & Dragées", slug: "nut-clusters-dragees", displayOrder: 2 },
        { name: "Chocolate Dipped Dry Fruits", slug: "chocolate-dipped-dry-fruits", displayOrder: 3 },
      ],
    },
    {
      id: 7,
      name: "Royal Mouth Fresheners",
      slug: "mouth-fresheners",
      description: "Heritage paan blends, silver-coated cardamom, and digestive mukhwas (100% Tobacco-free).",
      displayOrder: 7,
      subcategories: [
        { name: "Heritage Paan Confections", slug: "heritage-paan-confections", displayOrder: 1 },
        { name: "Roasted Digestive Seeds", slug: "roasted-digestive-seeds", displayOrder: 2 },
        { name: "Amla & Fruit Digestives", slug: "amla-fruit-digestives", displayOrder: 3 },
      ],
    },
    {
      id: 8,
      name: "Value Combos",
      slug: "combos",
      description: "Curated daily nutrition bundles and family packs.",
      displayOrder: 8,
      subcategories: [
        { name: "Daily Health Packs", slug: "daily-health-packs", displayOrder: 1 },
        { name: "Multi-Pack Bundles", slug: "multi-pack-bundles", displayOrder: 2 },
      ],
    },
    {
      id: 9,
      name: "Luxury Gifting",
      slug: "gifting",
      description: "Bespoke wooden caskets, velvet trays, and festive gift boxes.",
      displayOrder: 9,
      subcategories: [
        { name: "Classic Wooden Keepsake Boxes", slug: "wooden-keepsake-boxes", displayOrder: 1 },
        { name: "Royal Velvet Presentation Trays", slug: "royal-velvet-trays", displayOrder: 2 },
        { name: "Heritage Metal Tin Hampers", slug: "heritage-tin-hampers", displayOrder: 3 },
        { name: "Build Your Own Box (BYOB)", slug: "byob-gift-boxes", displayOrder: 4 },
      ],
    },
    {
      id: 10,
      name: "Specialty Products",
      slug: "specialty",
      description: "Kashmiri Grade-A saffron, organic honey, and cold-pressed nut oils.",
      displayOrder: 10,
      subcategories: [
        { name: "Kashmiri Saffron", slug: "kashmiri-saffron", displayOrder: 1 },
        { name: "Organic Honey & Spreads", slug: "organic-honey-spreads", displayOrder: 2 },
        { name: "Cold-Pressed Nut Oils", slug: "cold-pressed-nut-oils", displayOrder: 3 },
      ],
    },
  ];

  for (const cat of taxonomy) {
    const savedCategory = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, displayOrder: cat.displayOrder },
      create: {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        displayOrder: cat.displayOrder,
      },
    });

    for (const sub of cat.subcategories) {
      await prisma.subcategory.upsert({
        where: { slug: sub.slug },
        update: {
          categoryId: savedCategory.id,
          name: sub.name,
          displayOrder: sub.displayOrder,
        },
        create: {
          categoryId: savedCategory.id,
          name: sub.name,
          slug: sub.slug,
          displayOrder: sub.displayOrder,
        },
      });
    }
  }
  console.log(`✅ Seeded ${taxonomy.length} root categories and corresponding subcategories.`);

  console.log("🎉 Idempotent Phase 9C seed completed successfully.");
}

main()
  .catch((e) => {
    console.error("❌ Seed execution failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
