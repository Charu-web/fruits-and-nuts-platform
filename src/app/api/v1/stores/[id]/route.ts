import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { getRequestId } from "@/lib/request-context";
import { StoreService } from "@/services/store.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const requestId = await getRequestId();
  try {
    const { id } = await params;
    const store = await StoreService.getStoreById(parseInt(id, 10));
    return apiSuccess(store, 200, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}
