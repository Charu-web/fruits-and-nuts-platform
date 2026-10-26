import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth/guards";
import { getRequestId } from "@/lib/request-context";
import { CategoryService } from "@/services/category.service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = await getRequestId();
  try {
    await requirePermission("products:read", req);
    const { id } = await params;
    const category = await CategoryService.getCategoryById(Number(id));
    return apiSuccess(category, 200, { requestId });
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
    await requirePermission("products:write", req);
    const { id } = await params;
    const body = await req.json();
    const updated = await CategoryService.updateCategory(Number(id), body);
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
    await requirePermission("products:write", req);
    const { id } = await params;
    await CategoryService.deleteCategory(Number(id));
    return apiSuccess({ message: "Category deleted successfully" }, 200, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}
