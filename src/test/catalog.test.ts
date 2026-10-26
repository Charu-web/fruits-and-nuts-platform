import assert from "node:assert";
import {
  CreateCategorySchema,
  CreateSubcategorySchema,
  CreateProductSchema,
  CreateVariantSchema,
  UpdateVariantSchema,
  ReorderImagesSchema,
  ProductListQuerySchema,
} from "../lib/validation/catalog.schema";
import { HealthContentStatus, WeightUnit } from "@prisma/client";

async function runCatalogTests() {
  console.log("🧪 Running Phase 9C Product Catalog Tests...\n");

  // ----------------------------------------------------------------------
  // Test 1: Category & Subcategory Schema Validation
  // ----------------------------------------------------------------------
  console.log("▶️ Test 1: Category & Subcategory Validation...");
  
  // Valid category
  const validCategory = CreateCategorySchema.parse({
    name: "Dry Fruits",
    slug: "dry-fruits",
    description: "Premium California almonds, cashews, and walnuts",
    displayOrder: 1,
    isActive: true,
  });
  assert.strictEqual(validCategory.slug, "dry-fruits");

  // Invalid slug (contains uppercase and spaces)
  assert.throws(() => {
    CreateCategorySchema.parse({
      name: "Dry Fruits",
      slug: "Dry Fruits & Nuts",
    });
  }, /Slug must be lowercase alphanumeric/);

  // Valid subcategory
  const validSubcategory = CreateSubcategorySchema.parse({
    categoryId: 1,
    name: "Almonds / Badam",
    slug: "almonds-badam",
    displayOrder: 1,
  });
  assert.strictEqual(validSubcategory.categoryId, 1);
  console.log("✅ Test 1 Passed: Category and subcategory schemas enforce naming and slug rules.");

  // ----------------------------------------------------------------------
  // Test 2: Product & Variant Pricing Rules (sellingPrice <= mrp)
  // ----------------------------------------------------------------------
  console.log("▶️ Test 2: Product Variant Pricing & Constraints...");

  // Valid variant
  const validVariant = CreateVariantSchema.parse({
    sku: "FN-ALM-MAMRA-500G",
    weightGrams: 500,
    unit: WeightUnit.GRAMS,
    packageType: "STAND_UP_POUCH",
    mrp: 1200,
    sellingPrice: 999,
    initialStock: 50,
    safetyBufferThreshold: 10,
  });
  assert.strictEqual(validVariant.sellingPrice, 999);
  assert.strictEqual(validVariant.mrp, 1200);

  // Invalid pricing: sellingPrice > mrp
  assert.throws(() => {
    CreateVariantSchema.parse({
      sku: "FN-ALM-MAMRA-500G",
      weightGrams: 500,
      mrp: 500,
      sellingPrice: 750, // Higher than MRP!
    });
  }, /Selling price cannot exceed Maximum Retail Price/);

  // Variant update pricing validation
  assert.throws(() => {
    UpdateVariantSchema.parse({
      mrp: 400,
      sellingPrice: 600,
    });
  }, /Selling price cannot exceed Maximum Retail Price/);
  console.log("✅ Test 2 Passed: Selling price <= MRP rule strictly enforced.");

  // ----------------------------------------------------------------------
  // Test 3: Master Product Schema & Health Status Draft Guard
  // ----------------------------------------------------------------------
  console.log("▶️ Test 3: Master Product Validation & Health Claims Safety...");

  const validProduct = CreateProductSchema.parse({
    categoryId: 1,
    subcategoryId: 2,
    name: "Mamra Almonds Grade-A",
    slug: "mamra-almonds-grade-a",
    skuBase: "FN-ALM-MAMRA",
    description: "Premium organic handpicked Iranian Mamra almonds.",
    ingredients: "100% Raw Mamra Almonds",
    allergenInfo: "Contains tree nuts",
    storageInstructions: "Store in a cool dry place in airtight container",
    shelfLifeMonths: 12,
    gstPercentage: 5,
  });

  // Default healthContentStatus must be DRAFT_REVIEW for regulatory safety
  assert.strictEqual(validProduct.healthContentStatus, HealthContentStatus.DRAFT_REVIEW);
  assert.strictEqual(validProduct.skuBase, "FN-ALM-MAMRA");

  // Invalid SKU base format (invalid characters)
  assert.throws(() => {
    CreateProductSchema.parse({
      categoryId: 1,
      name: "Almonds",
      slug: "almonds",
      skuBase: "FN@ALM#$%", // Invalid characters
      description: "Sample description that is long enough.",
    });
  }, /SKU Base must be alphanumeric/);
  console.log("✅ Test 3 Passed: Master product fields, SKU syntax, and health draft guards validated.");

  // ----------------------------------------------------------------------
  // Test 4: Image Reordering Schema
  // ----------------------------------------------------------------------
  console.log("▶️ Test 4: Image Management & Reorder Constraints...");

  const reorderPayload = ReorderImagesSchema.parse({
    images: [
      { id: "123e4567-e89b-12d3-a456-426614174000", sortOrder: 0, isPrimary: true },
      { id: "123e4567-e89b-12d3-a456-426614174001", sortOrder: 1, isPrimary: false },
    ],
  });
  assert.strictEqual(reorderPayload.images.length, 2);
  assert.strictEqual(reorderPayload.images[0].isPrimary, true);
  console.log("✅ Test 4 Passed: Image reordering schema validated.");

  // ----------------------------------------------------------------------
  // Test 5: Public Query Filtering & Pagination
  // ----------------------------------------------------------------------
  console.log("▶️ Test 5: Storefront Query Validation...");

  const query = ProductListQuerySchema.parse({
    category: "dry-fruits",
    sort: "price_asc",
    page: "2",
    limit: "10",
    minPrice: "200",
    maxPrice: "1500",
  });
  assert.strictEqual(query.page, 2);
  assert.strictEqual(query.limit, 10);
  assert.strictEqual(query.sort, "price_asc");
  assert.strictEqual(query.minPrice, 200);
  assert.strictEqual(query.maxPrice, 1500);
  console.log("✅ Test 5 Passed: Storefront query parameter coercion and validation passed.");

  console.log("\n🎉 All Phase 9C Catalog Tests passed successfully!\n");
}

runCatalogTests().catch((err) => {
  console.error("❌ Catalog test failure:", err);
  process.exit(1);
});
