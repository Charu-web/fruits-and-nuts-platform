import { z } from "zod";

// ----------------------------------------------------------------------
// CART VALIDATION SCHEMAS
// ----------------------------------------------------------------------

export const AddToCartSchema = z.object({
  variantId: z.string().uuid("Variant ID must be a valid UUID"),
  quantity: z.number().int("Quantity must be an integer").min(1, "Quantity must be at least 1").max(99, "Maximum order quantity per item is 99").default(1),
});

export const UpdateCartItemSchema = z.object({
  quantity: z.number().int("Quantity must be an integer").min(1, "Quantity must be at least 1").max(99, "Maximum order quantity per item is 99"),
});

// ----------------------------------------------------------------------
// WISHLIST VALIDATION SCHEMAS
// ----------------------------------------------------------------------

export const AddToWishlistSchema = z.object({
  variantId: z.string().min(1, "Variant ID is required"),
  productId: z.string().optional(),
  slug: z.string().optional(),
});

export const MoveToCartSchema = z.object({
  variantId: z.string().min(1, "Variant ID is required"),
  quantity: z.number().int("Quantity must be an integer").min(1, "Quantity must be at least 1").max(99, "Maximum order quantity per item is 99").default(1),
});
