import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { getRequestId } from "@/lib/request-context";
import { SommelierService, ChatTurn } from "@/services/sommelier.service";
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

    // Validate and sanitize conversation history (up to 10 turns)
    const validHistory: ChatTurn[] = [];
    if (Array.isArray(body.history)) {
      for (const turn of body.history.slice(-10)) {
        if (
          turn &&
          typeof turn === "object" &&
          (turn.role === "user" || turn.role === "model") &&
          typeof turn.text === "string"
        ) {
          validHistory.push({
            role: turn.role,
            text: turn.text.substring(0, 500),
          });
        }
      }
    }

    const result = await SommelierService.consultAsync(message, validHistory);
    return apiSuccess(result, 200, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}

export async function GET() {
  const requestId = await getRequestId();
  // Returns initial sommelier greeting & starting prompts
  const result = await SommelierService.consultAsync("");
  return apiSuccess(result, 200, { requestId });
}
