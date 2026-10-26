import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth/guards";
import { getRequestId } from "@/lib/request-context";
import { OrderService } from "@/services/order.service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = await getRequestId();
  try {
    await requirePermission("orders:read", req);
    const { id } = await params;
    const order = await OrderService.getAdminOrderById(id);
    return apiSuccess(order, 200, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}
