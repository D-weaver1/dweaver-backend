import { env } from "../../env";
import { AiRateLimitService } from "./ai-rate-limit.service";

type OllamaChatResponse = {
    model?: string;
    message?: {
        role?: string;
        content?: string;
        thinking?: string;
    };
    done?: boolean;
    total_duration?: number;
};

type GeminiUsageMetadata = {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
    thoughtsTokenCount?: number;
};

type GeminiGenerateContentResponse = {
    candidates?: Array<{
        content?: {
            parts?: Array<{
                text?: string;
            }>;
        };
    }>;
    usageMetadata?: GeminiUsageMetadata;
};

const geminiAnalysisResponseSchema = {
    type: "OBJECT",
    properties: {
        title: {
            type: "STRING",
        },
        source_language: {
            type: "STRING",
        },
        target_language: {
            type: "STRING",
        },
        original_text: {
            type: "STRING",
        },
        text_units: {
            type: "ARRAY",
            items: {
                type: "STRING",
            },
        },
        pairs: {
            type: "ARRAY",
            items: {
                type: "OBJECT",
                properties: {
                    source_text: {
                        type: "STRING",
                    },
                    target_text: {
                        type: "STRING",
                    },
                    occurrence_indexes: {
                        type: "ARRAY",
                        items: {
                            type: "INTEGER",
                        },
                    },
                },
                required: ["source_text", "target_text", "occurrence_indexes"],
                propertyOrdering: [
                    "source_text",
                    "target_text",
                    "occurrence_indexes",
                ],
            },
        },
    },
    required: [
        "title",
        "source_language",
        "target_language",
        "original_text",
        "text_units",
        "pairs",
    ],
    propertyOrdering: [
        "title",
        "source_language",
        "target_language",
        "original_text",
        "text_units",
        "pairs",
    ],
};

export class AiClientService {
    private readonly rateLimitService = new AiRateLimitService();

    async analyze(prompt: string): Promise<string> {
        if (env.AI_PROVIDER === "gemini") {
            return this.analyzeWithGemini(prompt);
        }

        return this.analyzeWithOllama(prompt);
    }

    private async analyzeWithOllama(prompt: string): Promise<string> {
        console.log("[OLLAMA] Sending request...");
        console.log("[OLLAMA] Model:", env.OLLAMA_MODEL);
        console.log("[OLLAMA] Prompt length:", prompt.length);

        const startedAt = Date.now();

        const response = await fetch(`${env.OLLAMA_BASE_URL}/chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: env.OLLAMA_MODEL,
                stream: false,
                options: {
                    temperature: 0,
                },
                messages: [
                    {
                        role: "system",
                        content:
                            "Return only valid JSON. Do not use markdown. Do not add explanations.",
                    },
                    {
                        role: "user",
                        content: prompt,
                    },
                ],
            }),
            signal: AbortSignal.timeout(env.OLLAMA_TIMEOUT_MS),
        });

        const finishedAt = Date.now();

        console.log("[OLLAMA] Response received");
        console.log("[OLLAMA] Status:", response.status, response.statusText);
        console.log("[OLLAMA] Duration ms:", finishedAt - startedAt);

        if (!response.ok) {
            const errorText = await response.text();

            throw new Error(
                `Ollama request failed: ${response.status} ${response.statusText}. ${errorText}`
            );
        }

        const data = (await response.json()) as OllamaChatResponse;
        const content = data.message?.content;

        if (!content || typeof content !== "string") {
            throw new Error("Ollama response content is missing");
        }

        console.log("[OLLAMA] Response content length:", content.length);

        return content;
    }

    private async analyzeWithGemini(prompt: string): Promise<string> {
        if (!env.GEMINI_API_KEY) {
            throw new Error(
                "GEMINI_API_KEY is required when AI_PROVIDER=gemini"
            );
        }

        const estimatedPromptTokens = Math.ceil(prompt.length / 4);

        const reservationId = await this.rateLimitService.reserveGeminiRequest(
            estimatedPromptTokens
        );

        console.log("[GEMINI] Sending request...");
        console.log("[GEMINI] Model:", env.GEMINI_MODEL);
        console.log("[GEMINI] Prompt length:", prompt.length);
        console.log("[GEMINI] Estimated prompt tokens:", estimatedPromptTokens);

        const startedAt = Date.now();

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": env.GEMINI_API_KEY,
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: prompt,
                                },
                            ],
                        },
                    ],
                    generationConfig: {
                        temperature: 0,
                        responseMimeType: "application/json",
                        responseSchema: geminiAnalysisResponseSchema,
                    },
                }),
                signal: AbortSignal.timeout(env.GEMINI_TIMEOUT_MS),
            }
        );

        const finishedAt = Date.now();

        console.log("[GEMINI] Response received");
        console.log("[GEMINI] Status:", response.status, response.statusText);
        console.log("[GEMINI] Duration ms:", finishedAt - startedAt);

        if (!response.ok) {
            const errorText = await response.text();

            throw new Error(
                `Gemini request failed: ${response.status} ${response.statusText}. ${errorText}`
            );
        }

        const data = (await response.json()) as GeminiGenerateContentResponse;
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!content || typeof content !== "string") {
            throw new Error("Gemini response content is missing");
        }

        const usage = data.usageMetadata;

        if (usage) {
            console.log("[GEMINI] Token usage:", {
                promptTokenCount: usage.promptTokenCount,
                candidatesTokenCount: usage.candidatesTokenCount,
                thoughtsTokenCount: usage.thoughtsTokenCount,
                totalTokenCount: usage.totalTokenCount,
            });

            this.rateLimitService.completeGeminiRequest(
                reservationId,
                usage.promptTokenCount
            );
        } else {
            console.log("[GEMINI] Token usage metadata is missing");

            this.rateLimitService.completeGeminiRequest(reservationId);
        }

        console.log("[GEMINI] Response content length:", content.length);

        return content;
    }

    resetAttempts(): void {
        // nothing to reset
    }
}
