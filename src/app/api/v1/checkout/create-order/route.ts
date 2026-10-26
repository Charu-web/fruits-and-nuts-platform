import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { getSessionUserFromRequest, setSessionCookie } from "@/lib/auth/cookies";
import { generateSessionToken } from "@/lib/auth/tokens";
import { getRequestId } from "@/lib/request-context";
import { OrderService } from "@/services/order.service";
import { AuthService } from "@/services/auth.service";
import { CreateOrderSchema } from "@/lib/validation/order.schema";
import { AppError } from "@/lib/errors/app-error";

export async function POST(req: NextRequest) {
  const requestId = await getRequestId();
  try {
    let user = await getSessionUserFromRequest(req);
    const body = await req.json();
    const validated = CreateOrderSchema.parse(body);

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

      user = await AuthService.getOrCreateGuestUser({ phone, name });
      if (user) {
        const token = await generateSessionToken(user);
        await setSessionCookie(token);
      }
    }

    if (!user) {
      throw AppError.unauthorized("Unable to authenticate or initialize customer session.");
    }

    const order = await OrderService.createOrder(user.id, validated);
    return apiSuccess(order, 201, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}
