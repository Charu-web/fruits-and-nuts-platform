import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth/guards";
import { getRequestId } from "@/lib/request-context";
import { CMSService } from "@/services/cms.service";

interface RouteParams {
  params: Promise<{ sectionKey: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const requestId = await getRequestId();
  try {
    await requirePermission("cms:read", req);
    const { sectionKey } = await params;
    const section = await CMSService.getSectionByKey(sectionKey);
    return apiSuccess(section, 200, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const requestId = await getRequestId();
  try {
    const user = await requirePermission("cms:write", req);
    const { sectionKey } = await params;
    const body = await req.json();
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined;

    const upserted = await CMSService.upsertSection(sectionKey, body, user.id, ip);
    return apiSuccess(upserted, 200, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const requestId = await getRequestId();
  try {
    const user = await requirePermission("cms:write", req);
    const { sectionKey } = await params;
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined;

    const result = await CMSService.deleteSection(sectionKey, user.id, ip);
    return apiSuccess(result, 200, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}
