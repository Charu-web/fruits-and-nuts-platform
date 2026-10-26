import { PaymentConfig } from "@/config/payment.config";
import { IPaymentProviderAdapter } from "./payment-provider.interface";
import { RazorpayAdapter } from "./adapters/razorpay.adapter";

export class PaymentProviderFactory {
  private static instance: IPaymentProviderAdapter | null = null;

  static getProvider(): IPaymentProviderAdapter {
    if (!this.instance) {
      const provider = PaymentConfig.PROVIDER;
      switch (provider) {
        case "RAZORPAY":
        default:
          this.instance = new RazorpayAdapter();
          break;
      }
    }
    return this.instance;
  }
}
