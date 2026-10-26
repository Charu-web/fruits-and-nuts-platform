import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/guards";
import { getRequestId } from "@/lib/request-context";
import { OrderService } from "@/services/order.service";

export async function GET(req: NextRequest) {
  const requestId = await getRequestId();
  try {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);

    const query = {
      page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 10,
    };

    const result = await OrderService.listCustomerOrders(user.id, query);
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
