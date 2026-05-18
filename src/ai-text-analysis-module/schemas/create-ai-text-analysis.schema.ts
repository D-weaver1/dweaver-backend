import { z } from "zod";

export const createAiTextAnalysisSchema = z.object({
    title: z.string().trim().min(1, "Title is required"),
    source_language: z.string().trim().min(1, "Source language is required"),
    target_language: z.string().trim().min(1, "Target language is required"),
    original_text: z.string().trim().min(1, "Original text is required"),
});

export type CreateAiTextAnalysisSchema = z.infer<
    typeof createAiTextAnalysisSchema
>;