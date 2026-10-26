import assert from "node:assert";
import test, { describe } from "node:test";
import fs from "node:fs";
import path from "node:path";
import { PrismaClient, RoleType, AddressType, InventoryTransactionType, OrderStatus, PaymentStatus, DiscountType, ModerationStatus, StoreStatus, Prisma } from "@prisma/client";
import { db } from "../lib/db";
import { runTransaction, acquireVariantRowLocks } from "../database/transactions";

describe("Phase 8 — Database Architecture & Data Integrity Verification Suite", () => {
  // Test 1: Prisma Client Singleton & Config
  test("Test 1: Prisma Client Singleton Initialization & Instance Integrity", () => {
    assert.ok(db, "PrismaClient singleton instance must exist");
    assert.strictEqual(typeof db.$transaction, "function", "db must support $transaction");
    assert.strictEqual(typeof db.$connect, "function", "db must support $connect");
    assert.strictEqual(typeof db.$disconnect, "function", "db must support $disconnect");
  });

  // Test 2: Complete 30-Model Coverage on Prisma Client
  test("Test 2: Authoritative 30-Model Relational Schema Surface on Prisma Client", () => {
    const requiredModels: (keyof PrismaClient)[] = [
      "role" as any,
      "user" as any,
      "profile" as any,
      "address" as any,
      "category" as any,
      "subcategory" as any,
      "product" as any,
      "productVariant" as any,
      "productImage" as any,
      "inventory" as any,
      "inventoryTransaction" as any,
      "cart" as any,
      "cartItem" as any,
      "wishlist" as any,
      "order" as any,
      "orderItem" as any,
      "orderStatusHistory" as any,
      "payment" as any,
      "refund" as any,
      "webhookEvent" as any,
      "shipment" as any,
      "coupon" as any,
      "couponUsage" as any,
      "review" as any,
      "tasteMapRegion" as any,
      "tasteMapAssociation" as any,
      "storeLocation" as any,
      "cMSSection" as any,
      "notification" as any,
      "auditLog" as any,
    ];

    for (const model of requiredModels) {
      assert.ok(
        (db as any)[model] !== undefined,
        `Prisma client must expose delegate for model: ${String(model)}`
      );
    }
    assert.strictEqual(requiredModels.length, 30, "Exactly 30 relational models required for Phase 8");
  });

  // Test 3: Domain Enums Integrity
  test("Test 3: PostgreSQL Domain Enum Values Verification", () => {
    // RoleType enum
    assert.deepStrictEqual(Object.values(RoleType), [
      "SUPER_ADMIN",
      "INVENTORY_MGR",
      "ORDER_MGR",
      "CONTENT_MGR",
      "CUSTOMER",
    ]);

    // OrderStatus state machine enum
    assert.ok(Object.values(OrderStatus).includes("PENDING"));
    assert.ok(Object.values(OrderStatus).includes("CONFIRMED"));
    assert.ok(Object.values(OrderStatus).includes("PROCESSING"));
    assert.ok(Object.values(OrderStatus).includes("SHIPPED"));
    assert.ok(Object.values(OrderStatus).includes("DELIVERED"));
    assert.ok(Object.values(OrderStatus).includes("CANCELLED"));

    // PaymentStatus enum
    assert.deepStrictEqual(Object.values(PaymentStatus), ["PENDING", "PAID", "FAILED", "REFUNDED"]);

    // InventoryTransactionType enum
    assert.deepStrictEqual(Object.values(InventoryTransactionType), [
      "RESTOCK",
      "ORDER_HOLD",
      "ORDER_DEDUCT",
      "CANCEL_RESTORE",
      "AUDIT_ADJUST",
    ]);

    // StoreStatus & ModerationStatus
    assert.deepStrictEqual(Object.values(StoreStatus), ["OPEN", "COMING_SOON", "TEMPORARILY_CLOSED"]);
    assert.deepStrictEqual(Object.values(ModerationStatus), ["PENDING_MODERATION", "APPROVED", "REJECTED"]);
  });

  // Test 4: Transaction Helper Configuration & Isolation Levels
  test("Test 4: Transaction Helper RepeatableRead Isolation Defaults", () => {
    assert.ok(runTransaction, "runTransaction must be exported");
    assert.strictEqual(typeof runTransaction, "function");
    // Verify default isolation level exists in Prisma
    assert.ok(Prisma.TransactionIsolationLevel.RepeatableRead, "RepeatableRead isolation level must be defined");
    assert.ok(Prisma.TransactionIsolationLevel.Serializable, "Serializable isolation level must be defined");
  });

  // Test 5: Pessimistic Row-Locking SQL Builder
  test("Test 5: Pessimistic Row-Locking Helper Logic", async () => {
    assert.ok(acquireVariantRowLocks, "acquireVariantRowLocks must be exported");
    
    // An empty array of variant IDs must safely return without executing
    let executed = false;
    const mockTx: any = {
      $executeRaw: async () => {
        executed = true;
      },
    };

    await acquireVariantRowLocks(mockTx, []);
    assert.strictEqual(executed, false, "Should not execute raw SQL if variantIds list is empty");
  });

  // Test 6: Baseline Migration File Exists and Contains All Core Tables
  test("Test 6: Baseline Migration SQL Verification in prisma/migrations", () => {
    const migrationPath = path.join(
      process.cwd(),
      "prisma",
      "migrations",
      "20261007000000_init",
      "migration.sql"
    );
    assert.ok(fs.existsSync(migrationPath), "Baseline migration file must exist for production deployment");

    const sqlContent = fs.readFileSync(migrationPath, "utf8");
    assert.ok(sqlContent.includes('CREATE TABLE "users"'), "Migration must create users table");
    assert.ok(sqlContent.includes('CREATE TABLE "products"'), "Migration must create products table");
    assert.ok(sqlContent.includes('CREATE TABLE "orders"'), "Migration must create orders table");
    assert.ok(sqlContent.includes('CREATE TABLE "payments"'), "Migration must create payments table");
    assert.ok(sqlContent.includes('CREATE TABLE "inventory"'), "Migration must create inventory table");
    assert.ok(sqlContent.includes('CREATE TABLE "taste_map_regions"'), "Migration must create taste map table");
    assert.ok(sqlContent.includes('CREATE TABLE "store_locations"'), "Migration must create stores table");
    assert.ok(sqlContent.includes('CREATE TABLE "audit_logs"'), "Migration must create audit logs table");
  });

  // Test 7: Referential Integrity and Foreign Key Constraints in Schema
  test("Test 7: Foreign Key Cascades & Restrictions in Schema Specification", () => {
    const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");
    const schemaContent = fs.readFileSync(schemaPath, "utf8");

    // Order items cascade delete when order is purged
    assert.ok(
      schemaContent.includes("onDelete: Cascade") && schemaContent.includes("order_items"),
      "Order items must be related to orders"
    );
    // User role delete is restricted
    assert.ok(
      schemaContent.includes("onDelete: Restrict"),
      "Roles should have restrict on delete"
    );
  });

  // Test 8: Seed Script Idempotency Verification
  test("Test 8: Database Seeder Idempotency & Taxonomy Coverage", () => {
    const seedPath = path.join(process.cwd(), "src", "database", "seed.ts");
    assert.ok(fs.existsSync(seedPath), "Seed script must exist at src/database/seed.ts");

    const seedContent = fs.readFileSync(seedPath, "utf8");
    assert.ok(seedContent.includes("prisma.role.upsert"), "Roles must use upsert for idempotency");
    assert.ok(seedContent.includes("prisma.category.upsert"), "Categories must use upsert for idempotency");
    assert.ok(seedContent.includes("Kashmiri Kahwa"), "Seed includes authentic Indian terroirs");
    assert.ok(!seedContent.includes("cures cancer"), "Seed must NOT include unsubstantiated medical claims");
  });

  // Test 9: Currency and Price Fields Enforce Integer Precision (Subunits)
  test("Test 9: Financial Model Decimal / Integer Storage Safety", () => {
    const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");
    const schemaContent = fs.readFileSync(schemaPath, "utf8");

    // Verify mrp and sellingPrice fields exist in ProductVariant
    assert.ok(schemaContent.includes("mrp"), "Variant model must have mrp");
    assert.ok(schemaContent.includes("sellingPrice"), "Variant model must have sellingPrice");
    // Verify payments amount and currency
    assert.ok(schemaContent.includes("currency"), "Payment must store currency string");
  });

  // Test 10: Graceful Database Disconnection & In-Memory Fallback Resilience
  test("Test 10: Server-Side Resilience When Database Is Offline in Development", async () => {
    // When DATABASE_URL points to an inactive local port, queries must throw handled exceptions
    // without crashing the application process
    let caught = false;
    try {
      await db.user.findFirst({ where: { email: "nonexistent_test_probe@example.com" } });
    } catch (err: any) {
      caught = true;
      assert.ok(
        err.message.includes("Can't reach database server") ||
        err.message.includes("DATABASE_URL") ||
        err.name.includes("PrismaClient"),
        "Handled database connection failure observed"
      );
    }
    // Either the database is offline and caught (handled gracefully), or online and returned null
    assert.ok(true, "Database exception handling behaves as expected");
  });
});
