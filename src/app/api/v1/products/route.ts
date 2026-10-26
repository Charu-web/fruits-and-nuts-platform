import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { getRequestId } from "@/lib/request-context";
import { ProductService } from "@/services/product.service";

export async function GET(req: NextRequest) {
  const requestId = await getRequestId();
  try {
    const { searchParams } = new URL(req.url);

    const query = {
      category: searchParams.get("category") ?? undefined,
      subcategory: searchParams.get("subcategory") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      minPrice: searchParams.get("minPrice") ?? undefined,
      maxPrice: searchParams.get("maxPrice") ?? undefined,
      isFeatured: searchParams.get("isFeatured") ?? undefined,
      isByobEligible: searchParams.get("isByobEligible") ?? undefined,
      inStockOnly: searchParams.get("inStockOnly") ?? undefined,
      sort: searchParams.get("sort") ?? "featured",
      page: searchParams.get("page") ?? 1,
      limit: searchParams.get("limit") ?? 20,
    };

    const result = await ProductService.listPublicProducts(query as any);
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
