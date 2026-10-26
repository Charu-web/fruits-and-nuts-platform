import { NextRequest, NextResponse } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { getRequestId } from "@/lib/request-context";
import { PaymentService } from "@/services/payment.service";

export async function POST(req: NextRequest) {
  const requestId = await getRequestId();
  try {
    const rawBody = await req.text();
    const signatureHeader =
      req.headers.get("x-razorpay-signature") ||
      req.headers.get("X-Razorpay-Signature");

    const result = await PaymentService.processWebhook(rawBody, signatureHeader);
    return apiSuccess(result, 200, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}
