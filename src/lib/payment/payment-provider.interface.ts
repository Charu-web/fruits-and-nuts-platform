export interface CreateGatewayOrderParams {
  orderId: string;
  orderNumber: string;
  amount: number; // in standard units (INR)
  currency: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

export interface GatewayOrderResult {
  provider: string;
  providerOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

export interface VerifyPaymentParams {
  providerOrderId: string;
  providerPaymentId: string;
  providerSignature: string;
}

export interface ParsedWebhookEvent {
  eventId: string;
  eventType: string;
  provider: string;
  providerOrderId?: string;
  providerPaymentId?: string;
  amount?: number;
  currency?: string;
  status: "SUCCESS" | "FAILED" | "REFUNDED" | "IGNORED";
  payload: any;
  errorDescription?: string;
}

export interface InitiateRefundParams {
  providerPaymentId: string;
  amount: number;
  reason: string;
}

export interface GatewayRefundResult {
  providerRefundId: string;
  status: string;
  amount: number;
}

export interface IPaymentProviderAdapter {
  readonly providerName: string;

  createGatewayOrder(params: CreateGatewayOrderParams): Promise<GatewayOrderResult>;

  verifyPaymentSignature(params: VerifyPaymentParams): boolean;

  verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean;

  parseWebhookEvent(rawBody: string): ParsedWebhookEvent;

  initiateRefund(params: InitiateRefundParams): Promise<GatewayRefundResult>;
}
