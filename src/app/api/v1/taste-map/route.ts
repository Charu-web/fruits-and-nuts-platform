import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { getRequestId } from "@/lib/request-context";
import { TasteMapService } from "@/services/taste-map.service";

export async function GET(_req: NextRequest) {
  const requestId = await getRequestId();
  try {
    const regions = await TasteMapService.getPublicRegions();
    return apiSuccess(regions, 200, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}
