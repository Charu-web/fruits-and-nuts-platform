import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth/guards";
import { getRequestId } from "@/lib/request-context";
import { InventoryService } from "@/services/inventory.service";

export async function GET(req: NextRequest) {
  const requestId = await getRequestId();
  try {
    await requirePermission("inventory:read", req);
    const { searchParams } = new URL(req.url);

    const query = {
      search: searchParams.get("search") ?? undefined,
      stockStatus: (searchParams.get("stockStatus") as any) ?? "ALL",
      page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 20,
    };

    const overview = await InventoryService.getInventoryOverview(query);
    return apiSuccess(overview.items, 200, {
      page: overview.pagination.page,
      limit: overview.pagination.limit,
      total: overview.pagination.total,
      requestId,
    });
  } catch (error) {
    return apiError(error, requestId);
  }
}
