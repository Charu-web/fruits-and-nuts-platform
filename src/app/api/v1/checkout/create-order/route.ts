import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { getSessionUserFromRequest, setSessionCookie } from "@/lib/auth/cookies";
import { generateSessionToken } from "@/lib/auth/tokens";
import { enforceRateLimit } from "@/lib/auth/rate-limiter";
import { getRequestId } from "@/lib/request-context";
import { OrderService } from "@/services/order.service";
import { AuthService } from "@/services/auth.service";
import { CreateOrderSchema } from "@/lib/validation/order.schema";
import { AppError } from "@/lib/errors/app-error";
import { db } from "@/lib/db";

// Idempotency cache for atomic duplicate order prevention (TTL: 10 minutes)
interface CachedOrderRecord {
  order: any;
  timestamp: number;
}
const idempotencyMap = new Map<string, CachedOrderRecord>();

function cleanExpiredIdempotencyKeys() {
  const now = Date.now();
  const maxAge = 10 * 60 * 1000;
  for (const [key, record] of idempotencyMap.entries()) {
    if (now - record.timestamp > maxAge) {
      idempotencyMap.delete(key);
    }
  }
}

export async function POST(req: NextRequest) {
  const requestId = await getRequestId();
  try {
    cleanExpiredIdempotencyKeys();

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";

    // 1. Enforce local sliding-window rate limit on checkout creation (Max 10 orders per 5 mins per IP)
    await enforceRateLimit({
      key: `order_creation_${ip}`,
      limit: 10,
      windowSeconds: 300,
    });

    let user = await getSessionUserFromRequest(req);
    const body = await req.json();
    const validated = CreateOrderSchema.parse(body);

    // 2. Shared persistent COD rate limiting across all Vercel instances
    if (validated.paymentMethod === "COD") {
      try {
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        const recentCodAttempts = await db.auditLog.count({
          where: {
            action: "CHECKOUT_COD_ATTEMPT",
            ipAddress: ip,
            createdAt: { gte: tenMinutesAgo },
          },
        });

        if (recentCodAttempts >= 10) {
          throw new AppError(
            "Too many Cash on Delivery order attempts from this network. Please wait a few minutes or proceed with online payment.",
            // @ts-expect-error RATE_LIMITED maps to 429 in AppError
            "RATE_LIMITED",
            { retryAfterSeconds: 600 }
          );
        }

        // Record attempt in persistent audit log
        await db.auditLog.create({
          data: {
            action: "CHECKOUT_COD_ATTEMPT",
            entityName: "RATE_LIMIT_COD",
            entityId: ip,
            ipAddress: ip,
          },
        });
      } catch (rateErr) {
        if (rateErr instanceof AppError) throw rateErr;
        // Non-blocking fallback if database check is delayed
        console.warn("[Checkout] Persistent COD rate limit check skipped due to DB warning:", rateErr);
      }
    }

    // 3. Shared persistent Idempotency check (Fast memory cache + Shared PostgreSQL audit store)
    if (validated.idempotencyKey) {
      // Fast memory path
      const cached = idempotencyMap.get(validated.idempotencyKey);
      if (cached && Date.now() - cached.timestamp < 10 * 60 * 1000) {
        return apiSuccess(cached.order, 200, { requestId });
      }

      // Shared persistent PostgreSQL path (survives multi-instance Vercel and retries)
      try {
        const existingAudit = await db.auditLog.findFirst({
          where: {
            action: "ORDER_CREATED_IDEMPOTENT",
            entityName: "IDEMPOTENCY_KEY",
            entityId: validated.idempotencyKey,
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
        });

        if (existingAudit?.newState) {
          idempotencyMap.set(validated.idempotencyKey, {
            order: existingAudit.newState,
            timestamp: Date.now(),
          });
          return apiSuccess(existingAudit.newState, 200, { requestId });
        }
      } catch (idempErr) {
        console.warn("[Checkout] Persistent idempotency check fallback:", idempErr);
      }
    }

    if (!user) {
      // Find or provision guest customer profile
      const phone =
        typeof validated.shippingAddress === "object" && validated.shippingAddress?.phone
          ? validated.shippingAddress.phone
          : null;
      const name =
        typeof validated.shippingAddress === "object" && validated.shippingAddress?.recipientName
          ? validated.shippingAddress.recipientName
          : "Guest Customer";
      const email =
        typeof validated.shippingAddress === "object" && validated.shippingAddress?.email
          ? validated.shippingAddress.email
          : validated.customerEmail || null;

      user = await AuthService.getOrCreateGuestUser({ phone, name, email });
      if (user) {
        const token = await generateSessionToken(user);
        await setSessionCookie(token);
      }
    }

    if (!user) {
      throw AppError.unauthorized("Unable to authenticate or initialize customer session.");
    }

    const order = await OrderService.createOrder(user.id, validated);

    // 4. Store in memory and persistent database idempotency store
    if (validated.idempotencyKey) {
      idempotencyMap.set(validated.idempotencyKey, {
        order,
        timestamp: Date.now(),
      });

      try {
        const isActorUuid =
          user.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id);
        await db.auditLog.create({
          data: {
            actorId: isActorUuid ? user.id : null,
            action: "ORDER_CREATED_IDEMPOTENT",
            entityName: "IDEMPOTENCY_KEY",
            entityId: validated.idempotencyKey,
            newState: order as any,
            ipAddress: ip,
          },
        });
      } catch (persistErr) {
        console.warn("[Checkout] Failed to persist idempotency key to DB:", persistErr);
      }
    }

    return apiSuccess(order, 201, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}
