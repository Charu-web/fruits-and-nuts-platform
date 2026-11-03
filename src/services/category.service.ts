import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { z } from "zod";
import {
  CreateCategorySchema,
  UpdateCategorySchema,
  CreateSubcategorySchema,
  UpdateSubcategorySchema,
} from "@/lib/validation/catalog.schema";

const FALLBACK_CATEGORIES = [
  {
    id: 1,
    name: "Fruits & Nuts",
    slug: "fruits-and-nuts",
    description: "Whole, sliced, roasted, and flavored specialty nuts.",
    imageUrl: "/images/categories/dry-fruits.jpg",
    displayOrder: 1,
    isActive: true,
    subcategories: [
      { id: 1, categoryId: 1, name: "Raw / Natural Nuts", slug: "raw-natural-nuts", displayOrder: 1, isActive: true },
      { id: 2, categoryId: 1, name: "Roasted & Salted Nuts", slug: "roasted-salted-nuts", displayOrder: 2, isActive: true },
      { id: 3, categoryId: 1, name: "Flavored Gourmet Nuts", slug: "flavored-gourmet-nuts", displayOrder: 3, isActive: true },
    ],
    _count: { products: 12 },
  },
  {
    id: 2,
    name: "Dry Fruits",
    slug: "dry-fruits",
    description: "Premium almonds, cashews, walnuts, pistachios, and figs.",
    imageUrl: "/images/categories/dry-fruits.jpg",
    displayOrder: 2,
    isActive: true,
    subcategories: [
      { id: 4, categoryId: 2, name: "Almonds / Badam", slug: "almonds-badam", displayOrder: 1, isActive: true },
      { id: 5, categoryId: 2, name: "Cashews / Kaju", slug: "cashews-kaju", displayOrder: 2, isActive: true },
      { id: 6, categoryId: 2, name: "Walnuts / Akhrot", slug: "walnuts-akhrot", displayOrder: 3, isActive: true },
      { id: 7, categoryId: 2, name: "Pistachios / Pista", slug: "pistachios-pista", displayOrder: 4, isActive: true },
      { id: 8, categoryId: 2, name: "Raisins / Kishmish", slug: "raisins-kishmish", displayOrder: 5, isActive: true },
      { id: 9, categoryId: 2, name: "Figs / Anjeer", slug: "figs-anjeer", displayOrder: 6, isActive: true },
      { id: 10, categoryId: 2, name: "Berries & Prunes", slug: "berries-prunes", displayOrder: 7, isActive: true },
    ],
    _count: { products: 15 },
  },
  {
    id: 3,
    name: "Dates / Khajoor",
    slug: "dates-khajoor",
    description: "Artisanal Medjool, Ajwa, Mabroom, and stuffed dates.",
    imageUrl: "/images/categories/berries-dates.jpg",
    displayOrder: 3,
    isActive: true,
    subcategories: [
      { id: 11, categoryId: 3, name: "Premium Cultivars", slug: "premium-cultivars", displayOrder: 1, isActive: true },
      { id: 12, categoryId: 3, name: "Stuffed Gourmet Dates", slug: "stuffed-gourmet-dates", displayOrder: 2, isActive: true },
      { id: 13, categoryId: 3, name: "Chocolate Dipped Dates", slug: "chocolate-dipped-dates", displayOrder: 3, isActive: true },
    ],
    _count: { products: 6 },
  },
  {
    id: 4,
    name: "Super Seeds",
    slug: "seeds",
    description: "Raw and slow-roasted chia, flax, pumpkin, and sunflower seeds.",
    imageUrl: "/images/categories/dry-fruits.jpg",
    displayOrder: 4,
    isActive: true,
    subcategories: [
      { id: 14, categoryId: 4, name: "Raw Single Varietals", slug: "raw-single-varietals", displayOrder: 1, isActive: true },
      { id: 15, categoryId: 4, name: "Roasted Superfood Mixes", slug: "roasted-superfood-mixes", displayOrder: 2, isActive: true },
    ],
    _count: { products: 5 },
  },
  {
    id: 5,
    name: "Artisan Tea",
    slug: "tea",
    description: "Specialty whole leaf orthodox, CTC, green, and floral herbal infusions.",
    imageUrl: "/images/categories/dry-fruits.jpg",
    displayOrder: 5,
    isActive: true,
    subcategories: [
      { id: 16, categoryId: 5, name: "Orthodox Whole Leaf", slug: "orthodox-whole-leaf", displayOrder: 1, isActive: true },
      { id: 17, categoryId: 5, name: "CTC Black Teas", slug: "ctc-black-teas", displayOrder: 2, isActive: true },
      { id: 18, categoryId: 5, name: "Green Teas", slug: "green-teas", displayOrder: 3, isActive: true },
      { id: 19, categoryId: 5, name: "Herbal & Wellness Infusions", slug: "herbal-wellness-infusions", displayOrder: 4, isActive: true },
      { id: 20, categoryId: 5, name: "Kashmiri Kahwa & Spiced", slug: "kahwa-spiced", displayOrder: 5, isActive: true },
    ],
    _count: { products: 5 },
  },
  {
    id: 6,
    name: "Gourmet Chocolates",
    slug: "chocolates",
    description: "Handcrafted dark chocolates, nut clusters, and dragées.",
    imageUrl: "/images/categories/dry-fruits.jpg",
    displayOrder: 6,
    isActive: true,
    subcategories: [
      { id: 21, categoryId: 6, name: "Artisan Dark Chocolate Bars", slug: "artisan-dark-bars", displayOrder: 1, isActive: true },
      { id: 22, categoryId: 6, name: "Nut Clusters & Dragées", slug: "nut-clusters-dragees", displayOrder: 2, isActive: true },
      { id: 23, categoryId: 6, name: "Chocolate Dipped Dry Fruits", slug: "chocolate-dipped-dry-fruits", displayOrder: 3, isActive: true },
    ],
    _count: { products: 4 },
  },
  {
    id: 7,
    name: "Royal Mouth Fresheners",
    slug: "mouth-fresheners",
    description: "Heritage paan blends, silver-coated cardamom, and digestive mukhwas (100% Tobacco-free).",
    imageUrl: "/images/categories/dry-fruits.jpg",
    displayOrder: 7,
    isActive: true,
    subcategories: [
      { id: 24, categoryId: 7, name: "Heritage Paan Confections", slug: "heritage-paan-confections", displayOrder: 1, isActive: true },
      { id: 25, categoryId: 7, name: "Roasted Digestive Seeds", slug: "roasted-digestive-seeds", displayOrder: 2, isActive: true },
      { id: 26, categoryId: 7, name: "Amla & Fruit Digestives", slug: "amla-fruit-digestives", displayOrder: 3, isActive: true },
    ],
    _count: { products: 4 },
  },
  {
    id: 8,
    name: "Value Combos",
    slug: "combos",
    description: "Curated daily nutrition bundles and family packs.",
    imageUrl: "/images/categories/dry-fruits.jpg",
    displayOrder: 8,
    isActive: true,
    subcategories: [
      { id: 27, categoryId: 8, name: "Daily Health Packs", slug: "daily-health-packs", displayOrder: 1, isActive: true },
      { id: 28, categoryId: 8, name: "Multi-Pack Bundles", slug: "multi-pack-bundles", displayOrder: 2, isActive: true },
    ],
    _count: { products: 4 },
  },
  {
    id: 9,
    name: "Luxury Gifting",
    slug: "gifting",
    description: "Bespoke wooden caskets, velvet trays, and festive gift boxes.",
    imageUrl: "/images/categories/gifting-hampers.jpg",
    displayOrder: 9,
    isActive: true,
    subcategories: [
      { id: 29, categoryId: 9, name: "Classic Wooden Keepsake Boxes", slug: "wooden-keepsake-boxes", displayOrder: 1, isActive: true },
      { id: 30, categoryId: 9, name: "Royal Velvet Presentation Trays", slug: "royal-velvet-trays", displayOrder: 2, isActive: true },
      { id: 31, categoryId: 9, name: "Heritage Metal Tin Hampers", slug: "heritage-tin-hampers", displayOrder: 3, isActive: true },
      { id: 32, categoryId: 9, name: "Build Your Own Box (BYOB)", slug: "byob-gift-boxes", displayOrder: 4, isActive: true },
    ],
    _count: { products: 6 },
  },
  {
    id: 10,
    name: "Specialty Products",
    slug: "specialty",
    description: "Kashmiri Grade-A saffron, organic honey, and cold-pressed nut oils.",
    imageUrl: "/images/categories/kashmir-specials.jpg",
    displayOrder: 10,
    isActive: true,
    subcategories: [
      { id: 33, categoryId: 10, name: "Kashmiri Saffron", slug: "kashmiri-saffron", displayOrder: 1, isActive: true },
      { id: 34, categoryId: 10, name: "Organic Honey & Spreads", slug: "organic-honey-spreads", displayOrder: 2, isActive: true },
      { id: 35, categoryId: 10, name: "Cold-Pressed Nut Oils", slug: "cold-pressed-nut-oils", displayOrder: 3, isActive: true },
    ],
    _count: { products: 5 },
  },
];

export class CategoryService {
  /**
   * Retrieves all categories with their subcategories and active product counts.
   */
  static async getAllCategories(includeInactive = false) {
    try {
      // Query with a 4000ms timeout race to prevent indefinite request stalls on cold/slow database
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Database category query timeout (4000ms)")), 4000)
      );

      const dbQueryPromise = db.category.findMany({
        where: includeInactive ? {} : { isActive: true },
        orderBy: { displayOrder: "asc" },
        include: {
          subcategories: {
            where: includeInactive ? {} : { isActive: true },
            orderBy: { displayOrder: "asc" },
          },
          _count: {
            select: {
              products: includeInactive ? true : { where: { isActive: true } },
            },
          },
        },
      });

      const categories = await Promise.race([dbQueryPromise, timeoutPromise]);

      if (!categories || categories.length === 0) {
        return FALLBACK_CATEGORIES as any;
      }
      return categories;
    } catch (error) {
      console.warn("[CategoryService] DB unreachable, serving fallback categories:", error instanceof Error ? error.message : error);
      return FALLBACK_CATEGORIES as any;
    }
  }

  /**
   * Retrieves a single category by slug with its subcategories and active products summary.
   */
  static async getCategoryBySlug(slug: string, includeInactive = false) {
    const category = await db.category.findFirst({
      where: {
        slug,
        ...(includeInactive ? {} : { isActive: true }),
      },
      include: {
        subcategories: {
          where: includeInactive ? {} : { isActive: true },
          orderBy: { displayOrder: "asc" },
        },
        products: {
          where: includeInactive ? {} : { isActive: true },
          include: {
            images: {
              where: { isPrimary: true },
              take: 1,
            },
            variants: {
              where: includeInactive ? {} : { isActive: true },
              orderBy: { sellingPrice: "asc" },
              take: 1,
              include: {
                inventory: true,
              },
            },
          },
          take: 50,
        },
      },
    });

    if (!category) {
      throw AppError.notFound(`Category with slug '${slug}' not found`);
    }

    return category;
  }

  /**
   * Retrieves a category by ID (Admin).
   */
  static async getCategoryById(id: number) {
    const category = await db.category.findUnique({
      where: { id },
      include: {
        subcategories: {
          orderBy: { displayOrder: "asc" },
        },
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw AppError.notFound(`Category with ID ${id} not found`);
    }

    return category;
  }

  /**
   * Creates a new root category (Admin).
   */
  static async createCategory(input: z.infer<typeof CreateCategorySchema>) {
    const validated = CreateCategorySchema.parse(input);

    const existingSlug = await db.category.findUnique({
      where: { slug: validated.slug },
    });

    if (existingSlug) {
      throw AppError.conflict(`Category slug '${validated.slug}' is already in use`);
    }

    return await db.category.create({
      data: validated,
    });
  }

  /**
   * Updates an existing root category (Admin).
   */
  static async updateCategory(id: number, input: z.infer<typeof UpdateCategorySchema>) {
    const validated = UpdateCategorySchema.parse(input);

    const category = await db.category.findUnique({ where: { id } });
    if (!category) {
      throw AppError.notFound(`Category with ID ${id} not found`);
    }

    if (validated.slug && validated.slug !== category.slug) {
      const existingSlug = await db.category.findUnique({
        where: { slug: validated.slug },
      });
      if (existingSlug) {
        throw AppError.conflict(`Category slug '${validated.slug}' is already in use`);
      }
    }

    return await db.category.update({
      where: { id },
      data: validated,
    });
  }

  /**
   * Deletes a category if no products are attached (Admin).
   */
  static async deleteCategory(id: number) {
    const category = await db.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true, subcategories: true },
        },
      },
    });

    if (!category) {
      throw AppError.notFound(`Category with ID ${id} not found`);
    }

    if (category._count.products > 0) {
      throw AppError.conflict(
        `Cannot delete category '${category.name}' because ${category._count.products} products are associated with it. Deactivate or reassign them first.`
      );
    }

    if (category._count.subcategories > 0) {
      throw AppError.conflict(
        `Cannot delete category '${category.name}' because ${category._count.subcategories} subcategories are attached to it.`
      );
    }

    return await db.category.delete({
      where: { id },
    });
  }

  /**
   * Creates a subcategory under a root category (Admin).
   */
  static async createSubcategory(input: z.infer<typeof CreateSubcategorySchema>) {
    const validated = CreateSubcategorySchema.parse(input);

    const parentCategory = await db.category.findUnique({
      where: { id: validated.categoryId },
    });

    if (!parentCategory) {
      throw AppError.notFound(`Parent category with ID ${validated.categoryId} not found`);
    }

    const existingSlug = await db.subcategory.findUnique({
      where: { slug: validated.slug },
    });

    if (existingSlug) {
      throw AppError.conflict(`Subcategory slug '${validated.slug}' is already in use`);
    }

    return await db.subcategory.create({
      data: validated,
    });
  }

  /**
   * Updates an existing subcategory (Admin).
   */
  static async updateSubcategory(id: number, input: z.infer<typeof UpdateSubcategorySchema>) {
    const validated = UpdateSubcategorySchema.parse(input);

    const subcategory = await db.subcategory.findUnique({ where: { id } });
    if (!subcategory) {
      throw AppError.notFound(`Subcategory with ID ${id} not found`);
    }

    if (validated.categoryId && validated.categoryId !== subcategory.categoryId) {
      const parent = await db.category.findUnique({ where: { id: validated.categoryId } });
      if (!parent) {
        throw AppError.notFound(`Parent category with ID ${validated.categoryId} not found`);
      }
    }

    if (validated.slug && validated.slug !== subcategory.slug) {
      const existingSlug = await db.subcategory.findUnique({
        where: { slug: validated.slug },
      });
      if (existingSlug) {
        throw AppError.conflict(`Subcategory slug '${validated.slug}' is already in use`);
      }
    }

    return await db.subcategory.update({
      where: { id },
      data: validated,
    });
  }

  /**
   * Deletes a subcategory if no products are attached (Admin).
   */
  static async deleteSubcategory(id: number) {
    const subcategory = await db.subcategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!subcategory) {
      throw AppError.notFound(`Subcategory with ID ${id} not found`);
    }

    if (subcategory._count.products > 0) {
      throw AppError.conflict(
        `Cannot delete subcategory '${subcategory.name}' because ${subcategory._count.products} products are associated with it.`
      );
    }

    return await db.subcategory.delete({
      where: { id },
    });
  }
}
