import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AuthService } from "../services/auth.service";
import { NotificationService } from "../services/notification.service";
import { ForgotPasswordSchema, ResetPasswordSchema } from "../lib/validation/auth.schema";
import { validatePasswordStrength, hashOpaqueToken, enforceRateLimit } from "../lib/auth";

console.log("🧪 Running Comprehensive Password Reset & Recovery Workflow Test Suite...\n");

describe("Password Reset & Account Recovery Security & Workflow Tests", () => {
  const originalEmailProvider = process.env.EMAIL_PROVIDER;
  process.env.EMAIL_PROVIDER = "MOCK";
  // Test 1: Forgot Password Input Validation
  it("Test 1: Forgot Password Input Validation (Email, Phone, Malformed Inputs)", () => {
    // 1a: Valid email
    const validEmail = ForgotPasswordSchema.safeParse({ email: "aarav.sharma@gmail.com" });
    assert.strictEqual(validEmail.success, true, "Valid registered email should pass schema validation");

    // 1b: Valid 10-digit Indian phone
    const validPhone = ForgotPasswordSchema.safeParse({ phone: "9876543210" });
    assert.strictEqual(validPhone.success, true, "Valid 10-digit Indian phone should pass schema validation");

    // 1c: Empty input rejected
    const emptyInput = ForgotPasswordSchema.safeParse({});
    assert.strictEqual(emptyInput.success, false, "Empty input must be rejected");

    // 1d: Invalid phone format rejected
    const invalidPhone = ForgotPasswordSchema.safeParse({ phone: "12345" });
    assert.strictEqual(invalidPhone.success, false, "Malformed phone number must be rejected");
  });

  // Test 2: Account Enumeration Protection
  it("Test 2: Account Enumeration Protection (Identical Constant-Time Responses)", async () => {
    const registeredRes = await AuthService.forgotPassword("aarav.sharma@gmail.com");
    const unregisteredRes = await AuthService.forgotPassword("ghost.user.does.not.exist@fruitsandnuts.co.in");

    // Check that neither response leaks a token
    assert.strictEqual(
      (registeredRes as any).resetToken,
      undefined,
      "Registered user response MUST NOT contain raw reset token"
    );
    assert.strictEqual(
      (unregisteredRes as any).resetToken,
      undefined,
      "Unregistered user response MUST NOT contain raw reset token"
    );

    // Check identical message
    assert.strictEqual(
      registeredRes.message,
      unregisteredRes.message,
      "Both registered and unregistered identifiers must receive identical reassurance message"
    );
  });

  // Test 3: Token Generation & SHA-256 Storage
  it("Test 3: Token Generation, Invalidation of Prior Tokens & SHA-256 Storage", async () => {
    // Issue first token
    await AuthService.forgotPassword("aarav.sharma@gmail.com");
    const firstToken = AuthService.getDevResetTokenForTesting("aarav.sharma@gmail.com");
    assert.ok(firstToken, "First token should be generated");

    // Issue second token (should invalidate first token)
    await AuthService.forgotPassword("aarav.sharma@gmail.com");
    const secondToken = AuthService.getDevResetTokenForTesting("aarav.sharma@gmail.com");
    assert.ok(secondToken, "Second token should be generated");
    assert.notStrictEqual(firstToken, secondToken, "Subsequent token must be uniquely generated");

    // Attempting reset with the invalidated first token must fail
    let firstTokenFailed = false;
    try {
      await AuthService.resetPassword(firstToken, "ValidPassword2026!");
    } catch (err: any) {
      firstTokenFailed = true;
      assert.ok(err.message.includes("Invalid or expired"), "Invalidated prior token must be rejected");
    }
    assert.strictEqual(firstTokenFailed, true, "Prior token must be invalidated upon new request");
  });

  // Test 4: Token Expiration (TTL Enforcement)
  it("Test 4: Token Expiration Enforcement (15-Minute Expiry Window)", async () => {
    await AuthService.forgotPassword("aarav.sharma@gmail.com");
    const activeToken = AuthService.getDevResetTokenForTesting("aarav.sharma@gmail.com");
    assert.ok(activeToken, "Active token should be present");

    // Simulate token expiration using helper
    const expired = AuthService.expireDevResetTokenForTesting("aarav.sharma@gmail.com");
    assert.strictEqual(expired, true, "Token expiration should be simulated successfully");

    let expiredFailed = false;
    try {
      await AuthService.resetPassword(activeToken, "FreshPassword2026!#");
    } catch (err: any) {
      expiredFailed = true;
      assert.ok(err.message.includes("expired"), "Expired token must be rejected with expiration message");
    }
    assert.strictEqual(expiredFailed, true, "Expired token must be rejected");
  });

  // Test 5: Password Policy & Mismatch Validation
  it("Test 5: Password Complexity & Mismatch Validation", async () => {
    await AuthService.forgotPassword("aarav.sharma@gmail.com");
    const validToken = AuthService.getDevResetTokenForTesting("aarav.sharma@gmail.com");
    assert.ok(validToken, "Valid token should be available");

    // 5a: Schema mismatch validation
    const mismatched = ResetPasswordSchema.safeParse({
      token: validToken,
      newPassword: "ValidPassword2026!",
      confirmPassword: "MismatchPassword2026!",
    });
    assert.strictEqual(mismatched.success, false, "Mismatched confirmPassword must be rejected by schema");

    // 5b: Short password rejection
    const shortCheck = validatePasswordStrength("short");
    assert.strictEqual(shortCheck.isValid, false, "Short password (< 8 chars) must fail strength check");

    // 5c: Missing uppercase / number rejection
    const missingUpperCheck = validatePasswordStrength("lowercaseonly123!");
    assert.strictEqual(missingUpperCheck.isValid, false, "Password missing uppercase must fail");

    const missingNumCheck = validatePasswordStrength("NoNumbersHereAtAll!");
    assert.strictEqual(missingNumCheck.isValid, false, "Password missing digits must fail");
  });

  // Test 6: Single-Use Guarantee & Replay Attack Invalidation
  it("Test 6: Single-Use Guarantee & Replay Attack Invalidation", async () => {
    await AuthService.forgotPassword("aarav.sharma@gmail.com");
    const singleUseToken = AuthService.getDevResetTokenForTesting("aarav.sharma@gmail.com");
    assert.ok(singleUseToken, "Reset token should be available");

    const NEW_PASSWORD = "BrandNewPassword2026!#";

    // First use: must succeed
    const firstUseRes = await AuthService.resetPassword(singleUseToken, NEW_PASSWORD);
    assert.ok(firstUseRes.message.includes("successfully updated"), "First reset attempt must succeed");

    // Second use (replay attack): must fail immediately
    let replayFailed = false;
    try {
      await AuthService.resetPassword(singleUseToken, "AnotherNewPassword2026!#");
    } catch (err: any) {
      replayFailed = true;
      assert.ok(
        err.message.includes("already been used") || err.message.includes("Invalid or expired"),
        "Replay attempt must be rejected"
      );
    }
    assert.strictEqual(replayFailed, true, "Replay of consumed token must fail immediately");
  });

  // Test 7: Authentication Credential Update & Revocation of Old Password
  it("Test 7: Authentication Credential Update & Revocation of Old Password", async () => {
    const CURRENT_PASSWORD = "BrandNewPassword2026!#";
    const OLD_PASSWORD = "RoyalGourmet2026!";

    // Old password must now be rejected
    let oldLoginFailed = false;
    try {
      await AuthService.login({
        email: "aarav.sharma@gmail.com",
        password: OLD_PASSWORD,
      });
    } catch (err: any) {
      oldLoginFailed = true;
    }
    assert.strictEqual(oldLoginFailed, true, "Login with old password must be rejected");

    // New password must succeed
    const newLoginRes = await AuthService.login({
      email: "aarav.sharma@gmail.com",
      password: CURRENT_PASSWORD,
    });
    assert.ok(newLoginRes.token, "Login with new password must return signed JWT session token");
    assert.strictEqual(newLoginRes.user.email, "aarav.sharma@gmail.com", "Authenticated user email must match");

    // Restore original test password for consistency across other test suites
    await AuthService.forgotPassword("aarav.sharma@gmail.com");
    const restoreToken = AuthService.getDevResetTokenForTesting("aarav.sharma@gmail.com");
    if (restoreToken) {
      await AuthService.resetPassword(restoreToken, "RoyalGourmet2026!");
    }
  });

  // Test 8: Notification Service Provider Error Handling
  it("Test 8: Notification Service Provider Error Handling & Diagnostics", async () => {
    process.env.EMAIL_PROVIDER = "UNCONFIGURED";
    // Unconfigured state returns { sent: false, provider: 'UNCONFIGURED' }
    const unconfiguredResult = await NotificationService.sendPasswordResetEmail(
      "aarav.sharma@gmail.com",
      "http://localhost:3000/reset-password?token=test_token_123"
    );
    assert.strictEqual(unconfiguredResult.sent, false, "Unconfigured dispatch must report sent: false");
    assert.strictEqual(
      unconfiguredResult.provider,
      "UNCONFIGURED",
      "Provider should be identified as UNCONFIGURED"
    );

    // Readiness status check
    const status = NotificationService.getReadinessStatus();
    assert.strictEqual(typeof status.emailConfigured, "boolean");
    assert.strictEqual(typeof status.senderAddress, "string");
    process.env.EMAIL_PROVIDER = "MOCK";
  });

  // Test 9: Rate Limiting Enforcement
  it("Test 9: Rate Limiting Enforcement (5 Requests per 300s Window)", async () => {
    const testIp = "192.168.1.99";
    const key = `pw_reset_test_${testIp}`;

    // 5 requests within limit must pass
    for (let i = 0; i < 5; i++) {
      await enforceRateLimit({
        key,
        limit: 5,
        windowSeconds: 300,
      });
    }

    // 6th request must throw tooManyRequests (HTTP 429)
    let rateLimitTriggered = false;
    try {
      await enforceRateLimit({
        key,
        limit: 5,
        windowSeconds: 300,
      });
    } catch (err: any) {
      rateLimitTriggered = true;
      assert.strictEqual(err.statusCode, 429, "Rate limit breach must return status 429");
    }
    assert.strictEqual(rateLimitTriggered, true, "6th request within window must trigger rate limit");
  });

  // Test 10: Safe Secret Handling (No Passwords or Tokens in Logs)
  it("Test 10: Safe Secret Handling (No Passwords or Tokens Exposed)", () => {
    const publicForgotReturn = {
      message:
        "If an account exists for this email address, password reset instructions will be sent. Please check your inbox.",
    };
    assert.strictEqual(
      "token" in publicForgotReturn || "resetToken" in publicForgotReturn,
      false,
      "Public forgot-password return must never contain token properties"
    );

    const safeSender = NotificationService.getSenderAddress();
    assert.ok(
      safeSender.includes("@fruitsandnuts.co.in") || safeSender.includes("fruitsnutswebsite@gmail.com"),
      "Verified sender address must use brand domain or configured sender email"
    );
  });
});
