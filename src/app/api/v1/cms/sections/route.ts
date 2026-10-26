import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { getRequestId } from "@/lib/request-context";
import { CMSService } from "@/services/cms.service";

export async function GET(req: NextRequest) {
  const requestId = await getRequestId();
  try {
    const searchParams = req.nextUrl.searchParams;
    const keysParam = searchParams.get("keys");
    const keys = keysParam ? keysParam.split(",").map((k) => k.trim()).filter(Boolean) : undefined;

    const result = await CMSService.getPublishedSections(keys);
    return apiSuccess(result, 200, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}
