import { SignJWT, jwtVerify } from "jose";
import crypto from "crypto";
import { env } from "@/config/env";
import { RoleType } from "@prisma/client";

export interface SessionUser {
  id: string;
  email: string | null;
  phone: string | null;
  roleId: RoleType | string;
  isActive: boolean;
  name?: string | null;
}

/**
 * Dynamically resolves the secret key for signing and verifying JWTs.
 * Ensures the live environment variable is always used even if process.env
 * is populated after module evaluation in serverless environments.
 */
export function getAuthSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET || env.AUTH_SECRET || "0000000000000000000000000000000000000000000000000000000000000000";
  return new TextEncoder().encode(secret);
}

/**
 * Generates a signed JWT session token with HS256 algorithm and configured expiration.
 */
export async function generateSessionToken(user: SessionUser): Promise<string> {
  return await new SignJWT({
    id: user.id,
    email: user.email,
    phone: user.phone,
    roleId: user.roleId,
    isActive: user.isActive,
    name: user.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${env.JWT_EXPIRY_SECONDS}s`)
    .sign(getAuthSecret());
}

/**
 * Verifies and decodes a signed JWT session token.
 * Returns null if token is expired, tampered with, or invalid.
 */
export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getAuthSecret(), {
      algorithms: ["HS256"],
      clockTolerance: 120,
    });

    return {
      id: payload.id as string,
      email: (payload.email as string) || null,
      phone: (payload.phone as string) || null,
      roleId: payload.roleId as RoleType | string,
      isActive: Boolean(payload.isActive),
      name: (payload.name as string) || null,
    };
  } catch {
    return null;
  }
}

/**
 * Generates a cryptographically secure random hexadecimal token.
 * Used for email verification, password reset, and guest session tokens.
 */
export function generateSecureRandomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

/**
 * Computes a SHA-256 hash of a token for safe database storage.
 * Ensures that compromised database snapshots cannot be used to hijack reset links.
 */
export function hashOpaqueToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export interface PasswordResetPayload {
  userId: string;
  email: string | null;
  pwh: string;
  purpose: "password_reset";
}

export type PasswordResetVerification =
  | { success: true; payload: { userId: string; email: string | null; pwh: string } }
  | { success: false; expired: boolean; error: string };

/**
 * Generates a signed, stateless, time-limited JWT reset token.
 * Contains a slice of the active password hash so the token is automatically
 * invalidated once the password has been reset (single-use guarantee across serverless containers).
 * Embeds a cryptographic nonce to guarantee unique tokens across rapid calls.
 */
export async function generatePasswordResetToken(params: {
  userId: string;
  email: string | null;
  passwordHash?: string | null;
}): Promise<string> {
  const pwh = params.passwordHash ? params.passwordHash.slice(-16) : "";
  const nonce = crypto.randomBytes(16).toString("hex");
  return await new SignJWT({
    userId: params.userId,
    email: params.email,
    pwh,
    nonce,
    purpose: "password_reset",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setJti(nonce)
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(getAuthSecret());
}

/**
 * Verifies and decodes a signed password reset JWT token.
 * Returns detailed status distinguishing between expiration, signature failure, or purpose mismatch.
 * Incorporates clock tolerance to protect against distributed clock drift.
 */
export async function verifyPasswordResetToken(token: string): Promise<PasswordResetVerification> {
  try {
    const { payload } = await jwtVerify(token, getAuthSecret(), {
      algorithms: ["HS256"],
      clockTolerance: 120, // 2 minutes tolerance for distributed serverless lambdas
    });

    if (payload.purpose !== "password_reset") {
      return { success: false, expired: false, error: "Token purpose mismatch" };
    }

    return {
      success: true,
      payload: {
        userId: payload.userId as string,
        email: (payload.email as string) || null,
        pwh: (payload.pwh as string) || "",
      },
    };
  } catch (err: any) {
    const isExpired = err?.code === "ERR_JWT_EXPIRED" || err?.name === "JWTExpired";
    return {
      success: false,
      expired: Boolean(isExpired),
      error: err?.message || "Token verification failed",
    };
  }
}
