import { Request, Response } from "express";
import { createAiTextAnalysisSchema } from "./schemas/create-ai-text-analysis.schema";
import { AiTextAnalysisService } from "./ai-text-analysis.service";

export class AiTextAnalysisController {
    constructor(
        private readonly aiTextAnalysisService: AiTextAnalysisService
    ) {}

    analyze = async (req: Request, res: Response): Promise<void> => {
        try {
            const parseResult = createAiTextAnalysisSchema.safeParse(req.body);

            if (!parseResult.success) {
                res.status(400).json({
                    message: "Invalid request body",
                    error: parseResult.error.flatten(),
                });
                return;
            }

            const result = await this.aiTextAnalysisService.analyze(
                parseResult.data
            );

            res.status(200).json(result);
        } catch (error) {
            console.error(error);

            res.status(500).json({
                message: "Failed to analyze text",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    };
}