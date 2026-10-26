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
      variantId: searchParams.get("variantId") ?? undefined,
      transactionType: (searchParams.get("transactionType") as any) ?? undefined,
      page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 20,
    };

    const result = await InventoryService.getInventoryTransactions(query);
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
