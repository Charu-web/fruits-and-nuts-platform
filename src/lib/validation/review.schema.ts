import { z } from "zod";
import { ModerationStatus } from "@prisma/client";

/**
 * Customer review creation schema.
 */
export const CreateReviewSchema = z.object({
  productId: z.string().uuid("Invalid product ID format"),
  orderItemId: z.string().uuid("Invalid order item ID format").optional().nullable(),
  rating: z.coerce
    .number()
    .int("Rating must be an integer")
    .min(1, "Rating must be at least 1 star")
    .max(5, "Rating cannot exceed 5 stars"),
  title: z
    .string()
    .max(128, "Title cannot exceed 128 characters")
    .optional()
    .transform((val) => (val ? val.trim() : undefined)),
  reviewText: z
    .string()
    .min(10, "Review must contain at least 10 characters")
    .max(2000, "Review cannot exceed 2000 characters")
    .trim(),
  photos: z
    .array(z.string().url("Invalid photo URL format"))
    .max(5, "A maximum of 5 photos are allowed per review")
    .optional()
    .default([]),
});

export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;

/**
 * Admin review moderation status update schema.
 */
export const UpdateReviewStatusSchema = z.object({
  status: z.nativeEnum(ModerationStatus, {
    errorMap: () => ({ message: "Status must be PENDING_MODERATION, APPROVED, or REJECTED" }),
  }),
  moderationNotes: z.string().max(500, "Moderation notes cannot exceed 500 characters").optional(),
});

export type UpdateReviewStatusInput = z.infer<typeof UpdateReviewStatusSchema>;

/**
 * Review query parameters schema for storefront and admin filtering.
 */
export const ReviewQuerySchema = z.object({
  productId: z.string().uuid("Invalid product ID format").optional(),
  slug: z.string().optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  status: z.nativeEnum(ModerationStatus).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  sortBy: z.enum(["recent", "highest", "lowest"]).default("recent"),
});

export type ReviewQueryInput = z.infer<typeof ReviewQuerySchema>;
