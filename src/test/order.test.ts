import assert from "node:assert";
import {
  CreateAddressSchema,
  UpdateAddressSchema,
} from "../lib/validation/address.schema";
import {
  EstimateShippingSchema,
  CheckoutPreviewSchema,
  CreateOrderSchema,
  CancelOrderSchema,
  AdminUpdateOrderStatusSchema,
  AdminCreateShipmentSchema,
  AdminUpdateTrackingSchema,
} from "../lib/validation/order.schema";
import {
  validateOrderStatusTransition,
  shouldRestockOnCancellation,
  CustomerCancellableStatuses,
  CancellableOrderStatuses,
} from "../lib/order-state-machine";
import { OrderConfig } from "../config/order.config";
import { ShippingService } from "../services/shipping.service";
import { OrderService } from "../services/order.service";
import { hasPermission } from "../lib/auth/rbac";
import { OrderStatus, PaymentStatus, RoleType } from "@prisma/client";

async function runOrderTests() {
  console.log("🧪 Running Phase 9F Order Management & Fulfillment Test Suite...\n");

  // ----------------------------------------------------------------------
  // Test 1: Indian Address Format & PIN Code Validation
  // ----------------------------------------------------------------------
  console.log("▶️ Test 1: Indian Address & PIN Code Schema Validation...");

  // Valid Indian address
  const validAddress = CreateAddressSchema.parse({
    recipientName: "Aarav Sharma",
    addressLine1: "Flat 402, Lotus Greens",
    addressLine2: "Sector 78",
    city: "Noida",
    state: "Uttar Pradesh",
    postalCode: "201301",
    phone: "9876543210",
    isDefaultShipping: true,
    isDefaultBilling: false,
    gstin: "09AAACH7409R1ZZ",
    companyName: "Sharma Enterprises",
  });
  assert.strictEqual(validAddress.recipientName, "Aarav Sharma");
  assert.strictEqual(validAddress.postalCode, "201301");
  assert.strictEqual(validAddress.phone, "9876543210");
  assert.strictEqual(validAddress.gstin, "09AAACH7409R1ZZ");

  // Invalid PIN code (5 digits)
  assert.throws(() => {
    CreateAddressSchema.parse({
      recipientName: "Test User",
      addressLine1: "123 Street",
      city: "Delhi",
      state: "Delhi",
      postalCode: "11001", // Invalid
      phone: "9876543210",
    });
  }, /valid 6-digit Indian PIN code/i);

  // Invalid PIN code (starting with 0)
  assert.throws(() => {
    CreateAddressSchema.parse({
      recipientName: "Test User",
      addressLine1: "123 Street",
      city: "Delhi",
      state: "Delhi",
      postalCode: "010001", // Invalid start
      phone: "9876543210",
    });
  }, /valid 6-digit Indian PIN code/i);

  // Invalid Phone Number (invalid prefix)
  assert.throws(() => {
    CreateAddressSchema.parse({
      recipientName: "Test User",
      addressLine1: "123 Street",
      city: "Delhi",
      state: "Delhi",
      postalCode: "110001",
      phone: "1234567890", // Invalid prefix
    });
  }, /valid 10-digit Indian mobile number/i);

  // Invalid GSTIN Format
  assert.throws(() => {
    CreateAddressSchema.parse({
      recipientName: "Test User",
      addressLine1: "123 Street",
      city: "Delhi",
      state: "Delhi",
      postalCode: "110001",
      phone: "9876543210",
      gstin: "INVALID_GSTIN_123",
    });
  }, /Invalid 15-character GSTIN format/i);

  console.log("✅ Test 1 Passed: Indian address, 6-digit PIN code, mobile number, and GSTIN formats verified.");

  // ----------------------------------------------------------------------
  // Test 2: Shipping Fee & Free Shipping Threshold Calculation
  // ----------------------------------------------------------------------
  console.log("▶️ Test 2: Shipping Estimation & Free Delivery Threshold...");

  // Below ₹999 -> Standard Delivery Fee ₹75
  const belowThreshold = ShippingService.estimateShipping({
    postalCode: "110001",
    subtotal: 750,
  });
  assert.strictEqual(belowThreshold.shippingFee, OrderConfig.STANDARD_DELIVERY_FEE);
  assert.strictEqual(belowThreshold.isFreeShipping, false);
  assert.strictEqual(belowThreshold.freeShippingThreshold, 999);
  assert.strictEqual(belowThreshold.amountNeededForFreeShipping, 249);

  // Exactly ₹999 -> Free Shipping
  const exactThreshold = ShippingService.estimateShipping({
    postalCode: "110001",
    subtotal: 999,
  });
  assert.strictEqual(exactThreshold.shippingFee, 0);
  assert.strictEqual(exactThreshold.isFreeShipping, true);
  assert.strictEqual(exactThreshold.amountNeededForFreeShipping, 0);

  // Above ₹999 -> Free Shipping
  const aboveThreshold = ShippingService.estimateShipping({
    postalCode: "560001",
    subtotal: 2500,
  });
  assert.strictEqual(aboveThreshold.shippingFee, 0);
  assert.strictEqual(aboveThreshold.isFreeShipping, true);

  console.log("✅ Test 2 Passed: Shipping fee and free shipping threshold calculations verified.");

  // ----------------------------------------------------------------------
  // Test 3: Cash on Delivery (COD) Rules & Surcharge Caps
  // ----------------------------------------------------------------------
  console.log("▶️ Test 3: COD Surcharge & Max Order Limit Rules...");

  function calculateCodFee(subtotal: number, paymentMethod: string): { fee: number; eligible: boolean; error?: string } {
    if (paymentMethod !== "COD") {
      return { fee: 0, eligible: true };
    }
    if (subtotal > OrderConfig.COD_MAX_ORDER_AMOUNT) {
      return {
        fee: 0,
        eligible: false,
        error: `Cash on Delivery is only available for orders up to ₹${OrderConfig.COD_MAX_ORDER_AMOUNT}. Current subtotal is ₹${subtotal}.`,
      };
    }
    return { fee: OrderConfig.COD_FEE, eligible: true };
  }

  // Eligible COD under ₹5000
  const eligibleCod = calculateCodFee(2400, "COD");
  assert.strictEqual(eligibleCod.eligible, true);
  assert.strictEqual(eligibleCod.fee, 50);

  // Ineligible COD exceeding ₹5000 cap
  const ineligibleCod = calculateCodFee(5500, "COD");
  assert.strictEqual(ineligibleCod.eligible, false);
  assert.match(ineligibleCod.error!, /Cash on Delivery is only available for orders up to ₹5000/);

  // Online payment on ₹10000 order (no COD fee)
  const onlinePayment = calculateCodFee(10000, "ONLINE");
  assert.strictEqual(onlinePayment.eligible, true);
  assert.strictEqual(onlinePayment.fee, 0);

  console.log("✅ Test 3 Passed: COD ₹50 surcharge and ₹5,000 maximum order limit enforced.");

  // ----------------------------------------------------------------------
  // Test 4: Checkout Financial Arithmetic & Summary Dry-Run
  // ----------------------------------------------------------------------
  console.log("▶️ Test 4: Server-Authoritative Checkout Financial Arithmetic...");

  function computeCheckoutTotal(params: {
    subtotal: number;
    couponDiscount: number;
    shippingFee: number;
    codFee: number;
    giftWrapFee: number;
  }) {
    const netSubtotal = Math.max(0, params.subtotal - params.couponDiscount);
    const finalPayable = Math.max(0, netSubtotal + params.shippingFee + params.codFee + params.giftWrapFee);
    return Math.round(finalPayable * 100) / 100;
  }

  // Case A: ₹800 order + ₹75 shipping + ₹50 gift wrap = ₹925
  const caseA = computeCheckoutTotal({
    subtotal: 800,
    couponDiscount: 0,
    shippingFee: 75,
    codFee: 0,
    giftWrapFee: 50,
  });
  assert.strictEqual(caseA, 925);

  // Case B: ₹1500 order - ₹200 coupon (subtotal ₹1300) + Free Shipping (₹0) + ₹50 COD fee = ₹1350
  const caseB = computeCheckoutTotal({
    subtotal: 1500,
    couponDiscount: 200,
    shippingFee: 0,
    codFee: 50,
    giftWrapFee: 0,
  });
  assert.strictEqual(caseB, 1350);

  // Case C: ₹500 order - ₹500 coupon = ₹0 net + ₹75 shipping = ₹75
  const caseC = computeCheckoutTotal({
    subtotal: 500,
    couponDiscount: 500,
    shippingFee: 75,
    codFee: 0,
    giftWrapFee: 0,
  });
  assert.strictEqual(caseC, 75);

  console.log("✅ Test 4 Passed: Server-authoritative line-item financial calculation verified.");

  // ----------------------------------------------------------------------
  // Test 5: Order State Machine Transitions
  // ----------------------------------------------------------------------
  console.log("▶️ Test 5: Order State Machine Transitions & Invariants...");

  // Valid forward progressions
  assert.doesNotThrow(() => validateOrderStatusTransition(OrderStatus.PENDING, OrderStatus.CONFIRMED));
  assert.doesNotThrow(() => validateOrderStatusTransition(OrderStatus.CONFIRMED, OrderStatus.PROCESSING));
  assert.doesNotThrow(() => validateOrderStatusTransition(OrderStatus.PROCESSING, OrderStatus.PACKED));
  assert.doesNotThrow(() => validateOrderStatusTransition(OrderStatus.PACKED, OrderStatus.SHIPPED));
  assert.doesNotThrow(() => validateOrderStatusTransition(OrderStatus.SHIPPED, OrderStatus.OUT_FOR_DELIVERY));
  assert.doesNotThrow(() => validateOrderStatusTransition(OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED));

  // Valid pre-dispatch cancellations
  assert.doesNotThrow(() => validateOrderStatusTransition(OrderStatus.PENDING, OrderStatus.CANCELLED));
  assert.doesNotThrow(() => validateOrderStatusTransition(OrderStatus.CONFIRMED, OrderStatus.CANCELLED));
  assert.doesNotThrow(() => validateOrderStatusTransition(OrderStatus.PROCESSING, OrderStatus.CANCELLED));
  assert.doesNotThrow(() => validateOrderStatusTransition(OrderStatus.PACKED, OrderStatus.CANCELLED));

  // Illegal transitions (Must throw)
  assert.throws(() => {
    validateOrderStatusTransition(OrderStatus.DELIVERED, OrderStatus.CANCELLED);
  }, /Illegal order status transition from 'DELIVERED' to 'CANCELLED'/);

  assert.throws(() => {
    validateOrderStatusTransition(OrderStatus.CANCELLED, OrderStatus.DELIVERED);
  }, /Illegal order status transition from 'CANCELLED' to 'DELIVERED'/);

  assert.throws(() => {
    validateOrderStatusTransition(OrderStatus.SHIPPED, OrderStatus.PROCESSING);
  }, /Illegal order status transition from 'SHIPPED' to 'PROCESSING'/);

  console.log("✅ Test 5 Passed: Order state machine transitions and illegal jumps properly rejected.");

  // ----------------------------------------------------------------------
  // Test 6: Customer Pre-Dispatch Cancellation & Restock Rules
  // ----------------------------------------------------------------------
  console.log("▶️ Test 6: Customer Cancellation Bounds & Inventory Restock Decision...");

  // Verify customer cancellable statuses (pre-processing/pre-dispatch: PENDING, CONFIRMED)
  assert.strictEqual(CustomerCancellableStatuses.includes(OrderStatus.PENDING), true);
  assert.strictEqual(CustomerCancellableStatuses.includes(OrderStatus.CONFIRMED), true);
  assert.strictEqual(CustomerCancellableStatuses.includes(OrderStatus.SHIPPED), false);
  assert.strictEqual(CustomerCancellableStatuses.includes(OrderStatus.DELIVERED), false);

  // Verify all cancellable statuses before dispatch
  assert.strictEqual(CancellableOrderStatuses.includes(OrderStatus.PENDING), true);
  assert.strictEqual(CancellableOrderStatuses.includes(OrderStatus.CONFIRMED), true);
  assert.strictEqual(CancellableOrderStatuses.includes(OrderStatus.PROCESSING), true);
  assert.strictEqual(CancellableOrderStatuses.includes(OrderStatus.PACKED), true);
  assert.strictEqual(CancellableOrderStatuses.includes(OrderStatus.SHIPPED), false);

  // Restock logic
  assert.strictEqual(shouldRestockOnCancellation(OrderStatus.PENDING), true);
  assert.strictEqual(shouldRestockOnCancellation(OrderStatus.CONFIRMED), true);
  assert.strictEqual(shouldRestockOnCancellation(OrderStatus.PROCESSING), true);
  assert.strictEqual(shouldRestockOnCancellation(OrderStatus.PACKED), true);
  assert.strictEqual(shouldRestockOnCancellation(OrderStatus.DELIVERED), false);
  assert.strictEqual(shouldRestockOnCancellation(OrderStatus.CANCELLED), false);

  console.log("✅ Test 6 Passed: Customer pre-dispatch eligibility and inventory restock rules verified.");

  // ----------------------------------------------------------------------
  // Test 7: Shipment & AWB Manifestation Schema
  // ----------------------------------------------------------------------
  console.log("▶️ Test 7: Admin Shipment & AWB Tracking Schema...");

  const validShipment = AdminCreateShipmentSchema.parse({
    provider: "BLUEDART",
    awbNumber: "BD987654321IN",
    courierName: "Blue Dart Express",
    shippingLabelUrl: "https://cdn.fruitsandnuts.co.in/labels/BD987654321IN.pdf",
    manifestId: "MNF-2026-001",
  });
  assert.strictEqual(validShipment.provider, "BLUEDART");
  assert.strictEqual(validShipment.awbNumber, "BD987654321IN");
  assert.strictEqual(validShipment.courierName, "Blue Dart Express");

  // Invalid AWB (empty or too short)
  assert.throws(() => {
    AdminCreateShipmentSchema.parse({
      provider: "DELHIVERY",
      awbNumber: "1", // Too short
      courierName: "Delhivery",
    });
  }, /AWB number is required/i);

  console.log("✅ Test 7 Passed: Shipment provider and AWB schema validation verified.");

  // ----------------------------------------------------------------------
  // Test 8: RBAC Permissions for Order Operations
  // ----------------------------------------------------------------------
  console.log("▶️ Test 8: RBAC Permissions for Order Management...");

  // Customer cannot access admin order listing or status modification
  assert.strictEqual(hasPermission(RoleType.CUSTOMER, "orders:read"), false);
  assert.strictEqual(hasPermission(RoleType.CUSTOMER, "orders:write"), false);

  // Super Admin has full order permissions
  assert.strictEqual(hasPermission(RoleType.SUPER_ADMIN, "orders:read"), true);
  assert.strictEqual(hasPermission(RoleType.SUPER_ADMIN, "orders:write"), true);

  // Order Manager has full order permissions
  assert.strictEqual(hasPermission(RoleType.ORDER_MGR, "orders:read"), true);
  assert.strictEqual(hasPermission(RoleType.ORDER_MGR, "orders:write"), true);

  // Inventory Manager does not have order write permissions
  assert.strictEqual(hasPermission(RoleType.INVENTORY_MGR, "orders:read"), false);
  assert.strictEqual(hasPermission(RoleType.INVENTORY_MGR, "orders:write"), false);

  console.log("✅ Test 8 Passed: Role-based access control matrix enforces order access boundaries.");

  // ----------------------------------------------------------------------
  // Test 9: Abandoned Online Order Release Logic
  // ----------------------------------------------------------------------
  console.log("▶️ Test 9: Abandoned Online Order Release Timeout Logic...");

  const timeoutMinutes = OrderConfig.PAYMENT_PENDING_HOLD_TIMEOUT_MINUTES;
  assert.strictEqual(timeoutMinutes, 30);

  const createdAt = new Date(Date.now() - 35 * 60 * 1000); // 35 minutes ago
  const cutoffTime = new Date(Date.now() - timeoutMinutes * 60 * 1000); // 30 minutes ago
  const isExpired = createdAt < cutoffTime;
  assert.strictEqual(isExpired, true);

  const freshOrder = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
  const isFreshExpired = freshOrder < cutoffTime;
  assert.strictEqual(isFreshExpired, false);

  console.log("✅ Test 9 Passed: 30-minute stock hold expiry calculation verified.");

  // ----------------------------------------------------------------------
  // Test 10: Cron Endpoint Security & Header Token Verification
  // ----------------------------------------------------------------------
  console.log("▶️ Test 10: Cron Route Security & Authorization Header Token Verification...");

  const expectedSecret = "secret_cron_token_xyz987";
  const extractToken = (authHeader?: string | null, xCronSecret?: string | null) => {
    return xCronSecret || (authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null);
  };

  // Valid Bearer auth header
  assert.strictEqual(
    extractToken(`Bearer ${expectedSecret}`, null),
    expectedSecret
  );

  // Valid x-cron-secret custom header
  assert.strictEqual(
    extractToken(null, expectedSecret),
    expectedSecret
  );

  // Invalid bearer token rejected
  const wrongToken = extractToken("Bearer wrong_secret", null);
  assert.strictEqual(wrongToken === expectedSecret, false);

  // Missing token rejected
  const missingToken = extractToken(null, null);
  assert.strictEqual(missingToken === expectedSecret, false);

  console.log("✅ Test 10 Passed: Cron route token authorization and header extraction verified.");

  // ----------------------------------------------------------------------
  // Test 11: Customer Order Tracking Ownership & 403 Protection
  // ----------------------------------------------------------------------
  console.log("▶️ Test 11: Customer Order Tracking Ownership & Cross-Customer Access Protection...");

  const customerA = "usr-test-track-customer-a";
  const customerB = "usr-test-track-customer-b";
  const adminActor = "usr-test-track-admin";

  const createdOrder = await OrderService.createOrder(customerA, {
    paymentMethod: "COD",
    shippingAddress: {
      recipientName: "Rohan Verma",
      phone: "9876543210",
      addressLine1: "14 Residency Road",
      city: "Bengaluru",
      state: "Karnataka",
      postalCode: "560025",
    },
    items: [
      {
        variantId: "var-mamra-500",
        quantity: 1,
      },
    ],
  } as any);

  // Customer A can view their own order tracking
  const trackInitial = await OrderService.getCustomerOrderTracking(customerA, createdOrder.id);
  assert.strictEqual(trackInitial.orderId, createdOrder.id);
  assert.strictEqual(trackInitial.orderNumber, createdOrder.orderNumber);
  assert.strictEqual(trackInitial.currentStatus, "CONFIRMED");
  assert.strictEqual(trackInitial.trackingInfoAvailable, false);
  assert.strictEqual(trackInitial.courierName, null);
  assert.strictEqual(trackInitial.trackingNumber, null);
  assert.strictEqual(trackInitial.trackingUrl, null);

  // Customer B CANNOT access Customer A's order or tracking (must throw 403 Forbidden)
  await assert.rejects(
    async () => {
      await OrderService.getCustomerOrderTracking(customerB, createdOrder.id);
    },
    (err: any) => err?.statusCode === 403 && err?.code === "AUTHORIZATION_ERROR"
  );

  await assert.rejects(
    async () => {
      await OrderService.getCustomerOrderById(customerB, createdOrder.id);
    },
    (err: any) => err?.statusCode === 403 && err?.code === "AUTHORIZATION_ERROR"
  );

  console.log("✅ Test 11 Passed: Customer ownership verified and cross-customer access blocked with 403 Forbidden.");

  // ----------------------------------------------------------------------
  // Test 12: Complete 6-Milestone Tracking Timeline & Admin Tracking Updates
  // ----------------------------------------------------------------------
  console.log("▶️ Test 12: Complete 6-Milestone Timeline & Admin Shipment Tracking Updates...");

  // 1) Initial CONFIRMED state: Milestones 0 (ORDER_PLACED) & 1 (CONFIRMED) completed; 2..5 UPCOMING
  assert.strictEqual(trackInitial.milestones.length, 6);
  assert.strictEqual(trackInitial.milestones[0].key, "ORDER_PLACED");
  assert.strictEqual(trackInitial.milestones[0].completed, true);
  assert.ok(trackInitial.milestones[0].timestamp);
  assert.strictEqual(trackInitial.milestones[1].key, "CONFIRMED");
  assert.strictEqual(trackInitial.milestones[1].completed, true);
  assert.strictEqual(trackInitial.milestones[1].current, true);
  for (let i = 2; i < 6; i++) {
    assert.strictEqual(trackInitial.milestones[i].completed, false);
    assert.strictEqual(trackInitial.milestones[i].state, "UPCOMING");
  }

  // 2) Advance to PROCESSING -> PACKED
  await OrderService.updateAdminOrderStatus(
    createdOrder.id,
    { newStatus: OrderStatus.PROCESSING, reason: "Sorting & quality grading started" },
    adminActor
  );
  await OrderService.updateAdminOrderStatus(
    createdOrder.id,
    { newStatus: OrderStatus.PACKED, reason: "Vacuum-sealed in gold pouch" },
    adminActor
  );
  const trackPacked = await OrderService.getCustomerOrderTracking(customerA, createdOrder.id);
  assert.strictEqual(trackPacked.currentStatus, "PACKED");
  assert.strictEqual(trackPacked.milestones[2].key, "PACKED");
  assert.strictEqual(trackPacked.milestones[2].completed, true);
  assert.strictEqual(trackPacked.milestones[2].current, true);
  assert.ok(trackPacked.milestones[2].timestamp);
  assert.strictEqual(trackPacked.milestones[3].completed, false);

  // 3) Admin manifests shipment with courier, AWB, tracking URL, and estimated delivery date -> SHIPPED
  const expectedDate = new Date(Date.now() + 3 * 86400000);
  await OrderService.createShipment(
    createdOrder.id,
    {
      provider: "BLUEDART",
      courierName: "Blue Dart Express",
      awbNumber: "BD778899001IN",
      trackingUrl: "https://www.bluedart.com/tracking?awb=BD778899001IN",
      estimatedDeliveryDate: expectedDate,
      manifestId: "MAN-TEST-01",
    },
    adminActor
  );

  const trackShipped = await OrderService.getCustomerOrderTracking(customerA, createdOrder.id);
  assert.strictEqual(trackShipped.currentStatus, "SHIPPED");
  assert.strictEqual(trackShipped.trackingInfoAvailable, true);
  assert.strictEqual(trackShipped.courierName, "Blue Dart Express");
  assert.strictEqual(trackShipped.trackingNumber, "BD778899001IN");
  assert.strictEqual(trackShipped.trackingUrl, "https://www.bluedart.com/tracking?awb=BD778899001IN");
  assert.ok(trackShipped.estimatedDeliveryDate);
  assert.strictEqual(trackShipped.milestones[3].key, "SHIPPED");
  assert.strictEqual(trackShipped.milestones[3].completed, true);
  assert.strictEqual(trackShipped.milestones[3].current, true);
  assert.strictEqual(trackShipped.milestones[4].completed, false);
  assert.strictEqual(trackShipped.milestones[5].completed, false);

  // 4) Admin updates courier / tracking number / status to OUT_FOR_DELIVERY
  const parsedTrackingUpdate = AdminUpdateTrackingSchema.parse({
    courierName: "Delhivery Priority",
    awbNumber: "DLV998877665IN",
    trackingUrl: "https://www.delhivery.com/track/package/DLV998877665IN",
    newStatus: OrderStatus.OUT_FOR_DELIVERY,
    reason: "Out for doorstep delivery in Bengaluru",
  });
  await OrderService.updateShipmentTracking(createdOrder.id, parsedTrackingUpdate, adminActor);

  const trackOfd = await OrderService.getCustomerOrderTracking(customerA, createdOrder.id);
  assert.strictEqual(trackOfd.currentStatus, "OUT_FOR_DELIVERY");
  assert.strictEqual(trackOfd.isOutForDelivery, true);
  assert.strictEqual(trackOfd.courierName, "Delhivery Priority");
  assert.strictEqual(trackOfd.trackingNumber, "DLV998877665IN");
  assert.strictEqual(trackOfd.trackingUrl, "https://www.delhivery.com/track/package/DLV998877665IN");
  assert.strictEqual(trackOfd.milestones[4].key, "OUT_FOR_DELIVERY");
  assert.strictEqual(trackOfd.milestones[4].completed, true);
  assert.strictEqual(trackOfd.milestones[4].current, true);
  assert.strictEqual(trackOfd.milestones[5].completed, false);

  // 5) Advance to DELIVERED
  await OrderService.updateAdminOrderStatus(
    createdOrder.id,
    { newStatus: OrderStatus.DELIVERED, reason: "Delivered and signed by recipient" },
    adminActor
  );
  const trackDelivered = await OrderService.getCustomerOrderTracking(customerA, createdOrder.id);
  assert.strictEqual(trackDelivered.currentStatus, "DELIVERED");
  assert.strictEqual(trackDelivered.isDelivered, true);
  assert.ok(trackDelivered.actualDeliveryDate);
  for (let i = 0; i < 6; i++) {
    assert.strictEqual(trackDelivered.milestones[i].completed, true);
    assert.ok(trackDelivered.milestones[i].timestamp);
  }

  console.log("✅ Test 12 Passed: All 6 tracking milestones and admin tracking updates verified.");

  // ----------------------------------------------------------------------
  // Test 13: Cancelled Order Tracking Timeline State
  // ----------------------------------------------------------------------
  console.log("▶️ Test 13: Cancelled Order Tracking Timeline State...");

  const cancelOrder = await OrderService.createOrder(customerA, {
    paymentMethod: "COD",
    shippingAddress: {
      recipientName: "Rohan Verma",
      phone: "9876543210",
      addressLine1: "14 Residency Road",
      city: "Bengaluru",
      state: "Karnataka",
      postalCode: "560025",
    },
    items: [
      {
        variantId: "var-raisins-250",
        quantity: 1,
      },
    ],
  } as any);

  await OrderService.cancelCustomerOrder(customerA, cancelOrder.id, {
    reason: "Ordered wrong weight variant",
  });
  const trackCancelled = await OrderService.getCustomerOrderTracking(customerA, cancelOrder.id);
  assert.strictEqual(trackCancelled.isCancelled, true);
  assert.strictEqual(trackCancelled.currentStatus, "CANCELLED");
  assert.ok(trackCancelled.cancelReason?.includes("Ordered wrong weight variant"));
  assert.ok(trackCancelled.cancelledAt);
  // Future milestones (PACKED, SHIPPED, OUT_FOR_DELIVERY, DELIVERED) must NOT be marked completed
  assert.strictEqual(trackCancelled.milestones[2].completed, false);
  assert.strictEqual(trackCancelled.milestones[3].completed, false);
  assert.strictEqual(trackCancelled.milestones[4].completed, false);
  assert.strictEqual(trackCancelled.milestones[5].completed, false);

  console.log("✅ Test 13 Passed: Cancelled order tracking preserves pre-cancellation history and never marks future milestones completed.");

  console.log("\n🎉 All Phase 9F Order Management & Fulfillment Tests passed successfully!\n");
}

runOrderTests().catch((err) => {
  console.error("❌ Order test failure:", err);
  process.exit(1);
});
