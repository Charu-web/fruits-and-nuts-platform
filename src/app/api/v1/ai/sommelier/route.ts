import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { getRequestId } from "@/lib/request-context";
import { SommelierService } from "@/services/sommelier.service";
import { enforceRateLimit } from "@/lib/auth";
import { AppError } from "@/lib/errors/app-error";

export async function POST(req: NextRequest) {
  const requestId = await getRequestId();
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
    await enforceRateLimit({
      key: `sommelier_${ip}`,
      limit: 30,
      windowSeconds: 60,
    });

    const body = await req.json().catch(() => ({}));
    const message = typeof body.message === "string" ? body.message : "";

    if (message.length > 1000) {
      throw AppError.validation("Message exceeds maximum allowable length of 1000 characters.");
    }

    const result = SommelierService.consult(message);
    return apiSuccess(result, 200, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}

export async function GET() {
  const requestId = await getRequestId();
  // Returns initial sommelier greeting & starting prompts
  const result = SommelierService.consult("");
  return apiSuccess(result, 200, { requestId });
}
