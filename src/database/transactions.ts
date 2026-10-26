import { Prisma, PrismaClient } from "@prisma/client";
import { db } from "@/lib/db";

export type TransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

/**
 * Executes a callback within a managed database transaction.
 * Supports configurable isolation levels (default: REPEATABLE READ for strict commerce consistency).
 */
export async function runTransaction<T>(
  action: (tx: TransactionClient) => Promise<T>,
  options?: {
    maxWait?: number; // default: 5000ms
    timeout?: number; // default: 10000ms
    isolationLevel?: Prisma.TransactionIsolationLevel;
  }
): Promise<T> {
  return await db.$transaction(
    async (tx) => {
      return await action(tx as TransactionClient);
    },
    {
      maxWait: options?.maxWait ?? 5000,
      timeout: options?.timeout ?? 10000,
      isolationLevel: options?.isolationLevel ?? Prisma.TransactionIsolationLevel.RepeatableRead,
    }
  );
}

/**
 * Foundation helper for pessimistic row-level locking (SELECT ... FOR UPDATE)
 * Used by checkout and inventory services to lock stock records and prevent race conditions.
 */
export async function acquireVariantRowLocks(
  tx: TransactionClient,
  variantIds: string[]
): Promise<void> {
  if (variantIds.length === 0) return;

  // Execute raw parameterized query within transaction to acquire exclusive row-level locks
  const query = Prisma.sql`
    SELECT id FROM product_variants 
    WHERE id IN (${Prisma.join(variantIds)}) 
    FOR UPDATE;
  `;

  await tx.$executeRaw(query);
}
