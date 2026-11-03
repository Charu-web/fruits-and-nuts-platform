import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { getRequestId } from "@/lib/request-context";
import { ProductService } from "@/services/product.service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const requestId = await getRequestId();
  try {
    const { slug } = await params;
    const product = await ProductService.getProductBySlug(slug);
    const response = apiSuccess(product, 200, { requestId });
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    return response;
  } catch (error) {
    return apiError(error, requestId);
  }
}
