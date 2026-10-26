import { z } from "zod";
import { HealthContentStatus, InventoryTransactionType, WeightUnit } from "@prisma/client";

// Regex validators
export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const SKU_REGEX = /^[A-Za-z0-9_-]{3,64}$/;

// ----------------------------------------------------------------------
// CATEGORY SCHEMAS
// ----------------------------------------------------------------------

export const CreateCategorySchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters").max(128),
  slug: z.string().regex(SLUG_REGEX, "Slug must be lowercase alphanumeric with hyphens (e.g., dry-fruits)").max(128),
  description: z.string().max(2000).optional().nullable(),
  imageUrl: z.string().url("Must be a valid URL").optional().nullable(),
  displayOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  metaTitle: z.string().max(128).optional().nullable(),
  metaDescription: z.string().max(255).optional().nullable(),
});

export const UpdateCategorySchema = CreateCategorySchema.partial();

export const CreateSubcategorySchema = z.object({
  categoryId: z.number().int().positive("Valid category ID is required"),
  name: z.string().min(2, "Subcategory name must be at least 2 characters").max(128),
  slug: z.string().regex(SLUG_REGEX, "Slug must be lowercase alphanumeric with hyphens").max(128),
  description: z.string().max(2000).optional().nullable(),
  displayOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const UpdateSubcategorySchema = CreateSubcategorySchema.partial();

// ----------------------------------------------------------------------
// VARIANT SCHEMAS
// ----------------------------------------------------------------------

export const CreateVariantSchema = z.object({
  sku: z.string().regex(SKU_REGEX, "SKU must contain alphanumeric characters, underscores or hyphens").max(64),
  weightGrams: z.number().positive("Weight in grams must be greater than 0"),
  unit: z.nativeEnum(WeightUnit).default(WeightUnit.GRAMS),
  packageType: z.string().max(64).default("STAND_UP_POUCH"),
  mrp: z.number().positive("MRP must be greater than 0"),
  sellingPrice: z.number().positive("Selling price must be greater than 0"),
  wholesalePrice: z.number().positive("Wholesale price must be greater than 0").optional().nullable(),
  wholesaleMinQty: z.number().int().positive().optional().nullable(),
  isActive: z.boolean().default(true),
  initialStock: z.number().int().min(0).default(0),
  safetyBufferThreshold: z.number().int().min(0).default(10),
}).refine((data) => data.sellingPrice <= data.mrp, {
  message: "Selling price cannot exceed Maximum Retail Price (MRP)",
  path: ["sellingPrice"],
});

export const UpdateVariantSchema = z.object({
  sku: z.string().regex(SKU_REGEX).max(64).optional(),
  weightGrams: z.number().positive().optional(),
  unit: z.nativeEnum(WeightUnit).optional(),
  packageType: z.string().max(64).optional(),
  mrp: z.number().positive().optional(),
  sellingPrice: z.number().positive().optional(),
  wholesalePrice: z.number().positive().optional().nullable(),
  wholesaleMinQty: z.number().int().positive().optional().nullable(),
  isActive: z.boolean().optional(),
}).refine((data) => {
  if (data.sellingPrice !== undefined && data.mrp !== undefined) {
    return data.sellingPrice <= data.mrp;
  }
  return true;
}, {
  message: "Selling price cannot exceed Maximum Retail Price (MRP)",
  path: ["sellingPrice"],
});

// ----------------------------------------------------------------------
// IMAGE SCHEMAS
// ----------------------------------------------------------------------

export const AddImageSchema = z.object({
  storageKey: z.string().min(1, "Storage key is required"),
  imageUrl: z
    .string()
    .min(1, "Image path or URL is required")
    .refine(
      (val) => val.startsWith("/") || val.startsWith("http://") || val.startsWith("https://") || val.startsWith("data:"),
      "Must be a valid local path (e.g., /images/products/...) or HTTP URL"
    ),
  altText: z.string().min(1).max(255),
  sortOrder: z.number().int().min(0).default(0),
  isPrimary: z.boolean().default(false),
});

export const ReorderImagesSchema = z.object({
  images: z.array(
    z.object({
      id: z.string().uuid("Image ID must be a valid UUID"),
      sortOrder: z.number().int().min(0),
      isPrimary: z.boolean().default(false),
    })
  ).min(1, "At least one image is required to reorder"),
});

// ----------------------------------------------------------------------
// PRODUCT SCHEMAS
// ----------------------------------------------------------------------

export const CreateProductSchema = z.object({
  categoryId: z.number().int().positive("Category is required"),
  subcategoryId: z.number().int().positive().optional().nullable(),
  name: z.string().min(2, "Product name must be at least 2 characters").max(255),
  slug: z.string().regex(SLUG_REGEX, "Slug must be lowercase alphanumeric with hyphens").max(255),
  skuBase: z.string().regex(SKU_REGEX, "SKU Base must be alphanumeric (e.g., FN-ALM-MAMRA)").max(64),
  description: z.string().min(10, "Description must be at least 10 characters"),
  ingredients: z.string().max(2000).optional().nullable(),
  allergenInfo: z.string().max(1000).optional().nullable(),
  nutritionFacts: z.record(z.any()).optional().nullable(),
  storageInstructions: z.string().max(1000).optional().nullable(),
  shelfLifeMonths: z.number().int().positive().max(60).optional().nullable(),
  hsnCode: z.string().max(16).optional().nullable(),
  gstPercentage: z.number().min(0).max(28).default(5.0),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isByobEligible: z.boolean().default(false),
  healthContentStatus: z.nativeEnum(HealthContentStatus).default(HealthContentStatus.DRAFT_REVIEW),
  metaTitle: z.string().max(128).optional().nullable(),
  metaDescription: z.string().max(255).optional().nullable(),
  variants: z.array(CreateVariantSchema).optional(),
  images: z.array(AddImageSchema).optional(),
});

export const UpdateProductSchema = CreateProductSchema.omit({ variants: true, images: true }).partial();

// ----------------------------------------------------------------------
// INVENTORY SCHEMAS
// ----------------------------------------------------------------------

export const AdjustInventorySchema = z.object({
  variantId: z.string().uuid("Variant ID must be a valid UUID"),
  transactionType: z.enum([
    InventoryTransactionType.RESTOCK,
    InventoryTransactionType.AUDIT_ADJUST,
  ], {
    errorMap: () => ({ message: "Manual inventory adjustments must be RESTOCK or AUDIT_ADJUST" }),
  }),
  quantityDelta: z.number().int().refine((val) => val !== 0, {
    message: "Quantity delta cannot be zero",
  }),
  safetyBufferThreshold: z.number().int().min(0).optional(),
  notes: z.string().min(3, "Audit notes are mandatory for stock adjustments (minimum 3 characters)").max(1000),
  referenceType: z.string().max(32).optional(),
  referenceId: z.string().max(64).optional(),
});

// ----------------------------------------------------------------------
// QUERY SCHEMAS
// ----------------------------------------------------------------------

export const ProductListQuerySchema = z.object({
  category: z.string().optional(),
  subcategory: z.string().optional(),
  search: z.string().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  isFeatured: z.coerce.boolean().optional(),
  isByobEligible: z.coerce.boolean().optional(),
  inStockOnly: z.coerce.boolean().optional(),
  sort: z.enum(["featured", "price_asc", "price_desc", "newest", "name_asc"]).default("featured"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const AdminProductListQuerySchema = z.object({
  categoryId: z.coerce.number().int().optional(),
  subcategoryId: z.coerce.number().int().optional(),
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  healthContentStatus: z.nativeEnum(HealthContentStatus).optional(),
  stockStatus: z.enum(["ALL", "IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"]).default("ALL"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const AdminInventoryListQuerySchema = z.object({
  search: z.string().optional(),
  stockStatus: z.enum(["ALL", "LOW_STOCK", "OUT_OF_STOCK", "IN_STOCK"]).default("ALL"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const InventoryTransactionQuerySchema = z.object({
  variantId: z.string().uuid().optional(),
  transactionType: z.nativeEnum(InventoryTransactionType).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
