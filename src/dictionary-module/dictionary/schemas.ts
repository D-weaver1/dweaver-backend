import { z } from "zod";

const uuidSchema = z.string().uuid("Invalid ID format");

export const dictionaryLanguagePairParamsSchema = z.object({
    languagePairId: uuidSchema,
});

export const dictionaryIdParamsSchema = z.object({
    id: uuidSchema,
});

export const dictionaryExportPdfQuerySchema = z.object({
    mode: z
        .preprocess(
            (value) =>
                Array.isArray(value)
                    ? value[0]
                    : typeof value === "string"
                      ? value
                      : undefined,
            z.enum(["s_t", "t_s"])
        )
        .default("s_t"),
    query: z
        .preprocess(
            (value) =>
                Array.isArray(value)
                    ? value[0]
                    : typeof value === "string"
                      ? value
                      : undefined,
            z.string().trim().optional()
        )
        .optional(),
});

export const dictionaryAddWordBodySchema = z.object({
    wordId: uuidSchema,
    languagePairId: uuidSchema,
});

export type DictionaryLanguagePairParams = z.infer<
    typeof dictionaryLanguagePairParamsSchema
>;

export type DictionaryIdParams = z.infer<typeof dictionaryIdParamsSchema>;

export type DictionaryExportPdfQuery = z.infer<
    typeof dictionaryExportPdfQuerySchema
>;

export type DictionaryAddWordBody = z.infer<typeof dictionaryAddWordBodySchema>;
