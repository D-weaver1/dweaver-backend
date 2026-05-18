import { Router } from "express";
import db from "../data-source";
import { AiTextAnalysisController } from "./ai-text-analysis.controller";
import { AiTextAnalysisService } from "./ai-text-analysis.service";
import { AiClientService } from "./services/ai-client.service";
import { PromptBuilderService } from "./services/prompt-builder.service";
import { ResponseParserService } from "./services/response-parser.service";
import { ResponseValidatorService } from "./services/response-validator.service";
import { TextPreprocessorService } from "./services/text-preprocessor.service";
import { AiLanguagePairRepository } from "./repositories/ai-language-pair.repository";
import { LanguagePairValidatorService } from "./services/language-pair-validator.service";
import { TextChunkerService } from "./services/text-chunker.service";
import { AnalysisResultMergerService } from "./services/analysis-result-merger.service";
import { AiAnalysisJobRepository } from "./repositories/ai-analysis-job.repository";
import { AiAnalysisJobService } from "./services/ai-analysis-job.service";
import { AiAnalysisJobController } from "./ai-analysis-job.controller";
import { AiAnalysisJobWorkerService } from "./services/ai-analysis-job-worker.service";

const router = Router();

const textPreprocessorService = new TextPreprocessorService();
const promptBuilderService = new PromptBuilderService();
const aiClientService = new AiClientService();
const responseParserService = new ResponseParserService();
const responseValidatorService = new ResponseValidatorService();

const aiLanguagePairRepository = new AiLanguagePairRepository(db);
const languagePairValidatorService = new LanguagePairValidatorService(
    aiLanguagePairRepository
);

const textChunkerService = new TextChunkerService();
const analysisResultMergerService = new AnalysisResultMergerService();

const aiTextAnalysisService = new AiTextAnalysisService(
    textPreprocessorService,
    promptBuilderService,
    aiClientService,
    responseParserService,
    responseValidatorService,
    languagePairValidatorService,
    textChunkerService,
    analysisResultMergerService
);

const aiTextAnalysisController = new AiTextAnalysisController(
    aiTextAnalysisService
);

const aiAnalysisJobRepository = new AiAnalysisJobRepository(db);

const aiAnalysisJobService = new AiAnalysisJobService(
    aiAnalysisJobRepository,
    languagePairValidatorService
);

const aiAnalysisJobController = new AiAnalysisJobController(
    aiAnalysisJobService
);

const aiAnalysisJobWorkerService = new AiAnalysisJobWorkerService(
    aiAnalysisJobRepository,
    aiTextAnalysisService
);

aiAnalysisJobWorkerService.start();

router.post("/analyze", aiTextAnalysisController.analyze);

router.post("/jobs", aiAnalysisJobController.createJobs);
router.get("/jobs", aiAnalysisJobController.getRecentJobs);
router.get("/jobs/:id", aiAnalysisJobController.getJob);

export default router;
