import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth/guards";
import { getRequestId } from "@/lib/request-context";
import { ProductService } from "@/services/product.service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = await getRequestId();
  try {
    await requirePermission("products:write", req);
    const { id } = await params;
    const body = await req.json();
    const image = await ProductService.addImage(id, body);
    return apiSuccess(image, 201, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}
