import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { getRequestId } from "@/lib/request-context";
import { RecommendationService } from "@/services/recommendation.service";
import { NeedTag } from "@/lib/catalog/storefront-catalog";

export async function GET(req: NextRequest) {
  const requestId = await getRequestId();
  try {
    const searchParams = req.nextUrl.searchParams;
    const slug = searchParams.get("slug");
    const type = searchParams.get("type") || "all";
    const tag = searchParams.get("tag") as NeedTag | null;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 4;

    if (type === "bundle") {
      if (!slug) {
        return apiSuccess({ bundle: null }, 200, { requestId });
      }
      const bundle = RecommendationService.getFrequentlyBoughtTogether(slug);
      return apiSuccess({ bundle }, 200, { requestId });
    }

    if (type === "pairings") {
      if (!slug) {
        return apiSuccess({ pairings: [] }, 200, { requestId });
      }
      const pairings = RecommendationService.getComplementaryPairings(slug, limit);
      return apiSuccess({ pairings }, 200, { requestId });
    }

    if (type === "need") {
      if (!tag) {
        return apiSuccess({ recommendations: [] }, 200, { requestId });
      }
      const recommendations = RecommendationService.getNeedBasedRecommendations(tag, slug || undefined, limit);
      return apiSuccess({ recommendations }, 200, { requestId });
    }

    // Default "all" returns both pairings and bundle if slug provided
    if (slug) {
      const bundle = RecommendationService.getFrequentlyBoughtTogether(slug);
      const pairings = RecommendationService.getComplementaryPairings(slug, limit);
      return apiSuccess({ bundle, pairings }, 200, { requestId });
    }

    return apiSuccess({ message: "Provide slug or tag parameter" }, 200, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}
