import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { getRequestId } from "@/lib/request-context";
import { OrderService } from "@/services/order.service";
import { AppError, ErrorCode } from "@/lib/errors";

export async function POST(req: NextRequest) {
  const requestId = await getRequestId();

  try {
    const cronSecret = process.env.CRON_SECRET;

    if (process.env.NODE_ENV === "production" && !cronSecret) {
      throw new AppError("CRON_SECRET must be configured in production environment", ErrorCode.INTERNAL_ERROR);
    }

    if (cronSecret) {
      const authHeader = req.headers.get("authorization");
      const xCronSecret = req.headers.get("x-cron-secret");

      const providedToken =
        xCronSecret || (authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null);

      if (providedToken !== cronSecret) {
        throw AppError.unauthorized("Unauthorized cron invocation: Invalid or missing CRON_SECRET");
      }
    }

    const result = await OrderService.releaseExpiredPendingOrders();

    return apiSuccess(
      {
        message: "Expired pending orders cleanup completed successfully",
        releasedCount: result.releasedCount,
        timestamp: new Date().toISOString(),
      },
      200,
      { requestId }
    );
  } catch (error) {
    return apiError(error, requestId);
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
