import assert from "node:assert";
import {
  RegisterSchema,
  LoginSchema,
  UpdateProfileSchema,
  ChangePasswordSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from "../lib/validation/auth.schema";
import { validatePasswordStrength } from "../lib/auth";

async function runProfileAndMaintenanceTests() {
  console.log("🧪 Running Customer Profile & System Maintenance Test Suite...\n");

  // ----------------------------------------------------------------------
  // Test 1: Customer Profile Schema Validation
  // ----------------------------------------------------------------------
  console.log("▶️ Test 1: Customer Profile Update Schema Validation...");

  // Valid profile update
  const validProfile = UpdateProfileSchema.parse({
    firstName: "Rohan",
    lastName: "Mehta",
    phone: "9876543210",
    avatarUrl: "https://cdn.fruitsandnuts.co.in/avatars/u123.jpg",
  });
  assert.strictEqual(validProfile.firstName, "Rohan");
  assert.strictEqual(validProfile.lastName, "Mehta");
  assert.strictEqual(validProfile.phone, "9876543210");

  // Invalid phone number
  assert.throws(() => {
    UpdateProfileSchema.parse({
      firstName: "Rohan",
      phone: "12345", // Invalid
    });
  }, /Please provide a valid 10-digit Indian mobile number/);

  console.log("✅ Test 1 Passed: Profile update constraints and Indian mobile formats verified.");

  // ----------------------------------------------------------------------
  // Test 2: Change Password & Password Complexity Policy
  // ----------------------------------------------------------------------
  console.log("▶️ Test 2: Password Change & Complexity Policy Enforcement...");

  const validChange = ChangePasswordSchema.parse({
    currentPassword: "OldPassword123!",
    newPassword: "NewSecurePassword2026@",
  });
  assert.strictEqual(validChange.currentPassword, "OldPassword123!");

  // Verify strong password rules
  const strongCheck = validatePasswordStrength("SecurePass@2026");
  assert.strictEqual(strongCheck.isValid, true);

  // Verify weak password (too short or missing character sets)
  const weakCheck = validatePasswordStrength("short");
  assert.strictEqual(weakCheck.isValid, false);

  console.log("✅ Test 2 Passed: Password change validation and complexity rules verified.");

  // ----------------------------------------------------------------------
  // Test 3: Register and Login Schemas
  // ----------------------------------------------------------------------
  console.log("▶️ Test 3: Authentication Schemas (Register / Login / Reset)...");

  const validRegister = RegisterSchema.parse({
    email: "customer@fruitsandnuts.co.in",
    password: "StrongPassword123!",
    firstName: "Charu",
    phone: "9811122233",
  });
  assert.strictEqual(validRegister.email, "customer@fruitsandnuts.co.in");

  const validLogin = LoginSchema.parse({
    email: "customer@fruitsandnuts.co.in",
    password: "StrongPassword123!",
  });
  assert.strictEqual(validLogin.email, "customer@fruitsandnuts.co.in");

  const validForgot = ForgotPasswordSchema.parse({
    email: "customer@fruitsandnuts.co.in",
  });
  assert.strictEqual(validForgot.email, "customer@fruitsandnuts.co.in");

  const validReset = ResetPasswordSchema.parse({
    token: "token_1234567890123456",
    newPassword: "NewStrongPassword123!",
  });
  assert.strictEqual(validReset.token, "token_1234567890123456");

  console.log("✅ Test 3 Passed: Registration, login, and password reset schemas passed.");

  // ----------------------------------------------------------------------
  // Test 4: Maintenance Cron Secret Gate Simulation
  // ----------------------------------------------------------------------
  console.log("▶️ Test 4: Maintenance Cron Secret Gate Authorization...");

  function verifyCronAuthorization(
    configuredSecret: string | undefined,
    providedSecret: string | null
  ): boolean {
    if (!configuredSecret) return true; // Open in local dev
    return providedSecret === configuredSecret;
  }

  // Matching secret
  assert.strictEqual(verifyCronAuthorization("cron_secret_abc123", "cron_secret_abc123"), true);

  // Mismatched secret
  assert.strictEqual(verifyCronAuthorization("cron_secret_abc123", "wrong_token"), false);

  // Missing secret when required
  assert.strictEqual(verifyCronAuthorization("cron_secret_abc123", null), false);

  console.log("✅ Test 4 Passed: Cron secret authorization gating verified.");

  console.log("\n🎉 All Customer Profile & System Maintenance Tests passed successfully!\n");
}

runProfileAndMaintenanceTests().catch((err) => {
  console.error("❌ Profile maintenance test failure:", err);
  process.exit(1);
});
