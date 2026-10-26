import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/guards";
import { getRequestId } from "@/lib/request-context";
import { CartService } from "@/services/cart.service";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const requestId = await getRequestId();
  try {
    const user = await requireAuth(req);
    const { itemId } = await params;
    const body = await req.json();
    const cart = await CartService.updateItemQuantity(user.id, itemId, body);
    return apiSuccess(cart, 200, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const requestId = await getRequestId();
  try {
    const user = await requireAuth(req);
    const { itemId } = await params;
    const cart = await CartService.removeItem(user.id, itemId);
    return apiSuccess(cart, 200, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}
