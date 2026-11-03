import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/guards";
import { getRequestId } from "@/lib/request-context";
import { WishlistService } from "@/services/wishlist.service";
import { AppError } from "@/lib/errors";

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

export async function POST(req: NextRequest) {
  const requestId = await getRequestId();
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const wishlist = await WishlistService.addItem(user.id, body);
    return apiSuccess(wishlist.items, 201, {
      total: wishlist.totalCount,
      requestId,
    });
  } catch (error) {
    return apiError(error, requestId);
  }
}

export async function DELETE(req: NextRequest) {
  const requestId = await getRequestId();
  try {
    const user = await requireAuth(req);
    let variantId = req.nextUrl.searchParams.get("variantId") || req.nextUrl.searchParams.get("id");
    if (!variantId) {
      const body = await req.json().catch(() => ({}));
      variantId = body.variantId || body.id || body.slug;
    }
    if (!variantId) {
      throw AppError.validation("variantId parameter is required to remove item from wishlist.");
    }
    const wishlist = await WishlistService.removeItem(user.id, variantId);
    return apiSuccess(wishlist.items, 200, {
      total: wishlist.totalCount,
      requestId,
    });
  } catch (error) {
    return apiError(error, requestId);
  }
}
