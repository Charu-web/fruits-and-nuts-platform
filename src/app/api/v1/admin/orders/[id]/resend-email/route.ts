import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth/guards";
import { getRequestId } from "@/lib/request-context";
import { OrderService } from "@/services/order.service";
import { NotificationService } from "@/services/notification.service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = await getRequestId();
  try {
    await requirePermission("orders:write", req);
    const { id } = await params;
    const order = await OrderService.getAdminOrderById(id);
    const result = await NotificationService.sendOrderConfirmationEmail(order, { forceRetry: true });
    return apiSuccess(result, 200, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}
