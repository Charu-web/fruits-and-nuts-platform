import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { getRequestId } from "@/lib/request-context";
import { ProductService } from "@/services/product.service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const requestId = await getRequestId();
  try {
    const { slug } = await params;
    const product = await ProductService.getProductBySlug(slug);
    return apiSuccess(product, 200, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}
