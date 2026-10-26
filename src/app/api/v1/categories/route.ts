import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { getRequestId } from "@/lib/request-context";
import { CategoryService } from "@/services/category.service";

export async function GET(req: NextRequest) {
  const requestId = await getRequestId();
  try {
    const categories = await CategoryService.getAllCategories(false);
    return apiSuccess(categories, 200, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}
