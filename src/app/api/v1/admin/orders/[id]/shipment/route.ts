import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth/guards";
import { getRequestId } from "@/lib/request-context";
import { OrderService } from "@/services/order.service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = await getRequestId();
  try {
    const user = await requirePermission("orders:write", req);
    const { id } = await params;
    const body = await req.json();
    const shipment = await OrderService.createShipment(id, body, user.id);
    return apiSuccess(shipment, 201, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = await getRequestId();
  try {
    const user = await requirePermission("orders:write", req);
    const { id } = await params;
    const body = await req.json();
    const result = await OrderService.updateShipmentTracking(id, body, user.id);
    return apiSuccess(result, 200, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return PUT(req, { params });
}
