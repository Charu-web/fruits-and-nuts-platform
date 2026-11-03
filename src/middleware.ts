import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE_NAME = "fn_session";
const ADMIN_ROLES = ["SUPER_ADMIN", "INVENTORY_MGR", "ORDER_MGR", "CONTENT_MGR"];

function getAuthSecret(): Uint8Array {
  const secret =
    process.env.AUTH_SECRET ||
    "0000000000000000000000000000000000000000000000000000000000000000";
  return new TextEncoder().encode(secret);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Administrative routes protection (/admin/*)
  if (pathname.startsWith("/admin")) {
    // Whitelist admin login route
    if (pathname === "/admin/login") {
      // If already logged in as admin, redirect to /admin dashboard
      const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
      if (token) {
        try {
          const { payload } = await jwtVerify(token, getAuthSecret(), {
            algorithms: ["HS256"],
            clockTolerance: 120,
          });
          const roleId = payload.roleId as string;
          if (payload.isActive && ADMIN_ROLES.includes(roleId)) {
            return NextResponse.redirect(new URL("/admin", request.url));
          }
        } catch {
          // Token invalid, proceed to login
        }
      }
      return NextResponse.next();
    }

    // Protect all other /admin routes
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const { payload } = await jwtVerify(token, getAuthSecret(), {
        algorithms: ["HS256"],
        clockTolerance: 120,
      });

      const roleId = payload.roleId as string;
      const isActive = Boolean(payload.isActive);

      if (!isActive || !ADMIN_ROLES.includes(roleId)) {
        const loginUrl = new URL("/admin/login", request.url);
        loginUrl.searchParams.set("error", "forbidden");
        return NextResponse.redirect(loginUrl);
      }

      return NextResponse.next();
    } catch {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Customer account routes protection (/account/*)
  if (pathname.startsWith("/account")) {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const { payload } = await jwtVerify(token, getAuthSecret(), {
        algorithms: ["HS256"],
        clockTolerance: 120,
      });

      if (!payload.isActive) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("error", "suspended");
        return NextResponse.redirect(loginUrl);
      }

      return NextResponse.next();
    } catch {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/account/:path*",
  ],
};
