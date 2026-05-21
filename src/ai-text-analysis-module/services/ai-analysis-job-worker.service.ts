import { AiAnalysisJobRepository } from "../repositories/ai-analysis-job.repository";
import { AiTextAnalysisService } from "../ai-text-analysis.service";
import { AiAnalysisResult } from "../types/ai-analysis-result.type";
import { TextChunk } from "./text-chunker.service";
import { MaterialProcessingService } from "../../adaptive-reading-module/material-processing/material-processing.service";
import { CreateMaterialProcessingDto } from "../../adaptive-reading-module/material-processing/dto/create-material-processing.dto";
import { aiJobConfig } from "../config/ai-job.config";

export class AiAnalysisJobWorkerService {
    private readonly intervalMs = 5000;
    private isRunning = false;
    private intervalId: NodeJS.Timeout | null = null;

    constructor(
        private readonly aiAnalysisJobRepository: AiAnalysisJobRepository,
        private readonly aiTextAnalysisService: AiTextAnalysisService,
        private readonly materialProcessingService: MaterialProcessingService
    ) {}

    start(): void {
        if (this.intervalId) {
            return;
        }

        console.log("[AI_WORKER] Started");

        this.intervalId = setInterval(() => {
            void this.tick();
        }, this.intervalMs);
    }

    private async tick(): Promise<void> {
        if (this.isRunning) {
            return;
        }

        this.isRunning = true;

        try {
            await this.processOneJob();
        } catch (error) {
            console.error("[AI_WORKER] Unexpected worker error:", error);
        } finally {
            this.isRunning = false;
        }
    }

    private async processOneJob(): Promise<void> {
        const job = await this.aiAnalysisJobRepository.pickNextProcessableJob();

        if (!job) {
            return;
        }

        console.log(`[AI_WORKER] Processing job ${job.id}`);

        const payload = await this.aiAnalysisJobRepository.findPayloadByJobId(
            job.id
        );

        if (!payload) {
            await this.aiAnalysisJobRepository.markFailed(
                job,
                "Job payload not found"
            );
            return;
        }

        try {
            const sourceLanguage = job.languagePair.sourceLanguage.code;
            const targetLanguage = job.languagePair.targetLanguage.code;

            const processingState = await this.getOrCreateProcessingState({
                jobId: job.id,
                title: job.title,
                sourceLanguage,
                targetLanguage,
                originalText: payload.originalText,
                chunksJson: payload.chunksJson,
                partialResultJson: payload.partialResultJson,
            });

            let partialResult = processingState.partialResult;
            const chunks = processingState.chunks;

            await this.aiAnalysisJobRepository.updateProgress(job, {
                currentChunkIndex: job.currentChunkIndex,
                totalChunks: chunks.length,
            });

            for (
                let chunkIndex = job.currentChunkIndex;
                chunkIndex < chunks.length;
                chunkIndex++
            ) {
                const chunk = chunks[chunkIndex];

                console.log(
                    `[AI_WORKER] Job ${job.id}: processing chunk ${
                        chunkIndex + 1
                    }/${chunks.length}`
                );

                const chunkResult =
                    await this.aiTextAnalysisService.analyzeChunk({
                        title: job.title,
                        sourceLanguage,
                        targetLanguage,
                        languageLevel: job.languageLevel,
                        chunkText: chunk.text,
                        chunkIndex,
                    });

                partialResult = this.aiTextAnalysisService.mergeChunkResult(
                    partialResult,
                    chunkResult
                );

                const nextChunkIndex = chunkIndex + 1;

                await this.aiAnalysisJobRepository.savePayloadProcessingState(
                    job.id,
                    {
                        partialResultJson: partialResult,
                    }
                );

                await this.aiAnalysisJobRepository.updateProgress(job, {
                    currentChunkIndex: nextChunkIndex,
                    totalChunks: chunks.length,
                });

                job.currentChunkIndex = nextChunkIndex;
                job.totalChunks = chunks.length;

                console.log(
                    `[AI_WORKER] Job ${job.id}: chunk ${nextChunkIndex}/${chunks.length} saved`
                );
            }

            const resultForSecondModule: CreateMaterialProcessingDto = {
                title: job.title,
                language_level: job.languageLevel,
                source_language: sourceLanguage,
                target_language: targetLanguage,
                original_text: payload.originalText,
                text_units: partialResult.text_units,
                pairs: partialResult.pairs,
            };

            console.log(
                `[AI_WORKER] Job ${job.id}: sending result to material-processing module`
            );

            const materialProcessingResult =
                await this.materialProcessingService.createMaterialFromJson(
                    resultForSecondModule
                );

            console.log(
                `[AI_WORKER] Job ${job.id}: material-processing completed`
            );

            await this.aiAnalysisJobRepository.markCompleted(job, {
                sent_to_material_processing: true,
                material_processing_result: materialProcessingResult,
            });

            await this.aiAnalysisJobRepository.deletePayloadByJobId(job.id);

            console.log(`[AI_WORKER] Job ${job.id} completed`);
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "Unknown error";

            console.error(`[AI_WORKER] Job ${job.id} failed: ${message}`);

            if (this.isDailyLimitError(message)) {
                await this.aiAnalysisJobRepository.markWaitingRateLimit(
                    job,
                    message,
                    this.getNextDayDate()
                );
                return;
            }

            if (this.isTransientProviderError(message)) {
                if (job.attemptCount >= aiJobConfig.maxAttempts) {
                    await this.aiAnalysisJobRepository.markFailed(job, message);
                    return;
                }

                const nextAttemptAt = this.getTransientRetryDate(
                    job.attemptCount
                );

                console.warn(
                    `[AI_WORKER] Job ${job.id}: provider unavailable, retry scheduled at ${nextAttemptAt.toISOString()}`
                );

                await this.aiAnalysisJobRepository.markWaitingRetry(
                    job,
                    message,
                    nextAttemptAt
                );

                return;
            }

            if (job.attemptCount >= aiJobConfig.maxAttempts) {
                await this.aiAnalysisJobRepository.markFailed(job, message);
                return;
            }

            await this.aiAnalysisJobRepository.markWaitingRetry(
                job,
                message,
                this.getTransientRetryDate(job.attemptCount)
            );
        }
    }

    private async getOrCreateProcessingState(params: {
        jobId: string;
        title: string;
        sourceLanguage: string;
        targetLanguage: string;
        originalText: string;
        chunksJson: unknown | null;
        partialResultJson: unknown | null;
    }): Promise<{
        chunks: TextChunk[];
        partialResult: AiAnalysisResult;
    }> {
        if (
            this.isTextChunkArray(params.chunksJson) &&
            this.isAiAnalysisResult(params.partialResultJson)
        ) {
            console.log("[AI_WORKER] Existing chunk progress found");

            return {
                chunks: params.chunksJson,
                partialResult: params.partialResultJson,
            };
        }

        console.log("[AI_WORKER] Creating initial chunk progress");

        const initialState =
            this.aiTextAnalysisService.createInitialProcessingState({
                title: params.title,
                sourceLanguage: params.sourceLanguage,
                targetLanguage: params.targetLanguage,
                originalText: params.originalText,
            });

        await this.aiAnalysisJobRepository.savePayloadProcessingState(
            params.jobId,
            {
                chunksJson: initialState.chunks,
                partialResultJson: initialState.initialResult,
            }
        );

        return {
            chunks: initialState.chunks,
            partialResult: initialState.initialResult,
        };
    }

    private isTextChunkArray(value: unknown): value is TextChunk[] {
        if (!Array.isArray(value)) {
            return false;
        }

        return value.every(
            (item) =>
                typeof item === "object" &&
                item !== null &&
                typeof (item as TextChunk).index === "number" &&
                typeof (item as TextChunk).text === "string" &&
                typeof (item as TextChunk).estimatedTokens === "number"
        );
    }

    private isAiAnalysisResult(value: unknown): value is AiAnalysisResult {
        if (typeof value !== "object" || value === null) {
            return false;
        }

        const result = value as AiAnalysisResult;

        return (
            typeof result.title === "string" &&
            typeof result.source_language === "string" &&
            typeof result.target_language === "string" &&
            typeof result.original_text === "string" &&
            Array.isArray(result.text_units) &&
            Array.isArray(result.pairs)
        );
    }

    private isDailyLimitError(message: string): boolean {
        const normalized = message.toLowerCase();

        return (
            normalized.includes("daily") ||
            normalized.includes("rpd") ||
            normalized.includes("requests per day")
        );
    }

    private getNextDayDate(): Date {
        const date = new Date();

        date.setDate(date.getDate() + 1);
        date.setHours(0, 5, 0, 0);

        return date;
    }

    private isTransientProviderError(message: string): boolean {
        const normalized = message.toLowerCase();

        return (
            normalized.includes("503") ||
            normalized.includes("service unavailable") ||
            normalized.includes("unavailable") ||
            normalized.includes("high demand") ||
            normalized.includes("try again later") ||
            normalized.includes("overloaded")
        );
    }

    private getTransientRetryDate(attemptCount: number): Date {
        const multiplier = Math.max(1, Math.min(attemptCount, 6));

        const delayMs = Math.min(
            aiJobConfig.transientRetryDelayMs * multiplier,
            aiJobConfig.transientRetryMaxDelayMs
        );

        return new Date(Date.now() + delayMs);
    }
}
