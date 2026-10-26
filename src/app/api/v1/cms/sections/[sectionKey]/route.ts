import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { getRequestId } from "@/lib/request-context";
import { CMSService } from "@/services/cms.service";

interface RouteParams {
  params: Promise<{ sectionKey: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const requestId = await getRequestId();
  try {
    const { sectionKey } = await params;
    const section = await CMSService.getPublishedSectionByKey(sectionKey);
    return apiSuccess(section, 200, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}
