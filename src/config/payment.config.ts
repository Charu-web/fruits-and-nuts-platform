/**
 * Centralized Payment Gateway Configuration
 * All secrets and identifiers are loaded exclusively from environment variables.
 */
export const PaymentConfig = {
  // Configured primary provider ('RAZORPAY' | 'CASHFREE' | 'PHONEPE')
  PROVIDER: (process.env.PAYMENT_PROVIDER ?? "RAZORPAY").toUpperCase(),

  // Razorpay credentials
  RAZORPAY: {
    KEY_ID: process.env.RAZORPAY_KEY_ID ?? "rzp_test_placeholder_key_id",
    KEY_SECRET: process.env.RAZORPAY_KEY_SECRET ?? "rzp_test_placeholder_key_secret",
    WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET ?? "rzp_test_placeholder_webhook_secret",
    CURRENCY: "INR",
  },

  // Fallback / simulation toggle for testing environments where live gateway is not provisioned
  isConfigured(): boolean {
    if (this.PROVIDER === "RAZORPAY") {
      const keyId = process.env.RAZORPAY_KEY_ID;
      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      return Boolean(keyId && keySecret && !keyId.includes("placeholder"));
    }
    return false;
  },
} as const;
