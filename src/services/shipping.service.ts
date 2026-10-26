import { AppError } from "@/lib/errors";
import { OrderConfig } from "@/config/order.config";
import { EstimateShippingSchema, INDIAN_PINCODE_REGEX } from "@/lib/validation/order.schema";
import { z } from "zod";

export interface ShippingEstimateResult {
  isServiceable: boolean;
  postalCode: string;
  estimatedDays: string;
  shippingFee: number;
  isFreeShipping: boolean;
  freeShippingThreshold: number;
  amountNeededForFreeShipping: number;
  codAvailable: boolean;
  codFee: number;
  maxCodAmount: number;
}

export class ShippingService {
  /**
   * Calculates delivery serviceability, transit estimate, and shipping fee for a given Indian PIN code and cart subtotal.
   */
  static estimateShipping(input: z.infer<typeof EstimateShippingSchema>): ShippingEstimateResult {
    const validated = EstimateShippingSchema.parse(input);
    const { postalCode, subtotal } = validated;

    if (!INDIAN_PINCODE_REGEX.test(postalCode)) {
      throw AppError.validation("Please provide a valid 6-digit Indian PIN code.");
    }

    const freeShippingThreshold = OrderConfig.FREE_SHIPPING_THRESHOLD;
    const isFreeShipping = subtotal >= freeShippingThreshold;
    const shippingFee = isFreeShipping ? 0 : OrderConfig.STANDARD_DELIVERY_FEE;
    const amountNeededForFreeShipping = Math.max(0, Math.round((freeShippingThreshold - subtotal) * 100) / 100);

    return {
      isServiceable: true,
      postalCode,
      estimatedDays: "3-5 Business Days",
      shippingFee,
      isFreeShipping,
      freeShippingThreshold,
      amountNeededForFreeShipping,
      codAvailable: true,
      codFee: OrderConfig.COD_FEE,
      maxCodAmount: OrderConfig.COD_MAX_ORDER_AMOUNT,
    };
  }
}
