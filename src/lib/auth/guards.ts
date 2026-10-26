import { RoleType } from "@prisma/client";
import { getSessionUserFromRequest } from "./cookies";
import { SessionUser } from "./tokens";
import { hasPermission, hasRole, Permission } from "./rbac";
import { AppError } from "@/lib/errors/app-error";

/**
 * Server-side guard requiring a valid authenticated session.
 * Throws AppError.unauthorized (HTTP 401) if unauthenticated or account is inactive.
 */
export async function requireAuth(request?: Request): Promise<SessionUser> {
  const user = await getSessionUserFromRequest(request);

  if (!user) {
    throw AppError.unauthorized("Authentication required. Please sign in.");
  }

  if (!user.isActive) {
    throw AppError.forbidden("Your account has been deactivated or suspended. Please contact support.");
  }

  return user;
}

/**
 * Server-side guard requiring a valid session and specific role.
 * Throws AppError.forbidden (HTTP 403) if role is unauthorized.
 */
export async function requireRole(allowedRoles: (RoleType | string)[], request?: Request): Promise<SessionUser> {
  const user = await requireAuth(request);

  if (!hasRole(user.roleId, allowedRoles)) {
    throw AppError.forbidden("Access denied: You do not have permission to access this resource.");
  }

  return user;
}

/**
 * Server-side guard requiring a valid session and specific permission.
 */
export async function requirePermission(permission: Permission, request?: Request): Promise<SessionUser> {
  const user = await requireAuth(request);

  if (!hasPermission(user.roleId, permission)) {
    throw AppError.forbidden(`Access denied: Missing required permission '${permission}'.`);
  }

  return user;
}
