import { NextRequest } from "next/server";
import { z } from "zod";
import { OtpService } from "@/services/otp.service";
import { apiSuccess, apiError } from "@/lib/api-response";
import { validateRequest } from "@/lib/validation";
import { enforceRateLimit } from "@/lib/auth";
import { getRequestId } from "@/lib/request-context";
import { INDIAN_PHONE_REGEX } from "@/lib/validation/auth.schema";

const verifyOtpSchema = z.object({
  target: z.string().trim().min(1, "Target contact is required"),
  code: z.string().trim().length(6, "Verification code must be exactly 6 digits"),
  type: z.enum(["EMAIL", "PHONE"]),
}).refine(
  (data) => {
    if (data.type === "EMAIL") {
      return z.string().email().safeParse(data.target).success;
    }
    const cleanPhone = data.target.replace(/[\s\-\+]/g, "").slice(-10);
    return INDIAN_PHONE_REGEX.test(cleanPhone);
  },
  { message: "Please provide a valid Indian mobile number (10 digits) or email address" }
);

export async function POST(request: NextRequest) {
  const requestId = await getRequestId();

  try {
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    await enforceRateLimit({
      key: `otp_verify_${ip}`,
      limit: 10,
      windowSeconds: 300,
    });

    const body = await request.json();
    const validated = await validateRequest(verifyOtpSchema, body);

    const target = validated.type === "PHONE"
      ? validated.target.replace(/[\s\-\+]/g, "").slice(-10)
      : validated.target.trim().toLowerCase();

    const result = await OtpService.verifyOtp({
      target,
      code: validated.code,
      type: validated.type,
      ipAddress: ip,
    });

    return apiSuccess(result, 200, { requestId });
  } catch (error) {
    return apiError(error, requestId);
  }
}
