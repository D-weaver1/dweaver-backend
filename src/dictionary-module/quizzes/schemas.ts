import { z } from "zod";

const uuidSchema = z.string().uuid("Invalid ID format");

export const quizIdParamsSchema = z.object({
    id: uuidSchema,
});

export const quizAnswerParamsSchema = z.object({
    id: uuidSchema,
    questionId: uuidSchema,
});

export const quizAnswerBodySchema = z.object({
    answer: z.string().trim().min(1, "Answer is required"),
});

export type QuizIdParams = z.infer<typeof quizIdParamsSchema>;
export type QuizAnswerParams = z.infer<typeof quizAnswerParamsSchema>;
export type QuizAnswerBody = z.infer<typeof quizAnswerBodySchema>;
