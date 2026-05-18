import { Request, Response } from "express";
import { createAiAnalysisJobsSchema } from "./schemas/create-ai-analysis-jobs.schema";
import { AiAnalysisJobService } from "./services/ai-analysis-job.service";

export class AiAnalysisJobController {
    constructor(private readonly aiAnalysisJobService: AiAnalysisJobService) {}

    createJobs = async (req: Request, res: Response): Promise<void> => {
        try {
            const parseResult = createAiAnalysisJobsSchema.safeParse(req.body);

            if (!parseResult.success) {
                res.status(400).json({
                    message: "Invalid request body",
                    error: parseResult.error.flatten(),
                });
                return;
            }

            const result = await this.aiAnalysisJobService.createJobs(
                parseResult.data
            );

            res.status(202).json(result);
        } catch (error) {
            console.error(error);

            res.status(500).json({
                message: "Failed to create AI analysis jobs",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    };

    getJob = async (req: Request, res: Response): Promise<void> => {
        try {
            const job = await this.aiAnalysisJobService.getJob(req.params.id);

            res.status(200).json(job);
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "Unknown error";

            if (message.includes("not found")) {
                res.status(404).json({
                    message,
                });
                return;
            }

            res.status(500).json({
                message: "Failed to get AI analysis job",
                error: message,
            });
        }
    };

    getRecentJobs = async (_req: Request, res: Response): Promise<void> => {
        try {
            const jobs = await this.aiAnalysisJobService.getRecentJobs();

            res.status(200).json(jobs);
        } catch (error) {
            res.status(500).json({
                message: "Failed to get AI analysis jobs",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    };
}
