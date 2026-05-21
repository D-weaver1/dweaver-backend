import { z } from "zod";

const paragraphBreakUnit = "\n\n";

export const aiPairSchema = z.object({
    source_text: z.string().trim().min(1),
    target_text: z.string().trim().min(1),
    occurrence_indexes: z.array(z.number().int().nonnegative()).min(1),
});

export const aiAnalysisResultSchema = z.object({
    title: z.string().trim().min(1),
    source_language: z.string().trim().min(1),
    target_language: z.string().trim().min(1),
    original_text: z.string().trim().min(1),
    text_units: z.array(
        z
            .string()
            .refine(
                (value) =>
                    value === paragraphBreakUnit || value.trim().length > 0,
                "Text unit must not be empty"
            )
    ),
    pairs: z.array(aiPairSchema),
});

export type AiAnalysisResult = z.infer<typeof aiAnalysisResultSchema>;
