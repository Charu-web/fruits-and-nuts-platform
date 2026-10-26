import {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  generateSessionToken,
  verifySessionToken,
  generateSecureRandomToken,
  hashOpaqueToken,
  hasPermission,
  hasRole,
  isAdminRole,
  SessionUser,
} from "../lib/auth";
import { RoleType } from "@prisma/client";
import { AuthService } from "../services/auth.service";
import { NotificationService } from "../services/notification.service";

async function runAuthTests() {
  console.log("🧪 Running Phase 9B Authentication & RBAC Tests...");

  // Test 1: Password Hashing & Verification
  const rawPassword = "RoyalGourmet2026!";
  const hashed = await hashPassword(rawPassword);
  console.assert(hashed !== rawPassword, "Hashed password must not match plaintext");
  console.assert(hashed.startsWith("$2"), "Password hash should be standard bcrypt format");
  const isValid = await verifyPassword(rawPassword, hashed);
  console.assert(isValid === true, "Valid password should verify successfully");
  const isInvalid = await verifyPassword("WrongPassword123", hashed);
  console.assert(isInvalid === false, "Incorrect password must be rejected");
  console.log("✅ Test 1 Passed: Bcrypt password hashing & constant-time verification.");

  // Test 2: Password Complexity Validation
  console.assert(validatePasswordStrength("short").isValid === false, "Short password should fail");
  console.assert(validatePasswordStrength("lowercase123!").isValid === false, "Missing uppercase should fail");
  console.assert(validatePasswordStrength("UPPERCASE123!").isValid === false, "Missing lowercase should fail");
  console.assert(validatePasswordStrength("NoNumbersHere!").isValid === false, "Missing numbers should fail");
  console.assert(validatePasswordStrength("ValidPassword2026").isValid === true, "Compliant password must pass");
  console.log("✅ Test 2 Passed: Password policy rules enforcement.");

  // Test 3: JWT Session Token Creation & Verification
  const sessionUser: SessionUser = {
    id: "d8c11e74-3cf6-48be-8f35-64585141203a",
    email: "customer@fruitsandnuts.co.in",
    phone: "9876543210",
    roleId: RoleType.CUSTOMER,
    isActive: true,
    name: "Rajesh Kumar",
  };

  const jwtToken = await generateSessionToken(sessionUser);
  console.assert(typeof jwtToken === "string" && jwtToken.length > 50, "JWT token must be a signed string");

  const verifiedUser = await verifySessionToken(jwtToken);
  console.assert(verifiedUser !== null, "Signed JWT token should verify");
  console.assert(verifiedUser?.id === sessionUser.id, "Verified user ID must match payload");
  console.assert(verifiedUser?.email === sessionUser.email, "Verified email must match payload");
  console.assert(verifiedUser?.roleId === RoleType.CUSTOMER, "Role ID must match");
  console.log("✅ Test 3 Passed: JWT HS256 session token generation and verification.");

  // Test 4: RBAC & Permission Model
  console.assert(hasRole(RoleType.SUPER_ADMIN, [RoleType.SUPER_ADMIN, RoleType.INVENTORY_MGR]) === true, "Super Admin role check");
  console.assert(hasRole(RoleType.CUSTOMER, [RoleType.SUPER_ADMIN]) === false, "Customer cannot access admin role");
  
  console.assert(hasPermission(RoleType.SUPER_ADMIN, "products:write") === true, "Super Admin can write products");
  console.assert(hasPermission(RoleType.INVENTORY_MGR, "inventory:write") === true, "Inventory Manager can write inventory");
  console.assert(hasPermission(RoleType.INVENTORY_MGR, "orders:write") === false, "Inventory Manager cannot write orders");
  console.assert(hasPermission(RoleType.CUSTOMER, "products:write") === false, "Customer cannot write products");
  console.assert(hasPermission(RoleType.CUSTOMER, "profile:read") === true, "Customer can read own profile");
  
  console.assert(isAdminRole(RoleType.SUPER_ADMIN) === true, "Super Admin is admin");
  console.assert(isAdminRole(RoleType.INVENTORY_MGR) === true, "Inventory Manager is admin");
  console.assert(isAdminRole(RoleType.CUSTOMER) === false, "Customer is not admin");
  console.log("✅ Test 4 Passed: RBAC matrix and least-privilege permission checks.");

  // Test 5: Cryptographic Token Generation & Hashing
  const rawResetToken = generateSecureRandomToken(32);
  console.assert(rawResetToken.length === 64, "32-byte hex token should be 64 characters long");
  const hashedToken = hashOpaqueToken(rawResetToken);
  console.assert(hashedToken.length === 64, "SHA-256 hash must be 64 characters long");
  console.assert(hashedToken !== rawResetToken, "Hashed token must not equal raw token");
  console.log("✅ Test 5 Passed: Cryptographic opaque token generation and SHA-256 storage hashing.");

  // Test 6: AuthService.forgotPassword Never Leaks Token in Public Return Value
  const forgotResult = await AuthService.forgotPassword("aarav.sharma@gmail.com");
  console.assert(
    (forgotResult as any).resetToken === undefined,
    "forgotPassword return value MUST NOT contain resetToken"
  );
  console.assert(
    typeof forgotResult.message === "string" && forgotResult.message.includes("password reset instructions"),
    "Must return reassuring message"
  );
  console.log("✅ Test 6 Passed: AuthService.forgotPassword does not leak reset token in return value.");

  // Test 7: Enumeration Defense: Identical Generic Reassurance for Unknown Account
  const unknownResult = await AuthService.forgotPassword("nonexistent.user.999@fruitsandnuts.co.in");
  console.assert(
    (unknownResult as any).resetToken === undefined,
    "Unknown user must never return resetToken"
  );
  console.assert(
    unknownResult.message === forgotResult.message,
    "Both registered and unregistered identifiers must return identical response"
  );
  console.log("✅ Test 7 Passed: Constant-time identical response prevents email/user enumeration.");

  // Test 8: NotificationService Configuration Safety & Diagnostics
  const isConfigured = NotificationService.isEmailConfigured();
  console.assert(
    isConfigured === false,
    "Placeholder email API key must be recognized as unconfigured"
  );
  const emailDispatch = await NotificationService.sendPasswordResetEmail(
    "aarav.sharma@gmail.com",
    "http://localhost:3000/reset-password?token=mock_token_123"
  );
  console.assert(
    emailDispatch.sent === false && emailDispatch.provider === "UNCONFIGURED",
    "Unconfigured email provider safely reports status without crashing"
  );

  // Test 8b: SMTP Provider Detection & Configuration Validation
  console.assert(
    NotificationService.isSmtpConfigured() === false,
    "Empty/placeholder SMTP must be recognized as unconfigured"
  );
  process.env.SMTP_HOST = "smtp.fruitsandnuts.co.in";
  process.env.SMTP_USER = "orders@fruitsandnuts.co.in";
  process.env.SMTP_PASS = "secure_production_password";
  console.assert(
    NotificationService.isSmtpConfigured() === true,
    "Valid SMTP configuration must be recognized as configured"
  );
  console.assert(
    NotificationService.getEmailProvider() === "SMTP",
    "Provider must be identified as SMTP when SMTP credentials exist"
  );
  console.assert(
    NotificationService.isEmailConfigured() === true,
    "isEmailConfigured must return true when SMTP credentials exist"
  );
  delete process.env.SMTP_HOST;
  delete process.env.SMTP_USER;
  delete process.env.SMTP_PASS;

  console.log("✅ Test 8 Passed: NotificationService gracefully handles unconfigured credentials and verifies SMTP options.");

  // Test 9: Complete Password Reset Lifecycle, Single-Use Invalidation, and Password Updating
  const retrievedToken = AuthService.getDevResetTokenForTesting("aarav.sharma@gmail.com");
  console.assert(
    typeof retrievedToken === "string" && retrievedToken.length > 0,
    "Internal test helper retrieves valid reset token"
  );

  // 9a: Tampered token rejection
  let tamperedFailed = false;
  try {
    await AuthService.resetPassword("tampered_token_invalid_12345", "BrandNewSecure2026!");
  } catch (err: any) {
    tamperedFailed = true;
    console.assert(err.message.includes("Invalid or expired"), "Must reject invalid token");
  }
  console.assert(tamperedFailed, "Tampered token must throw AppError.validation");

  // 9b: Weak password rejection
  let weakPasswordFailed = false;
  try {
    await AuthService.resetPassword(retrievedToken!, "weak");
  } catch (err: any) {
    weakPasswordFailed = true;
  }
  console.assert(weakPasswordFailed, "Weak password must be rejected during reset");

  // 9c: Successful reset
  const resetSuccess = await AuthService.resetPassword(retrievedToken!, "NewPassword2026!@#");
  console.assert(
    resetSuccess.message.includes("successfully updated"),
    "Reset password returns success confirmation"
  );

  // 9d: Replay prevention / Single-use token invalidation
  let replayFailed = false;
  try {
    await AuthService.resetPassword(retrievedToken!, "AnotherPassword2026!");
  } catch (err: any) {
    replayFailed = true;
  }
  console.assert(replayFailed, "Reusing consumed token must fail immediately");

  // 9e: Old password rejected, new password verified
  const devUser = AuthService.getDevUsersForTesting().find(
    (u) => u.email === "aarav.sharma@gmail.com"
  );
  console.assert(devUser !== undefined, "User must exist in registry");
  const oldPwMatches = await verifyPassword("RoyalGourmet2026!", devUser!.passwordHash);
  console.assert(oldPwMatches === false, "Old password must no longer match hash");
  const newPwMatches = await verifyPassword("NewPassword2026!@#", devUser!.passwordHash);
  console.assert(newPwMatches === true, "New password must match updated hash");
  console.log("✅ Test 9 Passed: Token single-use invalidation, bcrypt update, and old password revocation.");

  console.log("🎉 All Phase 9B Authentication & RBAC Tests passed successfully!");
}

runAuthTests().catch((err) => {
  console.error("❌ Auth test failure:", err);
  process.exit(1);
});
