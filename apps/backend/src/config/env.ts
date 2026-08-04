import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().min(1),
  WEB_ORIGIN: z.string().url().default("http://localhost:5175"),
  ACCESS_TOKEN_SECRET: z.string().min(32),
  REFRESH_TOKEN_SECRET: z.string().min(32),
  REALTIME_TICKET_SECRET: z.string().min(32),
  AUTH_RATE_LIMIT: z.coerce.number().int().positive().default(20),
  EMAIL_PROVIDER: z.enum(["resend", "memory"]).default("memory"),
  EMAIL_FROM: z.string().default("RelayOps <no-reply@mail.khalidoyeneye.dev>"),
  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_WEBHOOK_SECRET: z.string().min(1).optional(),
  EMAIL_PAYLOAD_SECRET: z.string().min(32).default("local-email-payload-secret-change-me"),
  DEMO_PASSWORD: z.string().min(12).optional(),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info")
});

export type AppEnv = z.infer<typeof envSchema>;

let cachedEnv: AppEnv | undefined;

export function getEnv(): AppEnv {
  cachedEnv ??= envSchema.parse(process.env);
  return cachedEnv;
}
