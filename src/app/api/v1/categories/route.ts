import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { getRequestId } from "@/lib/request-context";
import { CategoryService } from "@/services/category.service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const requestId = await getRequestId();
  try {
    const categories = await CategoryService.getAllCategories(false);
    const response = apiSuccess(categories, 200, { requestId });
    response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
    return response;
  } catch (error) {
    return apiError(error, requestId);
  }
}

