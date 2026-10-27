import { z } from "zod";
import { INDIAN_PHONE_REGEX } from "./address.schema";

export { INDIAN_PHONE_REGEX };

export const RegisterSchema = z
  .object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Please provide a valid email address")
      .optional()
      .nullable()
      .or(z.literal(""))
      .transform((val) => (val && val.length > 0 ? val : undefined)),
    password: z.string().min(8, "Password must be at least 8 characters"),
    firstName: z.string().trim().max(64).optional().nullable(),
    lastName: z.string().trim().max(64).optional().nullable(),
    phone: z
      .string()
      .trim()
      .optional()
      .nullable()
      .or(z.literal(""))
      .transform((val) => {
        if (!val) return undefined;
        const cleaned = val.replace(/[\s-]/g, "");
        return cleaned.length > 0 ? cleaned : undefined;
      })
      .pipe(
        z
          .string()
          .regex(INDIAN_PHONE_REGEX, "Please provide a valid 10-digit Indian mobile number")
          .optional()
      ),
  })
  .refine((data) => !!(data.email || data.phone), {
    message: "Either mobile number or email address must be provided.",
  });

export const LoginSchema = z
  .object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Please provide a valid email address")
      .optional()
      .nullable()
      .or(z.literal(""))
      .transform((v) => (v && v.length > 0 ? v : undefined)),
    phone: z
      .string()
      .trim()
      .optional()
      .nullable()
      .or(z.literal(""))
      .transform((val) => {
        if (!val) return undefined;
        const cleaned = val.replace(/[\s-]/g, "");
        return cleaned.length > 0 ? cleaned : undefined;
      }),
    password: z.string().min(1, "Password is required"),
  })
  .refine((data) => !!(data.email || data.phone), {
    message: "Either email or phone number must be provided.",
  });

export const AdminLoginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please provide a valid email address").optional(),
  phone: z
    .string()
    .trim()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      const cleaned = val.replace(/[\s-]/g, "");
      return cleaned.length > 0 ? cleaned : undefined;
    }),
  password: z.string().min(1, "Password is required"),
  totpCode: z.string().regex(/^\d{6}$/, "TOTP code must be 6 digits").optional(),
}).refine((data) => data.email || data.phone, {
  message: "Either email or phone number must be provided.",
});

export const UpdateProfileSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(64).optional(),
  lastName: z.string().trim().max(64).optional().nullable(),
  phone: z.string().trim().regex(INDIAN_PHONE_REGEX, "Please provide a valid 10-digit Indian mobile number").optional().nullable(),
  avatarUrl: z.string().url("Avatar URL must be a valid URL").optional().nullable(),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export const ForgotPasswordSchema = z
  .object({
    email: z.string().trim().toLowerCase().email("Please provide a valid email address").optional().or(z.literal("")),
    phone: z
      .string()
      .trim()
      .regex(INDIAN_PHONE_REGEX, "Please provide a valid 10-digit Indian mobile number")
      .optional()
      .or(z.literal("")),
    identifier: z.string().trim().optional(),
  })
  .refine(
    (data) => Boolean(data.email || data.phone || data.identifier),
    { message: "Please provide your registered email address or mobile number." }
  );

export const ResetPasswordSchema = z
  .object({
    token: z.string().trim().min(16, "Reset token is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm password must be at least 8 characters").optional(),
  })
  .refine(
    (data) => !data.confirmPassword || data.newPassword === data.confirmPassword,
    { message: "Passwords do not match.", path: ["confirmPassword"] }
  );
