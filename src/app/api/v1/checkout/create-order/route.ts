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

    // 1. Enforce server-side rate limit on checkout creation (Max 10 orders per 5 mins per IP)
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
    await enforceRateLimit({
      key: `order_creation_${ip}`,
      limit: 10,
      windowSeconds: 300,
    });

    let user = await getSessionUserFromRequest(req);
    const body = await req.json();
    const validated = CreateOrderSchema.parse(body);

    // 2. Check Idempotency Key if provided by client
    if (validated.idempotencyKey) {
      const cached = idempotencyMap.get(validated.idempotencyKey);
      if (cached && Date.now() - cached.timestamp < 10 * 60 * 1000) {
        return apiSuccess(cached.order, 200, { requestId });
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

    // Store in idempotency cache
    if (validated.idempotencyKey) {
      idempotencyMap.set(validated.idempotencyKey, {
        order,
        timestamp: Date.now(),
      });
    }

    return apiSuccess(order, 201, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}
