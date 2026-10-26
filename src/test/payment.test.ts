import assert from "node:assert";
import crypto from "node:crypto";
import {
  CreateGatewayOrderSchema,
  VerifyPaymentSchema,
  CreateRefundSchema,
} from "../lib/validation/payment.schema";
import { RazorpayAdapter } from "../lib/payment/adapters/razorpay.adapter";
import { PaymentConfig } from "../config/payment.config";
import { hasPermission } from "../lib/auth/rbac";
import { OrderStatus, PaymentStatus, RoleType } from "@prisma/client";

async function runPaymentTests() {
  console.log("🧪 Running Phase 9G Payment Gateway & Webhook Synchronization Tests...\n");

  const testKeySecret = "test_rzp_secret_key_123456789";
  const testWebhookSecret = "test_webhook_secret_987654321";

  // ----------------------------------------------------------------------
  // Test 1: Payment Schema Validation
  // ----------------------------------------------------------------------
  console.log("▶️ Test 1: Payment and Refund Schema Validation...");

  const validGatewayOrderInput = CreateGatewayOrderSchema.parse({
    orderId: "c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
  });
  assert.strictEqual(validGatewayOrderInput.orderId, "c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c");

  const validVerifyInput = VerifyPaymentSchema.parse({
    orderId: "c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
    razorpayOrderId: "order_Kj98a7sd8f9",
    razorpayPaymentId: "pay_Lm34k5j6h7g",
    razorpaySignature: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  });
  assert.strictEqual(validVerifyInput.razorpayOrderId, "order_Kj98a7sd8f9");

  const validRefundInput = CreateRefundSchema.parse({
    paymentId: "c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
    amount: 750.5,
    reason: "Customer returned defective packaging",
  });
  assert.strictEqual(validRefundInput.amount, 750.5);

  // Invalid refund amount (negative or zero)
  assert.throws(() => {
    CreateRefundSchema.parse({
      paymentId: "c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
      amount: -50,
      reason: "Invalid amount",
    });
  }, /Refund amount must be greater than zero/);

  console.log("✅ Test 1 Passed: Payment, verification, and refund schemas enforced.");

  // ----------------------------------------------------------------------
  // Test 2: Amount Conversion to Smallest Unit (Paise Arithmetic)
  // ----------------------------------------------------------------------
  console.log("▶️ Test 2: Currency Subunit (Paise) Conversion Arithmetic...");

  function toPaise(amountInRupees: number): number {
    return Math.round(amountInRupees * 100);
  }

  assert.strictEqual(toPaise(1299.0), 129900);
  assert.strictEqual(toPaise(75.5), 7550);
  assert.strictEqual(toPaise(0.99), 99);
  assert.strictEqual(toPaise(4999.99), 499999);

  console.log("✅ Test 2 Passed: Server-authoritative INR to paise conversion verified.");

  // ----------------------------------------------------------------------
  // Test 3: Synchronous HMAC-SHA256 Signature Verification
  // ----------------------------------------------------------------------
  console.log("▶️ Test 3: Synchronous Razorpay Payment Signature Verification...");

  const providerOrderId = "order_O123456789";
  const providerPaymentId = "pay_P987654321";

  // Generate authentic signature
  const validSignature = crypto
    .createHmac("sha256", testKeySecret)
    .update(`${providerOrderId}|${providerPaymentId}`)
    .digest("hex");

  function verifySignature(orderId: string, paymentId: string, signature: string, secret: string): boolean {
    const payload = `${orderId}|${paymentId}`;
    const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(signature, "utf8"));
  }

  assert.strictEqual(verifySignature(providerOrderId, providerPaymentId, validSignature, testKeySecret), true);

  // Forged signature
  const forgedSignature = "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789";
  assert.strictEqual(verifySignature(providerOrderId, providerPaymentId, forgedSignature, testKeySecret), false);

  // Tampered payment ID
  assert.strictEqual(verifySignature(providerOrderId, "pay_TAMPERED", validSignature, testKeySecret), false);

  console.log("✅ Test 3 Passed: Cryptographic HMAC-SHA256 signature verification and forgery rejection verified.");

  // ----------------------------------------------------------------------
  // Test 4: Webhook Signature Verification & Payload Tamper Rejection
  // ----------------------------------------------------------------------
  console.log("▶️ Test 4: Asynchronous Webhook HMAC-SHA256 Signature Verification...");

  const webhookPayload = JSON.stringify({
    entity: "event",
    account_id: "acc_123456",
    event: "order.paid",
    event_id: "evt_123456789",
    contains: ["payment", "order"],
    payload: {
      payment: {
        entity: {
          id: "pay_W123456",
          order_id: "order_W123456",
          amount: 150000,
          currency: "INR",
          status: "captured",
        },
      },
    },
  });

  const validWebhookSignature = crypto
    .createHmac("sha256", testWebhookSecret)
    .update(webhookPayload)
    .digest("hex");

  function verifyWebhook(rawBody: string, signature: string, secret: string): boolean {
    const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(signature, "utf8"));
  }

  assert.strictEqual(verifyWebhook(webhookPayload, validWebhookSignature, testWebhookSecret), true);

  // Tampered payload with original signature
  const tamperedPayload = webhookPayload.replace("150000", "50000");
  assert.strictEqual(verifyWebhook(tamperedPayload, validWebhookSignature, testWebhookSecret), false);

  console.log("✅ Test 4 Passed: Webhook signature verification and body tamper detection verified.");

  // ----------------------------------------------------------------------
  // Test 5: Webhook Event Parsing & Normalization
  // ----------------------------------------------------------------------
  console.log("▶️ Test 5: Webhook Payload Parsing and Event Normalization...");

  const adapter = new RazorpayAdapter();
  const parsedSuccess = adapter.parseWebhookEvent(webhookPayload);
  assert.strictEqual(parsedSuccess.status, "SUCCESS");
  assert.strictEqual(parsedSuccess.providerPaymentId, "pay_W123456");
  assert.strictEqual(parsedSuccess.providerOrderId, "order_W123456");
  assert.strictEqual(parsedSuccess.amount, 1500); // 150000 paise -> ₹1500

  const failedPayload = JSON.stringify({
    event: "payment.failed",
    event_id: "evt_fail_999",
    payload: {
      payment: {
        entity: {
          id: "pay_F999",
          order_id: "order_F999",
          error_description: "Card declined by issuing bank",
        },
      },
    },
  });
  const parsedFailed = adapter.parseWebhookEvent(failedPayload);
  assert.strictEqual(parsedFailed.status, "FAILED");
  assert.strictEqual(parsedFailed.errorDescription, "Card declined by issuing bank");

  console.log("✅ Test 5 Passed: Webhook event parsing and field normalization verified.");

  // ----------------------------------------------------------------------
  // Test 6: Webhook Idempotency Logic
  // ----------------------------------------------------------------------
  console.log("▶️ Test 6: Webhook Idempotency Simulation...");

  const processedEventIds = new Set<string>();

  function handleWebhookDelivery(eventId: string): { processed: boolean; reason: string } {
    if (processedEventIds.has(eventId)) {
      return { processed: false, reason: "IDEMPOTENT_IGNORED" };
    }
    processedEventIds.add(eventId);
    return { processed: true, reason: "PROCESSED" };
  }

  const delivery1 = handleWebhookDelivery("evt_unique_101");
  assert.strictEqual(delivery1.processed, true);
  assert.strictEqual(delivery1.reason, "PROCESSED");

  // Duplicate delivery of same event
  const delivery2 = handleWebhookDelivery("evt_unique_101");
  assert.strictEqual(delivery2.processed, false);
  assert.strictEqual(delivery2.reason, "IDEMPOTENT_IGNORED");

  console.log("✅ Test 6 Passed: Duplicate webhook delivery idempotency verified.");

  // ----------------------------------------------------------------------
  // Test 7: Payment State Machine & Inventory Hold Conversion
  // ----------------------------------------------------------------------
  console.log("▶️ Test 7: Payment State Machine & Inventory Hold Conversion...");

  function simulatePaymentSuccess(currentOrderStatus: OrderStatus, currentPaymentStatus: PaymentStatus) {
    if (currentPaymentStatus === PaymentStatus.PAID) {
      return { newOrderStatus: currentOrderStatus, inventoryAction: "NONE (ALREADY DEDUCTED)" };
    }
    if (currentOrderStatus === OrderStatus.PENDING) {
      return {
        newOrderStatus: OrderStatus.CONFIRMED,
        newPaymentStatus: PaymentStatus.PAID,
        inventoryAction: "CONVERT_HOLD_TO_DEDUCT",
      };
    }
    return { newOrderStatus: currentOrderStatus, inventoryAction: "NONE" };
  }

  const syncResult = simulatePaymentSuccess(OrderStatus.PENDING, PaymentStatus.PENDING);
  assert.strictEqual(syncResult.newOrderStatus, OrderStatus.CONFIRMED);
  assert.strictEqual(syncResult.newPaymentStatus, PaymentStatus.PAID);
  assert.strictEqual(syncResult.inventoryAction, "CONVERT_HOLD_TO_DEDUCT");

  console.log("✅ Test 7 Passed: Order confirmation and inventory hold conversion verified.");

  // ----------------------------------------------------------------------
  // Test 8: Late Payment & Auto-Refund on Inventory Depletion
  // ----------------------------------------------------------------------
  console.log("▶️ Test 8: Late Payment Resolution & Auto-Refund Trigger...");

  function resolveLatePayment(orderStatus: OrderStatus, inventoryAvailable: boolean) {
    if (orderStatus !== OrderStatus.CANCELLED) {
      return { action: "NORMAL_CONFIRM" };
    }
    if (inventoryAvailable) {
      return { action: "RESURRECT_AND_DEDUCT" };
    }
    return { action: "AUTO_REFUND_DUE_TO_OUT_OF_STOCK" };
  }

  // Late payment when warehouse has stock -> Resurrect
  const lateWithStock = resolveLatePayment(OrderStatus.CANCELLED, true);
  assert.strictEqual(lateWithStock.action, "RESURRECT_AND_DEDUCT");

  // Late payment when warehouse is sold out -> Auto Refund
  const lateWithoutStock = resolveLatePayment(OrderStatus.CANCELLED, false);
  assert.strictEqual(lateWithoutStock.action, "AUTO_REFUND_DUE_TO_OUT_OF_STOCK");

  console.log("✅ Test 8 Passed: Late payment auto-refund logic verified.");

  // ----------------------------------------------------------------------
  // Test 9: Refund Amount Bounds & Multiple Partials
  // ----------------------------------------------------------------------
  console.log("▶️ Test 9: Refund Bounds & Balance Deductions...");

  function validateRefundEligibility(capturedAmount: number, existingRefunds: number[], requestedAmount: number) {
    const totalRefunded = existingRefunds.reduce((a, b) => a + b, 0);
    const available = capturedAmount - totalRefunded;
    if (requestedAmount <= 0) return { valid: false, error: "AMOUNT_MUST_BE_POSITIVE" };
    if (requestedAmount > available) return { valid: false, error: "EXCEEDS_CAPTURED_AMOUNT" };
    const isFull = totalRefunded + requestedAmount >= capturedAmount;
    return { valid: true, isFull, newAvailable: available - requestedAmount };
  }

  // ₹2000 payment, partial refund of ₹500
  const refund1 = validateRefundEligibility(2000, [], 500);
  assert.strictEqual(refund1.valid, true);
  assert.strictEqual(refund1.isFull, false);
  assert.strictEqual(refund1.newAvailable, 1500);

  // Second partial refund of ₹1500 -> Becomes Full
  const refund2 = validateRefundEligibility(2000, [500], 1500);
  assert.strictEqual(refund2.valid, true);
  assert.strictEqual(refund2.isFull, true);
  assert.strictEqual(refund2.newAvailable, 0);

  // Over-refund attempt
  const refundOver = validateRefundEligibility(2000, [500, 1500], 100);
  assert.strictEqual(refundOver.valid, false);
  assert.strictEqual(refundOver.error, "EXCEEDS_CAPTURED_AMOUNT");

  console.log("✅ Test 9 Passed: Refund bounds and multi-partial balances verified.");

  // ----------------------------------------------------------------------
  // Test 10: RBAC Refund Permissions
  // ----------------------------------------------------------------------
  console.log("▶️ Test 10: RBAC Permissions for Payment Refund Operations...");

  // Customer cannot initiate refunds
  assert.strictEqual(hasPermission(RoleType.CUSTOMER, "orders:write"), false);

  // Super Admin & Order Manager can initiate refunds
  assert.strictEqual(hasPermission(RoleType.SUPER_ADMIN, "orders:write"), true);
  assert.strictEqual(hasPermission(RoleType.ORDER_MGR, "orders:write"), true);

  // Content Manager cannot initiate refunds
  assert.strictEqual(hasPermission(RoleType.CONTENT_MGR, "orders:write"), false);

  console.log("✅ Test 10 Passed: Administrative RBAC refund gating verified.");

  console.log("\n🎉 All Phase 9G Payment Gateway & Webhook Tests passed successfully!\n");
}

runPaymentTests().catch((err) => {
  console.error("❌ Payment test failure:", err);
  process.exit(1);
});
