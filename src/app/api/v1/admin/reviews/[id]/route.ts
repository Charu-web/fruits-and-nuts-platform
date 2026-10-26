import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth/guards";
import { getRequestId } from "@/lib/request-context";
import { ReviewService } from "@/services/review.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const requestId = await getRequestId();
  try {
    const user = await requirePermission("reviews:moderate", req);
    const { id } = await params;
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined;

    const result = await ReviewService.deleteReview(id, user.id, ip);
    return apiSuccess(result, 200, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}
