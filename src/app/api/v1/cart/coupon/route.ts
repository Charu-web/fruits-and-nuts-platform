import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/guards";
import { getRequestId } from "@/lib/request-context";
import { CartService } from "@/services/cart.service";
import { ApplyCouponSchema } from "@/lib/validation/coupon.schema";

export async function POST(req: NextRequest) {
  const requestId = await getRequestId();
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const validated = ApplyCouponSchema.parse(body);
    const cart = await CartService.applyCoupon(user.id, validated.code);
    return apiSuccess(cart, 200, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}

export async function DELETE(req: NextRequest) {
  const requestId = await getRequestId();
  try {
    const user = await requireAuth(req);
    const cart = await CartService.removeCoupon(user.id);
    return apiSuccess(cart, 200, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}
