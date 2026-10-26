import { z } from "zod";
import { DiscountType } from "@prisma/client";

export const COUPON_CODE_REGEX = /^[A-Z0-9_-]{3,32}$/;

// ----------------------------------------------------------------------
// ADMIN COUPON MANAGEMENT SCHEMAS
// ----------------------------------------------------------------------

export const CreateCouponSchema = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(
        COUPON_CODE_REGEX,
        "Coupon code must be 3-32 uppercase alphanumeric characters, dashes, or underscores (e.g. WELCOME10, FESTIVE2026)"
      ),
    discountType: z.nativeEnum(DiscountType, {
      errorMap: () => ({ message: "Discount type must be PERCENTAGE or FLAT_AMOUNT" }),
    }),
    discountValue: z
      .number()
      .positive("Discount value must be greater than 0"),
    maxDiscountAmount: z
      .number()
      .positive("Maximum discount limit must be greater than 0")
      .optional()
      .nullable(),
    minOrderAmount: z
      .number()
      .min(0, "Minimum order amount cannot be negative")
      .default(0),
    usageLimitTotal: z
      .number()
      .int("Global usage limit must be an integer")
      .positive("Global usage limit must be greater than 0")
      .optional()
      .nullable(),
    usageLimitPerUser: z
      .number()
      .int("Usage limit per user must be an integer")
      .positive("Usage limit per user must be at least 1")
      .default(1),
    startDate: z.coerce.date({
      errorMap: () => ({ message: "A valid start date is required" }),
    }),
    endDate: z.coerce.date({
      errorMap: () => ({ message: "A valid expiry date is required" }),
    }),
    isActive: z.boolean().default(true),
  })
  .refine((data) => {
    if (data.discountType === DiscountType.PERCENTAGE) {
      return data.discountValue <= 100;
    }
    return true;
  }, {
    message: "Percentage discount value cannot exceed 100%",
    path: ["discountValue"],
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "Expiry date must be after the start date",
    path: ["endDate"],
  });

export const UpdateCouponSchema = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(COUPON_CODE_REGEX)
      .optional(),
    discountType: z.nativeEnum(DiscountType).optional(),
    discountValue: z.number().positive().optional(),
    maxDiscountAmount: z.number().positive().optional().nullable(),
    minOrderAmount: z.number().min(0).optional(),
    usageLimitTotal: z.number().int().positive().optional().nullable(),
    usageLimitPerUser: z.number().int().positive().optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => {
    if (data.discountType === DiscountType.PERCENTAGE && data.discountValue !== undefined) {
      return data.discountValue <= 100;
    }
    return true;
  }, {
    message: "Percentage discount value cannot exceed 100%",
    path: ["discountValue"],
  })
  .refine((data) => {
    if (data.startDate && data.endDate) {
      return data.endDate > data.startDate;
    }
    return true;
  }, {
    message: "Expiry date must be after the start date",
    path: ["endDate"],
  });

// ----------------------------------------------------------------------
// STOREFRONT & CART APPLICATION SCHEMAS
// ----------------------------------------------------------------------

export const ApplyCouponSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Coupon code is required")
    .max(32)
    .toUpperCase(),
});

export const ValidateCouponSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Coupon code is required")
    .max(32)
    .toUpperCase(),
  subtotal: z
    .number()
    .min(0, "Cart subtotal must be greater than or equal to 0"),
});

export const AdminCouponListQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(["ALL", "ACTIVE", "INACTIVE", "EXPIRED"]).default("ALL"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
