import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth/guards";
import { getRequestId } from "@/lib/request-context";
import { ReviewService } from "@/services/review.service";
import { ModerationStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const requestId = await getRequestId();
  try {
    await requirePermission("reviews:moderate", req);
    const searchParams = req.nextUrl.searchParams;

    const query = {
      status: (searchParams.get("status") as ModerationStatus) || undefined,
      productId: searchParams.get("productId") || undefined,
      rating: searchParams.get("rating") ? parseInt(searchParams.get("rating")!, 10) : undefined,
      page: searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : 1,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 20,
    };

    const result = await ReviewService.getAdminReviews(query);
    return apiSuccess(result, 200, {
      requestId,
      page: result.pagination.page,
      limit: result.pagination.limit,
      total: result.pagination.total,
    });
  } catch (error) {
    return apiError(error, requestId);
  }
}
