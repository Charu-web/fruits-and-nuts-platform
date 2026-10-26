import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { getRequestId } from "@/lib/request-context";
import { StoreService } from "@/services/store.service";
import { StoreStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const requestId = await getRequestId();
  try {
    const searchParams = req.nextUrl.searchParams;

    const query = {
      city: searchParams.get("city") || undefined,
      state: searchParams.get("state") || undefined,
      pincode: searchParams.get("pincode") || undefined,
      lat: searchParams.get("lat") ? parseFloat(searchParams.get("lat")!) : undefined,
      lng: searchParams.get("lng") ? parseFloat(searchParams.get("lng")!) : undefined,
      radiusKm: searchParams.get("radiusKm") ? parseFloat(searchParams.get("radiusKm")!) : 50,
      status: (searchParams.get("status") as StoreStatus) || undefined,
      page: searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : 1,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 20,
    };

    const result = await StoreService.getStores(query);
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
