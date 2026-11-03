import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { runTransaction } from "@/database/transactions";
import { InventoryService } from "./inventory.service";
import { CartService } from "./cart.service";
import { AddToWishlistSchema, MoveToCartSchema } from "@/lib/validation/cart.schema";
import { z } from "zod";

export interface FormattedWishlistItem {
  id: string;
  variantId: string;
  productId: string;
  name: string;
  slug: string;
  sku: string;
  weightGrams: number;
  unit: string;
  packageType: string;
  primaryImageUrl: string | null;
  mrp: number;
  sellingPrice: number;
  discountPercentage: number;
  stockAvailable: number;
  stockStatus: string;
  isAvailable: boolean;
  addedAt: Date;
}

export class WishlistService {
  /**
   * Retrieves all saved items in the customer's wishlist.
   */
  static async getWishlist(userId: string): Promise<{ items: FormattedWishlistItem[]; totalCount: number }> {
    const wishlistItems = await db.wishlist.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        variant: {
          include: {
            product: {
              include: {
                images: {
                  orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
                  take: 1,
                },
              },
            },
            inventory: true,
          },
        },
      },
    });

    const items: FormattedWishlistItem[] = wishlistItems.map((item) => {
      const variant = item.variant;
      const product = variant.product;
      const inventory = variant.inventory;

      const mrp = Number(variant.mrp);
      const sellingPrice = Number(variant.sellingPrice);
      const discountPercentage = mrp > sellingPrice ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0;
      const stockAvailable = inventory?.stockAvailable ?? 0;
      const buffer = inventory?.safetyBufferThreshold ?? 10;
      const stockStatus = InventoryService.calculateStockStatus(stockAvailable, buffer);
      const isAvailable = product.isActive && variant.isActive && stockAvailable > 0;

      return {
        id: item.id,
        variantId: variant.id,
        productId: product.id,
        name: product.name,
        slug: product.slug,
        sku: variant.sku,
        weightGrams: Number(variant.weightGrams),
        unit: variant.unit,
        packageType: variant.packageType,
        primaryImageUrl: product.images[0]?.imageUrl ?? null,
        mrp,
        sellingPrice,
        discountPercentage,
        stockAvailable,
        stockStatus,
        isAvailable,
        addedAt: item.createdAt,
      };
    });

    return {
      items,
      totalCount: items.length,
    };
  }

  /**
   * Adds a product variant to the customer's wishlist (prevents duplicates).
   */
  static async addItem(userId: string, input: z.infer<typeof AddToWishlistSchema>) {
    const validated = AddToWishlistSchema.parse(input);
    const { variantId, slug, productId } = validated;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(variantId);
    let variant: any = null;

    if (isUuid) {
      variant = await db.productVariant.findUnique({
        where: { id: variantId },
        include: { product: true },
      });
    }

    if (!variant) {
      // Look up by SKU, product slug, or productId
      variant = await db.productVariant.findFirst({
        where: {
          OR: [
            { sku: variantId },
            ...(slug ? [{ product: { slug } }] : [{ product: { slug: variantId } }]),
            ...(productId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId)
              ? [{ productId }]
              : []),
          ],
          isActive: true,
          product: { isActive: true },
        },
        include: { product: true },
      });
    }

    if (!variant || !variant.isActive || !variant.product.isActive) {
      throw AppError.notFound("The requested product variant is unavailable.");
    }

    await db.wishlist.upsert({
      where: {
        uq_user_wishlist_variant: {
          userId,
          variantId: variant.id,
        },
      },
      update: {},
      create: {
        userId,
        variantId: variant.id,
      },
    });

    return await this.getWishlist(userId);
  }

  /**
   * Removes an item from the customer's wishlist.
   */
  static async removeItem(userId: string, variantId: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(variantId);
    let targetVariantId = variantId;

    if (!isUuid) {
      const v = await db.productVariant.findFirst({
        where: { OR: [{ sku: variantId }, { product: { slug: variantId } }] },
        select: { id: true },
      });
      if (v) targetVariantId = v.id;
    }

    await db.wishlist.deleteMany({
      where: {
        userId,
        OR: [
          { variantId: targetVariantId },
          ...(isUuid ? [{ id: variantId }] : []),
        ],
      },
    });

    return await this.getWishlist(userId);
  }

  /**
   * Checks if a variant is present in the customer's wishlist.
   */
  static async isInWishlist(userId: string, variantId: string): Promise<boolean> {
    const count = await db.wishlist.count({
      where: {
        userId,
        variantId,
      },
    });
    return count > 0;
  }

  /**
   * Moves an item from Wishlist directly to Cart atomically.
   */
  static async moveToCart(userId: string, input: z.infer<typeof MoveToCartSchema>) {
    const validated = MoveToCartSchema.parse(input);
    const { variantId, quantity } = validated;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(variantId);
    let targetVariantId = variantId;

    if (!isUuid) {
      const v = await db.productVariant.findFirst({
        where: { OR: [{ sku: variantId }, { product: { slug: variantId } }] },
        select: { id: true },
      });
      if (v) targetVariantId = v.id;
    }

    return await runTransaction(async () => {
      // 1. Add to cart with full stock and active validation
      const cart = await CartService.addItem(userId, { variantId: targetVariantId, quantity });

      // 2. Remove from wishlist if present
      await db.wishlist.deleteMany({
        where: {
          userId,
          OR: [
            { variantId: targetVariantId },
            ...(isUuid ? [{ variantId }] : []),
          ],
        },
      });

      return {
        cart,
        message: "Item moved to cart successfully",
      };
    });
  }
}
