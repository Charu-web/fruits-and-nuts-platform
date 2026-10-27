import { NextRequest } from "next/server";
import { AuthService } from "@/services/auth.service";
import { apiSuccess, apiError } from "@/lib/api-response";
import { validateRequest } from "@/lib/validation";
import { LoginSchema } from "@/lib/validation/auth.schema";
import { enforceRateLimit, setSessionCookie } from "@/lib/auth";
import { getRequestId } from "@/lib/request-context";

export async function POST(request: NextRequest) {
  const requestId = await getRequestId();

  try {
    // 1. Enforce rate limiting on login endpoint (Max 10 attempts / 5 mins per IP)
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
    await enforceRateLimit({
      key: `login_${ip}`,
      limit: 10,
      windowSeconds: 300,
    });

    // 2. Validate request
    const body = await request.json();
    const validatedData = await validateRequest(LoginSchema, body);

    // 3. Authenticate
    const result = await AuthService.login({
      ...validatedData,
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") || undefined,
    });

    // 4. Set secure session cookie
    await setSessionCookie(result.token);

    return apiSuccess(result, 200, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}
