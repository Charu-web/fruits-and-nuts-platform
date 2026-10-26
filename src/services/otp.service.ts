/**
 * ==============================================================================
 * OTP VERIFICATION SERVICE — M/S FRUITS & NUTS
 * ==============================================================================
 * Manages cryptographically secure OTP lifecycle, attempt throttling,
 * resend cooldowns, and secure SHA-256 hash storage.
 * ==============================================================================
 */

import crypto from "crypto";
import { AppError } from "@/lib/errors/app-error";
import { NotificationService } from "./notification.service";
import { db } from "@/lib/db";
import { hashOpaqueToken } from "@/lib/auth/tokens";
import { logAuthEvent } from "@/lib/auth/audit";

export interface OtpRequestInput {
  target: string; // Phone or Email
  type: "EMAIL" | "PHONE";
  ipAddress?: string;
}

export interface OtpVerifyInput {
  target: string;
  code: string;
  type: "EMAIL" | "PHONE";
  ipAddress?: string;
}

interface StoredOtpRecord {
  target: string;
  type: "EMAIL" | "PHONE";
  codeHash: string;
  rawOtp?: string;
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
}

// Global in-memory OTP cache (resilient across Next.js dev route instances)
const globalForOtp = globalThis as unknown as { devOtpStore?: Map<string, StoredOtpRecord> };
const OTP_STORE = globalForOtp.devOtpStore || new Map<string, StoredOtpRecord>();
if (process.env.NODE_ENV !== "production") globalForOtp.devOtpStore = OTP_STORE;

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
const MAX_VERIFICATION_ATTEMPTS = 5;

export class OtpService {
  /**
   * Generates a cryptographically secure 6-digit numeric OTP code.
   */
  static generateSecureOtp(): string {
    return crypto.randomInt(100000, 1000000).toString();
  }

  /**
   * Initiates OTP dispatch with cooldown, expiry, and provider verification.
   */
  static async requestOtp(input: OtpRequestInput): Promise<{ message: string; cooldownSeconds: number }> {
    const normalizedTarget = input.target.trim().toLowerCase();
    const existing = OTP_STORE.get(normalizedTarget);

    // 1. Enforce 60-second resend cooldown
    const now = Date.now();
    if (existing && now - existing.lastSentAt < RESEND_COOLDOWN_MS) {
      const remainingSeconds = Math.ceil((RESEND_COOLDOWN_MS - (now - existing.lastSentAt)) / 1000);
      throw AppError.validation(
        `Please wait ${remainingSeconds} seconds before requesting a new verification code.`
      );
    }

    // 2. Validate live provider readiness (DO NOT fake delivery)
    if (input.type === "EMAIL" && !NotificationService.isEmailConfigured()) {
      throw AppError.serviceUnavailable(
        "Email verification is currently unavailable: Transactional email provider credentials are not yet configured."
      );
    }
    if (input.type === "PHONE" && !NotificationService.isSmsConfigured()) {
      throw AppError.serviceUnavailable(
        "SMS verification is currently unavailable: Indian SMS gateway credentials are not yet configured."
      );
    }

    // 3. Generate high-entropy 6-digit OTP and store SHA-256 hash
    const rawOtp = this.generateSecureOtp();
    const codeHash = hashOpaqueToken(rawOtp);

    OTP_STORE.set(normalizedTarget, {
      target: normalizedTarget,
      type: input.type,
      codeHash,
      rawOtp: process.env.NODE_ENV !== "production" ? rawOtp : undefined,
      expiresAt: now + OTP_TTL_MS,
      attempts: 0,
      lastSentAt: now,
    });

    // 4. Dispatch via real provider
    if (input.type === "EMAIL") {
      await NotificationService.sendEmailOtp(normalizedTarget, rawOtp);
    } else {
      await NotificationService.sendSmsOtp(normalizedTarget, rawOtp);
    }

    await logAuthEvent("OTP_REQUESTED" as any, {
      ipAddress: input.ipAddress,
      metadata: { type: input.type, target: normalizedTarget.substring(0, 4) + "***" },
    });

    return {
      message: `A 6-digit verification code has been sent to your ${input.type === "EMAIL" ? "email" : "mobile number"}.`,
      cooldownSeconds: 60,
    };
  }

  /**
   * Verifies an entered OTP with attempt limit enforcement and replay prevention.
   */
  static async verifyOtp(input: OtpVerifyInput): Promise<{ verified: boolean; message: string }> {
    const normalizedTarget = input.target.trim().toLowerCase();
    const cleanCode = input.code.trim();

    if (!cleanCode || cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
      throw AppError.validation("Please enter a valid 6-digit numeric verification code.");
    }

    const record = OTP_STORE.get(normalizedTarget);
    const now = Date.now();

    // 1. Verify existence and expiration
    if (!record || now > record.expiresAt) {
      OTP_STORE.delete(normalizedTarget);
      throw AppError.validation("Verification code has expired or was not requested. Please request a new code.");
    }

    // 2. Enforce brute-force attempt limits
    if (record.attempts >= MAX_VERIFICATION_ATTEMPTS) {
      OTP_STORE.delete(normalizedTarget);
      throw AppError.validation(
        "Too many failed verification attempts. This code has been invalidated for your security. Please request a new code."
      );
    }

    // 3. Constant-time SHA-256 hash verification
    const inputHash = hashOpaqueToken(cleanCode);
    const isValid = crypto.timingSafeEqual(
      Buffer.from(inputHash, "hex"),
      Buffer.from(record.codeHash, "hex")
    );

    if (!isValid) {
      record.attempts += 1;
      const remaining = MAX_VERIFICATION_ATTEMPTS - record.attempts;
      throw AppError.validation(
        `Invalid verification code. ${remaining > 0 ? `${remaining} attempts remaining.` : "Code invalidated."}`
      );
    }

    // 4. Invalidate immediately to prevent replay attacks
    OTP_STORE.delete(normalizedTarget);

    // 5. Update user verification status in DB if record exists
    try {
      if (input.type === "EMAIL") {
        await db.user.updateMany({
          where: { email: normalizedTarget },
          data: { isEmailVerified: true },
        });
      } else {
        await db.user.updateMany({
          where: { phone: normalizedTarget },
          data: { isPhoneVerified: true },
        });
      }
    } catch {
      // In dev fallback, update memory registry
      const devUsers = (globalThis as any).devUsersGlobal || [];
      const devUser = devUsers.find(
        (u: any) =>
          (input.type === "EMAIL" && u.email?.toLowerCase() === normalizedTarget) ||
          (input.type === "PHONE" && u.phone === normalizedTarget)
      );
      if (devUser) {
        if (input.type === "EMAIL") devUser.isEmailVerified = true;
        else devUser.isPhoneVerified = true;
      }
    }

    await logAuthEvent("OTP_VERIFIED" as any, {
      ipAddress: input.ipAddress,
      metadata: { type: input.type, target: normalizedTarget.substring(0, 4) + "***" },
    });

    return {
      verified: true,
      message: `${input.type === "EMAIL" ? "Email address" : "Mobile number"} verified successfully.`,
    };
  }

  /**
   * Testing helper: retrieves dev OTP for automated testing suites.
   */
  static getDevOtpForTesting(target: string): string | null {
    const normalizedTarget = target.trim().toLowerCase();
    const record = OTP_STORE.get(normalizedTarget);
    return record?.rawOtp || null;
  }
}
