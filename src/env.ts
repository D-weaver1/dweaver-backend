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
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
    console.error("Invalid environment variables:");
    console.error(parsedEnv.error.format());
    process.exit(1);
}

export const env = parsedEnv.data;
