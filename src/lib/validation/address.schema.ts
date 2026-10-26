import { z } from "zod";
import { AddressType } from "@prisma/client";

export const INDIAN_PINCODE_REGEX = /^[1-9][0-9]{5}$/;
export const INDIAN_PHONE_REGEX = /^(?:\+91|91)?[6-9]\d{9}$/;
export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export const CreateAddressSchema = z.object({
  recipientName: z
    .string()
    .trim()
    .min(2, "Recipient name must be at least 2 characters")
    .max(128),
  phone: z
    .string()
    .trim()
    .regex(INDIAN_PHONE_REGEX, "Please provide a valid 10-digit Indian mobile number"),
  addressLine1: z
    .string()
    .trim()
    .min(5, "Address Line 1 must be at least 5 characters")
    .max(255),
  addressLine2: z.string().trim().max(255).optional().nullable(),
  landmark: z.string().trim().max(128).optional().nullable(),
  city: z.string().trim().min(2, "City name is required").max(64),
  state: z.string().trim().min(2, "State name is required").max(64),
  postalCode: z
    .string()
    .trim()
    .regex(INDIAN_PINCODE_REGEX, "Please provide a valid 6-digit Indian PIN code"),
  country: z.string().trim().default("India"),
  addressType: z.nativeEnum(AddressType).default(AddressType.HOME),
  isDefaultShipping: z.boolean().default(false),
  isDefaultBilling: z.boolean().default(false),
  gstin: z
    .string()
    .trim()
    .toUpperCase()
    .regex(GSTIN_REGEX, "Invalid 15-character GSTIN format")
    .optional()
    .nullable(),
  companyName: z.string().trim().max(128).optional().nullable(),
});

export const UpdateAddressSchema = CreateAddressSchema.partial();
