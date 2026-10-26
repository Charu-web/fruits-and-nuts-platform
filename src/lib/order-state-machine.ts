import { OrderStatus } from "@prisma/client";
import { AppError } from "@/lib/errors";

/**
 * Valid state transition matrix for the M/S Fruits & Nuts order lifecycle.
 */
export const ValidOrderStateTransitions: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.PACKED, OrderStatus.CANCELLED],
  [OrderStatus.PACKED]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED],
  [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED, OrderStatus.RETURNED],
  [OrderStatus.DELIVERED]: [OrderStatus.RETURN_REQUESTED, OrderStatus.RETURNED],
  [OrderStatus.RETURN_REQUESTED]: [OrderStatus.RETURNED, OrderStatus.DELIVERED],
  [OrderStatus.RETURNED]: [OrderStatus.REFUNDED],
  [OrderStatus.CANCELLED]: [OrderStatus.REFUNDED],
  [OrderStatus.REFUNDED]: [],
};

/**
 * Statuses from which an order can still be cancelled and warehouse inventory restored.
 */
export const CancellableOrderStatuses: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.PROCESSING,
  OrderStatus.PACKED,
];

/**
 * Statuses from which a customer self-service cancellation is permitted (pre-dispatch).
 */
export const CustomerCancellableStatuses: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
];

/**
 * Validates whether a state transition from `currentStatus` to `newStatus` is allowed.
 * Throws AppError.validation if the transition is illegal.
 */
export function validateOrderStatusTransition(
  currentStatus: OrderStatus,
  newStatus: OrderStatus
): void {
  if (currentStatus === newStatus) {
    return; // No-op transition
  }

  const allowed = ValidOrderStateTransitions[currentStatus] || [];
  if (!allowed.includes(newStatus)) {
    throw AppError.validation(
      `Illegal order status transition from '${currentStatus}' to '${newStatus}'. Allowed next statuses: ${
        allowed.length > 0 ? allowed.join(", ") : "None (Terminal state)"
      }.`
    );
  }
}

/**
 * Determines whether the given status transition requires inventory to be restocked.
 */
export function shouldRestockOnCancellation(statusBeforeCancellation: OrderStatus): boolean {
  return CancellableOrderStatuses.includes(statusBeforeCancellation);
}
