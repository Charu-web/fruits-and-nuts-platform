import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth/guards";
import { getRequestId } from "@/lib/request-context";
import { CMSService } from "@/services/cms.service";

export async function GET(req: NextRequest) {
  const requestId = await getRequestId();
  try {
    await requirePermission("cms:read", req);
    const sections = await CMSService.getAllSections();
    return apiSuccess(sections, 200, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}

export async function POST(req: NextRequest) {
  const requestId = await getRequestId();
  try {
    const user = await requirePermission("cms:write", req);
    const body = await req.json();
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined;

    const created = await CMSService.createSection(body, user.id, ip);
    return apiSuccess(created, 201, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}
