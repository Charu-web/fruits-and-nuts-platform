import { headers } from "next/headers";

export async function getRequestId(): Promise<string> {
  const headerList = await headers();
  const reqId = headerList.get("x-request-id") || headerList.get("x-correlation-id");
  return reqId || `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
