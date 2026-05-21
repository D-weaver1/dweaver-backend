import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
    PORT: z.coerce.number().int().positive(),
    NODE_ENV: z
        .enum(["development", "production", "test"])
        .default("development"),

    POSTGRES_HOST: z.string().min(1),
    POSTGRES_PORT: z.coerce.number().int().positive(),
    POSTGRES_USER: z.string().min(1),
    POSTGRES_PASSWORD: z.string().min(1),
    POSTGRES_DB: z.string().min(1),

    AI_CHUNK_MAX_ESTIMATED_TOKENS: z.coerce
        .number()
        .int()
        .positive()
        .default(250000),

    AI_JOB_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
    AI_VALIDATION_MAX_ATTEMPTS: z.coerce.number().int().positive().default(9),
    AI_NETWORK_MAX_RETRIES: z.coerce.number().int().min(0).default(3),

    AI_TRANSIENT_RETRY_DELAY_MS: z.coerce
        .number()
        .int()
        .positive()
        .default(5 * 60 * 1000),

    AI_TRANSIENT_RETRY_MAX_DELAY_MS: z.coerce
        .number()
        .int()
        .positive()
        .default(30 * 60 * 1000),

    GEMINI_API_KEY: z.string().optional().default(""),
    GEMINI_MODEL: z.string().min(1).default("gemini-2.5-flash"),
    GEMINI_TIMEOUT_MS: z.coerce.number().int().positive().default(420000),

    GEMINI_RPM_LIMIT: z.coerce.number().int().positive().default(5),
    GEMINI_TPM_LIMIT: z.coerce.number().int().positive().default(250000),
    GEMINI_RPD_LIMIT: z.coerce.number().int().positive().default(20),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
    console.error("Invalid environment variables:");
    console.error(parsedEnv.error.format());
    process.exit(1);
}

export const env = parsedEnv.data;