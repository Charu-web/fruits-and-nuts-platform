import { z } from "zod";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { INDIAN_PINCODE_REGEX, INDIAN_PHONE_REGEX, GSTIN_REGEX } from "./address.schema";
export { INDIAN_PINCODE_REGEX, INDIAN_PHONE_REGEX, GSTIN_REGEX };

export const EstimateShippingSchema = z.object({
  postalCode: z
    .string()
    .trim()
    .regex(INDIAN_PINCODE_REGEX, "Please provide a valid 6-digit Indian PIN code"),
  subtotal: z
    .number()
    .min(0, "Subtotal cannot be negative"),
});

export const CheckoutPreviewSchema = z.object({
  shippingAddressId: z.string().uuid("Shipping address ID must be a valid UUID").optional(),
  giftWrapEnabled: z.boolean().default(false),
  giftMessage: z.string().trim().max(500, "Gift message cannot exceed 500 characters").optional().nullable(),
  paymentMethod: z.enum(["COD", "ONLINE"]).default("COD"),
});

export const ShippingAddressInputSchema = z.object({
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
  country: z.string().trim().default("India").optional(),
  gstin: z.string().trim().optional().nullable(),
  companyName: z.string().trim().max(128).optional().nullable(),
});

export const OrderItemInputSchema = z.object({
  variantId: z.string().min(1, "Variant ID is required"),
  quantity: z.number().int().positive("Quantity must be a positive integer"),
});

export const CreateOrderSchema = z
  .object({
    shippingAddressId: z.string().uuid("Shipping address ID must be a valid UUID").optional().nullable(),
    shippingAddress: z.union([z.string(), ShippingAddressInputSchema]).optional().nullable(),
    billingAddressId: z.string().uuid("Billing address must be a valid UUID").optional().nullable(),
    paymentMethod: z
      .enum(["COD", "ONLINE"], {
        errorMap: () => ({ message: "Payment method must be COD or ONLINE" }),
      })
      .default("COD"),
    giftWrapEnabled: z.boolean().default(false),
    giftMessage: z.string().trim().max(500, "Gift message cannot exceed 500 characters").optional().nullable(),
    idempotencyKey: z.string().max(64).optional(),
    items: z.array(OrderItemInputSchema).optional(),
  })
  .refine(
    (data) => Boolean(data.shippingAddressId || data.shippingAddress),
    {
      message: "A valid shipping address is required to place an order",
      path: ["shippingAddress"],
    }
  );

export const CancelOrderSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(3, "Cancellation reason must be at least 3 characters")
    .max(500),
});

export const AdminUpdateOrderStatusSchema = z.object({
  newStatus: z.nativeEnum(OrderStatus, {
    errorMap: () => ({ message: "Invalid order status value" }),
  }),
  reason: z.string().trim().max(500).optional(),
});

export const AdminCreateShipmentSchema = z.object({
  provider: z.string().trim().min(2, "Provider name is required").max(64),
  awbNumber: z.string().trim().min(3, "AWB number is required").max(128),
  courierName: z.string().trim().min(2, "Courier name is required").max(128),
  shippingLabelUrl: z.string().url("Valid URL required").optional().nullable(),
  trackingUrl: z.string().url("Valid tracking URL required").optional().nullable(),
  manifestId: z.string().trim().max(128).optional().nullable(),
  estimatedDeliveryDate: z.coerce.date().optional().nullable(),
});

export const AdminUpdateTrackingSchema = z.object({
  provider: z.string().trim().min(2).max(64).optional(),
  courierName: z.string().trim().min(2, "Courier name must be at least 2 characters").max(128).optional().nullable(),
  awbNumber: z.string().trim().min(3, "Tracking number must be at least 3 characters").max(128).optional().nullable(),
  trackingUrl: z
    .union([z.string().trim().url("Please provide a valid http/https tracking URL"), z.literal(""), z.null()])
    .optional(),
  shippingLabelUrl: z
    .union([z.string().trim().url("Please provide a valid http/https URL"), z.literal(""), z.null()])
    .optional(),
  manifestId: z.string().trim().max(128).optional().nullable(),
  estimatedDeliveryDate: z
    .union([z.coerce.date(), z.literal(""), z.null()])
    .optional(),
  newStatus: z.nativeEnum(OrderStatus).optional(),
  reason: z.string().trim().max(500).optional(),
});

export const AdminOrderListQuerySchema = z.object({
  orderStatus: z.nativeEnum(OrderStatus).optional(),
  paymentStatus: z.nativeEnum(PaymentStatus).optional(),
  paymentMethod: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const CustomerOrderListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});
