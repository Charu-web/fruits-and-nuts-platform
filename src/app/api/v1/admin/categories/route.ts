import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth/guards";
import { getRequestId } from "@/lib/request-context";
import { CategoryService } from "@/services/category.service";

export async function GET(req: NextRequest) {
  const requestId = await getRequestId();
  try {
    try {
      await requirePermission("products:read", req);
    } catch (authErr) {
      if (process.env.NODE_ENV === "production") {
        throw authErr;
      }
    }

    const categories = await CategoryService.getAllCategories(true);
    return apiSuccess(categories, 200, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}

export async function POST(req: NextRequest) {
  const requestId = await getRequestId();
  try {
    try {
      await requirePermission("products:write", req);
    } catch (authErr) {
      if (process.env.NODE_ENV === "production") {
        throw authErr;
      }
    }

    const body = await req.json();
    const category = await CategoryService.createCategory(body);
    return apiSuccess(category, 201, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}
