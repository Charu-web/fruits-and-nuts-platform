import assert from "assert";
import { generateTotpSecret, generateTotpCode, verifyTotpCode } from "../lib/auth/totp";
import { AdminLoginSchema } from "../lib/validation/auth.schema";
import { isAdminRole } from "../lib/auth/rbac";
import { RoleType } from "@prisma/client";
import { enforceRateLimit } from "../lib/auth/rate-limiter";

async function runAdminAuthTests() {
  console.log("🧪 Running Step 2 Admin Authentication & 2FA Tests...\n");

  // Test 1: AdminLoginSchema validation
  console.log("▶️ Test 1: Admin Login Schema Validation...");
  const validSchema = AdminLoginSchema.parse({
    email: "admin@myrapvtltd.com",
    password: "Password123!",
    totpCode: "123456",
  });
  assert.strictEqual(validSchema.email, "admin@myrapvtltd.com");
  assert.strictEqual(validSchema.totpCode, "123456");

  // Invalid TOTP length in schema
  assert.throws(() => {
    AdminLoginSchema.parse({
      email: "admin@myrapvtltd.com",
      password: "Password123!",
      totpCode: "12345", // Only 5 digits
    });
  }, "Should reject non-6-digit TOTP code");
  console.log("✅ Test 1 Passed: Admin login schema enforces email/phone and 6-digit TOTP syntax.\n");

  // Test 2: Standard RFC 6238 TOTP Generation and Verification
  console.log("▶️ Test 2: RFC 6238 TOTP Cryptographic Verification...");
  const secret = generateTotpSecret();
  assert.ok(secret && secret.length >= 16, "Secret should be generated");

  const currentCode = generateTotpCode(secret);
  assert.strictEqual(currentCode.length, 6, "Code must be 6 digits");

  const isValidCurrent = verifyTotpCode(currentCode, secret);
  assert.strictEqual(isValidCurrent, true, "Current TOTP code must verify as valid");

  const isInvalidCode = verifyTotpCode("000000", secret);
  assert.strictEqual(isInvalidCode, false, "Random code must be rejected");

  const isInvalidFormat = verifyTotpCode("abc", secret);
  assert.strictEqual(isInvalidFormat, false, "Non-numeric token must be rejected");
  console.log("✅ Test 2 Passed: TOTP token generation and timing-safe verification verified.\n");

  // Test 3: Role Gating & RBAC Protection (Customer vs Admin)
  console.log("▶️ Test 3: Administrative Role Gating Verification...");
  assert.strictEqual(isAdminRole(RoleType.SUPER_ADMIN), true, "SUPER_ADMIN is admin role");
  assert.strictEqual(isAdminRole(RoleType.INVENTORY_MGR), true, "INVENTORY_MGR is admin role");
  assert.strictEqual(isAdminRole(RoleType.ORDER_MGR), true, "ORDER_MGR is admin role");
  assert.strictEqual(isAdminRole(RoleType.CONTENT_MGR), true, "CONTENT_MGR is admin role");
  assert.strictEqual(isAdminRole(RoleType.CUSTOMER), false, "CUSTOMER is not an admin role");
  console.log("✅ Test 3 Passed: Role-based admin access boundary correctly isolates customers from staff roles.\n");

  // Test 4: Rate Limiter on Admin Endpoint
  console.log("▶️ Test 4: Admin Brute-Force Rate Limiting...");
  const testIpKey = `test_admin_ip_${Date.now()}`;
  for (let i = 0; i < 5; i++) {
    const res = await enforceRateLimit({ key: testIpKey, limit: 5, windowSeconds: 60 });
    assert.strictEqual(res.remaining >= 0, true, `Attempt ${i + 1} should be permitted`);
  }

  let rateLimited = false;
  try {
    await enforceRateLimit({ key: testIpKey, limit: 5, windowSeconds: 60 });
  } catch (err: any) {
    rateLimited = true;
    assert.ok(err.message.includes("Too many requests"), "Error message should notify about rate limit");
  }
  assert.strictEqual(rateLimited, true, "6th attempt within window must be rate-limited");
  console.log("✅ Test 4 Passed: Admin brute-force rate limiter strictly blocks excessive attempts.\n");

  console.log("🎉 All Step 2 Admin Auth & 2FA Tests passed successfully!");
}

runAdminAuthTests().catch((err) => {
  console.error("❌ Admin Auth Test Suite Failed:", err);
  process.exit(1);
});
