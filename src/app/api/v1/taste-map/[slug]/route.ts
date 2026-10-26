import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { getRequestId } from "@/lib/request-context";
import { TasteMapService } from "@/services/taste-map.service";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const requestId = await getRequestId();
  try {
    const { slug } = await params;
    const region = await TasteMapService.getRegionBySlug(slug, true);
    return apiSuccess(region, 200, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}
