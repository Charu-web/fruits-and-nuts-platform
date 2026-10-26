import { env } from "@/config/env";

export type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  requestId?: string;
  module?: string;
  userId?: string;
  [key: string]: unknown;
}

// Patterns for sensitive fields to redact automatically from logs
const SENSITIVE_KEYS = [
  "password",
  "passwordHash",
  "token",
  "authSecret",
  "secret",
  "key",
  "apiKey",
  "twoFactorSecret",
  "providerPaymentId",
  "signature",
  "creditCard",
  "cvv",
  "otp",
];

function sanitizeLogData(data: unknown): unknown {
  if (!data || typeof data !== "object") return data;

  if (Array.isArray(data)) {
    return data.map(sanitizeLogData);
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.some((sensitive) => key.toLowerCase().includes(sensitive.toLowerCase()))) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeLogData(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

class StructuredLogger {
  private formatLog(level: LogLevel, message: string, context?: LogContext, data?: unknown): string {
    const sanitizedCtx = context ? sanitizeLogData(context) : null;
    const sanitizedData = data ? sanitizeLogData(data) : null;

    const entry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      environment: env.NODE_ENV,
      ...(typeof sanitizedCtx === "object" && sanitizedCtx !== null ? { context: sanitizedCtx } : {}),
      ...(typeof sanitizedData === "object" && sanitizedData !== null ? { data: sanitizedData } : {}),
    };
    return JSON.stringify(entry);
  }

  info(message: string, context?: LogContext, data?: unknown): void {
    console.info(this.formatLog("info", message, context, data));
  }

  warn(message: string, context?: LogContext, data?: unknown): void {
    console.warn(this.formatLog("warn", message, context, data));
  }

  error(message: string, error?: unknown, context?: LogContext): void {
    const errorDetails = error instanceof Error
      ? { message: error.message, stack: env.NODE_ENV === "development" ? error.stack : undefined }
      : error;
    console.error(this.formatLog("error", message, context, errorDetails));
  }

  debug(message: string, context?: LogContext, data?: unknown): void {
    if (env.NODE_ENV === "development") {
      console.debug(this.formatLog("debug", message, context, data));
    }
  }
}

export const logger = new StructuredLogger();
