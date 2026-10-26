import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { runTransaction } from "@/database/transactions";
import { PaymentProviderFactory } from "@/lib/payment/payment-factory";
import { CreateRefundSchema } from "@/lib/validation/payment.schema";
import { OrderStatus, PaymentStatus, Prisma } from "@prisma/client";
import { z } from "zod";

export class RefundService {
  /**
   * Admin or automated workflow: Initiates a refund against a captured payment.
   */
  static async createRefund(
    actorId: string | null,
    input: z.infer<typeof CreateRefundSchema>
  ) {
    const validated = CreateRefundSchema.parse(input);
    const { paymentId, amount, reason } = validated;

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

    if (payment.status !== "SUCCESS" && payment.status !== "PARTIALLY_REFUNDED") {
      throw AppError.validation(
        `Cannot refund a payment with status '${payment.status}'. Only successful payments are refundable.`
      );
    }

    const previousRefundedTotal = payment.refunds.reduce(
      (sum, r) => sum + Number(r.amount),
      0
    );
    const availableForRefund = Number(payment.amount) - previousRefundedTotal;

    if (amount > availableForRefund) {
      throw AppError.validation(
        `Refund amount ₹${amount} exceeds the available refundable balance of ₹${availableForRefund.toFixed(2)}.`
      );
    }

    // Call Gateway Provider Adapter to initiate refund
    const provider = PaymentProviderFactory.getProvider();
    const gatewayResult = await provider.initiateRefund({
      providerPaymentId: payment.providerPaymentId || payment.id,
      amount,
      reason,
    });

    return await runTransaction(async (tx) => {
      // 1. Record Refund in database
      const refund = await tx.refund.create({
        data: {
          orderId: payment.orderId,
          paymentId: payment.id,
          amount: new Prisma.Decimal(amount),
          reason,
          providerRefundId: gatewayResult.providerRefundId,
          status: gatewayResult.status || "COMPLETED",
          initiatedByUserId: actorId,
          completedAt: new Date(),
        },
      });

      // 2. Update Payment status (REFUNDED or PARTIALLY_REFUNDED)
      const newTotalRefunded = previousRefundedTotal + amount;
      const isFullRefund = newTotalRefunded >= Number(payment.amount);

      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: isFullRefund ? "REFUNDED" : "PARTIALLY_REFUNDED",
        },
      });

      // 3. Update Order status if entire order is refunded
      const orderTotal = Number(payment.order.finalPayableAmount);
      if (newTotalRefunded >= orderTotal) {
        await tx.order.update({
          where: { id: payment.orderId },
          data: {
            paymentStatus: PaymentStatus.REFUNDED,
            orderStatus: OrderStatus.REFUNDED,
          },
        });
      }

      // 4. Record Order Status History
      await tx.orderStatusHistory.create({
        data: {
          orderId: payment.orderId,
          previousStatus: payment.order.orderStatus,
          newStatus: isFullRefund ? OrderStatus.REFUNDED : payment.order.orderStatus,
          changedByUserId: actorId,
          reason: `Refund of ₹${amount.toFixed(2)} processed (Refund ID: ${gatewayResult.providerRefundId}). Reason: ${reason}`,
        },
      });

      return refund;
    });
  }
}
