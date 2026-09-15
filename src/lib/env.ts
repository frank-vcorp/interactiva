import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(32),
  COOKIE_SECURE: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  INTERACTIVA_SUPERUSER_PASSWORD: z.string().min(8).optional(),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      `Invalid environment: ${parsed.error.issues.map((i) => i.path.join(".")).join(", ")}`,
    );
  }
  cached = parsed.data;
  return cached;
}

export function isProduction(): boolean {
  return getEnv().NODE_ENV === "production";
}
