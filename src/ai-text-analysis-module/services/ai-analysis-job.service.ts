import { randomUUID } from "crypto";
import { CreateAiAnalysisJobsDto } from "../dto/create-ai-analysis-jobs.dto";
import { AiAnalysisJobRepository } from "../repositories/ai-analysis-job.repository";
import { LanguagePairValidatorService } from "./language-pair-validator.service";

export class AiAnalysisJobService {
    constructor(
        private readonly aiAnalysisJobRepository: AiAnalysisJobRepository,
        private readonly languagePairValidatorService: LanguagePairValidatorService
    ) {}

    async createJobs(dto: CreateAiAnalysisJobsDto) {
        const batchId = randomUUID();

        const uniqueTargetLanguages = [...new Set(dto.target_languages)];

        const jobsToCreate = [];

        for (const targetLanguage of uniqueTargetLanguages) {
            const validatedLanguagePair =
                await this.languagePairValidatorService.validate(
                    dto.source_language,
                    targetLanguage
                );

            jobsToCreate.push({
                batchId,
                title: dto.title,
                languageLevel: dto.language_level,
                languagePairId: validatedLanguagePair.languagePairId,
                originalText: dto.original_text,
            });
        }

        const jobs =
            await this.aiAnalysisJobRepository.createJobs(jobsToCreate);

        return {
            batch_id: batchId,
            jobs: jobs.map((job, index) => ({
                id: job.id,
                batch_id: job.batchId,
                title: job.title,
                language_level: job.languageLevel,
                source_language: dto.source_language,
                target_language: uniqueTargetLanguages[index],
                status: job.status,
            })),
        };
    }

    async getJob(id: string) {
        const job = await this.aiAnalysisJobRepository.findById(id);

        if (!job) {
            throw new Error("AI analysis job not found");
        }

        return this.toResponse(job);
    }

    async getRecentJobs() {
        const jobs = await this.aiAnalysisJobRepository.findRecent();

        return jobs.map((job) => this.toResponse(job));
    }

    private toResponse(job: any) {
        return {
            id: job.id,
            batch_id: job.batchId,
            title: job.title,
            language_level: job.languageLevel,
            source_language: job.languagePair?.sourceLanguage?.code,
            target_language: job.languagePair?.targetLanguage?.code,
            status: job.status,
            error_message: job.errorMessage,
            attempt_count: job.attemptCount,
            next_attempt_at: job.nextAttemptAt,
            started_at: job.startedAt,
            completed_at: job.completedAt,
            created_at: job.createdAt,
            updated_at: job.updatedAt,
            result_json: job.resultJson,
        };
    }
}
