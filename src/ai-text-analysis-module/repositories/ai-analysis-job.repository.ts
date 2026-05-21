import { DataSource, EntityManager, IsNull, LessThanOrEqual } from "typeorm";
import {
    AiAnalysisJob,
    AiAnalysisJobPayload,
    AiAnalysisJobStatus,
    LanguageLevel,
    LanguagePair,
} from "../../entities";
import { AiAnalysisResult } from "../types/ai-analysis-result.type";
import { TextChunk } from "../services/text-chunker.service";

type CreateJobInput = {
    batchId: string;
    title: string;
    languageLevel: LanguageLevel;
    languagePairId: string;
    originalText: string;
};

export class AiAnalysisJobRepository {
    constructor(private readonly dataSource: DataSource) {}

    async createJobs(inputs: CreateJobInput[]): Promise<AiAnalysisJob[]> {
        return this.dataSource.transaction(async (manager) => {
            const jobs: AiAnalysisJob[] = [];

            for (const input of inputs) {
                const job = await this.createJob(manager, input);
                jobs.push(job);
            }

            return jobs;
        });
    }

    async findById(id: string): Promise<AiAnalysisJob | null> {
        return this.dataSource.getRepository(AiAnalysisJob).findOne({
            where: { id },
            relations: {
                languagePair: {
                    sourceLanguage: true,
                    targetLanguage: true,
                },
            },
        });
    }

    async findRecent(limit = 20): Promise<AiAnalysisJob[]> {
        return this.dataSource.getRepository(AiAnalysisJob).find({
            relations: {
                languagePair: {
                    sourceLanguage: true,
                    targetLanguage: true,
                },
            },
            order: {
                createdAt: "DESC",
            },
            take: limit,
        });
    }

    async findPayloadByJobId(
        jobId: string
    ): Promise<AiAnalysisJobPayload | null> {
        return this.dataSource.getRepository(AiAnalysisJobPayload).findOne({
            where: {
                job: {
                    id: jobId,
                },
            },
        });
    }

    async savePayloadProcessingState(
        jobId: string,
        input: {
            chunksJson?: TextChunk[];
            partialResultJson?: AiAnalysisResult;
        }
    ): Promise<void> {
        const payloadRepository =
            this.dataSource.getRepository(AiAnalysisJobPayload);

        const payload = await this.findPayloadByJobId(jobId);

        if (!payload) {
            throw new Error("Job payload not found");
        }

        if (input.chunksJson !== undefined) {
            payload.chunksJson = input.chunksJson;
        }

        if (input.partialResultJson !== undefined) {
            payload.partialResultJson = input.partialResultJson;
        }

        await payloadRepository.save(payload);
    }

    async deletePayloadByJobId(jobId: string): Promise<void> {
        await this.dataSource
            .getRepository(AiAnalysisJobPayload)
            .createQueryBuilder()
            .delete()
            .where("job_id = :jobId", { jobId })
            .execute();
    }

    async pickNextProcessableJob(): Promise<AiAnalysisJob | null> {
        const jobRepository = this.dataSource.getRepository(AiAnalysisJob);

        const job = await jobRepository.findOne({
            where: [
                {
                    status: AiAnalysisJobStatus.PENDING,
                },
                {
                    status: AiAnalysisJobStatus.WAITING_RATE_LIMIT,
                    nextAttemptAt: LessThanOrEqual(new Date()),
                },
                {
                    status: AiAnalysisJobStatus.WAITING_RATE_LIMIT,
                    nextAttemptAt: IsNull(),
                },
                {
                    status: AiAnalysisJobStatus.WAITING_RETRY,
                    nextAttemptAt: LessThanOrEqual(new Date()),
                },
            ],
            relations: {
                languagePair: {
                    sourceLanguage: true,
                    targetLanguage: true,
                },
            },
            order: {
                createdAt: "ASC",
            },
        });

        if (!job) {
            return null;
        }

        job.status = AiAnalysisJobStatus.PROCESSING;

        if (!job.startedAt) {
            job.startedAt = new Date();
        }

        job.errorMessage = null;
        job.attemptCount += 1;

        return jobRepository.save(job);
    }

    async updateProgress(
        job: AiAnalysisJob,
        input: {
            currentChunkIndex: number;
            totalChunks: number;
        }
    ): Promise<AiAnalysisJob> {
        const jobRepository = this.dataSource.getRepository(AiAnalysisJob);

        job.currentChunkIndex = input.currentChunkIndex;
        job.totalChunks = input.totalChunks;

        return jobRepository.save(job);
    }

    async markCompleted(
        job: AiAnalysisJob,
        resultJson: unknown
    ): Promise<AiAnalysisJob> {
        const jobRepository = this.dataSource.getRepository(AiAnalysisJob);

        job.status = AiAnalysisJobStatus.COMPLETED;
        job.completedAt = new Date();
        job.nextAttemptAt = null;
        job.errorMessage = null;
        job.resultJson = resultJson;

        if (job.totalChunks > 0) {
            job.currentChunkIndex = job.totalChunks;
        }

        return jobRepository.save(job);
    }

    async markFailed(
        job: AiAnalysisJob,
        errorMessage: string
    ): Promise<AiAnalysisJob> {
        const jobRepository = this.dataSource.getRepository(AiAnalysisJob);

        job.status = AiAnalysisJobStatus.FAILED;
        job.errorMessage = errorMessage;
        job.nextAttemptAt = null;

        return jobRepository.save(job);
    }

    async markWaitingRateLimit(
        job: AiAnalysisJob,
        errorMessage: string,
        nextAttemptAt: Date
    ): Promise<AiAnalysisJob> {
        const jobRepository = this.dataSource.getRepository(AiAnalysisJob);

        job.status = AiAnalysisJobStatus.WAITING_RATE_LIMIT;
        job.errorMessage = errorMessage;
        job.nextAttemptAt = nextAttemptAt;

        return jobRepository.save(job);
    }

    async markWaitingRetry(
        job: AiAnalysisJob,
        errorMessage: string,
        nextAttemptAt: Date
    ): Promise<AiAnalysisJob> {
        const jobRepository = this.dataSource.getRepository(AiAnalysisJob);

        job.status = AiAnalysisJobStatus.WAITING_RETRY;
        job.errorMessage = errorMessage;
        job.nextAttemptAt = nextAttemptAt;

        return jobRepository.save(job);
    }

    private async createJob(
        manager: EntityManager,
        input: CreateJobInput
    ): Promise<AiAnalysisJob> {
        const jobRepository = manager.getRepository(AiAnalysisJob);
        const payloadRepository = manager.getRepository(AiAnalysisJobPayload);

        const job = jobRepository.create({
            batchId: input.batchId,
            title: input.title,
            languageLevel: input.languageLevel,
            languagePair: {
                id: input.languagePairId,
            } as LanguagePair,
            status: AiAnalysisJobStatus.PENDING,
            errorMessage: null,
            attemptCount: 0,
            currentChunkIndex: 0,
            totalChunks: 0,
            nextAttemptAt: null,
            resultJson: null,
            startedAt: null,
            completedAt: null,
        });

        const savedJob = await jobRepository.save(job);

        const payload = payloadRepository.create({
            job: savedJob,
            originalText: input.originalText,
            chunksJson: null,
            partialResultJson: null,
        });

        await payloadRepository.save(payload);

        return savedJob;
    }
}
