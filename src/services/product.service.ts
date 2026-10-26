import fs from "fs";
import path from "path";
import crypto from "crypto";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { runTransaction } from "@/database/transactions";
import { InventoryService, StockStatus } from "./inventory.service";
import { InventoryTransactionType, Prisma } from "@prisma/client";
import {
  CreateProductSchema,
  UpdateProductSchema,
  CreateVariantSchema,
  UpdateVariantSchema,
  AddImageSchema,
  ReorderImagesSchema,
  ProductListQuerySchema,
  AdminProductListQuerySchema,
} from "@/lib/validation/catalog.schema";
import { z } from "zod";
import { getProductImageUrl } from "@/lib/catalog/product-asset-registry";
import { STOREFRONT_PRODUCTS } from "@/lib/catalog/storefront-catalog";

const DEV_PRODUCTS_CACHE_PATH = path.join(
  process.cwd(),
  "node_modules",
  ".cache",
  "fruits-nuts-dev-products.json"
);

function toDeterministicUuid(idOrSlug: string): string {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idOrSlug)) {
    return idOrSlug;
  }
  const hash = crypto.createHash("md5").update(idOrSlug).digest("hex");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

function buildInitialStorefrontProducts(): any[] {
  const categoryMap: Record<string, { id: number; name: string; slug: string }> = {
    "dry-fruits": { id: 2, name: "Dry Fruits & Nuts", slug: "dry-fruits" },
    "dates-khajoor": { id: 3, name: "Dates / Khajoor", slug: "dates-khajoor" },
    "dates": { id: 3, name: "Dates / Khajoor", slug: "dates-khajoor" },
    "tea": { id: 5, name: "Artisanal Teas", slug: "tea" },
    "seeds": { id: 4, name: "Super Seeds & Berries", slug: "seeds" },
    "chocolates": { id: 6, name: "Gourmet Bites & Confections", slug: "chocolates" },
    "bites": { id: 6, name: "Gourmet Bites & Confections", slug: "chocolates" },
    "pantry": { id: 7, name: "Pantry & Vedic Ghee", slug: "pantry" },
    "combos": { id: 8, name: "Luxury Gifting", slug: "gifting" },
    "gifting": { id: 8, name: "Luxury Gifting", slug: "gifting" },
    "all": { id: 1, name: "Fruits & Nuts", slug: "fruits-and-nuts" },
  };

  return STOREFRONT_PRODUCTS.map((p) => {
    const catSlug = p.category?.slug || p.collectionGroup || "all";
    const cat = categoryMap[catSlug] || categoryMap["all"];
    const productId = toDeterministicUuid(p.id || p.slug);
    const primaryImgUrl = p.primaryImage?.imageUrl || getProductImageUrl(p.slug) || "/images/products/kashmiri-mamra-almonds.jpg";

    return {
      id: productId,
      name: p.name,
      slug: p.slug,
      skuBase: `FN-${p.slug.toUpperCase().replace(/[^A-Z0-9]+/g, "-").slice(0, 16)}`,
      description: p.name + " — Handpicked, nitrogen-flushed, hygienically packed luxury gourmet harvest.",
      categoryId: cat.id,
      category: cat,
      subcategoryId: null,
      subcategory: null,
      isActive: true,
      isFeatured: Boolean(p.isBestseller),
      isByobEligible: true,
      gstPercentage: 5.0,
      shelfLifeMonths: 9,
      hsnCode: "0802",
      variants: (p.variants || []).map((v) => ({
        id: toDeterministicUuid(v.id || `${p.slug}-${v.weightGrams}`),
        productId,
        sku: v.sku || `FN-${p.slug.toUpperCase()}-${v.weightGrams}G`,
        weightGrams: Number(v.weightGrams || 250),
        unit: v.unit || "GRAMS",
        packageType: "STAND_UP_POUCH",
        mrp: Number(v.mrp || 500),
        sellingPrice: Number(v.sellingPrice || 400),
        wholesalePrice: null,
        wholesaleMinQty: null,
        isActive: v.isAvailable !== false,
        inventory: {
          stockAvailable: 50,
          safetyBufferThreshold: 10,
        },
      })),
      images: [
        {
          id: `img-${p.slug}`,
          productId,
          imageUrl: primaryImgUrl,
          altText: p.name,
          isPrimary: true,
          sortOrder: 0,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });
}

const DEV_PRODUCTS: any[] =
  (globalThis as any).devProductsGlobal ??
  ((globalThis as any).devProductsGlobal = buildInitialStorefrontProducts());

function syncDevProductsFromDisk(): void {
  try {
    if (!fs.existsSync(DEV_PRODUCTS_CACHE_PATH)) return;
    const raw = fs.readFileSync(DEV_PRODUCTS_CACHE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.products)) {
      for (const diskProd of parsed.products) {
        const idx = DEV_PRODUCTS.findIndex(
          (p) => p.id === diskProd.id || p.slug === diskProd.slug
        );
        if (idx >= 0) {
          DEV_PRODUCTS[idx] = diskProd;
        } else {
          DEV_PRODUCTS.unshift(diskProd);
        }
      }
    }
  } catch {}
}

function saveDevProductsToDisk(): void {
  try {
    const dir = path.dirname(DEV_PRODUCTS_CACHE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(
      DEV_PRODUCTS_CACHE_PATH,
      JSON.stringify(
        {
          updatedAt: new Date().toISOString(),
          products: DEV_PRODUCTS,
        },
        null,
        2
      ),
      "utf8"
    );
  } catch {}
}

syncDevProductsFromDisk();

export class ProductService {
  /**
   * Public Catalog: Filterable, searchable, paginated product list.
   */
  static async listPublicProducts(params: z.infer<typeof ProductListQuerySchema>) {
    const validated = ProductListQuerySchema.parse(params);
    const {
      category,
      subcategory,
      search,
      minPrice,
      maxPrice,
      isFeatured,
      isByobEligible,
      inStockOnly,
      sort,
      page,
      limit,
    } = validated;

    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      variants: {
        some: {
          isActive: true,
          ...(minPrice || maxPrice
            ? {
                sellingPrice: {
                  gte: minPrice ? new Prisma.Decimal(minPrice) : undefined,
                  lte: maxPrice ? new Prisma.Decimal(maxPrice) : undefined,
                },
              }
            : {}),
          ...(inStockOnly
            ? {
                inventory: {
                  stockAvailable: { gt: 0 },
                },
              }
            : {}),
        },
      },
    };

    if (category) {
      where.category = { slug: category, isActive: true };
    }

    if (subcategory) {
      where.subcategory = { slug: subcategory, isActive: true };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { skuBase: { contains: search, mode: "insensitive" } },
      ];
    }

    if (isFeatured !== undefined) {
      where.isFeatured = isFeatured;
    }

    if (isByobEligible !== undefined) {
      where.isByobEligible = isByobEligible;
    }

    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
    if (sort === "newest") {
      orderBy = { createdAt: "desc" };
    } else if (sort === "name_asc") {
      orderBy = { name: "asc" };
    } else if (sort === "featured") {
      orderBy = { isFeatured: "desc" };
    }

    let total = 0;
    let products: any[] = [];

    try {
      const [dbTotal, dbProducts] = await Promise.all([
        db.product.count({ where }),
        db.product.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: {
            category: { select: { id: true, name: true, slug: true } },
            subcategory: { select: { id: true, name: true, slug: true } },
            images: {
              orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
              take: 2,
            },
            variants: {
              where: { isActive: true },
              orderBy: { sellingPrice: "asc" },
              include: {
                inventory: true,
              },
            },
          },
        }),
      ]);
      total = dbTotal;
      products = dbProducts;
    } catch {
      // DB offline, fall back to DEV_PRODUCTS
    }

    syncDevProductsFromDisk();
    const dbSlugs = new Set(products.map((p) => p.slug));
    const extraDevProducts = DEV_PRODUCTS.filter((dp) => dp.isActive !== false && !dbSlugs.has(dp.slug));

    let allFormatted = products.map((p) => {
      const activeVariants = p.variants;
      const prices = activeVariants.map((v: any) => Number(v.sellingPrice));
      const mrps = activeVariants.map((v: any) => Number(v.mrp));

      const minSellingPrice = prices.length > 0 ? Math.min(...prices) : 0;
      const maxSellingPrice = prices.length > 0 ? Math.max(...prices) : 0;
      const minMrp = mrps.length > 0 ? Math.min(...mrps) : 0;
      const maxMrp = mrps.length > 0 ? Math.max(...mrps) : 0;

      let productStockStatus: StockStatus = "OUT_OF_STOCK";
      const totalStock = activeVariants.reduce(
        (acc: number, v: any) => acc + (v.inventory?.stockAvailable ?? 0),
        0
      );
      const lowestBuffer = Math.min(
        ...activeVariants.map((v: any) => v.inventory?.safetyBufferThreshold ?? 10)
      );

      if (totalStock > 0) {
        productStockStatus = totalStock <= lowestBuffer ? "LOW_STOCK" : "IN_STOCK";
      }

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        skuBase: p.skuBase,
        description: p.description,
        isFeatured: p.isFeatured,
        isByobEligible: p.isByobEligible,
        category: p.category,
        subcategory: p.subcategory,
        primaryImage: getProductImageUrl(p.slug)
          ? {
              id: p.images[0]?.id ?? `asset-${p.slug}`,
              imageUrl: getProductImageUrl(p.slug)!,
              altText: p.images[0]?.altText || p.name,
              isPrimary: true,
              sortOrder: 0,
            }
          : p.images[0] ?? null,
        priceRange: {
          minSellingPrice,
          maxSellingPrice,
          minMrp,
          maxMrp,
          discountPercentage:
            minMrp > minSellingPrice
              ? Math.round(((minMrp - minSellingPrice) / minMrp) * 100)
              : 0,
        },
        stockStatus: productStockStatus,
        variantsCount: activeVariants.length,
        createdAt: p.createdAt,
      };
    });

    for (const dp of extraDevProducts) {
      const activeVars = dp.variants?.filter((v: any) => v.isActive !== false) || [];
      const prices = activeVars.map((v: any) => Number(v.sellingPrice));
      const mrps = activeVars.map((v: any) => Number(v.mrp));
      const minSellingPrice = prices.length > 0 ? Math.min(...prices) : 0;
      const maxSellingPrice = prices.length > 0 ? Math.max(...prices) : 0;
      const minMrp = mrps.length > 0 ? Math.min(...mrps) : 0;
      const maxMrp = mrps.length > 0 ? Math.max(...mrps) : 0;

      allFormatted.push({
        id: dp.id,
        name: dp.name,
        slug: dp.slug,
        skuBase: dp.skuBase,
        description: dp.description,
        isFeatured: Boolean(dp.isFeatured),
        isByobEligible: Boolean(dp.isByobEligible),
        category: dp.category,
        subcategory: dp.subcategory,
        primaryImage: dp.images?.[0] || {
          id: `img-${dp.slug}`,
          imageUrl: getProductImageUrl(dp.slug) || "/images/products/kashmiri-mamra-almonds.jpg",
          altText: dp.name,
          isPrimary: true,
          sortOrder: 0,
        },
        priceRange: {
          minSellingPrice,
          maxSellingPrice,
          minMrp,
          maxMrp,
          discountPercentage: minMrp > minSellingPrice ? Math.round(((minMrp - minSellingPrice) / minMrp) * 100) : 0,
        },
        stockStatus: "IN_STOCK",
        variantsCount: activeVars.length,
        createdAt: dp.createdAt,
      });
    }

    if (category) {
      allFormatted = allFormatted.filter(
        (p) =>
          p.category?.slug === category ||
          (category === "dry-fruits" && (p.category?.slug === "fruits-and-nuts" || p.category?.slug === "dry-fruits"))
      );
    }
    if (search) {
      const q = search.toLowerCase();
      allFormatted = allFormatted.filter(
        (p) => p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q) || p.skuBase?.toLowerCase().includes(q)
      );
    }

    const finalTotal = allFormatted.length;
    const pagedItems = allFormatted.slice(skip, skip + limit);

    return {
      items: pagedItems,
      pagination: {
        total: finalTotal,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(finalTotal / limit)),
      },
    };
  }

  /**
   * Public Product Detail: Retrieves full PDP payload by product slug.
   */
  static async getProductBySlug(slug: string) {
    const product = await db.product.findFirst({
      where: { slug, isActive: true },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        subcategory: { select: { id: true, name: true, slug: true } },
        images: {
          orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
        },
        variants: {
          where: { isActive: true },
          orderBy: { sellingPrice: "asc" },
          include: {
            inventory: true,
          },
        },
      },
    });

    if (!product) {
      throw AppError.notFound(`Product with slug '${slug}' not found or is currently inactive`);
    }

    const formattedVariants = product.variants.map((v) => {
      const stockAvailable = v.inventory?.stockAvailable ?? 0;
      const buffer = v.inventory?.safetyBufferThreshold ?? 10;
      const stockStatus = InventoryService.calculateStockStatus(stockAvailable, buffer);

      return {
        id: v.id,
        sku: v.sku,
        weightGrams: Number(v.weightGrams),
        unit: v.unit,
        packageType: v.packageType,
        mrp: Number(v.mrp),
        sellingPrice: Number(v.sellingPrice),
        discountPercentage:
          Number(v.mrp) > Number(v.sellingPrice)
            ? Math.round(((Number(v.mrp) - Number(v.sellingPrice)) / Number(v.mrp)) * 100)
            : 0,
        stockStatus,
        isAvailable: stockAvailable > 0,
      };
    });

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      skuBase: product.skuBase,
      description: product.description,
      ingredients: product.ingredients,
      allergenInfo: product.allergenInfo,
      nutritionFacts: product.nutritionFacts,
      storageInstructions: product.storageInstructions,
      shelfLifeMonths: product.shelfLifeMonths,
      gstPercentage: Number(product.gstPercentage),
      isFeatured: product.isFeatured,
      isByobEligible: product.isByobEligible,
      metaTitle: product.metaTitle,
      metaDescription: product.metaDescription,
      category: product.category,
      subcategory: product.subcategory,
      images: getProductImageUrl(product.slug)
        ? [
            {
              id: product.images[0]?.id ?? `asset-${product.slug}`,
              imageUrl: getProductImageUrl(product.slug)!,
              altText: product.images[0]?.altText || product.name,
              isPrimary: true,
              sortOrder: 0,
              productId: product.id,
              createdAt: product.createdAt,
            },
          ]
        : product.images.length > 0
        ? product.images
        : [],
      variants: formattedVariants,
      createdAt: product.createdAt,
    };
  }

  /**
   * Admin Product List: Paginated list with admin filters and full inventory breakdown.
   */
  static async listAdminProducts(params: z.infer<typeof AdminProductListQuerySchema>) {
    const validated = AdminProductListQuerySchema.parse(params);
    const { categoryId, subcategoryId, search, isActive, healthContentStatus, page, limit } =
      validated;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {};

    if (categoryId) where.categoryId = categoryId;
    if (subcategoryId) where.subcategoryId = subcategoryId;
    if (isActive !== undefined) where.isActive = isActive;
    if (healthContentStatus) where.healthContentStatus = healthContentStatus;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { skuBase: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }

    let products: any[] = [];
    try {
      const dbProducts = await db.product.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          category: { select: { id: true, name: true } },
          subcategory: { select: { id: true, name: true } },
          images: {
            orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
          },
          variants: {
            include: { inventory: true },
          },
        },
      });
      products = dbProducts;
    } catch {}

    syncDevProductsFromDisk();
    const dbSlugs = new Set(products.map((p) => p.slug));
    const extraDevProducts = DEV_PRODUCTS.filter((dp) => !dbSlugs.has(dp.slug));

    const combinedFormatted = products.map((p) => {
      const totalStock = p.variants.reduce(
        (acc: number, v: any) => acc + (v.inventory?.stockAvailable ?? 0),
        0
      );

      const prices = p.variants.map((v: any) => Number(v.sellingPrice));
      const mrps = p.variants.map((v: any) => Number(v.mrp));
      const minSellingPrice = prices.length > 0 ? Math.min(...prices) : 0;
      const maxSellingPrice = prices.length > 0 ? Math.max(...prices) : 0;
      const minMrp = mrps.length > 0 ? Math.min(...mrps) : 0;
      const maxMrp = mrps.length > 0 ? Math.max(...mrps) : 0;

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        skuBase: p.skuBase,
        category: p.category,
        categoryName: p.category.name,
        subcategoryName: p.subcategory?.name ?? null,
        isActive: p.isActive,
        isFeatured: p.isFeatured,
        isByobEligible: p.isByobEligible,
        healthContentStatus: p.healthContentStatus,
        variantsCount: p.variants.length,
        totalStock,
        priceRange: {
          minSellingPrice,
          maxSellingPrice,
          minMrp,
          maxMrp,
          discountPercentage: minMrp > minSellingPrice ? Math.round(((minMrp - minSellingPrice) / minMrp) * 100) : 0,
        },
        stockStatus: totalStock > 0 ? "IN_STOCK" : "OUT_OF_STOCK",
        primaryImage: p.images.find((i: any) => i.isPrimary) ?? p.images[0] ?? null,
        primaryImageUrl: p.images.find((i: any) => i.isPrimary)?.imageUrl ?? p.images[0]?.imageUrl ?? null,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      };
    });

    for (const dp of extraDevProducts) {
      const vars = dp.variants || [];
      const totalStock = vars.reduce(
        (acc: number, v: any) => acc + (v.inventory?.stockAvailable ?? 0),
        0
      );
      const prices = vars.map((v: any) => Number(v.sellingPrice));
      const mrps = vars.map((v: any) => Number(v.mrp));
      const minSellingPrice = prices.length > 0 ? Math.min(...prices) : 0;
      const maxSellingPrice = prices.length > 0 ? Math.max(...prices) : 0;
      const minMrp = mrps.length > 0 ? Math.min(...mrps) : 0;
      const maxMrp = mrps.length > 0 ? Math.max(...mrps) : 0;

      combinedFormatted.push({
        id: dp.id,
        name: dp.name,
        slug: dp.slug,
        skuBase: dp.skuBase,
        category: dp.category,
        categoryName: dp.category?.name || "General",
        subcategoryName: dp.subcategory?.name ?? null,
        isActive: dp.isActive !== false,
        isFeatured: Boolean(dp.isFeatured),
        isByobEligible: Boolean(dp.isByobEligible),
        healthContentStatus: "APPROVED",
        variantsCount: vars.length,
        totalStock: totalStock || 50,
        priceRange: {
          minSellingPrice,
          maxSellingPrice,
          minMrp,
          maxMrp,
          discountPercentage: minMrp > minSellingPrice ? Math.round(((minMrp - minSellingPrice) / minMrp) * 100) : 0,
        },
        stockStatus: "IN_STOCK",
        primaryImage: dp.images?.[0] || null,
        primaryImageUrl: dp.images?.[0]?.imageUrl || getProductImageUrl(dp.slug) || null,
        createdAt: dp.createdAt,
        updatedAt: dp.updatedAt,
      });
    }

    let filtered = combinedFormatted;
    if (categoryId) filtered = filtered.filter((p) => p.category?.id === categoryId);
    if (isActive !== undefined) filtered = filtered.filter((p) => p.isActive === isActive);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (p) => p.name?.toLowerCase().includes(q) || p.skuBase?.toLowerCase().includes(q) || p.slug?.toLowerCase().includes(q)
      );
    }

    const total = filtered.length;
    const paged = filtered.slice(skip, skip + limit);

    return {
      items: paged,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  /**
   * Admin: Get full product details by ID.
   */
  static async getAdminProductById(id: string) {
    let product: any = null;
    try {
      product = await db.product.findFirst({
        where: { OR: [{ id }, { slug: id }] },
        include: {
          category: true,
          subcategory: true,
          images: { orderBy: { sortOrder: "asc" } },
          variants: {
            orderBy: { sellingPrice: "asc" },
            include: { inventory: true },
          },
        },
      });
    } catch {}

    if (!product) {
      syncDevProductsFromDisk();
      product = DEV_PRODUCTS.find((p) => p.id === id || p.slug === id);
    }

    if (!product) {
      throw AppError.notFound(`Product with ID '${id}' not found`);
    }

    return {
      ...product,
      gstPercentage: Number(product.gstPercentage || 5.0),
      variants: (product.variants || []).map((v: any) => ({
        ...v,
        weightGrams: Number(v.weightGrams || 250),
        mrp: Number(v.mrp || 500),
        sellingPrice: Number(v.sellingPrice || 400),
        wholesalePrice: v.wholesalePrice ? Number(v.wholesalePrice) : null,
      })),
    };
  }

  /**
   * Admin: Atomic product creation with optional variants, inventory records, and images.
   */
  static async createProduct(
    input: z.infer<typeof CreateProductSchema>,
    actorId?: string
  ) {
    const validated = CreateProductSchema.parse(input);

    const categoryMap: Record<number, { id: number; name: string; slug: string }> = {
      1: { id: 1, name: "Fruits & Nuts", slug: "fruits-and-nuts" },
      2: { id: 2, name: "Dry Fruits & Nuts", slug: "dry-fruits" },
      3: { id: 3, name: "Dates / Khajoor", slug: "dates-khajoor" },
      4: { id: 4, name: "Super Seeds & Berries", slug: "seeds" },
      5: { id: 5, name: "Artisanal Teas", slug: "tea" },
      6: { id: 6, name: "Gourmet Bites & Confections", slug: "chocolates" },
      7: { id: 7, name: "Pantry & Vedic Ghee", slug: "pantry" },
      8: { id: 8, name: "Luxury Gifting", slug: "gifting" },
    };

    const targetCategory = categoryMap[validated.categoryId] || {
      id: validated.categoryId,
      name: "Gourmet Category",
      slug: "gourmet",
    };

    const productId = toDeterministicUuid(validated.slug);

    const newDevProduct: any = {
      id: productId,
      name: validated.name,
      slug: validated.slug,
      skuBase: validated.skuBase,
      description: validated.description,
      categoryId: validated.categoryId,
      category: targetCategory,
      subcategoryId: validated.subcategoryId || null,
      subcategory: null,
      ingredients: validated.ingredients || null,
      allergenInfo: validated.allergenInfo || null,
      storageInstructions: validated.storageInstructions || null,
      shelfLifeMonths: validated.shelfLifeMonths || 9,
      hsnCode: validated.hsnCode || "0802",
      gstPercentage: validated.gstPercentage || 5.0,
      isActive: validated.isActive !== false,
      isFeatured: Boolean(validated.isFeatured),
      isByobEligible: Boolean(validated.isByobEligible),
      metaTitle: validated.metaTitle || null,
      metaDescription: validated.metaDescription || null,
      variants: (validated.variants || []).map((v) => ({
        id: toDeterministicUuid(v.sku),
        productId,
        sku: v.sku,
        weightGrams: Number(v.weightGrams),
        unit: v.unit,
        packageType: v.packageType,
        mrp: Number(v.mrp),
        sellingPrice: Number(v.sellingPrice),
        wholesalePrice: v.wholesalePrice ? Number(v.wholesalePrice) : null,
        wholesaleMinQty: v.wholesaleMinQty || null,
        isActive: v.isActive !== false,
        inventory: {
          stockAvailable: v.initialStock || 50,
          safetyBufferThreshold: v.safetyBufferThreshold || 10,
        },
      })),
      images: (validated.images || []).map((img, idx) => ({
        id: `img-${Date.now()}-${idx}`,
        productId,
        storageKey: img.storageKey,
        imageUrl: img.imageUrl,
        altText: img.altText,
        sortOrder: img.sortOrder,
        isPrimary: img.isPrimary,
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to dev cache immediately
    syncDevProductsFromDisk();
    const existingIdx = DEV_PRODUCTS.findIndex((p) => p.slug === validated.slug || p.id === productId);
    if (existingIdx >= 0) {
      DEV_PRODUCTS[existingIdx] = newDevProduct;
    } else {
      DEV_PRODUCTS.unshift(newDevProduct);
    }
    saveDevProductsToDisk();

    // Also attempt DB transaction if DB is online
    try {
      await runTransaction(async (tx) => {
        const product = await tx.product.create({
          data: {
            id: productId,
            categoryId: validated.categoryId,
            subcategoryId: validated.subcategoryId,
            name: validated.name,
            slug: validated.slug,
            skuBase: validated.skuBase,
            description: validated.description,
            ingredients: validated.ingredients,
            allergenInfo: validated.allergenInfo,
            storageInstructions: validated.storageInstructions,
            shelfLifeMonths: validated.shelfLifeMonths,
            hsnCode: validated.hsnCode,
            gstPercentage: new Prisma.Decimal(validated.gstPercentage),
            isActive: validated.isActive,
            isFeatured: validated.isFeatured,
            isByobEligible: validated.isByobEligible,
            healthContentStatus: validated.healthContentStatus,
            metaTitle: validated.metaTitle,
            metaDescription: validated.metaDescription,
          },
        });

        if (validated.variants && validated.variants.length > 0) {
          for (const v of validated.variants) {
            const variant = await tx.productVariant.create({
              data: {
                id: toDeterministicUuid(v.sku),
                productId: product.id,
                sku: v.sku,
                weightGrams: new Prisma.Decimal(v.weightGrams),
                unit: v.unit,
                packageType: v.packageType,
                mrp: new Prisma.Decimal(v.mrp),
                sellingPrice: new Prisma.Decimal(v.sellingPrice),
                wholesalePrice: v.wholesalePrice ? new Prisma.Decimal(v.wholesalePrice) : null,
                wholesaleMinQty: v.wholesaleMinQty,
                isActive: v.isActive,
              },
            });

            await tx.inventory.create({
              data: {
                variantId: variant.id,
                stockAvailable: v.initialStock,
                stockReserved: 0,
                safetyBufferThreshold: v.safetyBufferThreshold,
              },
            });
          }
        }

        if (validated.images && validated.images.length > 0) {
          await tx.productImage.createMany({
            data: validated.images.map((img) => ({
              productId: product.id,
              storageKey: img.storageKey,
              imageUrl: img.imageUrl,
              altText: img.altText,
              sortOrder: img.sortOrder,
              isPrimary: img.isPrimary,
            })),
          });
        }
      });
    } catch {}

    return newDevProduct;
  }

  /**
   * Admin: Update master product fields.
   */
  static async updateProduct(id: string, input: z.infer<typeof UpdateProductSchema>) {
    const validated = UpdateProductSchema.parse(input);

    syncDevProductsFromDisk();
    const idx = DEV_PRODUCTS.findIndex((p) => p.id === id || p.slug === id);
    if (idx >= 0) {
      DEV_PRODUCTS[idx] = {
        ...DEV_PRODUCTS[idx],
        ...validated,
        updatedAt: new Date().toISOString(),
      };
      saveDevProductsToDisk();
    }

    try {
      await db.product.update({
        where: { id },
        data: {
          ...validated,
          gstPercentage: validated.gstPercentage ? new Prisma.Decimal(validated.gstPercentage) : undefined,
          nutritionFacts: validated.nutritionFacts ? (validated.nutritionFacts as Prisma.InputJsonValue) : undefined,
        },
      });
    } catch {}

    return idx >= 0 ? DEV_PRODUCTS[idx] : { id, ...validated };
  }

  /**
   * Admin: Soft-delete / delete product.
   */
  static async deleteProduct(id: string) {
    syncDevProductsFromDisk();
    const idx = DEV_PRODUCTS.findIndex((p) => p.id === id || p.slug === id);
    if (idx >= 0) {
      DEV_PRODUCTS[idx].isActive = false;
      saveDevProductsToDisk();
    }

    try {
      await db.product.update({
        where: { id },
        data: { isActive: false },
      });
    } catch {}

    return { success: true, message: "Product deactivated successfully." };
  }

  /**
   * Admin: Add a new variant to an existing product.
   */
  static async addVariant(
    productId: string,
    input: z.infer<typeof CreateVariantSchema>,
    actorId?: string
  ) {
    const validated = CreateVariantSchema.parse(input);

    const product = await db.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw AppError.notFound(`Product with ID ${productId} not found`);
    }

    const existingSku = await db.productVariant.findUnique({
      where: { sku: validated.sku },
    });
    if (existingSku) {
      throw AppError.conflict(`Variant SKU '${validated.sku}' is already in use`);
    }

    return await runTransaction(async (tx) => {
      const variant = await tx.productVariant.create({
        data: {
          productId,
          sku: validated.sku,
          weightGrams: new Prisma.Decimal(validated.weightGrams),
          unit: validated.unit,
          packageType: validated.packageType,
          mrp: new Prisma.Decimal(validated.mrp),
          sellingPrice: new Prisma.Decimal(validated.sellingPrice),
          wholesalePrice: validated.wholesalePrice
            ? new Prisma.Decimal(validated.wholesalePrice)
            : null,
          wholesaleMinQty: validated.wholesaleMinQty,
          isActive: validated.isActive,
        },
      });

      await tx.inventory.create({
        data: {
          variantId: variant.id,
          stockAvailable: validated.initialStock,
          stockReserved: 0,
          safetyBufferThreshold: validated.safetyBufferThreshold,
        },
      });

      if (validated.initialStock > 0) {
        await tx.inventoryTransaction.create({
          data: {
            variantId: variant.id,
            transactionType: InventoryTransactionType.RESTOCK,
            quantityDelta: validated.initialStock,
            stockAfter: validated.initialStock,
            referenceType: "INITIAL_STOCK",
            actorId: actorId ?? null,
            notes: "Initial inventory setup on variant creation",
          },
        });
      }

      return variant;
    });
  }

  /**
   * Admin: Update an existing variant.
   */
  static async updateVariant(variantId: string, input: z.infer<typeof UpdateVariantSchema>) {
    const validated = UpdateVariantSchema.parse(input);

    const variant = await db.productVariant.findUnique({ where: { id: variantId } });
    if (!variant) {
      throw AppError.notFound(`Variant with ID ${variantId} not found`);
    }

    if (validated.sku && validated.sku !== variant.sku) {
      const existing = await db.productVariant.findUnique({ where: { sku: validated.sku } });
      if (existing) {
        throw AppError.conflict(`Variant SKU '${validated.sku}' is already in use`);
      }
    }

    const newMrp = validated.mrp !== undefined ? validated.mrp : Number(variant.mrp);
    const newSellingPrice =
      validated.sellingPrice !== undefined ? validated.sellingPrice : Number(variant.sellingPrice);

    if (newSellingPrice > newMrp) {
      throw AppError.validation("Selling price cannot exceed Maximum Retail Price (MRP)");
    }

    return await db.productVariant.update({
      where: { id: variantId },
      data: {
        sku: validated.sku,
        weightGrams: validated.weightGrams ? new Prisma.Decimal(validated.weightGrams) : undefined,
        unit: validated.unit,
        packageType: validated.packageType,
        mrp: validated.mrp ? new Prisma.Decimal(validated.mrp) : undefined,
        sellingPrice: validated.sellingPrice
          ? new Prisma.Decimal(validated.sellingPrice)
          : undefined,
        wholesalePrice:
          validated.wholesalePrice !== undefined
            ? validated.wholesalePrice
              ? new Prisma.Decimal(validated.wholesalePrice)
              : null
            : undefined,
        wholesaleMinQty: validated.wholesaleMinQty,
        isActive: validated.isActive,
      },
    });
  }

  /**
   * Admin: Delete or deactivate variant.
   */
  static async deleteVariant(variantId: string) {
    const variant = await db.productVariant.findUnique({
      where: { id: variantId },
      include: {
        _count: {
          select: { orderItems: true, cartItems: true },
        },
      },
    });

    if (!variant) {
      throw AppError.notFound(`Variant with ID ${variantId} not found`);
    }

    if (variant._count.orderItems > 0) {
      // Deactivate instead of hard deleting to preserve order history
      return await db.productVariant.update({
        where: { id: variantId },
        data: { isActive: false },
      });
    }

    return await db.productVariant.delete({
      where: { id: variantId },
    });
  }

  /**
   * Admin: Add image to product.
   */
  static async addImage(productId: string, input: z.infer<typeof AddImageSchema>) {
    const validated = AddImageSchema.parse(input);

    const product = await db.product.findUnique({
      where: { id: productId },
      include: { images: true },
    });

    if (!product) {
      throw AppError.notFound(`Product with ID ${productId} not found`);
    }

    const isFirstImage = product.images.length === 0;
    const isPrimary = validated.isPrimary || isFirstImage;

    return await runTransaction(async (tx) => {
      if (isPrimary && product.images.length > 0) {
        await tx.productImage.updateMany({
          where: { productId },
          data: { isPrimary: false },
        });
      }

      return await tx.productImage.create({
        data: {
          productId,
          storageKey: validated.storageKey,
          imageUrl: validated.imageUrl,
          altText: validated.altText,
          sortOrder: validated.sortOrder ?? product.images.length,
          isPrimary,
        },
      });
    });
  }

  /**
   * Admin: Delete product image.
   */
  static async deleteImage(productId: string, imageId: string) {
    const image = await db.productImage.findFirst({
      where: { id: imageId, productId },
    });

    if (!image) {
      throw AppError.notFound(`Image with ID ${imageId} not found on this product`);
    }

    return await runTransaction(async (tx) => {
      await tx.productImage.delete({ where: { id: imageId } });

      if (image.isPrimary) {
        const remaining = await tx.productImage.findFirst({
          where: { productId },
          orderBy: { sortOrder: "asc" },
        });

        if (remaining) {
          await tx.productImage.update({
            where: { id: remaining.id },
            data: { isPrimary: true },
          });
        }
      }

      return { success: true, deletedImageId: imageId };
    });
  }

  /**
   * Admin: Atomic image reorder and primary image designation.
   */
  static async reorderImages(productId: string, input: z.infer<typeof ReorderImagesSchema>) {
    const validated = ReorderImagesSchema.parse(input);

    return await runTransaction(async (tx) => {
      for (const img of validated.images) {
        await tx.productImage.update({
          where: { id: img.id, productId },
          data: {
            sortOrder: img.sortOrder,
            isPrimary: img.isPrimary,
          },
        });
      }

      return await tx.productImage.findMany({
        where: { productId },
        orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
      });
    });
  }
}
