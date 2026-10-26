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
    const { variantId } = validated;

    const variant = await db.productVariant.findUnique({
      where: { id: variantId },
      include: { product: true },
    });

    if (!variant || !variant.isActive || !variant.product.isActive) {
      throw AppError.notFound("The requested product variant is unavailable.");
    }

    await db.wishlist.upsert({
      where: {
        uq_user_wishlist_variant: {
          userId,
          variantId,
        },
      },
      update: {},
      create: {
        userId,
        variantId,
      },
    });

    return await this.getWishlist(userId);
  }

  /**
   * Removes an item from the customer's wishlist.
   */
  static async removeItem(userId: string, variantId: string) {
    const existing = await db.wishlist.findUnique({
      where: {
        uq_user_wishlist_variant: {
          userId,
          variantId,
        },
      },
    });

    if (!existing) {
      throw AppError.notFound("Item not found in your wishlist.");
    }

    await db.wishlist.delete({
      where: {
        uq_user_wishlist_variant: {
          userId,
          variantId,
        },
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

    return await runTransaction(async () => {
      // 1. Add to cart with full stock and active validation
      const cart = await CartService.addItem(userId, { variantId, quantity });

      // 2. Remove from wishlist if present
      await db.wishlist.deleteMany({
        where: {
          userId,
          variantId,
        },
      });

      return {
        cart,
        message: "Item moved to cart successfully",
      };
    });
  }
}
