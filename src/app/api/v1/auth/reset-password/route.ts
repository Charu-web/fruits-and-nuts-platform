import { NextRequest } from "next/server";
import { AuthService } from "@/services/auth.service";
import { apiSuccess, apiError } from "@/lib/api-response";
import { validateRequest } from "@/lib/validation";
import { ResetPasswordSchema } from "@/lib/validation/auth.schema";
import { enforceRateLimit, clearSessionCookie } from "@/lib/auth";
import { getRequestId } from "@/lib/request-context";

export async function POST(request: NextRequest) {
  const requestId = await getRequestId();

  try {
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    await enforceRateLimit({
      key: `reset_pw_${ip}`,
      limit: 5,
      windowSeconds: 300,
    });

    const body = await request.json();
    const { token, newPassword } = await validateRequest(ResetPasswordSchema, body);

    const result = await AuthService.resetPassword(token, newPassword, ip);

    // Invalidate existing session cookie to require re-authentication with new password
    await clearSessionCookie();

    return apiSuccess(result, 200, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}
