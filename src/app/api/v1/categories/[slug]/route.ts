import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { getRequestId } from "@/lib/request-context";
import { CategoryService } from "@/services/category.service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const requestId = await getRequestId();
  try {
    const { slug } = await params;
    const category = await CategoryService.getCategoryBySlug(slug, false);
    return apiSuccess(category, 200, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}
