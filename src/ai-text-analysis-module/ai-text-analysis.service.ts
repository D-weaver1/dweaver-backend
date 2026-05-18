import { CreateAiTextAnalysisDto } from "./dto/create-ai-text-analysis.dto";
import { PromptBuilderService } from "./services/prompt-builder.service";
import { TextPreprocessorService } from "./services/text-preprocessor.service";
import { AiClientService } from "./services/ai-client.service";
import { ResponseParserService } from "./services/response-parser.service";
import { ResponseValidatorService } from "./services/response-validator.service";
import { LanguagePairValidatorService } from "./services/language-pair-validator.service";
import { TextChunk, TextChunkerService } from "./services/text-chunker.service";
import { AnalysisResultMergerService } from "./services/analysis-result-merger.service";
import { AiAnalysisResult } from "./types/ai-analysis-result.type";

export class AiTextAnalysisService {
    private readonly maxValidationAttempts = 3;
    private readonly maxNetworkRetries = 2;

    constructor(
        private readonly textPreprocessorService: TextPreprocessorService,
        private readonly promptBuilderService: PromptBuilderService,
        private readonly aiClientService: AiClientService,
        private readonly responseParserService: ResponseParserService,
        private readonly responseValidatorService: ResponseValidatorService,
        private readonly languagePairValidatorService: LanguagePairValidatorService,
        private readonly textChunkerService: TextChunkerService,
        private readonly analysisResultMergerService: AnalysisResultMergerService
    ) {}

    async analyze(dto: CreateAiTextAnalysisDto): Promise<AiAnalysisResult> {
        console.log("[AI] Starting direct text analysis");

        await this.languagePairValidatorService.validate(
            dto.source_language,
            dto.target_language
        );

        const state = this.createInitialProcessingState({
            title: dto.title,
            sourceLanguage: dto.source_language,
            targetLanguage: dto.target_language,
            originalText: dto.original_text,
        });

        let mergedResult = state.initialResult;

        for (const chunk of state.chunks) {
            const chunkResult = await this.analyzeChunk({
                title: dto.title,
                sourceLanguage: dto.source_language,
                targetLanguage: dto.target_language,
                chunkText: chunk.text,
                chunkIndex: chunk.index,
            });

            mergedResult = this.mergeChunkResult(mergedResult, chunkResult);
        }

        return mergedResult;
    }

    createInitialProcessingState(params: {
        title: string;
        sourceLanguage: string;
        targetLanguage: string;
        originalText: string;
    }): {
        preprocessedText: string;
        chunks: TextChunk[];
        initialResult: AiAnalysisResult;
    } {
        const preprocessedText = this.textPreprocessorService.preprocess(
            params.originalText
        );

        const chunks = this.textChunkerService.split(preprocessedText);

        const initialResult = this.analysisResultMergerService.createBaseResult(
            {
                title: params.title,
                sourceLanguage: params.sourceLanguage,
                targetLanguage: params.targetLanguage,
                originalText: preprocessedText,
            }
        );

        return {
            preprocessedText,
            chunks,
            initialResult,
        };
    }

    async analyzeChunk(params: {
        title: string;
        sourceLanguage: string;
        targetLanguage: string;
        chunkText: string;
        chunkIndex: number;
    }): Promise<AiAnalysisResult> {
        let prompt = this.promptBuilderService.build({
            title: params.title,
            sourceLanguage: params.sourceLanguage,
            targetLanguage: params.targetLanguage,
            originalText: params.chunkText,
        });

        for (
            let validationAttempt = 1;
            validationAttempt <= this.maxValidationAttempts;
            validationAttempt++
        ) {
            console.log(
                `[AI] Chunk ${params.chunkIndex + 1}: validation attempt ${validationAttempt}/${this.maxValidationAttempts}`
            );
            console.log("[AI] Prompt length:", prompt.length);

            let rawResponse: string | null = null;

            for (
                let networkRetry = 0;
                networkRetry <= this.maxNetworkRetries;
                networkRetry++
            ) {
                const networkTryNumber = networkRetry + 1;

                try {
                    console.log(
                        `[AI] Chunk ${params.chunkIndex + 1}: network try ${networkTryNumber}/${this.maxNetworkRetries + 1}`
                    );

                    rawResponse = await this.aiClientService.analyze(prompt);

                    console.log("[AI] Raw response received");
                    console.log(
                        "[AI] Raw response length:",
                        rawResponse.length
                    );

                    break;
                } catch (error) {
                    const networkErrorMessage =
                        error instanceof Error
                            ? error.message
                            : "Unknown error";

                    console.error(
                        `[AI] Chunk ${params.chunkIndex + 1}: network try ${networkTryNumber} failed: ${networkErrorMessage}`
                    );

                    if (!this.isRetryableRequestError(networkErrorMessage)) {
                        throw error;
                    }

                    if (this.isDailyLimitError(networkErrorMessage)) {
                        throw error;
                    }

                    if (networkRetry === this.maxNetworkRetries) {
                        throw new Error(
                            `AI request failed for chunk ${
                                params.chunkIndex + 1
                            } after ${
                                this.maxNetworkRetries + 1
                            } network tries: ${networkErrorMessage}`
                        );
                    }

                    const waitMs = this.getRetryDelayMs(networkErrorMessage);

                    console.log(
                        `[AI] Waiting ${waitMs} ms before retrying the same chunk`
                    );

                    await this.delay(waitMs);
                }
            }

            if (!rawResponse) {
                throw new Error(
                    `AI response was not received for chunk ${params.chunkIndex + 1}`
                );
            }

            try {
                const parsedResponse =
                    this.responseParserService.parse(rawResponse);

                console.log("[AI] Parsed response successfully");

                const validatedResponse =
                    this.responseValidatorService.validate(parsedResponse);

                console.log(
                    `[AI] Chunk ${params.chunkIndex + 1}: validation passed`
                );

                return validatedResponse;
            } catch (error) {
                const validationErrorMessage =
                    error instanceof Error ? error.message : "Unknown error";

                console.error(
                    `[AI] Chunk ${params.chunkIndex + 1}: validation attempt ${validationAttempt} failed: ${validationErrorMessage}`
                );

                if (validationAttempt === this.maxValidationAttempts) {
                    throw new Error(
                        `AI analysis failed for chunk ${
                            params.chunkIndex + 1
                        } after ${
                            this.maxValidationAttempts
                        } validation attempts: ${validationErrorMessage}`
                    );
                }

                prompt = this.promptBuilderService.buildRetryPrompt({
                    previousPrompt: prompt,
                    validationError: validationErrorMessage,
                });
            }
        }

        throw new Error(
            `AI analysis failed for chunk ${params.chunkIndex + 1}`
        );
    }

    mergeChunkResult(
        target: AiAnalysisResult,
        chunkResult: AiAnalysisResult
    ): AiAnalysisResult {
        return this.analysisResultMergerService.mergeChunk(target, chunkResult);
    }

    private isRetryableRequestError(message: string): boolean {
        const normalizedMessage = message.toLowerCase();

        return (
            normalizedMessage.includes("fetch failed") ||
            normalizedMessage.includes("timeout") ||
            normalizedMessage.includes("aborted") ||
            normalizedMessage.includes("econnrefused") ||
            normalizedMessage.includes("network") ||
            normalizedMessage.includes("429") ||
            normalizedMessage.includes("rate limit") ||
            normalizedMessage.includes("quota") ||
            normalizedMessage.includes("resource_exhausted") ||
            normalizedMessage.includes("too many requests")
        );
    }

    private isDailyLimitError(message: string): boolean {
        const normalizedMessage = message.toLowerCase();

        return (
            normalizedMessage.includes("daily") ||
            normalizedMessage.includes("rpd") ||
            normalizedMessage.includes("requests per day")
        );
    }

    private getRetryDelayMs(message: string): number {
        const normalizedMessage = message.toLowerCase();

        if (
            normalizedMessage.includes("429") ||
            normalizedMessage.includes("rate limit") ||
            normalizedMessage.includes("quota") ||
            normalizedMessage.includes("resource_exhausted") ||
            normalizedMessage.includes("too many requests")
        ) {
            return 60_000;
        }

        return 5_000;
    }

    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }
}
