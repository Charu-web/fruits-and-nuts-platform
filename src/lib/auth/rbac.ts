import { RoleType } from "@prisma/client";

export type Permission =
  | "products:read"
  | "products:write"
  | "inventory:read"
  | "inventory:write"
  | "orders:read"
  | "orders:write"
  | "cms:read"
  | "cms:write"
  | "taste_map:write"
  | "stores:write"
  | "coupons:read"
  | "coupons:write"
  | "reviews:moderate"
  | "users:read"
  | "users:write"
  | "audit:read"
  | "profile:read"
  | "profile:write"
  | "customer:orders:read"
  | "customer:reviews:write";

// Fine-grained permission assignments per Role
export const RolePermissions: Record<RoleType, Permission[]> = {
  [RoleType.SUPER_ADMIN]: [
    "products:read",
    "products:write",
    "inventory:read",
    "inventory:write",
    "orders:read",
    "orders:write",
    "cms:read",
    "cms:write",
    "taste_map:write",
    "stores:write",
    "coupons:read",
    "coupons:write",
    "reviews:moderate",
    "users:read",
    "users:write",
    "audit:read",
    "profile:read",
    "profile:write",
    "customer:orders:read",
    "customer:reviews:write",
  ],
  [RoleType.INVENTORY_MGR]: [
    "products:read",
    "products:write",
    "inventory:read",
    "inventory:write",
    "profile:read",
    "profile:write",
  ],
  [RoleType.ORDER_MGR]: [
    "products:read",
    "orders:read",
    "orders:write",
    "inventory:read",
    "profile:read",
    "profile:write",
  ],
  [RoleType.CONTENT_MGR]: [
    "products:read",
    "cms:read",
    "cms:write",
    "taste_map:write",
    "stores:write",
    "coupons:read",
    "coupons:write",
    "reviews:moderate",
    "profile:read",
    "profile:write",
  ],
  [RoleType.CUSTOMER]: [
    "products:read",
    "cms:read",
    "profile:read",
    "profile:write",
    "customer:orders:read",
    "customer:reviews:write",
  ],
};

/**
 * Validates if a given role possesses a specific permission.
 */
export function hasPermission(role: RoleType | string, permission: Permission): boolean {
  const roleEnum = role as RoleType;
  const permissions = RolePermissions[roleEnum] || [];
  return permissions.includes(permission);
}

/**
 * Checks if a user role is included in the allowed roles list.
 */
export function hasRole(userRole: RoleType | string, allowedRoles: (RoleType | string)[]): boolean {
  return allowedRoles.includes(userRole);
}

/**
 * Checks if a role is an administrative staff role.
 */
export function isAdminRole(role: RoleType | string): boolean {
  const adminRoles: (RoleType | string)[] = [
    RoleType.SUPER_ADMIN,
    RoleType.INVENTORY_MGR,
    RoleType.ORDER_MGR,
    RoleType.CONTENT_MGR,
  ];
  return adminRoles.includes(role);
}
