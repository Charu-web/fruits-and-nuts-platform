import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth/guards";
import { getRequestId } from "@/lib/request-context";
import { OrderService } from "@/services/order.service";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = await getRequestId();
  try {
    const user = await requirePermission("orders:write", req);
    const { id } = await params;
    const body = await req.json();
    const order = await OrderService.updateAdminOrderStatus(id, body, user.id);
    return apiSuccess(order, 200, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}
