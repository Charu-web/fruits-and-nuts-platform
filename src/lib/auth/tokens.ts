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

const secretKey = new TextEncoder().encode(env.AUTH_SECRET);

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
    .sign(secretKey);
}

/**
 * Verifies and decodes a signed JWT session token.
 * Returns null if token is expired, tampered with, or invalid.
 */
export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ["HS256"],
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

/**
 * Generates a signed, stateless, time-limited JWT reset token.
 * Contains a slice of the active password hash so the token is automatically
 * invalidated once the password has been reset (single-use guarantee across serverless containers).
 */
export async function generatePasswordResetToken(params: {
  userId: string;
  email: string | null;
  passwordHash?: string | null;
}): Promise<string> {
  const pwh = params.passwordHash ? params.passwordHash.slice(-16) : "";
  return await new SignJWT({
    userId: params.userId,
    email: params.email,
    pwh,
    purpose: "password_reset",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(secretKey);
}

/**
 * Verifies and decodes a signed password reset JWT token.
 * Returns null if the token has expired, has been tampered with, or is not a reset token.
 */
export async function verifyPasswordResetToken(token: string): Promise<{
  userId: string;
  email: string | null;
  pwh: string;
} | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ["HS256"],
    });

    if (payload.purpose !== "password_reset") {
      return null;
    }

    return {
      userId: payload.userId as string,
      email: (payload.email as string) || null,
      pwh: (payload.pwh as string) || "",
    };
  } catch {
    return null;
  }
}
