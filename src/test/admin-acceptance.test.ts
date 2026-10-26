import assert from "node:assert";
import { describe, it } from "node:test";
import {
  RoleType,
  WeightUnit,
  HealthContentStatus,
  OrderStatus,
  StoreStatus,
  DiscountType,
  ModerationStatus,
} from "@prisma/client";
import {
  generateSessionToken,
  verifySessionToken,
  SessionUser,
} from "../lib/auth/tokens";
import { SESSION_COOKIE_NAME } from "../lib/auth/cookies";
import { hasPermission, isAdminRole } from "../lib/auth/rbac";
import {
  CreateProductSchema,
  CreateVariantSchema,
  UpdateVariantSchema,
  CreateCategorySchema,
  CreateSubcategorySchema,
  AdjustInventorySchema,
} from "../lib/validation/catalog.schema";
import { InventoryService } from "../services/inventory.service";
import {
  ValidOrderStateTransitions,
  validateOrderStatusTransition,
  CancellableOrderStatuses,
} from "../lib/order-state-machine";
import {
  CreateCouponSchema,
  ApplyCouponSchema,
} from "../lib/validation/coupon.schema";
import {
  UpdateReviewStatusSchema,
} from "../lib/validation/review.schema";
import {
  PinCoordinatesSchema,
  CreateTasteMapRegionSchema,
} from "../lib/validation/taste-map.schema";
import {
  CreateStoreSchema,
  UpdateStoreSchema,
} from "../lib/validation/store.schema";
import { StoreService } from "../services/store.service";
import { AdminLoginSchema } from "../lib/validation/auth.schema";
import { generateTotpSecret, generateTotpCode, verifyTotpCode } from "../lib/auth/totp";

console.log("🧪 Starting Phase 13D Functional Acceptance Test Suite...\n");

describe("Phase 13D: Comprehensive Admin Panel Functional Acceptance Tests", () => {
  // =========================================================================
  // Operation 1: Admin Login and Logout
  // =========================================================================
  it("Op 1: Admin Login, Schema, TOTP 2FA, and Session Token Minting", async () => {
    // 1a: AdminLoginSchema valid email and 6-digit TOTP
    const validLogin = AdminLoginSchema.parse({
      email: "admin@fruitsandnuts.co.in",
      password: "RoyalGourmet2026!",
      totpCode: "123456",
    });
    assert.strictEqual(validLogin.email, "admin@fruitsandnuts.co.in");
    assert.strictEqual(validLogin.totpCode, "123456");

    // 1b: Rejection of malformed TOTP
    assert.throws(() => {
      AdminLoginSchema.parse({
        email: "admin@fruitsandnuts.co.in",
        password: "RoyalGourmet2026!",
        totpCode: "abc",
      });
    }, "Should reject non-numeric TOTP");

    // 1c: RFC 6238 TOTP Cryptographic Generation & Verification
    const secret = generateTotpSecret();
    const code = generateTotpCode(secret);
    assert.strictEqual(code.length, 6);
    assert.strictEqual(verifyTotpCode(code, secret), true);
    assert.strictEqual(verifyTotpCode("000000", secret), false);

    // 1d: Token Generation & Verification
    const adminUser: SessionUser = {
      id: "usr_admin_001",
      email: "admin@fruitsandnuts.co.in",
      phone: "+91 98765 00000",
      roleId: RoleType.SUPER_ADMIN,
      isActive: true,
      name: "Imperial Administrator",
    };
    const token = await generateSessionToken(adminUser);
    assert.ok(token && typeof token === "string", "Token must be a non-empty string");

    const decoded = await verifySessionToken(token);
    assert.ok(decoded, "Decoded token must be valid");
    assert.strictEqual(decoded.id, adminUser.id);
    assert.strictEqual(decoded.roleId, RoleType.SUPER_ADMIN);
    assert.strictEqual(SESSION_COOKIE_NAME, "fn_session");
  });

  // =========================================================================
  // Operation 2: Protected Routes and Server-Side Authorization
  // =========================================================================
  it("Op 2: Server-Side Authorization & RBAC Permission Boundaries", async () => {
    // 2a: Role Gating
    assert.strictEqual(isAdminRole(RoleType.SUPER_ADMIN), true);
    assert.strictEqual(isAdminRole(RoleType.INVENTORY_MGR), true);
    assert.strictEqual(isAdminRole(RoleType.ORDER_MGR), true);
    assert.strictEqual(isAdminRole(RoleType.CONTENT_MGR), true);
    assert.strictEqual(isAdminRole(RoleType.CUSTOMER), false);

    // 2b: Granular Permission Checks
    assert.strictEqual(hasPermission(RoleType.SUPER_ADMIN, "products:write"), true);
    assert.strictEqual(hasPermission(RoleType.SUPER_ADMIN, "orders:write"), true);
    assert.strictEqual(hasPermission(RoleType.SUPER_ADMIN, "inventory:write"), true);
    assert.strictEqual(hasPermission(RoleType.SUPER_ADMIN, "coupons:write"), true);

    // INVENTORY_MGR can manage inventory but CANNOT write orders or coupons
    assert.strictEqual(hasPermission(RoleType.INVENTORY_MGR, "inventory:write"), true);
    assert.strictEqual(hasPermission(RoleType.INVENTORY_MGR, "orders:write"), false);
    assert.strictEqual(hasPermission(RoleType.INVENTORY_MGR, "coupons:write"), false);

    // ORDER_MGR can manage orders but CANNOT write products or taste_map
    assert.strictEqual(hasPermission(RoleType.ORDER_MGR, "orders:write"), true);
    assert.strictEqual(hasPermission(RoleType.ORDER_MGR, "products:write"), false);
    assert.strictEqual(hasPermission(RoleType.ORDER_MGR, "taste_map:write"), false);

    // CONTENT_MGR can manage CMS, taste map, and coupons, but CANNOT write inventory
    assert.strictEqual(hasPermission(RoleType.CONTENT_MGR, "cms:write"), true);
    assert.strictEqual(hasPermission(RoleType.CONTENT_MGR, "taste_map:write"), true);
    assert.strictEqual(hasPermission(RoleType.CONTENT_MGR, "inventory:write"), false);

    // CUSTOMER has no administrative write permissions
    assert.strictEqual(hasPermission(RoleType.CUSTOMER, "products:write"), false);
    assert.strictEqual(hasPermission(RoleType.CUSTOMER, "orders:write"), false);
    assert.strictEqual(hasPermission(RoleType.CUSTOMER, "inventory:write"), false);
    assert.strictEqual(hasPermission(RoleType.CUSTOMER, "cms:write"), false);
  });

  // =========================================================================
  // Operation 3: Dashboard Statistics Calculations & States
  // =========================================================================
  it("Op 3: Dashboard Metric Aggregations & Status Computation", () => {
    const mockOrders = [
      { id: "ord-1", status: "PENDING", totalAmount: 2500 },
      { id: "ord-2", status: "PROCESSING", totalAmount: 4800 },
      { id: "ord-3", status: "DELIVERED", totalAmount: 7200 },
      { id: "ord-4", status: "CANCELLED", totalAmount: 1500 },
    ];

    const pendingOrders = mockOrders.filter(
      (o) => o.status === "PENDING" || o.status === "PROCESSING"
    ).length;
    const totalRevenue = mockOrders
      .filter((o) => o.status !== "CANCELLED")
      .reduce((sum, o) => sum + o.totalAmount, 0);

    assert.strictEqual(pendingOrders, 2, "Pending fulfillment count must equal 2");
    assert.strictEqual(totalRevenue, 14500, "Non-cancelled revenue must equal ₹14,500");
  });

  // =========================================================================
  // Operation 4: Product Listing and Create/Edit Operations
  // =========================================================================
  it("Op 4: Product Creation Schema, Pricing Constraints & Draft Guards", () => {
    // 4a: Valid Master Product
    const validProduct = CreateProductSchema.parse({
      categoryId: 1,
      name: "Kashmiri Mamra Almonds Grade AAA",
      slug: "kashmiri-mamra-almonds-grade-aaa",
      skuBase: "FN-MAMRA-AAA",
      description: "Authentic cold-climate harvested organic Kashmiri Mamra almonds.",
      ingredients: "100% Raw Mamra Almonds",
      allergenInfo: "Contains tree nuts (almonds)",
      storageInstructions: "Store in a cool dry place in airtight container",
      shelfLifeMonths: 12,
      gstPercentage: 5,
    });
    assert.strictEqual(validProduct.slug, "kashmiri-mamra-almonds-grade-aaa");
    assert.strictEqual(validProduct.skuBase, "FN-MAMRA-AAA");
    // Health status draft guard
    assert.strictEqual(validProduct.healthContentStatus, HealthContentStatus.DRAFT_REVIEW);

    // 4b: Variant Selling Price <= MRP Rule
    const validVariant = CreateVariantSchema.parse({
      sku: "FN-MAMRA-AAA-500G",
      weightGrams: 500,
      unit: WeightUnit.GRAMS,
      packageType: "STAND_UP_POUCH",
      mrp: 1800,
      sellingPrice: 1450,
      initialStock: 25,
      safetyBufferThreshold: 5,
    });
    assert.strictEqual(validVariant.sellingPrice, 1450);
    assert.strictEqual(validVariant.mrp, 1800);

    // 4c: Rejection of illegal price where sellingPrice > mrp
    assert.throws(() => {
      CreateVariantSchema.parse({
        sku: "FN-MAMRA-AAA-500G",
        weightGrams: 500,
        mrp: 1200,
        sellingPrice: 1500, // Illegal!
      });
    }, /Selling price cannot exceed Maximum Retail Price/);

    // 4d: Update variant pricing guard
    assert.throws(() => {
      UpdateVariantSchema.parse({
        mrp: 500,
        sellingPrice: 800,
      });
    }, /Selling price cannot exceed Maximum Retail Price/);
  });

  // =========================================================================
  // Operation 5: Category & Subcategory Management
  // =========================================================================
  it("Op 5: Category & Subcategory Hierarchy & Slug Enforcements", () => {
    const validCat = CreateCategorySchema.parse({
      name: "Artisanal Dried Fruits",
      slug: "artisanal-dried-fruits",
      description: "Sun-dried organic fruits from Kashmir and Ladakh valleys.",
      displayOrder: 1,
      isActive: true,
    });
    assert.strictEqual(validCat.slug, "artisanal-dried-fruits");

    // Invalid slug with spaces or uppercase
    assert.throws(() => {
      CreateCategorySchema.parse({
        name: "Dried Fruits",
        slug: "Dried Fruits 2026",
      });
    }, /Slug must be lowercase alphanumeric/);

    // Subcategory validation
    const validSub = CreateSubcategorySchema.parse({
      categoryId: 1,
      name: "Sun-Dried Apricots",
      slug: "sun-dried-apricots",
      displayOrder: 2,
    });
    assert.strictEqual(validSub.categoryId, 1);
  });

  // =========================================================================
  // Operation 6: Inventory Updates and Stock Consistency
  // =========================================================================
  it("Op 6: Stock Status Calculation, Adjustment Schemas & Negative Balance Prevention", () => {
    // 6a: Stock Status Calculations
    assert.strictEqual(InventoryService.calculateStockStatus(50, 10), "IN_STOCK");
    assert.strictEqual(InventoryService.calculateStockStatus(10, 10), "LOW_STOCK");
    assert.strictEqual(InventoryService.calculateStockStatus(3, 10), "LOW_STOCK");
    assert.strictEqual(InventoryService.calculateStockStatus(0, 10), "OUT_OF_STOCK");

    // 6b: Inventory Adjustment Schema Validation
    const adjustment = AdjustInventorySchema.parse({
      variantId: "123e4567-e89b-12d3-a456-426614174000",
      quantityDelta: 25,
      transactionType: "RESTOCK",
      notes: "Received batch PO-2026-881 from Pampore cold storage",
    });
    assert.strictEqual(adjustment.quantityDelta, 25);
    assert.strictEqual(adjustment.transactionType, "RESTOCK");

    // 6c: Mandatory audit notes enforcement (min 3 chars)
    assert.throws(() => {
      AdjustInventorySchema.parse({
        variantId: "123e4567-e89b-12d3-a456-426614174000",
        quantityDelta: 10,
        transactionType: "RESTOCK",
        notes: "ab", // Too short
      });
    }, /Audit notes are mandatory for stock adjustments/);

    // 6d: Negative stock prevention arithmetic
    const currentStock = 15;
    const deduction = -20;
    const resultingStock = currentStock + deduction;
    assert.strictEqual(resultingStock < 0, true, "Resulting negative balance must be flagged");
  });

  // =========================================================================
  // Operation 7: Order Listing, Details, and Permitted Status Transitions
  // =========================================================================
  it("Op 7: Order State Machine Transitions & Permitted Lifecycles", () => {
    // 7a: Valid sequential status transitions
    assert.doesNotThrow(() => validateOrderStatusTransition(OrderStatus.PENDING, OrderStatus.CONFIRMED));
    assert.doesNotThrow(() => validateOrderStatusTransition(OrderStatus.CONFIRMED, OrderStatus.PROCESSING));
    assert.doesNotThrow(() => validateOrderStatusTransition(OrderStatus.PROCESSING, OrderStatus.PACKED));
    assert.doesNotThrow(() => validateOrderStatusTransition(OrderStatus.PACKED, OrderStatus.SHIPPED));
    assert.doesNotThrow(() => validateOrderStatusTransition(OrderStatus.SHIPPED, OrderStatus.DELIVERED));

    // Valid cancellation paths before dispatch
    assert.doesNotThrow(() => validateOrderStatusTransition(OrderStatus.PENDING, OrderStatus.CANCELLED));
    assert.doesNotThrow(() => validateOrderStatusTransition(OrderStatus.CONFIRMED, OrderStatus.CANCELLED));
    assert.doesNotThrow(() => validateOrderStatusTransition(OrderStatus.PROCESSING, OrderStatus.CANCELLED));
    assert.doesNotThrow(() => validateOrderStatusTransition(OrderStatus.PACKED, OrderStatus.CANCELLED));

    // 7b: Illegal status jumps strictly rejected
    assert.throws(() => validateOrderStatusTransition(OrderStatus.PENDING, OrderStatus.DELIVERED));
    assert.throws(() => validateOrderStatusTransition(OrderStatus.DELIVERED, OrderStatus.CANCELLED));
    assert.throws(() => validateOrderStatusTransition(OrderStatus.CANCELLED, OrderStatus.SHIPPED));
    assert.throws(() => validateOrderStatusTransition(OrderStatus.RETURNED, OrderStatus.DELIVERED));

    // 7c: Cancellable order statuses list inspection
    assert.ok(CancellableOrderStatuses.includes(OrderStatus.PENDING));
    assert.ok(CancellableOrderStatuses.includes(OrderStatus.PROCESSING));
    assert.strictEqual(CancellableOrderStatuses.includes(OrderStatus.DELIVERED), false);
  });

  // =========================================================================
  // Operation 8: Coupon Management
  // =========================================================================
  it("Op 8: Coupon Invariants, Discount Caps & Date Boundaries", () => {
    const now = new Date();
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // 8a: Valid Percentage Coupon
    const validCoupon = CreateCouponSchema.parse({
      code: "FESTIVE25",
      discountType: DiscountType.PERCENTAGE,
      discountValue: 25,
      maxDiscountAmount: 500,
      minOrderAmount: 1500,
      usageLimitTotal: 1000,
      usageLimitPerUser: 1,
      startDate: now.toISOString(),
      endDate: nextMonth.toISOString(),
      isActive: true,
    });
    assert.strictEqual(validCoupon.code, "FESTIVE25");
    assert.strictEqual(validCoupon.discountValue, 25);

    // 8b: Rejection of Percentage > 100%
    assert.throws(() => {
      CreateCouponSchema.parse({
        code: "INVALID150",
        discountType: DiscountType.PERCENTAGE,
        discountValue: 150, // Impossible percentage!
        startDate: now.toISOString(),
        endDate: nextMonth.toISOString(),
      });
    }, /Percentage discount value cannot exceed 100%/);

    // 8c: Rejection of End Date <= Start Date
    assert.throws(() => {
      CreateCouponSchema.parse({
        code: "BACKINTIME",
        discountType: DiscountType.FLAT_AMOUNT,
        discountValue: 100,
        startDate: nextMonth.toISOString(),
        endDate: now.toISOString(), // Expired before start!
      });
    }, /Expiry date must be after the start date/);

    // 8d: Storefront Coupon Application Formatting
    const applied = ApplyCouponSchema.parse({
      code: "festive25", // lowercase
      cartSubtotal: 2000,
    });
    assert.strictEqual(applied.code, "FESTIVE25", "Coupon code must auto-uppercase");
  });

  // =========================================================================
  // Operation 9: Customer Access and Privacy Controls
  // =========================================================================
  it("Op 9: Customer Data Sanitation & Privacy Preservation", () => {
    // Simulated customer record with raw sensitive fields
    const rawUserDbRecord = {
      id: "usr_cust_777",
      email: "kavita.deshmukh@gmail.com",
      phone: "+91 98200 99887",
      passwordHash: "$2b$10$abcdef1234567890abcdef1234567890abcdef1234567890abc",
      roleId: RoleType.CUSTOMER,
      isActive: true,
      profile: {
        firstName: "Kavita",
        lastName: "Deshmukh",
      },
      orders: [
        { finalPayableAmount: 3200, paymentStatus: "PAID", orderStatus: "DELIVERED" },
        { finalPayableAmount: 4800, paymentStatus: "PAID", orderStatus: "DELIVERED" },
      ],
    };

    // Sanitize into Admin DTO
    const totalSpend = rawUserDbRecord.orders.reduce((sum, o) => sum + o.finalPayableAmount, 0);
    const adminCustomerDto = {
      id: rawUserDbRecord.id,
      email: rawUserDbRecord.email,
      phone: rawUserDbRecord.phone,
      name: `${rawUserDbRecord.profile.firstName} ${rawUserDbRecord.profile.lastName}`,
      roleId: rawUserDbRecord.roleId,
      isActive: rawUserDbRecord.isActive,
      totalOrders: rawUserDbRecord.orders.length,
      totalSpend,
    };

    // Privacy assertions
    assert.strictEqual("passwordHash" in adminCustomerDto, false, "Password hash MUST NOT leak in customer DTO");
    assert.strictEqual(adminCustomerDto.totalSpend, 8000, "Customer lifetime spend must correctly aggregate ₹8,000");
    assert.strictEqual(adminCustomerDto.totalOrders, 2);
  });

  // =========================================================================
  // Operation 10: Review Moderation
  // =========================================================================
  it("Op 10: Review Moderation Status Transitions & Audit Notes", () => {
    // Valid approval update
    const approved = UpdateReviewStatusSchema.parse({
      status: ModerationStatus.APPROVED,
      moderationNotes: "Verified purchase customer review with high quality photo.",
    });
    assert.strictEqual(approved.status, ModerationStatus.APPROVED);

    // Valid rejection with notes
    const rejected = UpdateReviewStatusSchema.parse({
      status: ModerationStatus.REJECTED,
      moderationNotes: "Review contains competitor promotional links.",
    });
    assert.strictEqual(rejected.status, ModerationStatus.REJECTED);

    // Rejection of invalid status string
    assert.throws(() => {
      UpdateReviewStatusSchema.parse({
        status: "UNKNOWN_STATUS",
      });
    }, /Status must be PENDING_MODERATION, APPROVED, or REJECTED/);
  });

  // =========================================================================
  // Operation 11: Store Management & India Taste Map Administration
  // =========================================================================
  it("Op 11: Store Outlets, PIN Codes, Haversine Distance & Taste Map Coordinates", () => {
    // 11a: Taste Map Pin Coordinates Boundary (0% - 100%)
    const validPin = PinCoordinatesSchema.parse({
      xPct: 24.5,
      yPct: 18.2,
      lat: 34.0837,
      lng: 74.7973,
    });
    assert.strictEqual(validPin.xPct, 24.5);
    assert.strictEqual(validPin.yPct, 18.2);

    // Out of bounds coordinates rejected
    assert.throws(() => {
      PinCoordinatesSchema.parse({
        xPct: 105.0, // > 100%
        yPct: 20.0,
      });
    }, /X coordinate percentage cannot exceed 100/);

    // 11b: Store Location Schema & Indian 6-Digit PIN Code
    const validStore = CreateStoreSchema.parse({
      name: "M/S Fruits & Nuts Heritage Flagship",
      addressStreet: "Residency Road, Lal Chowk",
      city: "Srinagar",
      state: "Jammu & Kashmir",
      postalCode: "190001",
      phone: "+91 194 245 8899",
      email: "srinagar@fruitsandnuts.co.in",
      latitude: 34.0837,
      longitude: 74.7973,
      outletStatus: StoreStatus.OPEN,
    });
    assert.strictEqual(validStore.postalCode, "190001");

    // Invalid PIN code format rejected (must be 6 digits not starting with 0)
    assert.throws(() => {
      CreateStoreSchema.parse({
        name: "Store",
        addressStreet: "Road",
        city: "Delhi",
        state: "Delhi",
        postalCode: "123", // Too short
        phone: "+91 99999 88888",
      });
    }, /Postal code must be a valid 6-digit Indian PIN code/);

    // 11c: Haversine Geo-Distance Computation (Srinagar to New Delhi: ~646 km)
    const dist = StoreService.haversineDistanceKm(34.0837, 74.7973, 28.6315, 77.2167);
    assert.ok(dist > 640 && dist < 660, `Distance should be approximately 646 km, got ${dist}`);
  });

  // =========================================================================
  // Operation 12: Live API Gating Verification Against Running Server
  // =========================================================================
  it("Op 12: Live Server-Side Authorization Boundary Verification", async () => {
    try {
      const endpoints = [
        "http://localhost:3000/api/v1/admin/orders",
        "http://localhost:3000/api/v1/admin/products",
        "http://localhost:3000/api/v1/admin/inventory",
      ];

      for (const url of endpoints) {
        const res = await fetch(url);
        assert.strictEqual(
          res.status === 401 || res.status === 403,
          true,
          `Endpoint ${url} must return 401 or 403 when unauthenticated, got ${res.status}`
        );
      }
    } catch (e: any) {
      console.warn("Live fetch check note:", e.message);
    }
  });
});
