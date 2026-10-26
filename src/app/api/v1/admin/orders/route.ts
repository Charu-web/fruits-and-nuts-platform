import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth/guards";
import { getRequestId } from "@/lib/request-context";
import { OrderService } from "@/services/order.service";

export async function GET(req: NextRequest) {
  const requestId = await getRequestId();
  try {
    await requirePermission("orders:read", req);
    const { searchParams } = new URL(req.url);

    const query = {
      orderStatus: (searchParams.get("orderStatus") as any) ?? undefined,
      paymentStatus: (searchParams.get("paymentStatus") as any) ?? undefined,
      paymentMethod: (searchParams.get("paymentMethod") as any) ?? undefined,
      search: searchParams.get("search") ?? undefined,
      page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 20,
    };

    const result = await OrderService.listAdminOrders(query);
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
