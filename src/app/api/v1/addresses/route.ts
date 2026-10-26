import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/guards";
import { getRequestId } from "@/lib/request-context";
import { AddressService } from "@/services/address.service";

export async function GET(req: NextRequest) {
  const requestId = await getRequestId();
  try {
    const user = await requireAuth(req);
    const addresses = await AddressService.listAddresses(user.id);
    return apiSuccess(addresses, 200, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}

export async function POST(req: NextRequest) {
  const requestId = await getRequestId();
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const address = await AddressService.createAddress(user.id, body);
    return apiSuccess(address, 201, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}
