import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth/guards";
import { getRequestId } from "@/lib/request-context";
import { TasteMapService } from "@/services/taste-map.service";

export async function GET(req: NextRequest) {
  const requestId = await getRequestId();
  try {
    await requirePermission("taste_map:write", req);
    const regions = await TasteMapService.getAdminRegions();
    return apiSuccess(regions, 200, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}

export async function POST(req: NextRequest) {
  const requestId = await getRequestId();
  try {
    const user = await requirePermission("taste_map:write", req);
    const body = await req.json();
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined;

    const created = await TasteMapService.createRegion(body, user.id, ip);
    return apiSuccess(created, 201, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}
