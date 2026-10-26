import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth/guards";
import { getRequestId } from "@/lib/request-context";
import { CategoryService } from "@/services/category.service";

export async function POST(req: NextRequest) {
  const requestId = await getRequestId();
  try {
    await requirePermission("products:write", req);
    const body = await req.json();
    const subcategory = await CategoryService.createSubcategory(body);
    return apiSuccess(subcategory, 201, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}
