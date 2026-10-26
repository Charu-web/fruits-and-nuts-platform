import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth/guards";
import { getRequestId } from "@/lib/request-context";
import { ProductService } from "@/services/product.service";

export async function GET(req: NextRequest) {
  const requestId = await getRequestId();
  try {
    await requirePermission("products:read", req);
    const { searchParams } = new URL(req.url);

    const query = {
      categoryId: searchParams.get("categoryId") ? Number(searchParams.get("categoryId")) : undefined,
      subcategoryId: searchParams.get("subcategoryId") ? Number(searchParams.get("subcategoryId")) : undefined,
      search: searchParams.get("search") ?? undefined,
      isActive: searchParams.get("isActive") !== null ? searchParams.get("isActive") === "true" : undefined,
      healthContentStatus: (searchParams.get("healthContentStatus") as any) ?? undefined,
      stockStatus: (searchParams.get("stockStatus") as any) ?? "ALL",
      page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 20,
    };

    const result = await ProductService.listAdminProducts(query);
    return apiSuccess(result.items, 200, {
      page: result.pagination.page,
      limit: result.pagination.limit,
      total: result.pagination.total,
      requestId,
    });
  } catch (error) {
    return apiError(error, requestId);
  }
}

export async function POST(req: NextRequest) {
  const requestId = await getRequestId();
  try {
    const user = await requirePermission("products:write", req);
    const body = await req.json();
    const product = await ProductService.createProduct(body, user.id);
    return apiSuccess(product, 201, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}
