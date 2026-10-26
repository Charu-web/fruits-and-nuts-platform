import { z } from "zod";
import { StoreStatus } from "@prisma/client";

/**
 * Operating hours structured JSON schema.
 */
export const OperatingHoursSchema = z.record(z.string());

/**
 * Store location creation schema.
 */
export const CreateStoreSchema = z.object({
  name: z.string().min(2, "Store name must be at least 2 characters").max(128, "Store name cannot exceed 128 characters").trim(),
  addressStreet: z.string().min(5, "Address must be at least 5 characters").max(255, "Address cannot exceed 255 characters").trim(),
  city: z.string().min(2, "City must be at least 2 characters").max(64, "City cannot exceed 64 characters").trim(),
  state: z.string().min(2, "State must be at least 2 characters").max(64, "State cannot exceed 64 characters").trim(),
  postalCode: z.string().regex(/^[1-9][0-9]{5}$/, "Postal code must be a valid 6-digit Indian PIN code").trim(),
  phone: z.string().min(8, "Phone number must be at least 8 characters").max(20, "Phone number cannot exceed 20 characters").trim(),
  email: z.string().email("Invalid email format").optional().nullable(),
  latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
  longitude: z.coerce.number().min(-180).max(180).optional().nullable(),
  googleMapsUrl: z.string().url("Invalid Google Maps URL format").optional().nullable(),
  operatingHours: OperatingHoursSchema.optional().nullable(),
  outletStatus: z.nativeEnum(StoreStatus).default(StoreStatus.OPEN),
  displayOrder: z.coerce.number().int().default(0),
});

export type CreateStoreInput = z.infer<typeof CreateStoreSchema>;

/**
 * Store location update schema.
 */
export const UpdateStoreSchema = CreateStoreSchema.partial();

export type UpdateStoreInput = z.infer<typeof UpdateStoreSchema>;

/**
 * Store search & filter query schema.
 */
export const StoreQuerySchema = z.object({
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().min(1).max(500).default(50),
  status: z.nativeEnum(StoreStatus).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type StoreQueryInput = z.infer<typeof StoreQuerySchema>;
