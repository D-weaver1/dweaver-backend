import { z } from "zod";

export const createAiTextAnalysisSchema = z.object({
    title: z.string().trim().min(1, "Title is required"),
    language_level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]).default("A2"),
    source_language: z.string().trim().min(1, "Source language is required"),
    target_language: z.string().trim().min(1, "Target language is required"),
    original_text: z.string().trim().min(1, "Original text is required"),
});

export type CreateAiTextAnalysisSchema = z.infer<
    typeof createAiTextAnalysisSchema
>;
