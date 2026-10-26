import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth/guards";
import { getRequestId } from "@/lib/request-context";
import { CouponService } from "@/services/coupon.service";

export async function GET(req: NextRequest) {
  const requestId = await getRequestId();
  try {
    await requirePermission("coupons:read", req);
    const { searchParams } = new URL(req.url);

    const query = {
      search: searchParams.get("search") ?? undefined,
      status: (searchParams.get("status") as any) ?? "ALL",
      page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 20,
    };

    const result = await CouponService.listAdminCoupons(query);
    return apiSuccess(result.items, 200, {
      page: result.pagination.page,
      limit: result.pagination.limit,
      total: result.pagination.total,
      requestId,
    });
  } catch (error) {
    return apiError(error, requestId);
  }
}

export async function POST(req: NextRequest) {
  const requestId = await getRequestId();
  try {
    const user = await requirePermission("coupons:write", req);
    const body = await req.json();
    const coupon = await CouponService.createCoupon(body, user.id);
    return apiSuccess(coupon, 201, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}
