import { z } from "zod";

export const CreateGatewayOrderSchema = z.object({
  orderId: z.string().uuid("Invalid Order ID format"),
});

export const VerifyPaymentSchema = z.object({
  orderId: z.string().uuid("Invalid Order ID format"),
  razorpayOrderId: z.string().min(1, "Razorpay Order ID is required"),
  razorpayPaymentId: z.string().min(1, "Razorpay Payment ID is required"),
  razorpaySignature: z.string().min(1, "Razorpay Signature is required"),
});

export const CreateRefundSchema = z.object({
  paymentId: z.string().uuid("Invalid Payment ID format"),
  amount: z.number().positive("Refund amount must be greater than zero"),
  reason: z
    .string()
    .trim()
    .min(3, "Refund reason must be at least 3 characters")
    .max(500, "Refund reason cannot exceed 500 characters"),
});
