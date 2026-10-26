import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/guards";
import { getRequestId } from "@/lib/request-context";
import { WishlistService } from "@/services/wishlist.service";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ variantId: string }> }
) {
  const requestId = await getRequestId();
  try {
    const user = await requireAuth(req);
    const { variantId } = await params;
    const wishlist = await WishlistService.removeItem(user.id, variantId);
    return apiSuccess(wishlist.items, 200, {
      total: wishlist.totalCount,
      requestId,
    });
  } catch (error) {
    return apiError(error, requestId);
  }
}
