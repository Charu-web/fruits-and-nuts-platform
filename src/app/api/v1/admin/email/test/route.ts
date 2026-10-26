import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireRole } from "@/lib/auth/guards";
import { RoleType } from "@prisma/client";
import { getRequestId } from "@/lib/request-context";
import { NotificationService } from "@/services/notification.service";

/**
 * GET: Retrieves sanitized SMTP configuration status (never leaks passwords).
 */
export async function GET(req: NextRequest) {
  const requestId = await getRequestId();
  try {
    await requireRole([RoleType.SUPER_ADMIN], req);

    const isConfigured = NotificationService.isSmtpConfigured();
    const readiness = NotificationService.getReadinessStatus();

    return apiSuccess(
      {
        isConfigured,
        provider: "SMTP",
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT || "587", 10),
        user: process.env.SMTP_USER || "fruitsnutswebsite@gmail.com",
        senderAddress: readiness.senderAddress,
        lastEmailStatus: readiness.lastEmailStatus,
      },
      200,
      { requestId }
    );
  } catch (error) {
    return apiError(error, requestId);
  }
}

/**
 * POST: Dispatches a real SMTP test email to the configured administrator address.
 */
export async function POST(req: NextRequest) {
  const requestId = await getRequestId();
  try {
    await requireRole([RoleType.SUPER_ADMIN], req);

    let targetEmail: string | undefined;
    try {
      const body = await req.json();
      targetEmail = body.targetEmail;
    } catch {}

    const result = await NotificationService.sendTestEmail(targetEmail);

    return apiSuccess(
      {
        success: result.success,
        configured: result.configured,
        message: result.message,
        recipient: result.recipient,
        timestamp: result.timestamp,
        error: result.error,
      },
      result.success ? 200 : 200, // Return 200 with result.success so UI displays sanitized diagnostic message
      { requestId }
    );
  } catch (error) {
    return apiError(error, requestId);
  }
}
