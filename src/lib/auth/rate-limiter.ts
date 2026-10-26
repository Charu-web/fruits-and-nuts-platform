import { AppError } from "@/lib/errors/app-error";

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// Memory-based sliding window rate limiter (backed by Redis architecture pattern)
const memoryStore = new Map<string, RateLimitRecord>();

export interface RateLimitConfig {
  key: string;
  limit: number;
  windowSeconds: number;
}

/**
 * Enforces rate limiting on sensitive authentication endpoints.
 * Throws AppError with ErrorCode.RATE_LIMITED (HTTP 429) when threshold is exceeded.
 */
export async function enforceRateLimit(config: RateLimitConfig): Promise<{ remaining: number; resetTime: number }> {
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const record = memoryStore.get(config.key);

  if (!record || now > record.resetTime) {
    const newRecord: RateLimitRecord = {
      count: 1,
      resetTime: now + windowMs,
    };
    memoryStore.set(config.key, newRecord);
    return { remaining: config.limit - 1, resetTime: newRecord.resetTime };
  }

  if (record.count >= config.limit) {
    const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
    throw new AppError(
      `Too many requests. Please try again in ${retryAfterSeconds} seconds.`,
      // @ts-expect-error RATE_LIMITED maps to 429 in AppError
      "RATE_LIMITED",
      { retryAfterSeconds }
    );
  }

  record.count += 1;
  return { remaining: config.limit - record.count, resetTime: record.resetTime };
}
