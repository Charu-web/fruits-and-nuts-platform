import { z } from "zod";

/**
 * Coordinate payload schema for vector India map pins.
 */
export const PinCoordinatesSchema = z.object({
  xPct: z.number().min(0, "X coordinate percentage cannot be negative").max(100, "X coordinate percentage cannot exceed 100"),
  yPct: z.number().min(0, "Y coordinate percentage cannot be negative").max(100, "Y coordinate percentage cannot exceed 100"),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
});

export type PinCoordinates = z.infer<typeof PinCoordinatesSchema>;

/**
 * Taste Map region creation schema.
 */
export const CreateTasteMapRegionSchema = z.object({
  name: z.string().min(2, "Region name must be at least 2 characters").max(128, "Region name cannot exceed 128 characters").trim(),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(128, "Slug cannot exceed 128 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens (e.g. 'kashmir-valley')")
    .trim(),
  state: z.string().min(2, "State name must be at least 2 characters").max(64, "State name cannot exceed 64 characters").trim(),
  pinCoordinates: PinCoordinatesSchema,
  culturalStory: z.string().min(10, "Cultural story must be at least 10 characters").trim(),
  verificationSource: z.string().max(255).optional().nullable(),
  bannerImageUrl: z.string().url("Invalid banner image URL").optional().nullable(),
  displayOrder: z.coerce.number().int().default(0),
  isPublished: z.boolean().default(false),
  productIds: z.array(z.string().uuid("Invalid product ID format")).optional().default([]),
});

export type CreateTasteMapRegionInput = z.infer<typeof CreateTasteMapRegionSchema>;

/**
 * Taste Map region update schema.
 */
export const UpdateTasteMapRegionSchema = CreateTasteMapRegionSchema.partial();

export type UpdateTasteMapRegionInput = z.infer<typeof UpdateTasteMapRegionSchema>;

/**
 * Product association sync schema.
 */
export const SyncTasteMapProductsSchema = z.object({
  productIds: z.array(z.string().uuid("Invalid product ID format")),
});

export type SyncTasteMapProductsInput = z.infer<typeof SyncTasteMapProductsSchema>;
