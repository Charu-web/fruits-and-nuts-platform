import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/guards";
import { getRequestId } from "@/lib/request-context";
import { OrderService } from "@/services/order.service";
import { CheckoutPreviewSchema } from "@/lib/validation/order.schema";

export async function POST(req: NextRequest) {
  const requestId = await getRequestId();
  try {
    const user = await requireAuth(req);
    const body = await req.json().catch(() => ({}));
    const validated = CheckoutPreviewSchema.parse(body);
    const preview = await OrderService.previewCheckout(user.id, validated);
    return apiSuccess(preview, 200, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}
