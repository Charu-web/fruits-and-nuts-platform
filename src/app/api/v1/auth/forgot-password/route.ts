import { NextRequest } from "next/server";
import { AuthService } from "@/services/auth.service";
import { apiSuccess, apiError } from "@/lib/api-response";
import { validateRequest } from "@/lib/validation";
import { ForgotPasswordSchema } from "@/lib/validation/auth.schema";
import { enforceRateLimit } from "@/lib/auth";
import { getRequestId } from "@/lib/request-context";

export async function POST(request: NextRequest) {
  const requestId = await getRequestId();

  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
    await enforceRateLimit({
      key: `forgot_pw_${ip}`,
      limit: 5,
      windowSeconds: 300,
    });

    const body = await request.json();
    const validated = await validateRequest(ForgotPasswordSchema, body);
    const identifier = validated.email || validated.phone || validated.identifier || "";

    const result = await AuthService.forgotPassword(identifier, ip);

    return apiSuccess(result, 200, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}
