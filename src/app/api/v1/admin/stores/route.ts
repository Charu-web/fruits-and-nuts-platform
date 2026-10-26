import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth/guards";
import { getRequestId } from "@/lib/request-context";
import { StoreService } from "@/services/store.service";
import { StoreStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const requestId = await getRequestId();
  try {
    await requirePermission("stores:write", req);
    const searchParams = req.nextUrl.searchParams;

    const query = {
      city: searchParams.get("city") || undefined,
      state: searchParams.get("state") || undefined,
      pincode: searchParams.get("pincode") || undefined,
      status: (searchParams.get("status") as StoreStatus) || undefined,
      page: searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : 1,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 50,
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

export async function POST(req: NextRequest) {
  const requestId = await getRequestId();
  try {
    const user = await requirePermission("stores:write", req);
    const body = await req.json();
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined;

    const created = await StoreService.createStore(body, user.id, ip);
    return apiSuccess(created, 201, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}
