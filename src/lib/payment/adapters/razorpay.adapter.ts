import crypto from "node:crypto";
import { PaymentConfig } from "@/config/payment.config";
import {
  IPaymentProviderAdapter,
  CreateGatewayOrderParams,
  GatewayOrderResult,
  VerifyPaymentParams,
  ParsedWebhookEvent,
  InitiateRefundParams,
  GatewayRefundResult,
} from "../payment-provider.interface";
import { AppError } from "@/lib/errors";
import { ErrorCode } from "@/lib/errors/error-codes";

export class RazorpayAdapter implements IPaymentProviderAdapter {
  readonly providerName = "RAZORPAY";

  private get keyId(): string {
    return PaymentConfig.RAZORPAY.KEY_ID;
  }

  private get keySecret(): string {
    return PaymentConfig.RAZORPAY.KEY_SECRET;
  }

  private get webhookSecret(): string {
    return PaymentConfig.RAZORPAY.WEBHOOK_SECRET;
  }

  /**
   * Generates a Razorpay Order.
   * Converts amount into smallest currency subunit (paise).
   */
  async createGatewayOrder(params: CreateGatewayOrderParams): Promise<GatewayOrderResult> {
    const amountInPaise = Math.round(params.amount * 100);

    // If live credentials are provided, call Razorpay Orders API
    if (PaymentConfig.isConfigured()) {
      try {
        const authHeader = `Basic ${Buffer.from(`${this.keyId}:${this.keySecret}`).toString("base64")}`;
        const response = await fetch("https://api.razorpay.com/v1/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
          },
          body: JSON.stringify({
            amount: amountInPaise,
            currency: params.currency || "INR",
            receipt: params.orderNumber,
            notes: {
              orderId: params.orderId,
              customerEmail: params.customerEmail,
              customerPhone: params.customerPhone,
            },
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new AppError(
            `Razorpay Order Creation Failed: ${errorData.error?.description || response.statusText}`,
            ErrorCode.EXTERNAL_SERVICE_ERROR
          );
        }

        const data = await response.json();
        return {
          provider: this.providerName,
          providerOrderId: data.id,
          amount: params.amount,
          currency: data.currency,
          keyId: this.keyId,
        };
      } catch (err: any) {
        if (err instanceof AppError) throw err;
        throw new AppError(
          `Failed to connect to Razorpay: ${err.message}`,
          ErrorCode.EXTERNAL_SERVICE_ERROR
        );
      }
    }

    // Sandbox / Test Mode fallback order generator
    const mockProviderOrderId = `order_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 7)}`;
    return {
      provider: this.providerName,
      providerOrderId: mockProviderOrderId,
      amount: params.amount,
      currency: params.currency || "INR",
      keyId: this.keyId,
    };
  }

  /**
   * Synchronous payment signature verification:
   * generated_signature = hmac_sha256(order_id + "|" + razorpay_payment_id, secret)
   */
  verifyPaymentSignature(params: VerifyPaymentParams): boolean {
    const { providerOrderId, providerPaymentId, providerSignature } = params;
    if (!providerOrderId || !providerPaymentId || !providerSignature) {
      return false;
    }

    try {
      const payload = `${providerOrderId}|${providerPaymentId}`;
      const expectedSignature = crypto
        .createHmac("sha256", this.keySecret)
        .update(payload)
        .digest("hex");

      const expectedBuffer = Buffer.from(expectedSignature, "utf8");
      const signatureBuffer = Buffer.from(providerSignature, "utf8");
      if (expectedBuffer.length !== signatureBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
    } catch {
      return false;
    }
  }

  /**
   * Asynchronous webhook signature verification:
   * hmac_sha256(raw_body, webhook_secret) == x-razorpay-signature
   */
  verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
    if (!rawBody || !signatureHeader) {
      return false;
    }

    try {
      const expectedSignature = crypto
        .createHmac("sha256", this.webhookSecret)
        .update(rawBody)
        .digest("hex");

      const expectedBuffer = Buffer.from(expectedSignature, "utf8");
      const signatureBuffer = Buffer.from(signatureHeader, "utf8");
      if (expectedBuffer.length !== signatureBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
    } catch {
      return false;
    }
  }

  /**
   * Parses Razorpay Webhook Event payload into canonical structure.
   */
  parseWebhookEvent(rawBody: string): ParsedWebhookEvent {
    let json: any;
    try {
      json = typeof rawBody === "string" ? JSON.parse(rawBody) : rawBody;
    } catch {
      throw AppError.validation("Invalid JSON payload received in webhook");
    }

    const eventType = json.event || "unknown";
    const eventId = json.event_id || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const paymentEntity = json.payload?.payment?.entity;
    const orderEntity = json.payload?.order?.entity;

    let status: ParsedWebhookEvent["status"] = "IGNORED";
    let providerOrderId = paymentEntity?.order_id || orderEntity?.id;
    let providerPaymentId = paymentEntity?.id;
    let amount = paymentEntity?.amount ? paymentEntity.amount / 100 : undefined;
    let currency = paymentEntity?.currency || orderEntity?.currency || "INR";
    let errorDescription = paymentEntity?.error_description;

    if (eventType === "order.paid" || eventType === "payment.captured") {
      status = "SUCCESS";
    } else if (eventType === "payment.failed") {
      status = "FAILED";
    } else if (eventType === "refund.processed") {
      status = "REFUNDED";
    }

    return {
      eventId,
      eventType,
      provider: this.providerName,
      providerOrderId,
      providerPaymentId,
      amount,
      currency,
      status,
      payload: json,
      errorDescription,
    };
  }

  /**
   * Initiates a refund for a captured payment.
   */
  async initiateRefund(params: InitiateRefundParams): Promise<GatewayRefundResult> {
    const amountInPaise = Math.round(params.amount * 100);

    if (PaymentConfig.isConfigured()) {
      try {
        const authHeader = `Basic ${Buffer.from(`${this.keyId}:${this.keySecret}`).toString("base64")}`;
        const response = await fetch(
          `https://api.razorpay.com/v1/payments/${params.providerPaymentId}/refund`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: authHeader,
            },
            body: JSON.stringify({
              amount: amountInPaise,
              notes: {
                reason: params.reason,
              },
            }),
          }
        );

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new AppError(
            `Razorpay Refund Failed: ${err.error?.description || response.statusText}`,
            ErrorCode.EXTERNAL_SERVICE_ERROR
          );
        }

        const data = await response.json();
        return {
          providerRefundId: data.id,
          status: data.status || "PROCESSED",
          amount: data.amount / 100,
        };
      } catch (err: any) {
        if (err instanceof AppError) throw err;
        throw new AppError(
          `Failed to process refund with Razorpay: ${err.message}`,
          ErrorCode.EXTERNAL_SERVICE_ERROR
        );
      }
    }

    // Sandbox / Test Mode fallback refund
    return {
      providerRefundId: `rfnd_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 6)}`,
      status: "PROCESSED",
      amount: params.amount,
    };
  }
}
