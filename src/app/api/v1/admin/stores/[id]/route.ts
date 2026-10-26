import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth/guards";
import { getRequestId } from "@/lib/request-context";
import { StoreService } from "@/services/store.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const requestId = await getRequestId();
  try {
    await requirePermission("stores:write", req);
    const { id } = await params;
    const store = await StoreService.getStoreById(parseInt(id, 10));
    return apiSuccess(store, 200, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const requestId = await getRequestId();
  try {
    const user = await requirePermission("stores:write", req);
    const { id } = await params;
    const body = await req.json();
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined;

    const updated = await StoreService.updateStore(parseInt(id, 10), body, user.id, ip);
    return apiSuccess(updated, 200, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const requestId = await getRequestId();
  try {
    const user = await requirePermission("stores:write", req);
    const { id } = await params;
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined;

    const result = await StoreService.deleteStore(parseInt(id, 10), user.id, ip);
    return apiSuccess(result, 200, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}
