import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireAuth, getOptionalAuth } from "@/lib/auth/guards";
import { getRequestId } from "@/lib/request-context";
import { CartService } from "@/services/cart.service";

export async function GET(req: NextRequest) {
  const requestId = await getRequestId();
  try {
    const user = await getOptionalAuth(req);
    if (!user) {
      return apiSuccess(
        {
          id: "guest",
          userId: null,
          isGuest: true,
          items: [],
          subtotal: 0,
          total: 0,
          totalMrp: 0,
          discount: 0,
          currency: "INR",
        },
        200,
        { requestId, isGuest: true }
      );
    }
    const cart = await CartService.getCart(user.id);
    return apiSuccess(cart, 200, { requestId, isGuest: false });
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
