import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { clearSessionCookie, logAuthEvent, getSessionUserFromRequest } from "@/lib/auth";
import { getRequestId } from "@/lib/request-context";

export async function POST(request: NextRequest) {
  const requestId = await getRequestId();

  try {
    const user = await getSessionUserFromRequest(request);

    if (user) {
      await logAuthEvent("LOGOUT", {
        actorId: user.id,
        targetId: user.id,
        ipAddress: request.headers.get("x-forwarded-for") || undefined,
      });
    }

    await clearSessionCookie();

    return apiSuccess({ message: "Successfully logged out." }, 200, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}
