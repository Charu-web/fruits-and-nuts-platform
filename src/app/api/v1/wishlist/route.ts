import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/guards";
import { getRequestId } from "@/lib/request-context";
import { WishlistService } from "@/services/wishlist.service";

export async function GET(req: NextRequest) {
  const requestId = await getRequestId();
  try {
    const user = await requireAuth(req);
    const wishlist = await WishlistService.getWishlist(user.id);
    return apiSuccess(wishlist.items, 200, {
      total: wishlist.totalCount,
      requestId,
    });
  } catch (error) {
    return apiError(error, requestId);
  }
}
