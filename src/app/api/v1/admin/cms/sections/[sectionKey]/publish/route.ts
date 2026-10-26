import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth/guards";
import { getRequestId } from "@/lib/request-context";
import { CMSService } from "@/services/cms.service";

interface RouteParams {
  params: Promise<{ sectionKey: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const requestId = await getRequestId();
  try {
    const user = await requirePermission("cms:write", req);
    const { sectionKey } = await params;
    const body = await req.json();
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined;

    const updated = await CMSService.updatePublishStatus(sectionKey, body, user.id, ip);
    return apiSuccess(updated, 200, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}
