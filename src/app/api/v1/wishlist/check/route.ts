import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/guards";
import { getRequestId } from "@/lib/request-context";
import { WishlistService } from "@/services/wishlist.service";

export async function GET(req: NextRequest) {
  const requestId = await getRequestId();
  try {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const variantId = searchParams.get("variantId");

    if (!variantId) {
      return apiSuccess({ inWishlist: false }, 200, { requestId });
    }

    const inWishlist = await WishlistService.isInWishlist(user.id, variantId);
    return apiSuccess({ inWishlist, variantId }, 200, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}
