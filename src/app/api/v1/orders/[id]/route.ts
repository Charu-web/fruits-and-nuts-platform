import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/guards";
import { getRequestId } from "@/lib/request-context";
import { OrderService } from "@/services/order.service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = await getRequestId();
  try {
    const user = await requireAuth(req);
    const { id } = await params;
    const order = await OrderService.getCustomerOrderById(user.id, id);
    return apiSuccess(order, 200, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}
