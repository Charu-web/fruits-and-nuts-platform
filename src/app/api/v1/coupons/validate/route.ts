import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { getSessionUserFromRequest } from "@/lib/auth";
import { getRequestId } from "@/lib/request-context";
import { CouponService } from "@/services/coupon.service";
import { ValidateCouponSchema } from "@/lib/validation/coupon.schema";

export async function POST(req: NextRequest) {
  const requestId = await getRequestId();
  try {
    const user = await getSessionUserFromRequest(req);
    const body = await req.json();
    const validated = ValidateCouponSchema.parse(body);

    const result = await CouponService.validateAndCalculateDiscount(
      validated.code,
      validated.subtotal,
      user?.id
    );

    return apiSuccess(result, 200, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}
