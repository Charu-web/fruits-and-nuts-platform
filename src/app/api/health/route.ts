import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/api-response";
import { getRequestId } from "@/lib/request-context";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * Health & Readiness Check Endpoint
 * GET /api/health
 */
export async function GET(request: NextRequest) {
  const requestId = await getRequestId();
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const checkType = searchParams.get("type") || "liveness"; // 'liveness' or 'readiness'

    if (checkType === "liveness") {
      return apiSuccess(
        {
          status: "healthy",
          check: "liveness",
          uptimeSeconds: process.uptime(),
          timestamp: new Date().toISOString(),
        },
        200,
        { requestId }
      );
    }

    // Readiness check: Verify database connectivity with low-overhead query
    let databaseStatus = "disconnected";
    try {
      await db.$queryRaw`SELECT 1;`;
      databaseStatus = "connected";
    } catch (dbErr) {
      logger.warn("Health check readiness database probe failed", { requestId }, dbErr);
      databaseStatus = "unreachable";
    }

    const durationMs = Date.now() - startTime;

    return apiSuccess(
      {
        status: databaseStatus === "connected" ? "healthy" : "degraded",
        check: "readiness",
        database: databaseStatus,
        durationMs,
        timestamp: new Date().toISOString(),
      },
      databaseStatus === "connected" ? 200 : 503,
      { requestId }
    );
  } catch (error) {
    logger.error("Health check endpoint encountered an error", error, { requestId });
    return apiError(error, requestId);
  }
}
