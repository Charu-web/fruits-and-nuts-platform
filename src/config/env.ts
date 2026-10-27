import { z } from "zod";
import "dotenv/config";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
  PORT: z.coerce.number().default(3000),
  NEXT_PUBLIC_APP_URL: z.string().url().default("https://fruits-and-nuts-platform.vercel.app"),

  // Database Connection
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DIRECT_URL: z.string().optional(),

  // Redis Cache
  REDIS_URL: z.string().default("redis://localhost:6379"),

  // Authentication
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
  JWT_EXPIRY_SECONDS: z.coerce.number().default(604800),

  // Payment Gateway (PAYMENT_PROVIDER_PENDING)
  PAYMENT_PROVIDER: z.string().default("GENERIC_ADAPTER"),
  PAYMENT_GATEWAY_KEY_ID: z.string().default("placeholder_key_id"),
  PAYMENT_GATEWAY_KEY_SECRET: z.string().default("placeholder_key_secret"),
  PAYMENT_GATEWAY_WEBHOOK_SECRET: z.string().default("placeholder_webhook_secret"),

  // Logistics (LOGISTICS_PROVIDER_PENDING)
  LOGISTICS_PROVIDER: z.string().default("GENERIC_ADAPTER"),
  LOGISTICS_API_TOKEN: z.string().default("placeholder_logistics_token"),

  // Cloud Storage
  STORAGE_PROVIDER: z.string().default("S3_COMPATIBLE"),
  STORAGE_BUCKET_NAME: z.string().default("fruits-and-nuts-media-dev"),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  // Allow fallback to development defaults if variables are not yet loaded
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build" || process.env.CI === "1";
    const sanitizedIssues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
    
    if (process.env.NODE_ENV === "production" && !isBuildPhase) {
      console.error("❌ CRITICAL: Invalid environment variable configuration:", sanitizedIssues);
      throw new Error("Failed to initialize server due to invalid environment variables.");
    }

    if (process.env.NODE_ENV === "production" && isBuildPhase) {
      console.warn("⚠️ BUILD PHASE: Environment variables missing during build collection, using safe build-time defaults:", sanitizedIssues);
    }
    // Return safe defaults for build time or local dev bootstrap
    return {
      NODE_ENV: process.env.NODE_ENV === "production" ? "production" : "development",
      PORT: 3000,
      NEXT_PUBLIC_APP_URL:
        process.env.NEXT_PUBLIC_APP_URL ||
        (process.env.VERCEL_PROJECT_PRODUCTION_URL
          ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
          : process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : "https://fruits-and-nuts-platform.vercel.app"),
      DATABASE_URL: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/fruits_and_nuts?schema=public",
      DIRECT_URL: process.env.DIRECT_URL,
      REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
      AUTH_SECRET: process.env.AUTH_SECRET || "0000000000000000000000000000000000000000000000000000000000000000",
      JWT_EXPIRY_SECONDS: 604800,
      PAYMENT_PROVIDER: "GENERIC_ADAPTER",
      PAYMENT_GATEWAY_KEY_ID: "placeholder_key_id",
      PAYMENT_GATEWAY_KEY_SECRET: "placeholder_key_secret",
      PAYMENT_GATEWAY_WEBHOOK_SECRET: "placeholder_webhook_secret",
      LOGISTICS_PROVIDER: "GENERIC_ADAPTER",
      LOGISTICS_API_TOKEN: "placeholder_logistics_token",
      STORAGE_PROVIDER: "S3_COMPATIBLE",
      STORAGE_BUCKET_NAME: "fruits-and-nuts-media-dev",
    };
  }

  return parsed.data;
}

export const env = validateEnv();
