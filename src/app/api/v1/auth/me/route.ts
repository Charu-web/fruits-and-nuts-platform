import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { AuthService } from "@/services/auth.service";
import { getRequestId } from "@/lib/request-context";

export async function GET(request: NextRequest) {
  const requestId = await getRequestId();

  try {
    const sessionUser = await requireAuth(request);
    const userProfile = await AuthService.getCurrentUser(sessionUser.id);

    return apiSuccess({ user: userProfile }, 200, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}

export async function PUT(request: NextRequest) {
  const requestId = await getRequestId();

  try {
    const sessionUser = await requireAuth(request);
    const body = await request.json();
    const updatedProfile = await AuthService.updateProfile(sessionUser.id, body);

    return apiSuccess({ user: updatedProfile }, 200, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}

