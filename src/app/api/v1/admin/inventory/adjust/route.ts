import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth/guards";
import { getRequestId } from "@/lib/request-context";
import { InventoryService } from "@/services/inventory.service";

export async function POST(req: NextRequest) {
  const requestId = await getRequestId();
  try {
    const user = await requirePermission("inventory:write", req);
    const body = await req.json();
    const result = await InventoryService.adjustStock(body, user.id);
    return apiSuccess(result, 200, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}
