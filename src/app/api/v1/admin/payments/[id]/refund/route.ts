import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth/guards";
import { getRequestId } from "@/lib/request-context";
import { RefundService } from "@/services/refund.service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = await getRequestId();
  try {
    const user = await requirePermission("orders:write", req);
    const { id } = await params;
    const body = await req.json();
    const refund = await RefundService.createRefund(user.id, {
      paymentId: id,
      amount: body.amount,
      reason: body.reason,
    });
    return apiSuccess(refund, 201, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}
