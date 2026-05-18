import { env } from "../../env";

type TokenReservation = {
    id: number;
    createdAt: number;
    promptTokens: number;
};

type RateLimitSnapshot = {
    rpm: {
        limit: number;
        used: number;
        remaining: number;
    };
    tpm: {
        limit: number;
        used: number;
        remaining: number;
    };
    rpd: {
        limit: number;
        used: number;
        remaining: number;
    };
};

export class AiRateLimitService {
    private readonly minuteWindowMs = 60_000;

    private requestTimestamps: number[] = [];
    private tokenReservations: TokenReservation[] = [];

    private currentDayKey = this.getCurrentDayKey();
    private dailyRequestCount = 0;

    private reservationSequence = 0;

    async reserveGeminiRequest(estimatedPromptTokens: number): Promise<number> {
        this.ensureCurrentDay();

        if (this.dailyRequestCount + 1 > env.GEMINI_RPD_LIMIT) {
            throw new Error(
                `Gemini daily request limit reached: ${this.dailyRequestCount}/${env.GEMINI_RPD_LIMIT}. Try again after the daily limit resets.`
            );
        }

        await this.waitForMinuteCapacity(estimatedPromptTokens);

        const now = Date.now();
        const reservationId = ++this.reservationSequence;

        this.requestTimestamps.push(now);
        this.tokenReservations.push({
            id: reservationId,
            createdAt: now,
            promptTokens: estimatedPromptTokens,
        });

        this.dailyRequestCount += 1;

        console.log("[RATE_LIMIT] Gemini request reserved");
        console.log("[RATE_LIMIT] Current usage:", this.getSnapshot());

        return reservationId;
    }

    completeGeminiRequest(
        reservationId: number,
        actualPromptTokens?: number
    ): RateLimitSnapshot {
        if (typeof actualPromptTokens === "number" && actualPromptTokens >= 0) {
            const reservation = this.tokenReservations.find(
                (item) => item.id === reservationId
            );

            if (reservation) {
                reservation.promptTokens = actualPromptTokens;
            }
        }

        const snapshot = this.getSnapshot();

        console.log("[RATE_LIMIT] Gemini request completed");
        console.log("[RATE_LIMIT] Current usage:", snapshot);

        return snapshot;
    }

    getSnapshot(): RateLimitSnapshot {
        this.ensureCurrentDay();
        this.removeExpiredMinuteEntries();

        const usedRequestsPerMinute = this.requestTimestamps.length;
        const usedTokensPerMinute = this.tokenReservations.reduce(
            (sum, item) => sum + item.promptTokens,
            0
        );

        return {
            rpm: {
                limit: env.GEMINI_RPM_LIMIT,
                used: usedRequestsPerMinute,
                remaining: Math.max(
                    env.GEMINI_RPM_LIMIT - usedRequestsPerMinute,
                    0
                ),
            },
            tpm: {
                limit: env.GEMINI_TPM_LIMIT,
                used: usedTokensPerMinute,
                remaining: Math.max(
                    env.GEMINI_TPM_LIMIT - usedTokensPerMinute,
                    0
                ),
            },
            rpd: {
                limit: env.GEMINI_RPD_LIMIT,
                used: this.dailyRequestCount,
                remaining: Math.max(
                    env.GEMINI_RPD_LIMIT - this.dailyRequestCount,
                    0
                ),
            },
        };
    }

    private async waitForMinuteCapacity(
        estimatedPromptTokens: number
    ): Promise<void> {
        while (true) {
            this.removeExpiredMinuteEntries();

            const now = Date.now();

            const usedRequestsPerMinute = this.requestTimestamps.length;
            const usedTokensPerMinute = this.tokenReservations.reduce(
                (sum, item) => sum + item.promptTokens,
                0
            );

            const rpmExceeded =
                usedRequestsPerMinute + 1 > env.GEMINI_RPM_LIMIT;

            const tpmExceeded =
                usedTokensPerMinute + estimatedPromptTokens >
                env.GEMINI_TPM_LIMIT;

            if (!rpmExceeded && !tpmExceeded) {
                return;
            }

            const oldestRequestTimestamp = this.requestTimestamps[0] ?? now;
            const oldestTokenTimestamp =
                this.tokenReservations[0]?.createdAt ?? now;

            const rpmWaitMs = rpmExceeded
                ? this.minuteWindowMs - (now - oldestRequestTimestamp)
                : 0;

            const tpmWaitMs = tpmExceeded
                ? this.minuteWindowMs - (now - oldestTokenTimestamp)
                : 0;

            const waitMs = Math.max(rpmWaitMs, tpmWaitMs, 1000);

            console.log(
                `[RATE_LIMIT] Waiting ${waitMs} ms before Gemini request`
            );

            await this.delay(waitMs + 250);
        }
    }

    private removeExpiredMinuteEntries(): void {
        const now = Date.now();
        const minTimestamp = now - this.minuteWindowMs;

        this.requestTimestamps = this.requestTimestamps.filter(
            (timestamp) => timestamp >= minTimestamp
        );

        this.tokenReservations = this.tokenReservations.filter(
            (item) => item.createdAt >= minTimestamp
        );
    }

    private ensureCurrentDay(): void {
        const dayKey = this.getCurrentDayKey();

        if (dayKey !== this.currentDayKey) {
            this.currentDayKey = dayKey;
            this.dailyRequestCount = 0;
        }
    }

    private getCurrentDayKey(): string {
        return new Date().toISOString().slice(0, 10);
    }

    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }
}
