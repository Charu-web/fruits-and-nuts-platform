import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { runTransaction } from "@/database/transactions";
import { InventoryTransactionType, Prisma } from "@prisma/client";
import {
  AdminInventoryListQuerySchema,
  AdjustInventorySchema,
  InventoryTransactionQuerySchema,
} from "@/lib/validation/catalog.schema";
import { z } from "zod";

export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

export class InventoryService {
  /**
   * Helper function to determine stock status based on available stock and safety buffer.
   */
  static calculateStockStatus(
    stockAvailable: number,
    safetyBufferThreshold: number
  ): StockStatus {
    if (stockAvailable <= 0) {
      return "OUT_OF_STOCK";
    }
    if (stockAvailable <= safetyBufferThreshold) {
      return "LOW_STOCK";
    }
    return "IN_STOCK";
  }

  /**
   * Retrieves paginated inventory overview across all variants (Admin).
   */
  static async getInventoryOverview(params: z.infer<typeof AdminInventoryListQuerySchema>) {
    const validated = AdminInventoryListQuerySchema.parse(params);
    const { page, limit, search, stockStatus } = validated;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductVariantWhereInput = {};

    if (search) {
      where.OR = [
        { sku: { contains: search, mode: "insensitive" } },
        { product: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [totalVariants, variants] = await Promise.all([
      db.productVariant.count({ where }),
      db.productVariant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              category: { select: { id: true, name: true } },
            },
          },
          inventory: true,
        },
      }),
    ]);

    const formatted = variants.map((v) => {
      const stockAvailable = v.inventory?.stockAvailable ?? 0;
      const stockReserved = v.inventory?.stockReserved ?? 0;
      const safetyBufferThreshold = v.inventory?.safetyBufferThreshold ?? 10;
      const computedStatus = this.calculateStockStatus(stockAvailable, safetyBufferThreshold);

      return {
        variantId: v.id,
        sku: v.sku,
        productName: v.product.name,
        productSlug: v.product.slug,
        categoryName: v.product.category.name,
        weightGrams: Number(v.weightGrams),
        unit: v.unit,
        packageType: v.packageType,
        mrp: Number(v.mrp),
        sellingPrice: Number(v.sellingPrice),
        isActive: v.isActive,
        stockAvailable,
        stockReserved,
        safetyBufferThreshold,
        stockStatus: computedStatus,
        updatedAt: v.inventory?.updatedAt ?? v.updatedAt,
      };
    });

    const filtered = stockStatus === "ALL"
      ? formatted
      : formatted.filter((item) => item.stockStatus === stockStatus);

    return {
      items: filtered,
      pagination: {
        total: totalVariants,
        page,
        limit,
        totalPages: Math.ceil(totalVariants / limit),
      },
    };
  }

  /**
   * Retrieves full inventory status for a specific variant.
   */
  static async getInventoryByVariantId(variantId: string) {
    const variant = await db.productVariant.findUnique({
      where: { id: variantId },
      include: {
        product: { select: { id: true, name: true, slug: true } },
        inventory: true,
      },
    });

    if (!variant) {
      throw AppError.notFound(`Product variant with ID ${variantId} not found`);
    }

    const stockAvailable = variant.inventory?.stockAvailable ?? 0;
    const stockReserved = variant.inventory?.stockReserved ?? 0;
    const safetyBufferThreshold = variant.inventory?.safetyBufferThreshold ?? 10;
    const computedStatus = this.calculateStockStatus(stockAvailable, safetyBufferThreshold);

    return {
      variantId: variant.id,
      sku: variant.sku,
      productName: variant.product.name,
      stockAvailable,
      stockReserved,
      safetyBufferThreshold,
      stockStatus: computedStatus,
      updatedAt: variant.inventory?.updatedAt ?? variant.updatedAt,
    };
  }

  /**
   * Atomic inventory adjustment with transaction ledger recording (Admin / System).
   */
  static async adjustStock(
    input: z.infer<typeof AdjustInventorySchema>,
    actorId?: string
  ) {
    const validated = AdjustInventorySchema.parse(input);

    return await runTransaction(async (tx) => {
      // 1. Fetch variant and current inventory
      const variant = await tx.productVariant.findUnique({
        where: { id: validated.variantId },
        include: { inventory: true },
      });

      if (!variant) {
        throw AppError.notFound(`Variant with ID ${validated.variantId} not found`);
      }

      const currentStock = variant.inventory?.stockAvailable ?? 0;
      const currentReserved = variant.inventory?.stockReserved ?? 0;
      const currentBuffer = validated.safetyBufferThreshold ?? variant.inventory?.safetyBufferThreshold ?? 10;

      const newStock = currentStock + validated.quantityDelta;

      if (newStock < 0) {
        throw AppError.insufficientStock(
          `Cannot reduce stock by ${Math.abs(validated.quantityDelta)} units. Current stock is ${currentStock}.`
        );
      }

      // 2. Upsert inventory table
      const updatedInventory = await tx.inventory.upsert({
        where: { variantId: validated.variantId },
        update: {
          stockAvailable: newStock,
          safetyBufferThreshold: currentBuffer,
        },
        create: {
          variantId: validated.variantId,
          stockAvailable: newStock,
          stockReserved: currentReserved,
          safetyBufferThreshold: currentBuffer,
        },
      });

      // 3. Record immutable inventory transaction
      const transactionRecord = await tx.inventoryTransaction.create({
        data: {
          variantId: validated.variantId,
          transactionType: validated.transactionType,
          quantityDelta: validated.quantityDelta,
          stockAfter: newStock,
          referenceType: validated.referenceType ?? "MANUAL_ADJUSTMENT",
          referenceId: validated.referenceId ?? null,
          actorId: actorId ?? null,
          notes: validated.notes,
        },
      });

      const stockStatus = this.calculateStockStatus(newStock, currentBuffer);

      return {
        inventory: {
          variantId: updatedInventory.variantId,
          stockAvailable: updatedInventory.stockAvailable,
          stockReserved: updatedInventory.stockReserved,
          safetyBufferThreshold: updatedInventory.safetyBufferThreshold,
          stockStatus,
        },
        transaction: transactionRecord,
      };
    });
  }

  /**
   * Retrieves paginated inventory audit trail transactions.
   */
  static async getInventoryTransactions(
    params: z.infer<typeof InventoryTransactionQuerySchema>
  ) {
    const validated = InventoryTransactionQuerySchema.parse(params);
    const { page, limit, variantId, transactionType } = validated;
    const skip = (page - 1) * limit;

    const where: Prisma.InventoryTransactionWhereInput = {};

    if (variantId) {
      where.variantId = variantId;
    }
    if (transactionType) {
      where.transactionType = transactionType;
    }

    const [total, transactions] = await Promise.all([
      db.inventoryTransaction.count({ where }),
      db.inventoryTransaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          variant: {
            select: {
              sku: true,
              product: { select: { id: true, name: true, slug: true } },
            },
          },
          actor: {
            select: {
              id: true,
              email: true,
              roleId: true,
            },
          },
        },
      }),
    ]);

    return {
      items: transactions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
