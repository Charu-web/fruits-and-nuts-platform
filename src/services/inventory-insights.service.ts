export interface InventoryRunoutInsight {
  variantId: string;
  sku: string;
  productName: string;
  categoryName: string;
  stockAvailable: number;
  safetyBuffer: number;
  unitsSold30d: number;
  dailyVelocity: number;
  daysToRunout: number | null; // null if insufficient sales data
  runoutRisk: "CRITICAL" | "ATTENTION" | "HEALTHY" | "INSUFFICIENT_DATA";
  suggestedRestockQty: number;
  confidence: "HIGH" | "MEDIUM" | "ESTIMATE_ONLY" | "INSUFFICIENT_DATA";
}

export class InventoryInsightsService {
  /**
   * Calculates run-out velocity projections based on actual stock levels and historical sales.
   * Read-only analytical computation; never modifies inventory or creates orders.
   * Explicitly flags insufficient data when velocity is zero or unrecorded.
   */
  static calculateRunoutEstimates(
    items: Array<{
      variantId: string;
      sku: string;
      productName: string;
      categoryName?: string;
      stockAvailable: number;
      safetyBuffer?: number;
      unitsSold30d?: number;
    }>
  ): InventoryRunoutInsight[] {
    return items.map((item) => {
      const stock = Math.max(0, item.stockAvailable || 0);
      const buffer = item.safetyBuffer ?? 10;
      const sold = Math.max(0, item.unitsSold30d || 0);

      // If no sales history available in the period
      if (sold === 0) {
        return {
          variantId: item.variantId,
          sku: item.sku,
          productName: item.productName,
          categoryName: item.categoryName || "General",
          stockAvailable: stock,
          safetyBuffer: buffer,
          unitsSold30d: 0,
          dailyVelocity: 0,
          daysToRunout: null,
          runoutRisk: "INSUFFICIENT_DATA",
          suggestedRestockQty: stock <= buffer ? buffer * 2 : 0,
          confidence: "INSUFFICIENT_DATA",
        };
      }

      // Calculate daily velocity (over 30-day window)
      const dailyVelocity = parseFloat((sold / 30).toFixed(2));
      const daysToRunout = Math.floor(stock / (dailyVelocity || 0.01));

      // Determine run-out risk classification
      let runoutRisk: "CRITICAL" | "ATTENTION" | "HEALTHY" = "HEALTHY";
      if (daysToRunout <= 7 || stock <= buffer) {
        runoutRisk = "CRITICAL";
      } else if (daysToRunout <= 21) {
        runoutRisk = "ATTENTION";
      }

      // Suggest restock quantity to maintain a 45-day operational runway
      const target45DayNeed = Math.ceil(dailyVelocity * 45) + buffer;
      const suggestedRestockQty = Math.max(0, target45DayNeed - stock);

      const confidence = sold >= 15 ? "HIGH" : sold >= 5 ? "MEDIUM" : "ESTIMATE_ONLY";

      return {
        variantId: item.variantId,
        sku: item.sku,
        productName: item.productName,
        categoryName: item.categoryName || "General",
        stockAvailable: stock,
        safetyBuffer: buffer,
        unitsSold30d: sold,
        dailyVelocity,
        daysToRunout,
        runoutRisk,
        suggestedRestockQty,
        confidence,
      };
    });
  }
}
