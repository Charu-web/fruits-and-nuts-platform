/**
 * Centralized Order, Shipping & Commerce Configuration
 * Values default to client-specified baselines and can be overridden via environment variables.
 */
export const OrderConfig = {
  // Standard Delivery Fee for orders below the free shipping threshold
  STANDARD_DELIVERY_FEE: Number(process.env.STANDARD_DELIVERY_FEE ?? 75),

  // Free shipping threshold
  FREE_SHIPPING_THRESHOLD: Number(process.env.FREE_SHIPPING_THRESHOLD ?? 999),

  // Cash on Delivery (COD) Convenience Fee
  COD_FEE: Number(process.env.COD_FEE ?? 50),

  // Maximum order subtotal allowed for Cash on Delivery
  COD_MAX_ORDER_AMOUNT: Number(process.env.COD_MAX_ORDER_AMOUNT ?? 5000),

  // Optional Gift Packaging Add-on Fee
  GIFT_PACKAGING_FEE: Number(process.env.GIFT_PACKAGING_FEE ?? 50),

  // Payment hold timeout in minutes for abandoned/timed-out online payments
  PAYMENT_PENDING_HOLD_TIMEOUT_MINUTES: Number(
    process.env.PAYMENT_PENDING_HOLD_TIMEOUT_MINUTES ?? 30
  ),

  // Supported logistics provider designation (Unconfigured until client selection)
  DEFAULT_LOGISTICS_PROVIDER: process.env.LOGISTICS_PROVIDER ?? "PENDING_CLIENT_SELECTION",
} as const;
