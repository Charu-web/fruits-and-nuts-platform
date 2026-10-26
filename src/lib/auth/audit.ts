import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export type AuthAuditEvent =
  | "REGISTER"
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILURE"
  | "ADMIN_LOGIN_SUCCESS"
  | "LOGIN_2FA_FAILURE"
  | "UNAUTHORIZED_ADMIN_ACCESS_ATTEMPT"
  | "LOGOUT"
  | "PASSWORD_RESET_REQUESTED"
  | "PASSWORD_RESET_COMPLETED"
  | "EMAIL_VERIFICATION_SENT"
  | "EMAIL_VERIFIED"
  | "ROLE_CHANGED"
  | "ACCOUNT_DEACTIVATED";

interface AuditContext {
  actorId?: string;
  targetId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Records an authentication security event in the structured audit log and database.
 */
export async function logAuthEvent(event: AuthAuditEvent, context: AuditContext): Promise<void> {
  // 1. Emit structured application log (sensitive data auto-redacted)
  logger.info(`[AUTH_AUDIT] ${event}`, {
    module: "AUTH",
    event,
    actorId: context.actorId,
    targetId: context.targetId,
    ipAddress: context.ipAddress,
  });

  // 2. Persist audit log entry to database if actor/target available
  try {
    const rawActor = context.actorId || context.targetId;
    const isUuid = rawActor && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawActor);
    if (context.actorId || context.targetId) {
      await db.auditLog.create({
        data: {
          actorId: isUuid ? rawActor : null,
          action: `AUTH_${event}`,
          entityName: "User",
          entityId: context.targetId || context.actorId || "ANONYMOUS",
          newState: context.metadata ? (context.metadata as object) : undefined,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        },
      });
    }
  } catch (err) {
    // Audit logging failure should not crash the request, but must be logged
    logger.warn("Failed to persist auth audit log entry to database", { event }, err);
  }
}
