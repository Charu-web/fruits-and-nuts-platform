import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { runTransaction } from "@/database/transactions";
import { PaymentProviderFactory } from "@/lib/payment/payment-factory";
import { RefundService } from "./refund.service";
import {
  CreateGatewayOrderSchema,
  VerifyPaymentSchema,
} from "@/lib/validation/payment.schema";
import {
  InventoryTransactionType,
  OrderStatus,
  PaymentStatus,
  Prisma,
} from "@prisma/client";
import { z } from "zod";

export class PaymentService {
  /**
   * Customer: Generates a gateway order for an active PENDING online order.
   */
  static async createPaymentOrder(userId: string, input: z.infer<typeof CreateGatewayOrderSchema>) {
    const { orderId } = CreateGatewayOrderSchema.parse(input);

    let order: any = null;
    try {
      order = await db.order.findFirst({
        where: { id: orderId, userId },
        include: {
          payments: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      });
    } catch {
      const devOrders: any[] = (globalThis as any).devOrdersGlobal || [];
      order = devOrders.find((o) => (o.id === orderId || o.orderNumber === orderId) && (o.userId === userId || !o.userId));
    }

    if (!order) {
      throw AppError.notFound("Order not found in your account.");
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
      throw AppError.validation("This order has already been paid for.");
    }

    if (order.orderStatus === OrderStatus.CANCELLED) {
      throw AppError.validation(
        "This order has been cancelled due to payment timeout. Please place a new order."
      );
    }

    if (order.paymentMethod !== "ONLINE") {
      throw AppError.validation(
        "Online payment is only applicable for orders with payment method 'ONLINE'."
      );
    }

    const provider = PaymentProviderFactory.getProvider();
    const gatewayOrder = await provider.createGatewayOrder({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: Number(order.finalPayableAmount),
      currency: order.currency || "INR",
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
    });

    // Record or update Payment attempt
    try {
      await db.payment.create({
        data: {
          orderId: order.id,
          provider: provider.providerName,
          providerOrderId: gatewayOrder.providerOrderId,
          amount: new Prisma.Decimal(order.finalPayableAmount),
          currency: order.currency || "INR",
          paymentMethod: "ONLINE",
          status: "INITIATED",
        },
      });
    } catch {
      order.payments = order.payments || [];
      order.payments.unshift({
        id: `pay_dev_${Date.now()}`,
        orderId: order.id,
        provider: provider.providerName,
        providerOrderId: gatewayOrder.providerOrderId,
        amount: Number(order.finalPayableAmount),
        currency: order.currency || "INR",
        paymentMethod: "ONLINE",
        status: "INITIATED",
        createdAt: new Date(),
      });
    }

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      provider: gatewayOrder.provider,
      providerOrderId: gatewayOrder.providerOrderId,
      amount: gatewayOrder.amount,
      currency: gatewayOrder.currency,
      keyId: gatewayOrder.keyId,
    };
  }

  /**
   * Synchronous Frontend Callback: Verifies cryptographic payment signature and confirms order.
   */
  static async verifyPayment(userId: string, input: z.infer<typeof VerifyPaymentSchema>) {
    const validated = VerifyPaymentSchema.parse(input);
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = validated;

    let order: any = null;
    let isDevOrder = false;
    try {
      order = await db.order.findFirst({
        where: { id: orderId, userId },
        include: { items: true },
      });
    } catch {
      const devOrders: any[] = (globalThis as any).devOrdersGlobal || [];
      order = devOrders.find((o) => (o.id === orderId || o.orderNumber === orderId) && (o.userId === userId || !o.userId));
      isDevOrder = Boolean(order);
    }

    if (!order) {
      throw AppError.notFound("Order not found in your account.");
    }

    // Idempotent return if already marked PAID
    if (order.paymentStatus === PaymentStatus.PAID && order.orderStatus === OrderStatus.CONFIRMED) {
      return {
        message: "Payment already verified successfully.",
        order,
      };
    }

    if (order.orderStatus === OrderStatus.CANCELLED) {
      throw AppError.validation(
        "This order was cancelled before payment completion. If your account was debited, an automated refund will be processed."
      );
    }

    // Verify HMAC-SHA256 signature
    const provider = PaymentProviderFactory.getProvider();
    const isValidSignature = provider.verifyPaymentSignature({
      providerOrderId: razorpayOrderId,
      providerPaymentId: razorpayPaymentId,
      providerSignature: razorpaySignature,
    });

    if (!isValidSignature) {
      throw AppError.unauthorized("Invalid payment signature received. Verification failed.");
    }

    if (isDevOrder) {
      const prevStatus = order.orderStatus;
      order.orderStatus = OrderStatus.CONFIRMED;
      order.paymentStatus = PaymentStatus.PAID;
      order.updatedAt = new Date();
      order.payments = order.payments || [];
      order.payments.unshift({
        id: `pay_dev_${Date.now()}`,
        orderId: order.id,
        provider: provider.providerName,
        providerOrderId: razorpayOrderId,
        providerPaymentId: razorpayPaymentId,
        providerSignature: razorpaySignature,
        amount: Number(order.finalPayableAmount),
        currency: order.currency || "INR",
        paymentMethod: "ONLINE",
        status: "SUCCESS",
        createdAt: new Date(),
      });
      order.statusHistory = order.statusHistory || [];
      order.statusHistory.push({
        previousStatus: prevStatus,
        newStatus: OrderStatus.CONFIRMED,
        changedByUserId: userId,
        createdAt: new Date(),
        reason: `Online payment authorized and verified (Payment ID: ${razorpayPaymentId})`,
      });
      return {
        message: "Payment verified successfully.",
        order,
      };
    }

    return await runTransaction(async (tx) => {
      // 1. Update Payment record
      const existingPayment = await tx.payment.findFirst({
        where: { orderId: order.id, providerOrderId: razorpayOrderId },
      });

      if (existingPayment) {
        await tx.payment.update({
          where: { id: existingPayment.id },
          data: {
            providerPaymentId: razorpayPaymentId,
            providerSignature: razorpaySignature,
            status: "SUCCESS",
          },
        });
      } else {
        await tx.payment.create({
          data: {
            orderId: order.id,
            provider: provider.providerName,
            providerOrderId: razorpayOrderId,
            providerPaymentId: razorpayPaymentId,
            providerSignature: razorpaySignature,
            amount: order.finalPayableAmount,
            currency: order.currency,
            paymentMethod: "ONLINE",
            status: "SUCCESS",
          },
        });
      }

      // 2. Transition Order to CONFIRMED & PAID
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          orderStatus: OrderStatus.CONFIRMED,
          paymentStatus: PaymentStatus.PAID,
        },
      });

      // 3. Convert Inventory Transaction from ORDER_HOLD to permanent ORDER_DEDUCT
      for (const item of order.items) {
        if (item.variantId) {
          const inv = await tx.inventory.findUnique({ where: { variantId: item.variantId } });
          await tx.inventoryTransaction.create({
            data: {
              variantId: item.variantId,
              transactionType: InventoryTransactionType.ORDER_DEDUCT,
              quantityDelta: 0, // Stock was already reserved under ORDER_HOLD
              stockAfter: inv?.stockAvailable ?? 0,
              referenceType: "ORDER_PAID",
              referenceId: order.orderNumber,
              actorId: userId,
              notes: `Stock hold converted to permanent deduction on payment confirmation (${razorpayPaymentId})`,
            },
          });
        }
      }

      // 4. Record Order Status History
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          previousStatus: order.orderStatus,
          newStatus: OrderStatus.CONFIRMED,
          changedByUserId: userId,
          reason: `Online payment authorized and verified (Payment ID: ${razorpayPaymentId})`,
        },
      });

      return {
        message: "Payment verified successfully.",
        order: updatedOrder,
      };
    });
  }

  /**
   * Asynchronous Webhook Processor: Cryptographic validation, idempotency gate, and state machine sync.
   */
  static async processWebhook(rawBody: string, signatureHeader: string | null) {
    const provider = PaymentProviderFactory.getProvider();

    // 1. Verify Webhook Signature
    const isValidSignature = provider.verifyWebhookSignature(rawBody, signatureHeader);
    if (!isValidSignature) {
      throw AppError.unauthorized("Invalid webhook signature.");
    }

    // 2. Parse Event Payload
    const event = provider.parseWebhookEvent(rawBody);

    // 3. Webhook Idempotency Check
    const existingEvent = await db.webhookEvent.findUnique({
      where: { eventId: event.eventId },
    });

    if (existingEvent) {
      return {
        status: "IDEMPOTENT_IGNORED",
        message: "Webhook event has already been processed.",
        eventId: event.eventId,
      };
    }

    return await runTransaction(async (tx) => {
      // Record Webhook Event for idempotency
      await tx.webhookEvent.create({
        data: {
          provider: provider.providerName,
          eventId: event.eventId,
          eventType: event.eventType,
          payload: event.payload as any,
        },
      });

      // Handle Event Types
      if (event.status === "SUCCESS") {
        // Find order by providerOrderId or paymentEntity id
        let order = await tx.order.findFirst({
          where: {
            OR: [
              { payments: { some: { providerOrderId: event.providerOrderId } } },
              { payments: { some: { providerPaymentId: event.providerPaymentId } } },
            ],
          },
          include: { items: true, payments: true },
        });

        // Fallback search by notes if present in webhook
        if (!order && event.payload?.payload?.payment?.entity?.notes?.orderId) {
          order = await tx.order.findUnique({
            where: { id: event.payload.payload.payment.entity.notes.orderId },
            include: { items: true, payments: true },
          });
        }

        if (order) {
          // If already CONFIRMED & PAID, no further action required
          if (order.paymentStatus === PaymentStatus.PAID && order.orderStatus === OrderStatus.CONFIRMED) {
            return { status: "PROCESSED", eventId: event.eventId, orderId: order.id };
          }

          if (order.orderStatus === OrderStatus.PENDING) {
            // Confirm Order & Sync Payment
            await tx.order.update({
              where: { id: order.id },
              data: {
                orderStatus: OrderStatus.CONFIRMED,
                paymentStatus: PaymentStatus.PAID,
              },
            });

            // Upsert / Update Payment
            const existingPayment = order.payments.find(
              (p) => p.providerOrderId === event.providerOrderId || p.providerPaymentId === event.providerPaymentId
            );

            if (existingPayment) {
              await tx.payment.update({
                where: { id: existingPayment.id },
                data: {
                  providerPaymentId: event.providerPaymentId,
                  status: "SUCCESS",
                  rawResponse: event.payload as any,
                },
              });
            } else {
              await tx.payment.create({
                data: {
                  orderId: order.id,
                  provider: provider.providerName,
                  providerOrderId: event.providerOrderId,
                  providerPaymentId: event.providerPaymentId,
                  amount: order.finalPayableAmount,
                  currency: order.currency,
                  paymentMethod: "ONLINE",
                  status: "SUCCESS",
                  rawResponse: event.payload as any,
                },
              });
            }

            // Convert HOLD to permanent DEDUCT
            for (const item of order.items) {
              if (item.variantId) {
                const inv = await tx.inventory.findUnique({ where: { variantId: item.variantId } });
                await tx.inventoryTransaction.create({
                  data: {
                    variantId: item.variantId,
                    transactionType: InventoryTransactionType.ORDER_DEDUCT,
                    quantityDelta: 0,
                    stockAfter: inv?.stockAvailable ?? 0,
                    referenceType: "WEBHOOK_PAID",
                    referenceId: order.orderNumber,
                    notes: `Inventory hold converted to permanent deduction via webhook (${event.eventId})`,
                  },
                });
              }
            }

            await tx.orderStatusHistory.create({
              data: {
                orderId: order.id,
                previousStatus: order.orderStatus,
                newStatus: OrderStatus.CONFIRMED,
                reason: `Payment confirmed via webhook (${event.eventType}: ${event.providerPaymentId})`,
              },
            });
          } else if (order.orderStatus === OrderStatus.CANCELLED) {
            // Late Payment Handler (Hold expired before webhook arrived)
            let allItemsAvailable = true;
            for (const item of order.items) {
              if (item.variantId) {
                const inv = await tx.inventory.findUnique({ where: { variantId: item.variantId } });
                if (!inv || inv.stockAvailable < item.quantity) {
                  allItemsAvailable = false;
                  break;
                }
              }
            }

            if (allItemsAvailable) {
              // Resurrect order and deduct stock
              for (const item of order.items) {
                if (item.variantId) {
                  const inv = await tx.inventory.findUnique({ where: { variantId: item.variantId } });
                  const newStock = (inv?.stockAvailable ?? 0) - item.quantity;
                  await tx.inventory.update({
                    where: { variantId: item.variantId },
                    data: { stockAvailable: newStock },
                  });

                  await tx.inventoryTransaction.create({
                    data: {
                      variantId: item.variantId,
                      transactionType: InventoryTransactionType.ORDER_DEDUCT,
                      quantityDelta: -item.quantity,
                      stockAfter: newStock,
                      referenceType: "LATE_PAYMENT_RESURRECT",
                      referenceId: order.orderNumber,
                      notes: `Late payment captured post-timeout; inventory re-allocated (${event.eventId})`,
                    },
                  });
                }
              }

              await tx.order.update({
                where: { id: order.id },
                data: {
                  orderStatus: OrderStatus.CONFIRMED,
                  paymentStatus: PaymentStatus.PAID,
                },
              });

              await tx.orderStatusHistory.create({
                data: {
                  orderId: order.id,
                  previousStatus: OrderStatus.CANCELLED,
                  newStatus: OrderStatus.CONFIRMED,
                  reason: `Late payment captured post-timeout; stock was available so order was resurrected (Payment: ${event.providerPaymentId})`,
                },
              });
            } else {
              // Stock unavailable: trigger automatic refund
              const createdPayment = await tx.payment.create({
                data: {
                  orderId: order.id,
                  provider: provider.providerName,
                  providerOrderId: event.providerOrderId,
                  providerPaymentId: event.providerPaymentId,
                  amount: order.finalPayableAmount,
                  currency: order.currency,
                  paymentMethod: "ONLINE",
                  status: "SUCCESS",
                  rawResponse: event.payload as any,
                },
              });

              await tx.orderStatusHistory.create({
                data: {
                  orderId: order.id,
                  previousStatus: OrderStatus.CANCELLED,
                  newStatus: OrderStatus.CANCELLED,
                  reason: `Late payment captured after hold expired; inventory exhausted; automated refund dispatched (Payment: ${event.providerPaymentId})`,
                },
              });

              // Dispatch automatic refund
              await RefundService.createRefund(null, {
                paymentId: createdPayment.id,
                amount: Number(order.finalPayableAmount),
                reason: "Late payment received after stock hold timeout expired; inventory unavailable.",
              });
            }
          }
        }
      } else if (event.status === "FAILED") {
        if (event.providerOrderId) {
          const payment = await tx.payment.findFirst({
            where: { providerOrderId: event.providerOrderId },
            include: { order: true },
          });

          if (payment) {
            await tx.payment.update({
              where: { id: payment.id },
              data: {
                status: "FAILED",
                rawResponse: event.payload as any,
              },
            });

            if (payment.order && payment.order.orderStatus === OrderStatus.PENDING) {
              await tx.orderStatusHistory.create({
                data: {
                  orderId: payment.order.id,
                  previousStatus: payment.order.orderStatus,
                  newStatus: payment.order.orderStatus,
                  reason: `Payment attempt failed: ${event.errorDescription || "Gateway transaction failed"}`,
                },
              });
            }
          }
        }
      }

      return {
        status: "PROCESSED",
        eventId: event.eventId,
      };
    });
  }

  /**
   * Customer: Get all payment attempts for a customer-scoped order.
   */
  static async getOrderPayments(userId: string, orderId: string) {
    const order = await db.order.findFirst({
      where: { id: orderId, userId },
      include: {
        payments: {
          orderBy: { createdAt: "desc" },
          include: { refunds: true },
        },
      },
    });

    if (!order) {
      throw AppError.notFound("Order not found in your account.");
    }

    return order.payments.map((p) => ({
      id: p.id,
      orderId: p.orderId,
      provider: p.provider,
      providerOrderId: p.providerOrderId,
      providerPaymentId: p.providerPaymentId,
      amount: Number(p.amount),
      currency: p.currency,
      status: p.status,
      createdAt: p.createdAt,
      refunds: p.refunds.map((r) => ({
        id: r.id,
        amount: Number(r.amount),
        reason: r.reason,
        status: r.status,
        createdAt: r.createdAt,
      })),
    }));
  }

  /**
   * Admin: View payment details.
   */
  static async getAdminPaymentById(paymentId: string) {
    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: {
        order: true,
        refunds: true,
      },
    });

    if (!payment) {
      throw AppError.notFound(`Payment with ID '${paymentId}' not found.`);
    }

    return {
      ...payment,
      amount: Number(payment.amount),
      order: {
        ...payment.order,
        finalPayableAmount: Number(payment.order.finalPayableAmount),
      },
      refunds: payment.refunds.map((r) => ({
        ...r,
        amount: Number(r.amount),
      })),
    };
  }
}
