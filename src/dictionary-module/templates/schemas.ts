import { z } from "zod";
import { QuestionType } from "../../entities/Question.entity";

export const upsertTemplateBodySchema = z.object({
    questionType: z.nativeEnum(QuestionType),
    languageTextTemplates: z
        .array(
            z.object({
                languageId: z.string().uuid("Invalid language ID format"),
                template: z.string().trim(),
            })
        )
        .min(1, "At least one language template is required"),
});

export type UpsertTemplateBody = z.infer<typeof upsertTemplateBodySchema>;
