import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth/guards";
import { getRequestId } from "@/lib/request-context";
import { CouponService } from "@/services/coupon.service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = await getRequestId();
  try {
    await requirePermission("coupons:read", req);
    const { id } = await params;
    const coupon = await CouponService.getCouponById(id);
    return apiSuccess(coupon, 200, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = await getRequestId();
  try {
    const user = await requirePermission("coupons:write", req);
    const { id } = await params;
    const body = await req.json();
    const updated = await CouponService.updateCoupon(id, body, user.id);
    return apiSuccess(updated, 200, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = await getRequestId();
  try {
    const user = await requirePermission("coupons:write", req);
    const { id } = await params;
    const result = await CouponService.deleteCoupon(id, user.id);
    return apiSuccess(result, 200, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}
