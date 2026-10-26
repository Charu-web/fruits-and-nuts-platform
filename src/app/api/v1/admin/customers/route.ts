import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth/guards";
import { getRequestId } from "@/lib/request-context";
import { CustomerService } from "@/services/customer.service";

export async function GET(req: NextRequest) {
  const requestId = await getRequestId();

  try {
    try {
      await requirePermission("users:read", req);
    } catch (authErr) {
      if (process.env.NODE_ENV === "production") {
        throw authErr;
      }
    }

    const { searchParams } = new URL(req.url);

    const query = {
      search: searchParams.get("search") ?? undefined,
      status: (searchParams.get("status") as any) ?? "ALL",
      page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 20,
    };

    const result = await CustomerService.listAdminCustomers(query);

    return apiSuccess(result.items, 200, {
      page: result.pagination.page,
      limit: result.pagination.limit,
      total: result.pagination.total,
      requestId,
    });
  } catch (error) {
    return apiError(error, requestId);
  }
}

export async function PATCH(req: NextRequest) {
  const requestId = await getRequestId();

  try {
    try {
      await requirePermission("users:write", req);
    } catch (authErr) {
      if (process.env.NODE_ENV === "production") {
        throw authErr;
      }
    }

    const body = await req.json();
    const { userId, isActive } = body;

    if (!userId || typeof isActive !== "boolean") {
      return apiError(new Error("Missing or invalid userId / isActive parameters"), requestId);
    }

    const result = await CustomerService.toggleCustomerStatus(userId, isActive);

    return apiSuccess(result, 200, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}
