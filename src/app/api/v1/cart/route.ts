import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/guards";
import { getRequestId } from "@/lib/request-context";
import { CartService } from "@/services/cart.service";

export async function GET(req: NextRequest) {
  const requestId = await getRequestId();
  try {
    const user = await requireAuth(req);
    const cart = await CartService.getCart(user.id);
    return apiSuccess(cart, 200, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}

export async function DELETE(req: NextRequest) {
  const requestId = await getRequestId();
  try {
    const user = await requireAuth(req);
    const cart = await CartService.clearCart(user.id);
    return apiSuccess(cart, 200, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}
