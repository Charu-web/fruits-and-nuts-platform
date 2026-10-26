import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth/guards";
import { getRequestId } from "@/lib/request-context";
import { InventoryService } from "@/services/inventory.service";
import { InventoryInsightsService } from "@/services/inventory-insights.service";

export async function GET(req: NextRequest) {
  const requestId = await getRequestId();
  try {
    // Strictly restrict insights to authorized admin users with inventory:read permission
    await requirePermission("inventory:read", req);

    const overview = await InventoryService.getInventoryOverview({
      limit: 100,
      page: 1,
      stockStatus: "ALL",
    });

    const insights = InventoryInsightsService.calculateRunoutEstimates(
      overview.items.map((item) => ({
        variantId: item.variantId,
        sku: item.sku,
        productName: item.productName,
        categoryName: item.categoryName,
        stockAvailable: item.stockAvailable,
        safetyBuffer: item.safetyBufferThreshold,
        // In live system, unitsSold30d is computed from orders/transactions
        unitsSold30d: item.stockReserved > 0 ? item.stockReserved * 2 : 0,
      }))
    );

    return apiSuccess(insights, 200, {
      requestId,
      total: insights.length,
    });
  } catch (error) {
    return apiError(error, requestId);
  }
}
