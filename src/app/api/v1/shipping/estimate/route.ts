import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { getRequestId } from "@/lib/request-context";
import { ShippingService } from "@/services/shipping.service";
import { EstimateShippingSchema } from "@/lib/validation/order.schema";

export async function GET(req: NextRequest) {
  const requestId = await getRequestId();
  try {
    const searchParams = req.nextUrl.searchParams;
    const postalCode = searchParams.get("postalCode") || "";
    const subtotal = Number(searchParams.get("subtotal") || "0");
    const validated = EstimateShippingSchema.parse({ postalCode, subtotal });
    const estimate = ShippingService.estimateShipping(validated);
    return apiSuccess(estimate, 200, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}

export async function POST(req: NextRequest) {
  const requestId = await getRequestId();
  try {
    const body = await req.json();
    const validated = EstimateShippingSchema.parse(body);
    const estimate = ShippingService.estimateShipping(validated);
    return apiSuccess(estimate, 200, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}
