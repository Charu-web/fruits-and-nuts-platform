import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/guards";
import { getRequestId } from "@/lib/request-context";
import { PaymentService } from "@/services/payment.service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const requestId = await getRequestId();
  try {
    const user = await requireAuth(req);
    const { orderId } = await params;
    const payments = await PaymentService.getOrderPayments(user.id, orderId);
    return apiSuccess(payments, 200, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}
