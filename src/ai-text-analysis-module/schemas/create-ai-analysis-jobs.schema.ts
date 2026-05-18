import { z } from "zod";
import { LanguageLevel } from "../../entities";

export const createAiAnalysisJobsSchema = z.object({
    title: z.string().trim().min(1, "Title is required"),
    language_level: z.nativeEnum(LanguageLevel),
    source_language: z.string().trim().min(1, "Source language is required"),
    target_languages: z
        .array(z.string().trim().min(1))
        .min(1, "At least one target language is required"),
    original_text: z.string().trim().min(1, "Original text is required"),
});

export type CreateAiAnalysisJobsSchema = z.infer<
    typeof createAiAnalysisJobsSchema
>;
