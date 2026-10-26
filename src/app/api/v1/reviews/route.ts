import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireAuth, requirePermission } from "@/lib/auth/guards";
import { getRequestId } from "@/lib/request-context";
import { ReviewService } from "@/services/review.service";

export async function POST(req: NextRequest) {
  const requestId = await getRequestId();
  try {
    const user = await requirePermission("customer:reviews:write", req);
    const body = await req.json();

    const review = await ReviewService.submitReview(user.id, body);
    return apiSuccess(
      {
        review,
        message: "Review submitted successfully and is pending moderation.",
      },
      201,
      { requestId }
    );
  } catch (error) {
    return apiError(error, requestId);
  }
}

export async function GET(req: NextRequest) {
  const requestId = await getRequestId();
  try {
    const user = await requireAuth(req);
    const searchParams = req.nextUrl.searchParams;
    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : 1;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 10;

    const result = await ReviewService.getUserReviews(user.id, page, limit);
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
