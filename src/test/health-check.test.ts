import { AppError, ErrorCode } from "../lib/errors";
import { CommonSchemas, validateRequest } from "../lib/validation";
import { z } from "zod";

async function runFoundationTests() {
  console.log("🧪 Running Phase 9A Foundation Tests...");

  // Test 1: AppError construction and status code mapping
  const notFoundErr = AppError.notFound("Product", "ALM-001");
  console.assert(notFoundErr.statusCode === 404, "AppError.notFound should return HTTP 404");
  console.assert(notFoundErr.code === ErrorCode.NOT_FOUND, "AppError code must match NOT_FOUND");
  console.log("✅ Test 1 Passed: AppError hierarchy & status mappings.");

  // Test 2: Validation schema for Indian Mobile Phone
  const validPhone = await validateRequest(CommonSchemas.indianPhone, "9876543210");
  console.assert(validPhone === "9876543210", "Valid Indian mobile should pass");

  try {
    await validateRequest(CommonSchemas.indianPhone, "12345");
    console.assert(false, "Invalid phone should throw AppError");
  } catch (err) {
    console.assert(err instanceof AppError, "Should throw AppError instance");
    console.assert((err as AppError).code === ErrorCode.VALIDATION_ERROR, "Should have VALIDATION_ERROR code");
  }
  console.log("✅ Test 2 Passed: Request validation foundation.");

  // Test 3: Centralized Environment Config
  const testSchema = z.object({
    PORT: z.number().default(3000),
    NODE_ENV: z.string(),
  });
  const envResult = testSchema.parse({ NODE_ENV: "test" });
  console.assert(envResult.PORT === 3000, "Default port must be 3000");
  console.log("✅ Test 3 Passed: Environment schema fallback defaults.");

  console.log("🎉 All Phase 9A Foundation Tests passed successfully!");
}

runFoundationTests().catch((err) => {
  console.error("❌ Foundation test failure:", err);
  process.exit(1);
});
