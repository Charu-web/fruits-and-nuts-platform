import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/guards";
import { getRequestId } from "@/lib/request-context";
import { AddressService } from "@/services/address.service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = await getRequestId();
  try {
    const user = await requireAuth(req);
    const { id } = await params;
    const address = await AddressService.getAddressById(user.id, id);
    return apiSuccess(address, 200, { requestId });
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
    const user = await requireAuth(req);
    const { id } = await params;
    const body = await req.json();
    const updated = await AddressService.updateAddress(user.id, id, body);
    return apiSuccess(updated, 200, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = await getRequestId();
  try {
    const user = await requireAuth(req);
    const { id } = await params;
    const result = await AddressService.deleteAddress(user.id, id);
    return apiSuccess(result, 200, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}
