import { NextRequest } from "next/server";
import { AuthService } from "@/services/auth.service";
import { AdminLoginSchema } from "@/lib/validation/auth.schema";
import { apiSuccess, apiError } from "@/lib/api-response";
import { validateRequest } from "@/lib/validation";
import { enforceRateLimit, setSessionCookie } from "@/lib/auth";
import { getRequestId } from "@/lib/request-context";

export async function POST(request: NextRequest) {
  const requestId = await getRequestId();

  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || undefined;

    // Rate Limiting: Max 5 attempts per 15 minutes per IP on admin login
    await enforceRateLimit({
      key: `admin_login_${ip}`,
      limit: 5,
      windowSeconds: 900,
    });

    const body = await request.json();
    const validated = await validateRequest(AdminLoginSchema, body);

    const result = await AuthService.adminLogin({
      email: validated.email,
      phone: validated.phone,
      password: validated.password,
      totpCode: validated.totpCode,
      ipAddress: ip,
      userAgent,
    });

    if (result.requires2FA) {
      return apiSuccess(
        {
          requires2FA: true,
          userId: result.userId,
          email: result.email,
          message: "2FA authentication code required to complete login.",
        },
        200,
        { requestId }
      );
    }

    // Set secure HttpOnly session cookie
    await setSessionCookie(result.token);

    return apiSuccess(
      {
        requires2FA: false,
        user: result.user,
        message: "Administrative authentication successful.",
      },
      200,
      { requestId }
    );
  } catch (error) {
    return apiError(error, requestId);
  }
}
