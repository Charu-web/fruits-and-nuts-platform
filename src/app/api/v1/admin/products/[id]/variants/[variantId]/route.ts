import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth/guards";
import { getRequestId } from "@/lib/request-context";
import { ProductService } from "@/services/product.service";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  const requestId = await getRequestId();
  try {
    await requirePermission("products:write", req);
    const { variantId } = await params;
    const body = await req.json();
    const updated = await ProductService.updateVariant(variantId, body);
    return apiSuccess(updated, 200, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  const requestId = await getRequestId();
  try {
    await requirePermission("products:write", req);
    const { variantId } = await params;
    await ProductService.deleteVariant(variantId);
    return apiSuccess({ message: "Variant removed or deactivated successfully" }, 200, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}
