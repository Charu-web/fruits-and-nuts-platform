import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/guards";
import { getRequestId } from "@/lib/request-context";
import { PaymentService } from "@/services/payment.service";

export async function POST(req: NextRequest) {
  const requestId = await getRequestId();
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const result = await PaymentService.verifyPayment(user.id, body);
    return apiSuccess(result, 200, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}
