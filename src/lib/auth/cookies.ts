import { cookies, headers } from "next/headers";
import { env } from "@/config/env";
import { verifySessionToken, SessionUser } from "./tokens";

export const SESSION_COOKIE_NAME = "fn_session";

/**
 * Sets the secure HttpOnly session cookie on the outgoing response.
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: env.JWT_EXPIRY_SECONDS,
  });
}

/**
 * Clears the session cookie during logout.
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Extracts and verifies the current session user from the incoming request cookies or Authorization header.
 */
export async function getSessionUserFromRequest(request?: Request): Promise<SessionUser | null> {
  let token: string | undefined;

  // 1. Try to read from Authorization header (Bearer token)
  if (request) {
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }
  } else {
    const headerList = await headers();
    const authHeader = headerList.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }
  }

  // 2. If no bearer token, read from HttpOnly session cookie
  if (!token) {
    if (request) {
      const cookieHeader = request.headers.get("cookie");
      if (cookieHeader) {
        const match = cookieHeader
          .split(";")
          .map((c) => c.trim())
          .find((c) => c.startsWith(`${SESSION_COOKIE_NAME}=`));
        if (match) {
          token = match.substring(SESSION_COOKIE_NAME.length + 1).trim();
        }
      }
    }
    if (!token) {
      try {
        const cookieStore = await cookies();
        token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
      } catch {
        // Called outside Next.js request AsyncLocalStorage context
      }
    }
  }

  if (!token) return null;

  return await verifySessionToken(token);
}
