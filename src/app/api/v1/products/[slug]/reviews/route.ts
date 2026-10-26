import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { getRequestId } from "@/lib/request-context";
import { ReviewService } from "@/services/review.service";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const requestId = await getRequestId();
  try {
    const { slug } = await params;
    const searchParams = req.nextUrl.searchParams;

    const query = {
      page: searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : 1,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 10,
      rating: searchParams.get("rating") ? parseInt(searchParams.get("rating")!, 10) : undefined,
      sortBy: (searchParams.get("sortBy") as "recent" | "highest" | "lowest") || "recent",
    };

    const result = await ReviewService.getProductReviews(slug, query);
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
