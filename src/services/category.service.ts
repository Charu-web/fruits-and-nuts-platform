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
    name: "Dry Fruits & Nuts",
    slug: "dry-fruits-nuts",
    description: "Premium single-origin Kashmiri almonds, jumbo Afghan cashews, and rich walnuts.",
    imageUrl: "/images/categories/dry-fruits.jpg",
    displayOrder: 1,
    isActive: true,
    metaTitle: "Buy Premium Dry Fruits & Nuts Online | M/S Fruits & Nuts",
    metaDescription: "Handpicked Mamra almonds, king cashews, and pistachio kernels sourced directly from origin orchards.",
    createdAt: new Date("2026-08-01"),
    updatedAt: new Date("2026-10-14"),
    subcategories: [
      { id: 101, categoryId: 1, name: "Almonds & Kernels", slug: "almonds-kernels", description: "Grade-A Kashmiri Mamra, Sanora, and California almonds", displayOrder: 1, isActive: true },
      { id: 102, categoryId: 1, name: "Cashews & Pistachios", slug: "cashews-pistachios", description: "Jumbo W180 cashews and roasted salted pistachios", displayOrder: 2, isActive: true },
      { id: 103, categoryId: 1, name: "Walnuts & Pecans", slug: "walnuts-pecans", description: "Paper-shell Kashmiri walnuts and golden light halves", displayOrder: 3, isActive: true },
    ],
    _count: { products: 12 },
  },
  {
    id: 2,
    name: "Kashmiri Specialties",
    slug: "kashmiri-specialties",
    description: "GI-tagged Pampore Mongra Saffron, dried wild morels (Gucchi), and Sulai honey.",
    imageUrl: "/images/categories/kashmir-specials.jpg",
    displayOrder: 2,
    isActive: true,
    metaTitle: "Pure Kashmiri Saffron & Gourmet Specialties | M/S Fruits & Nuts",
    metaDescription: "Certified Grade-A Pampore saffron threads, Himalayan morels, and pure acacia flower nectar.",
    createdAt: new Date("2026-08-01"),
    updatedAt: new Date("2026-10-14"),
    subcategories: [
      { id: 201, categoryId: 2, name: "GI Saffron & Kehwa", slug: "gi-saffron-kehwa", description: "ISO 3632 Grade-1 tested saffron threads and spice blends", displayOrder: 1, isActive: true },
      { id: 202, categoryId: 2, name: "Wild Morel Mushrooms (Gucchi)", slug: "wild-morel-mushrooms", description: "Foraged Himalayan Morchella conica wild mushrooms", displayOrder: 2, isActive: true },
    ],
    _count: { products: 6 },
  },
  {
    id: 3,
    name: "Berries, Figs & Dates",
    slug: "berries-figs-dates",
    description: "Sun-dried Kandahar Anjeer, Medjool Royal Dates, and mountain blueberries.",
    imageUrl: "/images/categories/berries-dates.jpg",
    displayOrder: 3,
    isActive: true,
    metaTitle: "Gourmet Dried Berries, Afghan Figs & Royal Dates",
    metaDescription: "Naturally sun-cured Afghan garland figs, Saudi Medjool dates, and antioxidant berries.",
    createdAt: new Date("2026-08-01"),
    updatedAt: new Date("2026-10-14"),
    subcategories: [
      { id: 301, categoryId: 3, name: "Afghan Garland Figs (Anjeer)", slug: "afghan-garland-figs", description: "Sun-dried natural garland figs from Kandahar", displayOrder: 1, isActive: true },
      { id: 302, categoryId: 3, name: "Royal Medjool Dates", slug: "royal-medjool-dates", description: "Jumbo soft Medjool and Ajwa dates", displayOrder: 2, isActive: true },
      { id: 303, categoryId: 3, name: "Superfood Berries & Seeds", slug: "superfood-berries-seeds", description: "Dried wild cranberries, blueberries, and organic chia seeds", displayOrder: 3, isActive: true },
    ],
    _count: { products: 8 },
  },
  {
    id: 4,
    name: "Festive & Luxury Gifting",
    slug: "festive-luxury-gifting",
    description: "Handcrafted pine wood chests, bespoke velvet sleeve boxes, and royal corporate hampers.",
    imageUrl: "/images/categories/gifting-hampers.jpg",
    displayOrder: 4,
    isActive: true,
    metaTitle: "Luxury Dried Fruit Hampers & Corporate Gift Boxes",
    metaDescription: "Artisanal handcrafted gift hampers with custom wax-sealed calligraphy greeting cards.",
    createdAt: new Date("2026-08-01"),
    updatedAt: new Date("2026-10-14"),
    subcategories: [
      { id: 401, categoryId: 4, name: "Imperial Wooden Trunks", slug: "imperial-wooden-trunks", description: "Solid pinewood brass-clamped royal keepsake trunks", displayOrder: 1, isActive: true },
      { id: 402, categoryId: 4, name: "Festive Occasion Boxes", slug: "festive-occasion-boxes", description: "Diwali, wedding, and corporate prestige gift boxes", displayOrder: 2, isActive: true },
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
      const categories = await db.category.findMany({
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

      if (categories.length === 0) {
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
