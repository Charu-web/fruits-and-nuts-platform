import { z, ZodSchema } from "zod";
import { AppError } from "./errors/app-error";

/**
 * Validates request payload against a Zod schema.
 * Throws a formatted AppError.validation if validation fails.
 */
export async function validateRequest<T>(schema: ZodSchema<T>, data: unknown): Promise<T> {
  const result = await schema.safeParseAsync(data);
  if (!result.success) {
    const formattedErrors = result.error.errors.map((err) => ({
      field: err.path.join("."),
      message: err.message,
    }));
    throw AppError.validation("Invalid request data payload", formattedErrors);
  }
  return result.data;
}

// Common Reusable Validation Primitives
export const CommonSchemas = {
  uuid: z.string().uuid("Invalid UUID format"),
  slug: z.string().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
  indianPhone: z.string().regex(/^[6-9]\d{9}$/, "Must be a valid 10-digit Indian mobile number"),
  pincode: z.string().regex(/^\d{6}$/, "Must be a valid 6-digit Indian postal pincode"),
  gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Invalid GSTIN format").optional().nullable(),
  pagination: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(24),
  }),
};
