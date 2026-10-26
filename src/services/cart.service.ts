import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { runTransaction } from "@/database/transactions";
import { AddToCartSchema, UpdateCartItemSchema } from "@/lib/validation/cart.schema";
import { CouponService } from "./coupon.service";
import { z } from "zod";

export interface FormattedCartItem {
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
  unitMrp: number;
  unitSellingPrice: number;
  quantity: number;
  lineMrp: number;
  lineSellingPrice: number;
  lineDiscount: number;
  gstPercentage: number;
  stockAvailable: number;
  isAvailable: boolean;
  unavailabilityReason?: "PRODUCT_UNAVAILABLE" | "OUT_OF_STOCK" | "INSUFFICIENT_STOCK";
}

export interface AppliedCouponInfo {
  code: string;
  discountType: string;
  discountValue: number;
  maxDiscountAmount: number | null;
  discountAmount: number;
}

export interface CartSummary {
  id: string;
  userId: string;
  items: FormattedCartItem[];
  totalItemCount: number;
  uniqueItemCount: number;
  subtotal: number;
  couponDiscount: number;
  finalSubtotal: number;
  appliedCoupon: AppliedCouponInfo | null;
  couponError: string | null;
  totalMrp: number;
  totalSavings: number;
  estimatedGst: number;
  isCheckoutReady: boolean;
  hasUnavailableItems: boolean;
  updatedAt: Date;
}

export class CartService {
  /**
   * Retrieves or initializes an active cart for an authenticated user.
   */
  static async getOrCreateCart(userId: string) {
    let cart = await db.cart.findFirst({
      where: { userId },
    });

    if (!cart) {
      cart = await db.cart.create({
        data: { userId },
      });
    }

    return cart;
  }

  /**
   * Retrieves full customer cart with live server-authoritative calculations, coupon discounts and availability checks.
   */
  static async getCart(userId: string): Promise<CartSummary> {
    const cart = await this.getOrCreateCart(userId);

    const fullCart = await db.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          orderBy: { createdAt: "asc" },
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
        },
      },
    });

    if (!fullCart) {
      throw AppError.notFound("Cart not found");
    }

    let subtotal = 0;
    let totalMrp = 0;
    let estimatedGst = 0;
    let totalItemCount = 0;
    let hasUnavailableItems = false;

    const formattedItems: FormattedCartItem[] = fullCart.items.map((item) => {
      const variant = item.variant;
      const product = variant.product;
      const inventory = variant.inventory;

      const unitSellingPrice = Number(variant.sellingPrice);
      const unitMrp = Number(variant.mrp);
      const gstPercentage = Number(product.gstPercentage);
      const stockAvailable = inventory?.stockAvailable ?? 0;

      const lineSellingPrice = unitSellingPrice * item.quantity;
      const lineMrp = unitMrp * item.quantity;
      const lineDiscount = Math.max(0, lineMrp - lineSellingPrice);

      let isAvailable = true;
      let unavailabilityReason: FormattedCartItem["unavailabilityReason"] = undefined;

      if (!product.isActive || !variant.isActive) {
        isAvailable = false;
        unavailabilityReason = "PRODUCT_UNAVAILABLE";
        hasUnavailableItems = true;
      } else if (stockAvailable <= 0) {
        isAvailable = false;
        unavailabilityReason = "OUT_OF_STOCK";
        hasUnavailableItems = true;
      } else if (item.quantity > stockAvailable) {
        isAvailable = false;
        unavailabilityReason = "INSUFFICIENT_STOCK";
        hasUnavailableItems = true;
      }

      // Add to valid cart totals only if item is currently available
      if (isAvailable) {
        subtotal += lineSellingPrice;
        totalMrp += lineMrp;
        totalItemCount += item.quantity;
        // Embedded GST calculation: Price * (GST% / (100 + GST%))
        const itemGst = lineSellingPrice * (gstPercentage / (100 + gstPercentage));
        estimatedGst += itemGst;
      }

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
        unitMrp,
        unitSellingPrice,
        quantity: item.quantity,
        lineMrp,
        lineSellingPrice,
        lineDiscount,
        gstPercentage,
        stockAvailable,
        isAvailable,
        unavailabilityReason,
      };
    });

    // Calculate coupon discount if a coupon code is stored on the cart
    let couponDiscount = 0;
    let appliedCoupon: AppliedCouponInfo | null = null;
    let couponError: string | null = null;

    if (fullCart.couponCode && subtotal > 0) {
      try {
        const couponResult = await CouponService.validateAndCalculateDiscount(
          fullCart.couponCode,
          subtotal,
          userId
        );
        couponDiscount = couponResult.discountAmount;
        appliedCoupon = {
          code: couponResult.code,
          discountType: couponResult.discountType,
          discountValue: couponResult.discountValue,
          maxDiscountAmount: couponResult.maxDiscountAmount,
          discountAmount: couponResult.discountAmount,
        };
      } catch (err: any) {
        couponError = err?.message || "Applied coupon is no longer valid for this cart.";
        couponDiscount = 0;
        appliedCoupon = null;
      }
    }

    const finalSubtotal = Math.max(0, Math.round((subtotal - couponDiscount) * 100) / 100);
    const totalCatalogSavings = Math.max(0, totalMrp - subtotal);
    const totalSavings = Math.round((totalCatalogSavings + couponDiscount) * 100) / 100;
    const isCheckoutReady =
      formattedItems.length > 0 && formattedItems.every((item) => item.isAvailable);

    return {
      id: fullCart.id,
      userId,
      items: formattedItems,
      totalItemCount,
      uniqueItemCount: formattedItems.length,
      subtotal: Math.round(subtotal * 100) / 100,
      couponDiscount,
      finalSubtotal,
      appliedCoupon,
      couponError,
      totalMrp: Math.round(totalMrp * 100) / 100,
      totalSavings,
      estimatedGst: Math.round(estimatedGst * 100) / 100,
      isCheckoutReady,
      hasUnavailableItems,
      updatedAt: fullCart.updatedAt,
    };
  }

  /**
   * Applies a coupon code to the customer's cart after full validation.
   */
  static async applyCoupon(userId: string, code: string): Promise<CartSummary> {
    const cart = await this.getOrCreateCart(userId);
    const currentCart = await this.getCart(userId);

    if (currentCart.items.length === 0 || currentCart.subtotal <= 0) {
      throw AppError.validation("Cannot apply coupon to an empty cart.");
    }

    // Validate coupon against current subtotal
    const validationResult = await CouponService.validateAndCalculateDiscount(
      code,
      currentCart.subtotal,
      userId
    );

    await db.cart.update({
      where: { id: cart.id },
      data: { couponCode: validationResult.code },
    });

    return await this.getCart(userId);
  }

  /**
   * Removes any applied coupon code from the customer's cart.
   */
  static async removeCoupon(userId: string): Promise<CartSummary> {
    const cart = await this.getOrCreateCart(userId);

    await db.cart.update({
      where: { id: cart.id },
      data: { couponCode: null },
    });

    return await this.getCart(userId);
  }

  /**
   * Adds a product variant to the customer's cart with inventory availability gating.
   */
  static async addItem(userId: string, input: z.infer<typeof AddToCartSchema>): Promise<CartSummary> {
    const validated = AddToCartSchema.parse(input);
    const { variantId, quantity } = validated;

    // 1. Fetch variant, product, and inventory
    const variant = await db.productVariant.findUnique({
      where: { id: variantId },
      include: {
        product: true,
        inventory: true,
      },
    });

    if (!variant || !variant.isActive || !variant.product.isActive) {
      throw AppError.notFound("The requested product variant is not available.");
    }

    const availableStock = variant.inventory?.stockAvailable ?? 0;
    if (availableStock <= 0) {
      throw AppError.insufficientStock(
        `'${variant.product.name} (${variant.sku})' is currently out of stock.`
      );
    }

    const cart = await this.getOrCreateCart(userId);

    // 2. Check if item is already in cart
    const existingItem = await db.cartItem.findUnique({
      where: {
        uq_cart_variant: {
          cartId: cart.id,
          variantId,
        },
      },
    });

    const targetQuantity = existingItem ? existingItem.quantity + quantity : quantity;

    if (targetQuantity > availableStock) {
      throw AppError.insufficientStock(
        `Cannot add ${quantity} more item(s). Total requested (${targetQuantity}) exceeds available stock of ${availableStock}.`
      );
    }

    if (targetQuantity > 99) {
      throw AppError.validation("Maximum allowed quantity per product variant is 99 units.");
    }

    // 3. Upsert cart item
    await db.cartItem.upsert({
      where: {
        uq_cart_variant: {
          cartId: cart.id,
          variantId,
        },
      },
      update: {
        quantity: targetQuantity,
      },
      create: {
        cartId: cart.id,
        variantId,
        quantity: targetQuantity,
      },
    });

    return await this.getCart(userId);
  }

  /**
   * Updates the quantity of an existing cart item with inventory validation.
   */
  static async updateItemQuantity(
    userId: string,
    itemId: string,
    input: z.infer<typeof UpdateCartItemSchema>
  ): Promise<CartSummary> {
    const validated = UpdateCartItemSchema.parse(input);
    const { quantity } = validated;

    const cart = await this.getOrCreateCart(userId);

    const item = await db.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
      include: {
        variant: {
          include: {
            product: true,
            inventory: true,
          },
        },
      },
    });

    if (!item) {
      throw AppError.notFound("Cart item not found in your cart.");
    }

    const availableStock = item.variant.inventory?.stockAvailable ?? 0;

    if (quantity > availableStock) {
      throw AppError.insufficientStock(
        `Cannot set quantity to ${quantity}. Only ${availableStock} units are currently available in stock.`
      );
    }

    await db.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });

    return await this.getCart(userId);
  }

  /**
   * Removes a specific item from the customer's cart.
   */
  static async removeItem(userId: string, itemId: string): Promise<CartSummary> {
    const cart = await this.getOrCreateCart(userId);

    const item = await db.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });

    if (!item) {
      throw AppError.notFound("Cart item not found in your cart.");
    }

    await db.cartItem.delete({
      where: { id: itemId },
    });

    return await this.getCart(userId);
  }

  /**
   * Clears all items from the customer's cart.
   */
  static async clearCart(userId: string): Promise<CartSummary> {
    const cart = await this.getOrCreateCart(userId);

    await db.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return await this.getCart(userId);
  }
}
