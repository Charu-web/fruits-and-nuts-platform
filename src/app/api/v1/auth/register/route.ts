import { NextRequest } from "next/server";
import { AuthService } from "@/services/auth.service";
import { apiSuccess, apiError } from "@/lib/api-response";
import { validateRequest } from "@/lib/validation";
import { RegisterSchema } from "@/lib/validation/auth.schema";
import { enforceRateLimit, setSessionCookie } from "@/lib/auth";
import { getRequestId } from "@/lib/request-context";

export async function POST(request: NextRequest) {
  const requestId = await getRequestId();

  try {
    // 1. Enforce rate limiting on registration endpoint (Max 5 requests / minute per IP)
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
    await enforceRateLimit({
      key: `register_${ip}`,
      limit: 5,
      windowSeconds: 60,
    });

    // 2. Parse & Validate body
    const body = await request.json();
    const validatedData = await validateRequest(RegisterSchema, body);

    // 3. Execute registration
    const result = await AuthService.register({
      ...validatedData,
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") || undefined,
    });

    // 4. Set secure session cookie
    await setSessionCookie(result.token);

    return apiSuccess(result, 201, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}
