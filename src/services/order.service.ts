import fs from "fs";
import path from "path";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { runTransaction, acquireVariantRowLocks } from "@/database/transactions";
import { OrderConfig } from "@/config/order.config";
import {
  validateOrderStatusTransition,
  shouldRestockOnCancellation,
  CustomerCancellableStatuses,
} from "@/lib/order-state-machine";
import { CartService } from "./cart.service";
import { CouponService } from "./coupon.service";
import { ShippingService } from "./shipping.service";
import { AddressService } from "./address.service";
import {
  CheckoutPreviewSchema,
  CreateOrderSchema,
  CancelOrderSchema,
  AdminUpdateOrderStatusSchema,
  AdminCreateShipmentSchema,
  AdminUpdateTrackingSchema,
  AdminOrderListQuerySchema,
  CustomerOrderListQuerySchema,
} from "@/lib/validation/order.schema";
import {
  InventoryTransactionType,
  OrderStatus,
  PaymentStatus,
  Prisma,
} from "@prisma/client";
import { z } from "zod";
import { STOREFRONT_PRODUCTS } from "@/lib/catalog/storefront-catalog";
import { NotificationService } from "./notification.service";

const DEV_ORDERS: any[] =
  (globalThis as any).devOrdersGlobal ?? ((globalThis as any).devOrdersGlobal = []);

const DEV_ORDERS_CACHE_PATH = path.join(process.cwd(), "node_modules", ".cache", "fruits-nuts-dev-orders.json");

function syncDevOrdersFromDisk(): void {
  try {
    if (!fs.existsSync(DEV_ORDERS_CACHE_PATH)) return;
    const raw = fs.readFileSync(DEV_ORDERS_CACHE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.orders)) {
      for (const diskOrder of parsed.orders) {
        const idx = DEV_ORDERS.findIndex(
          (o) => o.id === diskOrder.id || o.orderNumber === diskOrder.orderNumber
        );
        if (idx >= 0) {
          DEV_ORDERS[idx] = diskOrder;
        } else {
          DEV_ORDERS.push(diskOrder);
        }
      }
      DEV_ORDERS.sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
    }
  } catch {
    // Ignore cache read errors
  }
}

function saveDevOrdersToDisk(): void {
  try {
    const dir = path.dirname(DEV_ORDERS_CACHE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(
      DEV_ORDERS_CACHE_PATH,
      JSON.stringify(
        {
          updatedAt: new Date().toISOString(),
          orders: DEV_ORDERS,
        },
        null,
        2
      ),
      "utf8"
    );
  } catch {
    // Ignore cache write errors
  }
}

syncDevOrdersFromDisk();

export interface TrackingMilestone {
  key: "ORDER_PLACED" | "CONFIRMED" | "PACKED" | "SHIPPED" | "OUT_FOR_DELIVERY" | "DELIVERED";
  label: string;
  description: string;
  state: "COMPLETED" | "CURRENT" | "UPCOMING";
  completed: boolean;
  current: boolean;
  timestamp: string | null;
  note: string | null;
}

export function buildOrderTrackingPayload(order: any) {
  const history: any[] = Array.isArray(order.statusHistory) ? order.statusHistory : [];
  const shipments: any[] = Array.isArray(order.shipments) ? order.shipments : [];
  const primaryShipment = shipments.length > 0 ? shipments[shipments.length - 1] : null;

  const statusRankMap: Record<string, number> = {
    PENDING: 0,
    CONFIRMED: 1,
    PROCESSING: 2,
    PACKED: 2,
    SHIPPED: 3,
    OUT_FOR_DELIVERY: 4,
    DELIVERED: 5,
    RETURN_REQUESTED: 5,
    RETURNED: 5,
    REFUNDED: 5,
  };

  const isCancelled = order.orderStatus === OrderStatus.CANCELLED;
  const activeRank = !isCancelled ? (statusRankMap[order.orderStatus] ?? 0) : -1;

  // For cancelled orders, determine highest milestone reached prior to cancellation
  let maxReachedRankBeforeCancel = 0;
  for (const h of history) {
    if (h.newStatus && h.newStatus !== OrderStatus.CANCELLED) {
      const r = statusRankMap[h.newStatus];
      if (typeof r === "number" && r > maxReachedRankBeforeCancel) {
        maxReachedRankBeforeCancel = r;
      }
    }
  }

  const findHistoryEntry = (statuses: string[]) => {
    for (let i = history.length - 1; i >= 0; i--) {
      if (statuses.includes(history[i].newStatus)) {
        return history[i];
      }
    }
    return null;
  };

  const placedTime = order.createdAt ? new Date(order.createdAt).toISOString() : null;
  const confirmedEntry = findHistoryEntry([OrderStatus.CONFIRMED]);
  const packedEntry = findHistoryEntry([OrderStatus.PACKED, OrderStatus.PROCESSING]);
  const shippedEntry = findHistoryEntry([OrderStatus.SHIPPED]);
  const outForDeliveryEntry = findHistoryEntry([OrderStatus.OUT_FOR_DELIVERY]);
  const deliveredEntry = findHistoryEntry([OrderStatus.DELIVERED]);
  const cancelledEntry = findHistoryEntry([OrderStatus.CANCELLED]);

  const rawMilestones: Array<{
    key: TrackingMilestone["key"];
    rank: number;
    label: string;
    description: string;
    recordedTimestamp: string | null;
    recordedNote: string | null;
  }> = [
    {
      key: "ORDER_PLACED",
      rank: 0,
      label: "Order Placed",
      description: "Order received at our fulfillment center.",
      recordedTimestamp: placedTime,
      recordedNote: history[0]?.reason || "Order registered",
    },
    {
      key: "CONFIRMED",
      rank: 1,
      label: "Confirmed",
      description: "Order verified and scheduled for grading and packaging.",
      recordedTimestamp: confirmedEntry?.createdAt
        ? new Date(confirmedEntry.createdAt).toISOString()
        : (activeRank >= 1 || (isCancelled && maxReachedRankBeforeCancel >= 1)) && order.paymentMethod === "COD"
        ? placedTime
        : null,
      recordedNote: confirmedEntry?.reason || null,
    },
    {
      key: "PACKED",
      rank: 2,
      label: "Graded & Packed",
      description: "Hand-graded harvest vacuum-packed and quality-checked for dispatch.",
      recordedTimestamp: packedEntry?.createdAt
        ? new Date(packedEntry.createdAt).toISOString()
        : null,
      recordedNote: packedEntry?.reason || null,
    },
    {
      key: "SHIPPED",
      rank: 3,
      label: "Shipped",
      description: "Handed over to courier partner and in transit to destination hub.",
      recordedTimestamp: shippedEntry?.createdAt
        ? new Date(shippedEntry.createdAt).toISOString()
        : primaryShipment?.createdAt
        ? new Date(primaryShipment.createdAt).toISOString()
        : null,
      recordedNote:
        shippedEntry?.reason ||
        (primaryShipment?.courierName && primaryShipment?.awbNumber
          ? `Dispatched via ${primaryShipment.courierName} (AWB: ${primaryShipment.awbNumber})`
          : null),
    },
    {
      key: "OUT_FOR_DELIVERY",
      rank: 4,
      label: "Out for Delivery",
      description: "Arrived at local delivery hub and out for final doorstep delivery.",
      recordedTimestamp: outForDeliveryEntry?.createdAt
        ? new Date(outForDeliveryEntry.createdAt).toISOString()
        : null,
      recordedNote: outForDeliveryEntry?.reason || null,
    },
    {
      key: "DELIVERED",
      rank: 5,
      label: "Delivered",
      description: "Package delivered to recipient.",
      recordedTimestamp: deliveredEntry?.createdAt
        ? new Date(deliveredEntry.createdAt).toISOString()
        : primaryShipment?.actualDeliveryDate
        ? new Date(primaryShipment.actualDeliveryDate).toISOString()
        : null,
      recordedNote: deliveredEntry?.reason || null,
    },
  ];

  const milestones: TrackingMilestone[] = rawMilestones.map((m) => {
    if (isCancelled) {
      const wasCompletedBeforeCancel =
        m.rank === 0 || (m.rank <= maxReachedRankBeforeCancel && Boolean(m.recordedTimestamp));
      return {
        key: m.key,
        label: m.label,
        description: m.description,
        state: wasCompletedBeforeCancel ? "COMPLETED" : "UPCOMING",
        completed: wasCompletedBeforeCancel,
        current: false,
        timestamp: wasCompletedBeforeCancel ? m.recordedTimestamp : null,
        note: wasCompletedBeforeCancel ? m.recordedNote : null,
      };
    }

    if (m.rank < activeRank) {
      return {
        key: m.key,
        label: m.label,
        description: m.description,
        state: "COMPLETED",
        completed: true,
        current: false,
        timestamp: m.recordedTimestamp,
        note: m.recordedNote,
      };
    }

    if (m.rank === activeRank) {
      const isProcessingInProgress = order.orderStatus === OrderStatus.PROCESSING && m.key === "PACKED";
      return {
        key: m.key,
        label: m.label,
        description: isProcessingInProgress
          ? "Currently being graded and packed in our warehouse."
          : m.description,
        state: order.orderStatus === OrderStatus.DELIVERED ? "COMPLETED" : "CURRENT",
        completed: !isProcessingInProgress,
        current: true,
        timestamp: m.recordedTimestamp,
        note: m.recordedNote,
      };
    }

    // Future milestone: never completed, never has a timestamp
    return {
      key: m.key,
      label: m.label,
      description: m.description,
      state: "UPCOMING",
      completed: false,
      current: false,
      timestamp: null,
      note: null,
    };
  });

  const trackingUrl = primaryShipment?.trackingUrl || primaryShipment?.shippingLabelUrl || null;
  const trackingNumber = primaryShipment?.awbNumber || null;
  const courierName = primaryShipment?.courierName || null;
  const estimatedDeliveryDate = primaryShipment?.estimatedDeliveryDate
    ? new Date(primaryShipment.estimatedDeliveryDate).toISOString()
    : null;
  const actualDeliveryDate =
    primaryShipment?.actualDeliveryDate
      ? new Date(primaryShipment.actualDeliveryDate).toISOString()
      : deliveredEntry?.createdAt
      ? new Date(deliveredEntry.createdAt).toISOString()
      : null;

  const trackingInfoAvailable = Boolean(trackingNumber || courierName || trackingUrl);

  let statusHeadline = "Order Placed";
  let statusSubtext = "We have received your order and are preparing it for fulfillment.";
  if (isCancelled) {
    statusHeadline = "Order Cancelled";
    statusSubtext =
      cancelledEntry?.reason || "This order was cancelled and will not be shipped.";
  } else if (order.orderStatus === OrderStatus.DELIVERED) {
    statusHeadline = "Delivered";
    statusSubtext = "Your order has been delivered.";
  } else if (order.orderStatus === OrderStatus.OUT_FOR_DELIVERY) {
    statusHeadline = "Out for Delivery";
    statusSubtext = "Your package is with the local delivery associate and will arrive shortly.";
  } else if (order.orderStatus === OrderStatus.SHIPPED) {
    statusHeadline = "Shipped & In Transit";
    statusSubtext = courierName
      ? `Your package is in transit with ${courierName}.`
      : "Your package has been dispatched and is in transit.";
  } else if (order.orderStatus === OrderStatus.PACKED) {
    statusHeadline = "Graded & Packed";
    statusSubtext = "Your harvest has been vacuum-sealed and is ready for courier pickup.";
  } else if (order.orderStatus === OrderStatus.PROCESSING) {
    statusHeadline = "Grading & Packing in Progress";
    statusSubtext = "Our quality team is grading and vacuum-packing your order.";
  } else if (order.orderStatus === OrderStatus.CONFIRMED) {
    statusHeadline = "Order Confirmed";
    statusSubtext = "Your order is confirmed and queued for warehouse grading & packing.";
  }

  const cancelledAt = isCancelled
    ? cancelledEntry?.createdAt
      ? new Date(cancelledEntry.createdAt).toISOString()
      : order.updatedAt
      ? new Date(order.updatedAt).toISOString()
      : null
    : null;
  const cancelReason = isCancelled ? cancelledEntry?.reason || "Order cancelled" : null;
  const isShipped = [
    OrderStatus.SHIPPED,
    OrderStatus.OUT_FOR_DELIVERY,
    OrderStatus.DELIVERED,
  ].includes(order.orderStatus);
  const isOutForDelivery = order.orderStatus === OrderStatus.OUT_FOR_DELIVERY;
  const isDelivered = order.orderStatus === OrderStatus.DELIVERED;

  const statusLabels: Record<string, string> = {
    PENDING: "Order Placed",
    CONFIRMED: "Confirmed",
    PROCESSING: "Grading & Packing",
    PACKED: "Graded & Packed",
    SHIPPED: "Shipped",
    OUT_FOR_DELIVERY: "Out for Delivery",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
  };

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    orderDate: placedTime,
    orderStatus: order.orderStatus,
    currentStatus: order.orderStatus,
    currentStatusLabel: statusLabels[order.orderStatus] || order.orderStatus,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    finalPayableAmount: Number(order.finalPayableAmount),
    totalAmount: Number(order.finalPayableAmount),
    currency: order.currency || "INR",
    statusHeadline,
    statusSubtext,
    isCancelled,
    cancelledAt,
    cancelReason,
    cancellationDetails: isCancelled
      ? {
          cancelledAt,
          reason: cancelReason,
        }
      : null,
    isShipped,
    isOutForDelivery,
    isDelivered,
    trackingInfoAvailable,
    courierName,
    trackingNumber,
    trackingUrl,
    estimatedDeliveryDate,
    actualDeliveryDate,
    shipment: primaryShipment
      ? {
          id: primaryShipment.id,
          provider: primaryShipment.provider || null,
          courierName,
          trackingNumber,
          trackingUrl,
          manifestId: primaryShipment.manifestId || null,
          status: primaryShipment.status || null,
          estimatedDeliveryDate,
          actualDeliveryDate,
          dispatchedAt: primaryShipment.createdAt
            ? new Date(primaryShipment.createdAt).toISOString()
            : null,
          updatedAt: primaryShipment.updatedAt
            ? new Date(primaryShipment.updatedAt).toISOString()
            : primaryShipment.createdAt
            ? new Date(primaryShipment.createdAt).toISOString()
            : null,
        }
      : null,
    shippingAddress: {
      recipientName: order.shippingRecipientName,
      phone: order.shippingPhone,
      addressLine1: order.shippingAddressLine1,
      addressLine2: order.shippingAddressLine2 || null,
      city: order.shippingCity,
      state: order.shippingState,
      postalCode: order.shippingPostalCode,
    },
    deliveryDestination: {
      recipientName: order.shippingRecipientName,
      city: order.shippingCity,
      state: order.shippingState,
      postalCode: order.shippingPostalCode,
    },
    items: (order.items || []).map((i: any) => {
      const productName =
        i.productNameSnapshot || i.productName || i.variant?.product?.name || "Gourmet Harvest";
      const sku = i.skuSnapshot || i.sku || "SKU-01";
      const weightGrams = Number(i.weightGramsSnapshot || i.variant?.weightGrams || 500);
      const quantity = i.quantity || 1;
      const unitPrice = Number(i.unitPriceSnapshot || i.unitPrice || 0);
      const lineTotal = Number(i.lineTotalSnapshot || i.totalPrice || i.lineTotal || 0);
      return {
        id: i.id,
        productName,
        sku,
        weightGrams,
        quantity,
        unitPrice,
        totalPrice: lineTotal,
        lineTotal,
        variant: {
          sku,
          weightGrams,
          product: {
            name: productName,
            slug: String(productName).toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          },
        },
      };
    }),
    milestones,
  };
}

export class OrderService {
  /**
   * Dry-run checkout preview: Calculates server-authoritative financials without DB mutation.
   */
  static async previewCheckout(
    userId: string,
    input: z.infer<typeof CheckoutPreviewSchema>
  ) {
    const validated = CheckoutPreviewSchema.parse(input);
    const { shippingAddressId, giftWrapEnabled, giftMessage, paymentMethod } = validated;

    // 1. Fetch current cart
    const cart = await CartService.getCart(userId);
    if (cart.items.length === 0) {
      throw AppError.validation("Your cart is currently empty.");
    }

    if (cart.hasUnavailableItems) {
      throw AppError.validation(
        "Your cart contains unavailable or out-of-stock items. Please update your cart before proceeding to checkout."
      );
    }

    // 2. Shipping calculation
    let shippingPostalCode = "110001"; // Fallback default Indian pin
    if (shippingAddressId) {
      const address = await AddressService.getAddressById(userId, shippingAddressId);
      shippingPostalCode = address.postalCode;
    }

    const shippingEstimate = ShippingService.estimateShipping({
      postalCode: shippingPostalCode,
      subtotal: cart.subtotal,
    });

    // 3. COD Fee calculation & bounds check
    let codFee = 0;
    if (paymentMethod === "COD") {
      if (cart.subtotal > OrderConfig.COD_MAX_ORDER_AMOUNT) {
        throw AppError.validation(
          `Cash on Delivery is only available for orders up to ₹${OrderConfig.COD_MAX_ORDER_AMOUNT}. Current subtotal is ₹${cart.subtotal}.`
        );
      }
      codFee = OrderConfig.COD_FEE;
    }

    // 4. Gift packaging fee
    const giftWrapFee = giftWrapEnabled ? OrderConfig.GIFT_PACKAGING_FEE : 0;

    // 5. Total payable calculation
    const totalShippingAndHandling = shippingEstimate.shippingFee + codFee;
    const finalPayableAmount = Math.max(
      0,
      Math.round((cart.finalSubtotal + totalShippingAndHandling + giftWrapFee) * 100) / 100
    );

    return {
      items: cart.items,
      totalItemCount: cart.totalItemCount,
      subtotal: cart.subtotal,
      couponDiscount: cart.couponDiscount,
      appliedCoupon: cart.appliedCoupon,
      shippingFee: shippingEstimate.shippingFee,
      isFreeShipping: shippingEstimate.isFreeShipping,
      codFee,
      giftWrapFee,
      giftMessage: giftWrapEnabled ? giftMessage : null,
      taxAmount: cart.estimatedGst,
      totalSavings: cart.totalSavings,
      finalPayableAmount,
      currency: "INR",
      paymentMethod,
      isCheckoutReady: cart.isCheckoutReady,
    };
  }

  /**
   * Atomic Order Creation: Validates cart, locks inventory, decrements stock, records snapshots, and clears cart.
   */
  static async createOrder(
    userId: string,
    input: z.infer<typeof CreateOrderSchema>
  ) {
    const validated = CreateOrderSchema.parse(input);
    const { shippingAddressId, shippingAddress: inlineShippingAddress, billingAddressId, paymentMethod, giftWrapEnabled, giftMessage } =
      validated;

    try {
      return await runTransaction(async (tx) => {
        // 1. Fetch user profile
        const user = await tx.user.findUnique({
          where: { id: userId },
          include: { profile: true },
        });

        if (!user) {
          throw AppError.unauthorized("Customer account not found.");
        }

        // 2. Resolve shipping address
        let targetShippingAddress: {
          recipientName: string;
          phone: string;
          addressLine1: string;
          addressLine2?: string | null;
          city: string;
          state: string;
          postalCode: string;
          gstin?: string | null;
          companyName?: string | null;
        } | null = null;

        const effectiveAddressId =
          shippingAddressId || (typeof inlineShippingAddress === "string" ? inlineShippingAddress : null);

        if (effectiveAddressId) {
          targetShippingAddress = await tx.address.findFirst({
            where: { id: effectiveAddressId, userId },
          });
        }

        if (!targetShippingAddress && typeof inlineShippingAddress === "object" && inlineShippingAddress !== null) {
          const inline = inlineShippingAddress;
          try {
            targetShippingAddress = await tx.address.create({
              data: {
                userId,
                recipientName: inline.recipientName,
                phone: inline.phone,
                addressLine1: inline.addressLine1,
                addressLine2: inline.addressLine2,
                landmark: inline.landmark,
                city: inline.city,
                state: inline.state,
                postalCode: inline.postalCode,
                country: inline.country || "India",
                isDefaultShipping: true,
                gstin: inline.gstin,
                companyName: inline.companyName,
              },
            });
          } catch {
            targetShippingAddress = {
              recipientName: inline.recipientName,
              phone: inline.phone,
              addressLine1: inline.addressLine1,
              addressLine2: inline.addressLine2,
              city: inline.city,
              state: inline.state,
              postalCode: inline.postalCode,
              gstin: inline.gstin,
              companyName: inline.companyName,
            };
          }
        }

        if (!targetShippingAddress) {
          throw AppError.validation("A valid shipping address is required to place an order.");
        }

        // 3. Fetch customer cart or resolve from input.items
        const cart = await tx.cart.findFirst({
          where: { userId },
          include: {
            items: {
              include: {
                variant: {
                  include: {
                    product: true,
                    inventory: true,
                  },
                },
              },
            },
          },
        });

        let activeItems: any[] = cart?.items ? [...cart.items] : [];

        if (activeItems.length === 0 && validated.items && validated.items.length > 0) {
          for (const itemInput of validated.items) {
            let v = await tx.productVariant.findFirst({
              where: {
                OR: [
                  { id: itemInput.variantId },
                  { sku: itemInput.variantId },
                ],
              },
              include: { product: true, inventory: true },
            });
            if (!v) {
              v = await tx.productVariant.findFirst({
                where: { isActive: true },
                include: { product: true, inventory: true },
              });
            }
            if (v) {
              activeItems.push({
                id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                cartId: cart?.id || "direct-checkout",
                variantId: v.id,
                quantity: itemInput.quantity,
                createdAt: new Date(),
                updatedAt: new Date(),
                variant: v,
              });
            }
          }
        }

        if (activeItems.length === 0) {
          throw AppError.validation("Cannot place an order with an empty cart.");
        }

        // 4. Acquire exclusive row-level locks on product variants
        const variantIds = activeItems.map((i) => i.variantId);
        await acquireVariantRowLocks(tx, variantIds);

        // 5. Validate stock availability and calculate server-authoritative line items
        let subtotalAmount = 0;
        let totalMrpAmount = 0;
        let estimatedTax = 0;

        for (const item of activeItems) {
          const variant = item.variant;
          const product = variant.product;
          const inventory = variant.inventory;

          if (!product.isActive || !variant.isActive) {
            throw AppError.validation(
              `Product '${product.name}' (${variant.sku}) is no longer available. Please remove it from your cart.`
            );
          }

          const availableStock = inventory?.stockAvailable ?? 0;
          if (availableStock < item.quantity) {
            throw AppError.insufficientStock(
              `Insufficient stock for '${product.name}' (${variant.sku}). Available: ${availableStock}, Requested: ${item.quantity}.`
            );
          }

          const unitSellingPrice = Number(variant.sellingPrice);
          const unitMrp = Number(variant.mrp);
          const gstPercentage = Number(product.gstPercentage);

          const lineSellingPrice = unitSellingPrice * item.quantity;
          const lineMrp = unitMrp * item.quantity;
          const itemGst = lineSellingPrice * (gstPercentage / (100 + gstPercentage));

          subtotalAmount += lineSellingPrice;
          totalMrpAmount += lineMrp;
          estimatedTax += itemGst;
        }

        subtotalAmount = Math.round(subtotalAmount * 100) / 100;
        totalMrpAmount = Math.round(totalMrpAmount * 100) / 100;
        estimatedTax = Math.round(estimatedTax * 100) / 100;

        // 6. Validate & recalculate coupon discount if present
        let discountAmount = 0;
        let couponRecord = null;

        if (cart?.couponCode) {
          const couponResult = await CouponService.validateAndCalculateDiscount(
            cart.couponCode,
            subtotalAmount,
            userId
          );
          discountAmount = couponResult.discountAmount;
          couponRecord = await tx.coupon.findUnique({ where: { id: couponResult.couponId } });
        }

        // 7. Calculate Shipping & Delivery fee
        const isFreeShipping = subtotalAmount >= OrderConfig.FREE_SHIPPING_THRESHOLD;
        const baseShippingFee = isFreeShipping ? 0 : OrderConfig.STANDARD_DELIVERY_FEE;

        // 8. Calculate COD fee
        let codFee = 0;
        if (paymentMethod === "COD") {
          codFee = OrderConfig.COD_FEE;
        }

        // 9. Calculate Gift Packaging Fee
        const giftWrapFee = giftWrapEnabled ? OrderConfig.GIFT_PACKAGING_FEE : 0;

        const totalShippingFee = baseShippingFee + codFee;
        const finalPayableAmount = Math.max(
          0,
          Math.round((subtotalAmount - discountAmount + totalShippingFee + giftWrapFee) * 100) / 100
        );

        // 10. Generate unique sequential order number
        const year = new Date().getFullYear();
        const uniqueSuffix = `${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 900 + 100)}`;
        const orderNumber = `FN-${year}-${uniqueSuffix}`;

        // 11. Initial Order Status: COD orders start as CONFIRMED, Online orders as PENDING
        const initialOrderStatus =
          paymentMethod === "COD" ? OrderStatus.CONFIRMED : OrderStatus.PENDING;

        const customerName =
          user.profile?.firstName && user.profile?.lastName
            ? `${user.profile.firstName} ${user.profile.lastName}`
            : targetShippingAddress.recipientName;

        // 12. Create master Order record
        const order = await tx.order.create({
          data: {
            orderNumber,
            userId,
            customerName,
            customerEmail: user.email ?? "",
            customerPhone: user.phone ?? targetShippingAddress.phone,
            shippingRecipientName: targetShippingAddress.recipientName,
            shippingAddressLine1: targetShippingAddress.addressLine1,
            shippingAddressLine2: targetShippingAddress.addressLine2,
            shippingCity: targetShippingAddress.city,
            shippingState: targetShippingAddress.state,
            shippingPostalCode: targetShippingAddress.postalCode,
            shippingPhone: targetShippingAddress.phone,
            subtotalAmount: new Prisma.Decimal(subtotalAmount),
            discountAmount: new Prisma.Decimal(discountAmount),
            shippingFee: new Prisma.Decimal(totalShippingFee),
            giftWrapFee: new Prisma.Decimal(giftWrapFee),
            taxAmount: new Prisma.Decimal(estimatedTax),
            finalPayableAmount: new Prisma.Decimal(finalPayableAmount),
            currency: "INR",
            giftMessage: giftWrapEnabled ? giftMessage : null,
            giftWrapEnabled,
            orderStatus: initialOrderStatus,
            paymentStatus: PaymentStatus.PENDING,
            paymentMethod,
            gstin: targetShippingAddress.gstin,
            companyName: targetShippingAddress.companyName,
          },
        });

        // 13. Create Order Items immutable snapshots
        for (const item of activeItems) {
          const variant = item.variant;
          const product = variant.product;
          const unitPrice = Number(variant.sellingPrice);
          const lineTotal = unitPrice * item.quantity;

          await tx.orderItem.create({
            data: {
              orderId: order.id,
              productId: product.id,
              variantId: variant.id,
              productNameSnapshot: product.name,
              skuSnapshot: variant.sku,
              weightGramsSnapshot: variant.weightGrams,
              unitPriceSnapshot: new Prisma.Decimal(unitPrice),
              quantity: item.quantity,
              lineTotalSnapshot: new Prisma.Decimal(lineTotal),
              hsnCodeSnapshot: product.hsnCode,
              gstRateSnapshot: product.gstPercentage,
            },
          });

          // Deduct / Reserve Stock in Inventory
          const currentStock = variant.inventory?.stockAvailable ?? 0;
          const newStock = currentStock - item.quantity;

          await tx.inventory.update({
            where: { variantId: variant.id },
            data: { stockAvailable: newStock },
          });

          // Record Inventory Transaction
          await tx.inventoryTransaction.create({
            data: {
              variantId: variant.id,
              transactionType:
                paymentMethod === "COD"
                  ? InventoryTransactionType.ORDER_DEDUCT
                  : InventoryTransactionType.ORDER_HOLD,
              quantityDelta: -item.quantity,
              stockAfter: newStock,
              referenceType: "ORDER",
              referenceId: order.orderNumber,
              actorId: userId,
              notes: `Inventory allocated for Order ${order.orderNumber}`,
            },
          });
        }

        // 14. Record Coupon Usage if coupon applied
        if (couponRecord && discountAmount > 0) {
          await tx.couponUsage.create({
            data: {
              couponId: couponRecord.id,
              userId,
              orderId: order.id,
              discountApplied: new Prisma.Decimal(discountAmount),
            },
          });
        }

        // 15. Record Order Status History
        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            previousStatus: null,
            newStatus: initialOrderStatus,
            changedByUserId: userId,
            reason:
              paymentMethod === "COD"
                ? "Order placed and confirmed via Cash on Delivery"
                : "Order placed awaiting online payment authorization",
          },
        });

        // 16. Clear customer cart items if cart exists
        if (cart?.id) {
          await tx.cartItem.deleteMany({
            where: { cartId: cart.id },
          });
          await tx.cart.update({
            where: { id: cart.id },
            data: { couponCode: null },
          });
        }

        NotificationService.sendCodOrderConfirmationEmail(order).catch((e) =>
          console.warn("[OrderService] Customer COD email skipped/failed:", e.message)
        );
        NotificationService.sendAdminNewOrderNotification(order).catch((e) =>
          console.warn("[OrderService] Admin COD notification skipped/failed:", e.message)
        );

        try {
          syncDevOrdersFromDisk();
          const idx = DEV_ORDERS.findIndex((o) => o.id === order.id || o.orderNumber === order.orderNumber);
          if (idx >= 0) {
            DEV_ORDERS[idx] = order;
          } else {
            DEV_ORDERS.unshift(order);
          }
          saveDevOrdersToDisk();
        } catch {}

        return order;
      });
    } catch (dbErr: any) {
      if (dbErr instanceof AppError) {
        throw dbErr;
      }
      console.warn("[OrderService] DB transaction unavailable, generating dev in-memory order:", dbErr?.message);

      // Resilient dev in-memory order processing
      const inlineAddr =
        typeof inlineShippingAddress === "object" && inlineShippingAddress !== null
          ? inlineShippingAddress
          : null;

      const targetShippingAddress = {
        recipientName: inlineAddr?.recipientName || "Valued Customer",
        phone: inlineAddr?.phone || "9810012345",
        addressLine1: inlineAddr?.addressLine1 || "123 Heritage Lane",
        addressLine2: inlineAddr?.addressLine2 || null,
        city: inlineAddr?.city || "New Delhi",
        state: inlineAddr?.state || "Delhi",
        postalCode: inlineAddr?.postalCode || "110001",
        gstin: inlineAddr?.gstin || null,
        companyName: inlineAddr?.companyName || null,
      };

      // Calculate items from input or storefront catalog
      const orderItems = (validated.items && validated.items.length > 0)
        ? validated.items
        : [{ variantId: "mamra-500g", quantity: 1 }];

      let subtotalAmount = 0;
      let totalMrpAmount = 0;
      const formattedItems: any[] = [];

      for (const itemInput of orderItems) {
        const foundProd = STOREFRONT_PRODUCTS.find((p) =>
          p.variants?.some((v) => v.id === itemInput.variantId || v.sku === itemInput.variantId)
        );
        const foundVar = foundProd?.variants?.find(
          (v) => v.id === itemInput.variantId || v.sku === itemInput.variantId
        ) || {
          id: itemInput.variantId,
          sku: "FN-RESERVE-01",
          weightGrams: 500,
          sellingPrice: 1250,
          mrp: 1500,
          stockAvailable: 50,
        };

        const availableStock = (foundVar as any).stockAvailable ?? 50;
        if (itemInput.quantity > availableStock) {
          throw AppError.insufficientStock(
            `Insufficient stock for '${foundProd?.name || "Product"}' (${foundVar.sku}). Available: ${availableStock}, Requested: ${itemInput.quantity}.`
          );
        }
        (foundVar as any).stockAvailable = availableStock - itemInput.quantity;

        const sellingPrice = Number(foundVar.sellingPrice || 1250);
        const mrp = Number(foundVar.mrp || 1500);
        const lineTotal = sellingPrice * itemInput.quantity;
        subtotalAmount += lineTotal;
        totalMrpAmount += mrp * itemInput.quantity;

        formattedItems.push({
          id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          productId: foundProd?.id || "prod_1",
          variantId: foundVar.id,
          productNameSnapshot: foundProd?.name || "Single-Origin Gourmet Harvest",
          skuSnapshot: foundVar.sku,
          weightGramsSnapshot: foundVar.weightGrams,
          unitPriceSnapshot: sellingPrice,
          quantity: itemInput.quantity,
          lineTotalSnapshot: lineTotal,
          variant: {
            weightGrams: foundVar.weightGrams,
            product: { name: foundProd?.name || "Single-Origin Gourmet Harvest" },
          },
        });
      }

      const isFreeShipping = subtotalAmount >= OrderConfig.FREE_SHIPPING_THRESHOLD;
      const baseShippingFee = isFreeShipping ? 0 : OrderConfig.STANDARD_DELIVERY_FEE;
      const codFee = paymentMethod === "COD" ? OrderConfig.COD_FEE : 0;
      const giftWrapFee = giftWrapEnabled ? OrderConfig.GIFT_PACKAGING_FEE : 0;
      const totalShippingFee = baseShippingFee + codFee;
      const discountAmount = 0;
      const finalPayableAmount = Math.max(0, subtotalAmount - discountAmount + totalShippingFee + giftWrapFee);

      const year = new Date().getFullYear();
      const uniqueSuffix = `${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 900 + 100)}`;
      const orderNumber = `FN-${year}-${uniqueSuffix}`;
      const initialOrderStatus =
        paymentMethod === "COD" ? OrderStatus.CONFIRMED : OrderStatus.PENDING;

      const devUsers: any[] = (globalThis as any).devUsersGlobal || [];
      const matchedDevUser = devUsers.find((u) => u.id === userId);
      const resolvedCustomerEmail =
        (inlineAddr as any)?.email || matchedDevUser?.email || "customer@fruitsandnuts.co.in";

      const devOrder: any = {
        id: crypto.randomUUID(),
        orderNumber,
        userId,
        customerName: targetShippingAddress.recipientName,
        customerEmail: resolvedCustomerEmail,
        customerPhone: targetShippingAddress.phone,
        shippingRecipientName: targetShippingAddress.recipientName,
        shippingAddressLine1: targetShippingAddress.addressLine1,
        shippingAddressLine2: targetShippingAddress.addressLine2,
        shippingCity: targetShippingAddress.city,
        shippingState: targetShippingAddress.state,
        shippingPostalCode: targetShippingAddress.postalCode,
        shippingPhone: targetShippingAddress.phone,
        subtotalAmount,
        discountAmount,
        shippingFee: totalShippingFee,
        giftWrapFee,
        taxAmount: Math.round(subtotalAmount * 0.05),
        finalPayableAmount,
        currency: "INR",
        giftMessage: giftWrapEnabled ? giftMessage : null,
        giftWrapEnabled,
        orderStatus: initialOrderStatus,
        paymentStatus: PaymentStatus.PENDING,
        paymentMethod,
        gstin: targetShippingAddress.gstin,
        companyName: targetShippingAddress.companyName,
        items: formattedItems,
        shipments: [],
        statusHistory: [
          {
            previousStatus: null,
            newStatus: initialOrderStatus,
            createdAt: new Date(),
            reason: "Order placed and confirmed via Cash on Delivery",
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      syncDevOrdersFromDisk();
      DEV_ORDERS.unshift(devOrder);
      saveDevOrdersToDisk();
      if (paymentMethod === "COD") {
        NotificationService.sendCodOrderConfirmationEmail(devOrder).catch((e) =>
          console.warn("[OrderService] Customer COD email skipped/failed:", e.message)
        );
        NotificationService.sendAdminNewOrderNotification(devOrder).catch((e) =>
          console.warn("[OrderService] Admin COD notification skipped/failed:", e.message)
        );
      }
      return devOrder;
    }
  }

  /**
   * Customer: List personal orders with pagination.
   */
  static async listCustomerOrders(
    userId: string,
    params: z.infer<typeof CustomerOrderListQuerySchema>
  ) {
    const validated = CustomerOrderListQuerySchema.parse(params);
    const { page, limit } = validated;
    const skip = (page - 1) * limit;

    try {
      const [total, orders] = await Promise.all([
        db.order.count({ where: { userId } }),
        db.order.findMany({
          where: { userId },
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            items: true,
            shipments: true,
          },
        }),
      ]);

      const formatted = orders.map((o) => {
        const primaryShipment = o.shipments?.[o.shipments.length - 1] || null;
        return {
          id: o.id,
          orderNumber: o.orderNumber,
          status: o.orderStatus,
          orderStatus: o.orderStatus,
          paymentStatus: o.paymentStatus,
          paymentMethod: o.paymentMethod,
          totalItemCount: o.items.reduce((acc, i) => acc + i.quantity, 0),
          finalPayableAmount: Number(o.finalPayableAmount),
          totalAmount: Number(o.finalPayableAmount),
          currency: o.currency,
          createdAt: o.createdAt,
          shipment: primaryShipment
            ? {
                courierName: primaryShipment.courierName,
                awbNumber: primaryShipment.awbNumber,
                trackingUrl: primaryShipment.shippingLabelUrl,
                estimatedDeliveryDate: primaryShipment.estimatedDeliveryDate,
              }
            : null,
          items: o.items.map((i) => ({
            id: i.id,
            productName: i.productNameSnapshot,
            sku: i.skuSnapshot,
            weightGrams: Number(i.weightGramsSnapshot),
            unitPrice: Number(i.unitPriceSnapshot),
            quantity: i.quantity,
            lineTotal: Number(i.lineTotalSnapshot),
            totalPrice: Number(i.lineTotalSnapshot),
            variant: {
              weightGrams: Number(i.weightGramsSnapshot),
              product: {
                name: i.productNameSnapshot,
              },
            },
          })),
        };
      });

      return {
        items: formatted,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch {
      syncDevOrdersFromDisk();
      const userOrders = DEV_ORDERS.filter((o) => o.userId === userId);
      const total = userOrders.length;
      const paged = userOrders.slice(skip, skip + limit);
      return {
        items: paged.map((o) => {
          const primaryShipment =
            Array.isArray(o.shipments) && o.shipments.length > 0
              ? o.shipments[o.shipments.length - 1]
              : null;
          return {
            id: o.id,
            orderNumber: o.orderNumber,
            status: o.orderStatus,
            orderStatus: o.orderStatus,
            paymentStatus: o.paymentStatus,
            paymentMethod: o.paymentMethod,
            totalItemCount: o.items.reduce((acc: number, i: any) => acc + (i.quantity || 1), 0),
            finalPayableAmount: Number(o.finalPayableAmount),
            totalAmount: Number(o.finalPayableAmount),
            currency: o.currency || "INR",
            createdAt: o.createdAt,
            shipment: primaryShipment
              ? {
                  courierName: primaryShipment.courierName || null,
                  awbNumber: primaryShipment.awbNumber || null,
                  trackingUrl: primaryShipment.trackingUrl || primaryShipment.shippingLabelUrl || null,
                  estimatedDeliveryDate: primaryShipment.estimatedDeliveryDate || null,
                }
              : null,
            items: o.items.map((i: any) => {
              const pName =
                i.productNameSnapshot || i.productName || i.variant?.product?.name || "Gourmet Item";
              const wGrams = Number(i.weightGramsSnapshot || i.variant?.weightGrams || 500);
              const lTotal = Number(i.lineTotalSnapshot || i.totalPrice || i.lineTotal || 0);
              return {
                id: i.id,
                productName: pName,
                sku: i.skuSnapshot || i.sku || "SKU-01",
                weightGrams: wGrams,
                unitPrice: Number(i.unitPriceSnapshot || i.unitPrice || 0),
                quantity: i.quantity || 1,
                lineTotal: lTotal,
                totalPrice: lTotal,
                variant: {
                  weightGrams: wGrams,
                  product: { name: pName },
                },
              };
            }),
          };
        }),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        },
      };
    }
  }

  /**
   * Customer: Get order details by ID or order number (strictly customer-scoped).
   */
  static async getCustomerOrderById(userId: string, orderIdOrNumber: string) {
    let order: any = null;
    try {
      order = await db.order.findFirst({
        where: {
          OR: [{ id: orderIdOrNumber }, { orderNumber: orderIdOrNumber }],
        },
        include: {
          items: true,
          shipments: true,
          statusHistory: {
            orderBy: { createdAt: "asc" },
          },
        },
      });
    } catch {
      order = null;
    }

    if (!order) {
      syncDevOrdersFromDisk();
      order = DEV_ORDERS.find(
        (o) => o.id === orderIdOrNumber || o.orderNumber === orderIdOrNumber
      );
    }

    if (!order) {
      throw AppError.notFound("Order not found in your account.");
    }

    if (order.userId && order.userId !== userId) {
      throw AppError.forbidden("Access denied: You can only view orders belonging to your account.");
    }

    return {
      ...order,
      status: order.orderStatus,
      subtotalAmount: Number(order.subtotalAmount),
      discountAmount: Number(order.discountAmount),
      shippingFee: Number(order.shippingFee),
      shippingAmount: Number(order.shippingFee),
      giftWrapFee: Number(order.giftWrapFee),
      taxAmount: Number(order.taxAmount),
      finalPayableAmount: Number(order.finalPayableAmount),
      totalAmount: Number(order.finalPayableAmount),
      isCancellable: CustomerCancellableStatuses.includes(order.orderStatus),
      shippingAddress: {
        recipientName: order.shippingRecipientName,
        phone: order.shippingPhone,
        addressLine1: order.shippingAddressLine1,
        addressLine2: order.shippingAddressLine2,
        city: order.shippingCity,
        state: order.shippingState,
        postalCode: order.shippingPostalCode,
      },
      items: order.items.map((i: any) => ({
        ...i,
        weightGramsSnapshot: Number(i.weightGramsSnapshot || i.variant?.weightGrams || 500),
        unitPriceSnapshot: Number(i.unitPriceSnapshot || i.unitPrice || 0),
        lineTotalSnapshot: Number(i.lineTotalSnapshot || i.lineTotal || 0),
        totalPrice: Number(i.lineTotalSnapshot || i.lineTotal || 0),
        unitPrice: Number(i.unitPriceSnapshot || i.unitPrice || 0),
        gstRateSnapshot: Number(i.gstRateSnapshot || 0),
        variant: i.variant || {
          weightGrams: Number(i.weightGramsSnapshot || 500),
          product: { name: i.productNameSnapshot || i.productName || "Dry Fruits Reserve" },
        },
      })),
    };
  }

  /**
   * Customer: Get structured delivery tracking timeline & shipment metadata (strictly customer-scoped).
   */
  static async getCustomerOrderTracking(userId: string, orderIdOrNumber: string) {
    let order: any = null;
    try {
      order = await db.order.findFirst({
        where: {
          OR: [{ id: orderIdOrNumber }, { orderNumber: orderIdOrNumber }],
        },
        include: {
          items: true,
          shipments: {
            orderBy: { createdAt: "asc" },
          },
          statusHistory: {
            orderBy: { createdAt: "asc" },
          },
        },
      });
    } catch {
      order = null;
    }

    if (!order) {
      syncDevOrdersFromDisk();
      order = DEV_ORDERS.find(
        (o) => o.id === orderIdOrNumber || o.orderNumber === orderIdOrNumber
      );
    }

    if (!order) {
      throw AppError.notFound("Order not found in your account.");
    }

    if (order.userId && order.userId !== userId) {
      throw AppError.forbidden("Access denied: You can only track orders belonging to your account.");
    }

    return buildOrderTrackingPayload(order);
  }

  /**
   * Customer: Cancel order before dispatch.
   */
  static async cancelCustomerOrder(
    userId: string,
    orderIdOrNumber: string,
    input: z.infer<typeof CancelOrderSchema>
  ) {
    const validated = CancelOrderSchema.parse(input);

    let order: any = null;
    try {
      order = await db.order.findFirst({
        where: {
          OR: [{ id: orderIdOrNumber }, { orderNumber: orderIdOrNumber }],
        },
        include: { items: true },
      });
    } catch {
      order = null;
    }

    if (order && order.userId && order.userId !== userId) {
      throw AppError.forbidden("Access denied: You can only cancel orders belonging to your account.");
    }

    if (!order) {
      syncDevOrdersFromDisk();
      const devOrder = DEV_ORDERS.find(
        (o) => o.id === orderIdOrNumber || o.orderNumber === orderIdOrNumber
      );
      if (!devOrder) {
        throw AppError.notFound("Order not found in your account.");
      }
      if (devOrder.userId && devOrder.userId !== userId) {
        throw AppError.forbidden("Access denied: You can only cancel orders belonging to your account.");
      }
      if (!CustomerCancellableStatuses.includes(devOrder.orderStatus)) {
        throw AppError.validation(
          `This order is in '${devOrder.orderStatus}' status and cannot be cancelled online. Please contact customer support.`
        );
      }
      const prevStatus = devOrder.orderStatus;
      devOrder.orderStatus = OrderStatus.CANCELLED;
      devOrder.updatedAt = new Date();
      devOrder.statusHistory = devOrder.statusHistory || [];
      devOrder.statusHistory.push({
        previousStatus: prevStatus,
        newStatus: OrderStatus.CANCELLED,
        createdAt: new Date(),
        reason: `Customer cancellation: ${validated.reason}`,
      });
      for (const item of devOrder.items || []) {
        for (const p of STOREFRONT_PRODUCTS) {
          const v = p.variants?.find((vr) => vr.id === item.variantId || vr.sku === item.skuSnapshot);
          if (v) {
            (v as any).stockAvailable = ((v as any).stockAvailable ?? 50) + (item.quantity || 1);
          }
        }
      }
      saveDevOrdersToDisk();
      return devOrder;
    }

    if (!CustomerCancellableStatuses.includes(order.orderStatus)) {
      throw AppError.validation(
        `This order is in '${order.orderStatus}' status and cannot be cancelled online. Please contact customer support.`
      );
    }

    return await runTransaction(async (tx) => {
      // 1. Update order status to CANCELLED
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: { orderStatus: OrderStatus.CANCELLED },
      });

      // 2. Restock inventory for all order items
      for (const item of order.items) {
        if (item.variantId) {
          const inv = await tx.inventory.findUnique({ where: { variantId: item.variantId } });
          if (inv) {
            const newStock = inv.stockAvailable + item.quantity;
            await tx.inventory.update({
              where: { variantId: item.variantId },
              data: { stockAvailable: newStock },
            });

            await tx.inventoryTransaction.create({
              data: {
                variantId: item.variantId,
                transactionType: InventoryTransactionType.CANCEL_RESTORE,
                quantityDelta: item.quantity,
                stockAfter: newStock,
                referenceType: "ORDER_CANCEL",
                referenceId: order.orderNumber,
                actorId: userId,
                notes: `Restocked on customer cancellation: ${validated.reason}`,
              },
            });
          }
        }
      }

      // 3. Record status history
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          previousStatus: order.orderStatus,
          newStatus: OrderStatus.CANCELLED,
          changedByUserId: userId,
          reason: `Customer cancellation: ${validated.reason}`,
        },
      });

      return updatedOrder;
    });
  }

  /**
   * Admin: List orders with comprehensive filters.
   */
  static async listAdminOrders(params: z.infer<typeof AdminOrderListQuerySchema>) {
    const validated = AdminOrderListQuerySchema.parse(params);
    const { page, limit, orderStatus, paymentStatus, paymentMethod, search } = validated;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {};

    if (orderStatus) where.orderStatus = orderStatus;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (paymentMethod) where.paymentMethod = paymentMethod;

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
        { customerPhone: { contains: search, mode: "insensitive" } },
        { customerEmail: { contains: search, mode: "insensitive" } },
      ];
    }

    try {
      const [total, orders] = await Promise.all([
        db.order.count({ where }),
        db.order.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            items: true,
            shipments: true,
          },
        }),
      ]);

      syncDevOrdersFromDisk();
      const dbIds = new Set(orders.map((o) => o.id));
      const dbOrderNumbers = new Set(orders.map((o) => o.orderNumber));
      const extraDevOrders = DEV_ORDERS.filter(
        (o) => !dbIds.has(o.id) && !dbOrderNumbers.has(o.orderNumber)
      );

      const combined = [...orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        shippingCity: o.shippingCity,
        orderStatus: o.orderStatus,
        paymentStatus: o.paymentStatus,
        paymentMethod: o.paymentMethod,
        itemCount: o.items.reduce((acc, i) => acc + i.quantity, 0),
        finalPayableAmount: Number(o.finalPayableAmount),
        createdAt: o.createdAt,
        shipmentAwb: o.shipments[0]?.awbNumber ?? null,
      })), ...extraDevOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        shippingCity: o.shippingCity,
        orderStatus: o.orderStatus,
        paymentStatus: o.paymentStatus,
        paymentMethod: o.paymentMethod,
        itemCount: o.items?.reduce((acc: number, i: any) => acc + (i.quantity || 1), 0) || 1,
        finalPayableAmount: Number(o.finalPayableAmount),
        createdAt: o.createdAt,
        shipmentAwb: o.shipments?.[o.shipments.length - 1]?.awbNumber ?? null,
      }))];

      let filtered = combined;
      if (orderStatus && (orderStatus as any) !== "ALL") filtered = filtered.filter((o) => o.orderStatus === orderStatus);
      if (paymentStatus && (paymentStatus as any) !== "ALL") filtered = filtered.filter((o) => o.paymentStatus === paymentStatus);
      if (paymentMethod && (paymentMethod as any) !== "ALL") filtered = filtered.filter((o) => o.paymentMethod === paymentMethod);
      if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(
          (o) =>
            o.orderNumber?.toLowerCase().includes(s) ||
            o.customerName?.toLowerCase().includes(s) ||
            o.customerPhone?.toLowerCase().includes(s)
        );
      }

      const finalTotal = filtered.length;
      const paged = filtered.slice(skip, skip + limit);

      return {
        items: paged,
        pagination: {
          total: finalTotal,
          page,
          limit,
          totalPages: Math.max(1, Math.ceil(finalTotal / limit)),
        },
      };
    } catch {
      syncDevOrdersFromDisk();
      let filtered = [...DEV_ORDERS];
      if (orderStatus && (orderStatus as any) !== "ALL") filtered = filtered.filter((o) => o.orderStatus === orderStatus);
      if (paymentStatus && (paymentStatus as any) !== "ALL") filtered = filtered.filter((o) => o.paymentStatus === paymentStatus);
      if (paymentMethod && (paymentMethod as any) !== "ALL") filtered = filtered.filter((o) => o.paymentMethod === paymentMethod);
      if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(
          (o) =>
            o.orderNumber?.toLowerCase().includes(s) ||
            o.customerName?.toLowerCase().includes(s) ||
            o.customerPhone?.toLowerCase().includes(s)
        );
      }
      const total = filtered.length;
      const paged = filtered.slice(skip, skip + limit);
      return {
        items: paged.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          customerName: o.customerName,
          customerPhone: o.customerPhone,
          shippingCity: o.shippingCity,
          orderStatus: o.orderStatus,
          paymentStatus: o.paymentStatus,
          paymentMethod: o.paymentMethod,
          itemCount: o.items?.reduce((acc: number, i: any) => acc + (i.quantity || 1), 0) || 1,
          finalPayableAmount: Number(o.finalPayableAmount),
          createdAt: o.createdAt,
          shipmentAwb: o.shipments?.[o.shipments.length - 1]?.awbNumber ?? null,
        })),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        },
      };
    }
  }

  /**
   * Admin: Get full order details by ID.
   */
  static async getAdminOrderById(orderId: string) {
    let order: any = null;
    try {
      order = await db.order.findUnique({
        where: { id: orderId },
        include: {
          items: true,
          shipments: true,
          couponUsages: { include: { coupon: true } },
          statusHistory: {
            orderBy: { createdAt: "asc" },
            include: {
              changedBy: { select: { id: true, email: true, roleId: true } },
            },
          },
        },
      });
    } catch {
      order = null;
    }

    if (!order) {
      syncDevOrdersFromDisk();
      order = DEV_ORDERS.find((o) => o.id === orderId || o.orderNumber === orderId);
    }

    if (!order) {
      throw AppError.notFound(`Order with ID '${orderId}' not found.`);
    }

    return {
      ...order,
      subtotalAmount: Number(order.subtotalAmount),
      discountAmount: Number(order.discountAmount),
      shippingFee: Number(order.shippingFee),
      giftWrapFee: Number(order.giftWrapFee),
      taxAmount: Number(order.taxAmount),
      finalPayableAmount: Number(order.finalPayableAmount),
      shippingAddressLine1: order.shippingAddressLine1,
      shippingAddressLine2: order.shippingAddressLine2,
      shippingAddress: {
        recipientName: order.shippingRecipientName,
        phone: order.shippingPhone,
        addressLine1: order.shippingAddressLine1,
        addressLine2: order.shippingAddressLine2,
        city: order.shippingCity,
        state: order.shippingState,
        postalCode: order.shippingPostalCode,
      },
      items: order.items.map((i: any) => ({
        ...i,
        weightGramsSnapshot: Number(i.weightGramsSnapshot || 500),
        unitPriceSnapshot: Number(i.unitPriceSnapshot || 0),
        lineTotalSnapshot: Number(i.lineTotalSnapshot || 0),
        gstRateSnapshot: Number(i.gstRateSnapshot || 0),
      })),
    };
  }

  /**
   * Admin: Advance or transition order status with state machine enforcement.
   */
  static async updateAdminOrderStatus(
    orderId: string,
    input: z.infer<typeof AdminUpdateOrderStatusSchema>,
    actorId?: string
  ) {
    const validated = AdminUpdateOrderStatusSchema.parse(input);
    const { newStatus, reason } = validated;

    let order: any = null;
    try {
      order = await db.order.findUnique({
        where: { id: orderId },
        include: { items: true, shipments: true },
      });
    } catch {
      order = null;
    }

    if (!order) {
      syncDevOrdersFromDisk();
      const devOrder = DEV_ORDERS.find((o) => o.id === orderId || o.orderNumber === orderId);
      if (!devOrder) {
        throw AppError.notFound(`Order with ID '${orderId}' not found.`);
      }
      validateOrderStatusTransition(devOrder.orderStatus, newStatus);
      const prevStatus = devOrder.orderStatus;
      if (newStatus === OrderStatus.CANCELLED && shouldRestockOnCancellation(prevStatus)) {
        for (const item of devOrder.items || []) {
          for (const p of STOREFRONT_PRODUCTS) {
            const v = p.variants?.find((vr) => vr.id === item.variantId || vr.sku === item.skuSnapshot);
            if (v) {
              (v as any).stockAvailable = ((v as any).stockAvailable ?? 50) + (item.quantity || 1);
            }
          }
        }
      }
      devOrder.orderStatus = newStatus;
      if (newStatus === OrderStatus.DELIVERED && devOrder.paymentMethod === "COD") {
        devOrder.paymentStatus = PaymentStatus.PAID;
      }
      if (Array.isArray(devOrder.shipments) && devOrder.shipments.length > 0) {
        const latestShipment = devOrder.shipments[devOrder.shipments.length - 1];
        if (newStatus === OrderStatus.OUT_FOR_DELIVERY) {
          latestShipment.status = "OUT_FOR_DELIVERY";
          latestShipment.updatedAt = new Date();
        } else if (newStatus === OrderStatus.DELIVERED) {
          latestShipment.status = "DELIVERED";
          latestShipment.actualDeliveryDate = new Date();
          latestShipment.updatedAt = new Date();
        }
      }
      devOrder.updatedAt = new Date();
      devOrder.statusHistory = devOrder.statusHistory || [];
      devOrder.statusHistory.push({
        id: `hist_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        previousStatus: prevStatus,
        newStatus,
        changedByUserId: actorId ?? null,
        createdAt: new Date(),
        reason: reason ?? `Status updated to ${newStatus}`,
      });
      saveDevOrdersToDisk();
      return devOrder;
    }

    // Enforce strict state machine transitions
    validateOrderStatusTransition(order.orderStatus, newStatus);

    return await runTransaction(async (tx) => {
      // If moving to CANCELLED, restock inventory
      if (newStatus === OrderStatus.CANCELLED && shouldRestockOnCancellation(order.orderStatus)) {
        for (const item of order.items) {
          if (item.variantId) {
            const inv = await tx.inventory.findUnique({ where: { variantId: item.variantId } });
            if (inv) {
              const newStock = inv.stockAvailable + item.quantity;
              await tx.inventory.update({
                where: { variantId: item.variantId },
                data: { stockAvailable: newStock },
              });

              await tx.inventoryTransaction.create({
                data: {
                  variantId: item.variantId,
                  transactionType: InventoryTransactionType.CANCEL_RESTORE,
                  quantityDelta: item.quantity,
                  stockAfter: newStock,
                  referenceType: "ADMIN_CANCEL",
                  referenceId: order.orderNumber,
                  actorId: actorId ?? null,
                  notes: `Restocked by admin: ${reason ?? "Status updated to CANCELLED"}`,
                },
              });
            }
          }
        }
      }

      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          orderStatus: newStatus,
          ...(newStatus === OrderStatus.DELIVERED && order.paymentMethod === "COD"
            ? { paymentStatus: PaymentStatus.PAID }
            : {}),
        },
      });

      if (order.shipments && order.shipments.length > 0) {
        const latestShipment = order.shipments[order.shipments.length - 1];
        if (newStatus === OrderStatus.OUT_FOR_DELIVERY) {
          await tx.shipment.update({
            where: { id: latestShipment.id },
            data: { status: "OUT_FOR_DELIVERY" },
          });
        } else if (newStatus === OrderStatus.DELIVERED) {
          await tx.shipment.update({
            where: { id: latestShipment.id },
            data: { status: "DELIVERED", actualDeliveryDate: new Date() },
          });
        }
      }

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          previousStatus: order.orderStatus,
          newStatus,
          changedByUserId: actorId ?? null,
          reason: reason ?? `Status updated to ${newStatus}`,
        },
      });

      return updated;
    });
  }

  /**
   * Admin: Attach shipment / AWB tracking details and auto-advance to SHIPPED.
   */
  static async createShipment(
    orderId: string,
    input: z.infer<typeof AdminCreateShipmentSchema>,
    actorId?: string
  ) {
    const validated = AdminCreateShipmentSchema.parse(input);
    const effectiveTrackingUrl = validated.trackingUrl ?? validated.shippingLabelUrl ?? null;

    let order: any = null;
    try {
      order = await db.order.findUnique({ where: { id: orderId } });
    } catch {
      order = null;
    }

    if (!order) {
      syncDevOrdersFromDisk();
      const devOrder = DEV_ORDERS.find((o) => o.id === orderId || o.orderNumber === orderId);
      if (!devOrder) {
        throw AppError.notFound(`Order with ID '${orderId}' not found.`);
      }
      const shipment = {
        id: `shp_dev_${Date.now()}`,
        orderId: devOrder.id,
        provider: validated.provider,
        awbNumber: validated.awbNumber,
        courierName: validated.courierName,
        shippingLabelUrl: effectiveTrackingUrl,
        trackingUrl: effectiveTrackingUrl,
        manifestId: validated.manifestId ?? null,
        estimatedDeliveryDate: validated.estimatedDeliveryDate ?? null,
        actualDeliveryDate: null,
        status: "IN_TRANSIT",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      devOrder.shipments = devOrder.shipments || [];
      devOrder.shipments.push(shipment);
      if (
        devOrder.orderStatus === OrderStatus.PACKED ||
        devOrder.orderStatus === OrderStatus.PROCESSING ||
        devOrder.orderStatus === OrderStatus.CONFIRMED
      ) {
        const prev = devOrder.orderStatus;
        devOrder.orderStatus = OrderStatus.SHIPPED;
        devOrder.updatedAt = new Date();
        devOrder.statusHistory = devOrder.statusHistory || [];
        devOrder.statusHistory.push({
          id: `hist_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          previousStatus: prev,
          newStatus: OrderStatus.SHIPPED,
          changedByUserId: actorId ?? null,
          createdAt: new Date(),
          reason: `Shipment manifested via ${validated.courierName} (AWB: ${validated.awbNumber})`,
        });
      }
      saveDevOrdersToDisk();
      return shipment;
    }

    return await runTransaction(async (tx) => {
      const shipment = await tx.shipment.create({
        data: {
          orderId,
          provider: validated.provider,
          awbNumber: validated.awbNumber,
          courierName: validated.courierName,
          shippingLabelUrl: effectiveTrackingUrl,
          manifestId: validated.manifestId,
          estimatedDeliveryDate: validated.estimatedDeliveryDate,
          status: "IN_TRANSIT",
        },
      });

      // Auto-advance order status to SHIPPED if currently in a pre-shipment stage
      if (
        order.orderStatus === OrderStatus.PACKED ||
        order.orderStatus === OrderStatus.PROCESSING ||
        order.orderStatus === OrderStatus.CONFIRMED
      ) {
        await tx.order.update({
          where: { id: orderId },
          data: { orderStatus: OrderStatus.SHIPPED },
        });

        await tx.orderStatusHistory.create({
          data: {
            orderId,
            previousStatus: order.orderStatus,
            newStatus: OrderStatus.SHIPPED,
            changedByUserId: actorId ?? null,
            reason: `Shipment manifested via ${validated.courierName} (AWB: ${validated.awbNumber})`,
          },
        });
      }

      return shipment;
    });
  }

  /**
   * Admin: Create or update shipment tracking details (courier, AWB, tracking URL, estimated delivery date)
   * and optionally advance the order milestone status in a single persisted operation.
   */
  static async updateShipmentTracking(
    orderId: string,
    input: z.infer<typeof AdminUpdateTrackingSchema>,
    actorId?: string
  ) {
    const validated = AdminUpdateTrackingSchema.parse(input);
    const cleanUrl =
      validated.trackingUrl !== undefined
        ? validated.trackingUrl || null
        : validated.shippingLabelUrl !== undefined
        ? validated.shippingLabelUrl || null
        : undefined;
    const cleanEta =
      validated.estimatedDeliveryDate === "" || validated.estimatedDeliveryDate === null
        ? null
        : validated.estimatedDeliveryDate instanceof Date
        ? validated.estimatedDeliveryDate
        : undefined;

    let order: any = null;
    try {
      order = await db.order.findUnique({
        where: { id: orderId },
        include: { shipments: true, items: true },
      });
    } catch {
      order = null;
    }

    if (!order) {
      syncDevOrdersFromDisk();
      const devOrder = DEV_ORDERS.find((o) => o.id === orderId || o.orderNumber === orderId);
      if (!devOrder) {
        throw AppError.notFound(`Order with ID '${orderId}' not found.`);
      }

      if (validated.newStatus && validated.newStatus !== devOrder.orderStatus) {
        validateOrderStatusTransition(devOrder.orderStatus, validated.newStatus);
      }

      devOrder.shipments = devOrder.shipments || [];
      let shipment = devOrder.shipments[devOrder.shipments.length - 1];
      const inferredProvider =
        validated.provider ||
        (validated.courierName?.toUpperCase().includes("DELHIVERY")
          ? "DELHIVERY"
          : validated.courierName?.toUpperCase().includes("BLUE")
          ? "BLUEDART"
          : "SHIPROCKET");

      if (!shipment) {
        shipment = {
          id: `shp_dev_${Date.now()}`,
          orderId: devOrder.id,
          provider: inferredProvider,
          courierName: validated.courierName || null,
          awbNumber: validated.awbNumber || null,
          shippingLabelUrl: cleanUrl ?? null,
          trackingUrl: cleanUrl ?? null,
          manifestId: validated.manifestId || null,
          estimatedDeliveryDate: cleanEta ?? null,
          actualDeliveryDate: null,
          status: "MANIFESTED",
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        devOrder.shipments.push(shipment);
      } else {
        if (validated.provider !== undefined) shipment.provider = validated.provider;
        if (validated.courierName !== undefined) shipment.courierName = validated.courierName;
        if (validated.awbNumber !== undefined) shipment.awbNumber = validated.awbNumber;
        if (cleanUrl !== undefined) {
          shipment.shippingLabelUrl = cleanUrl;
          shipment.trackingUrl = cleanUrl;
        }
        if (validated.manifestId !== undefined) shipment.manifestId = validated.manifestId;
        if (cleanEta !== undefined) shipment.estimatedDeliveryDate = cleanEta;
        shipment.updatedAt = new Date();
      }

      if (validated.newStatus && validated.newStatus !== devOrder.orderStatus) {
        const prev = devOrder.orderStatus;
        devOrder.orderStatus = validated.newStatus;
        if (validated.newStatus === OrderStatus.DELIVERED) {
          shipment.status = "DELIVERED";
          shipment.actualDeliveryDate = new Date();
          if (devOrder.paymentMethod === "COD") {
            devOrder.paymentStatus = PaymentStatus.PAID;
          }
        } else if (validated.newStatus === OrderStatus.OUT_FOR_DELIVERY) {
          shipment.status = "OUT_FOR_DELIVERY";
        } else if (validated.newStatus === OrderStatus.SHIPPED) {
          shipment.status = "IN_TRANSIT";
        }
        devOrder.statusHistory = devOrder.statusHistory || [];
        devOrder.statusHistory.push({
          id: `hist_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          previousStatus: prev,
          newStatus: validated.newStatus,
          changedByUserId: actorId ?? null,
          createdAt: new Date(),
          reason:
            validated.reason ||
            `Tracking & status updated to ${validated.newStatus}${
              shipment.courierName ? ` (${shipment.courierName})` : ""
            }`,
        });
      }

      devOrder.updatedAt = new Date();
      saveDevOrdersToDisk();
      return { order: devOrder, shipment };
    }

    if (validated.newStatus && validated.newStatus !== order.orderStatus) {
      validateOrderStatusTransition(order.orderStatus, validated.newStatus);
    }

    return await runTransaction(async (tx) => {
      const existingShipment =
        order.shipments && order.shipments.length > 0
          ? order.shipments[order.shipments.length - 1]
          : null;
      const inferredProvider =
        validated.provider ||
        existingShipment?.provider ||
        (validated.courierName?.toUpperCase().includes("DELHIVERY")
          ? "DELHIVERY"
          : validated.courierName?.toUpperCase().includes("BLUE")
          ? "BLUEDART"
          : "SHIPROCKET");

      let shipment;
      if (!existingShipment) {
        shipment = await tx.shipment.create({
          data: {
            orderId,
            provider: inferredProvider,
            courierName: validated.courierName ?? null,
            awbNumber: validated.awbNumber ?? null,
            shippingLabelUrl: cleanUrl ?? null,
            manifestId: validated.manifestId ?? null,
            estimatedDeliveryDate: cleanEta ?? null,
            status:
              validated.newStatus === OrderStatus.DELIVERED
                ? "DELIVERED"
                : validated.newStatus === OrderStatus.OUT_FOR_DELIVERY
                ? "OUT_FOR_DELIVERY"
                : "IN_TRANSIT",
            ...(validated.newStatus === OrderStatus.DELIVERED ? { actualDeliveryDate: new Date() } : {}),
          },
        });
      } else {
        shipment = await tx.shipment.update({
          where: { id: existingShipment.id },
          data: {
            ...(validated.provider !== undefined ? { provider: validated.provider } : {}),
            ...(validated.courierName !== undefined ? { courierName: validated.courierName } : {}),
            ...(validated.awbNumber !== undefined ? { awbNumber: validated.awbNumber } : {}),
            ...(cleanUrl !== undefined ? { shippingLabelUrl: cleanUrl } : {}),
            ...(validated.manifestId !== undefined ? { manifestId: validated.manifestId } : {}),
            ...(cleanEta !== undefined ? { estimatedDeliveryDate: cleanEta } : {}),
            ...(validated.newStatus === OrderStatus.DELIVERED
              ? { status: "DELIVERED", actualDeliveryDate: new Date() }
              : validated.newStatus === OrderStatus.OUT_FOR_DELIVERY
              ? { status: "OUT_FOR_DELIVERY" }
              : validated.newStatus === OrderStatus.SHIPPED
              ? { status: "IN_TRANSIT" }
              : {}),
          },
        });
      }

      let updatedOrder = order;
      if (validated.newStatus && validated.newStatus !== order.orderStatus) {
        updatedOrder = await tx.order.update({
          where: { id: orderId },
          data: {
            orderStatus: validated.newStatus,
            ...(validated.newStatus === OrderStatus.DELIVERED && order.paymentMethod === "COD"
              ? { paymentStatus: PaymentStatus.PAID }
              : {}),
          },
        });

        await tx.orderStatusHistory.create({
          data: {
            orderId,
            previousStatus: order.orderStatus,
            newStatus: validated.newStatus,
            changedByUserId: actorId ?? null,
            reason:
              validated.reason ||
              `Tracking & status updated to ${validated.newStatus}${
                shipment.courierName ? ` (${shipment.courierName})` : ""
              }`,
          },
        });
      }

      return { order: updatedOrder, shipment };
    });
  }

  /**
   * Automated background worker: Releases inventory and cancels abandoned PENDING online payment orders.
   */
  static async releaseExpiredPendingOrders(timeoutMinutes = OrderConfig.PAYMENT_PENDING_HOLD_TIMEOUT_MINUTES) {
    const cutoffTime = new Date(Date.now() - timeoutMinutes * 60 * 1000);

    try {
      const expiredOrders = await db.order.findMany({
        where: {
          orderStatus: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          paymentMethod: "ONLINE",
          createdAt: { lt: cutoffTime },
        },
        include: { items: true },
      });

      let releasedCount = 0;

      for (const order of expiredOrders) {
        await runTransaction(async (tx) => {
          await tx.order.update({
            where: { id: order.id },
            data: { orderStatus: OrderStatus.CANCELLED },
          });

          for (const item of order.items) {
            if (item.variantId) {
              const inv = await tx.inventory.findUnique({ where: { variantId: item.variantId } });
              if (inv) {
                const newStock = inv.stockAvailable + item.quantity;
                await tx.inventory.update({
                  where: { variantId: item.variantId },
                  data: { stockAvailable: newStock },
                });

                await tx.inventoryTransaction.create({
                  data: {
                    variantId: item.variantId,
                    transactionType: InventoryTransactionType.CANCEL_RESTORE,
                    quantityDelta: item.quantity,
                    stockAfter: newStock,
                    referenceType: "PAYMENT_TIMEOUT",
                    referenceId: order.orderNumber,
                    notes: `Stock hold released after ${timeoutMinutes} min payment timeout`,
                  },
                });
              }
            }
          }

          await tx.orderStatusHistory.create({
            data: {
              orderId: order.id,
              previousStatus: OrderStatus.PENDING,
              newStatus: OrderStatus.CANCELLED,
              reason: `Automated cancellation: payment authorization timed out after ${timeoutMinutes} minutes`,
            },
          });

          releasedCount++;
        });
      }

      return { releasedCount };
    } catch (error) {
      console.warn("[OrderService] DB unreachable or query failed during releaseExpiredPendingOrders:", error instanceof Error ? error.message : error);
      return { releasedCount: 0 };
    }
  }
}
