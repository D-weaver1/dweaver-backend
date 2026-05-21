import { env } from "../../env";

export const aiJobConfig = {
    maxAttempts: env.AI_JOB_MAX_ATTEMPTS,

    validationMaxAttempts: env.AI_VALIDATION_MAX_ATTEMPTS,
    networkMaxRetries: env.AI_NETWORK_MAX_RETRIES,

    transientRetryDelayMs: env.AI_TRANSIENT_RETRY_DELAY_MS,
    transientRetryMaxDelayMs: env.AI_TRANSIENT_RETRY_MAX_DELAY_MS,
};