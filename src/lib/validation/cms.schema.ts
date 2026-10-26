import { z } from "zod";

/**
 * CMS Section Key validator.
 */
export const SectionKeySchema = z
  .string()
  .min(3, "Section key must be at least 3 characters")
  .max(64, "Section key cannot exceed 64 characters")
  .regex(/^[A-Z0-9_]+$/, "Section key must be uppercase alphanumeric with underscores (e.g. 'HOMEPAGE_HERO')")
  .trim();

/**
 * CMS Section creation schema.
 */
export const CreateCMSSectionSchema = z.object({
  sectionKey: SectionKeySchema,
  title: z.string().max(128, "Title cannot exceed 128 characters").optional().nullable(),
  contentJson: z.union([z.record(z.any()), z.array(z.any())], {
    errorMap: () => ({ message: "Content must be a valid JSON object or array" }),
  }),
  isPublished: z.boolean().default(true),
  displayOrder: z.coerce.number().int().default(0),
});

export type CreateCMSSectionInput = z.infer<typeof CreateCMSSectionSchema>;

/**
 * CMS Section update / upsert schema.
 */
export const UpdateCMSSectionSchema = z.object({
  title: z.string().max(128).optional().nullable(),
  contentJson: z.union([z.record(z.any()), z.array(z.any())]).optional(),
  isPublished: z.boolean().optional(),
  displayOrder: z.coerce.number().int().optional(),
});

export type UpdateCMSSectionInput = z.infer<typeof UpdateCMSSectionSchema>;

/**
 * CMS Section publish status toggle schema.
 */
export const UpdatePublishStatusSchema = z.object({
  isPublished: z.boolean({ required_error: "isPublished is required" }),
});

export type UpdatePublishStatusInput = z.infer<typeof UpdatePublishStatusSchema>;
