import { Router } from "express";
import db from "../data-source";
import {
    LanguageTextTemplate,
    Question,
    Quiz,
    QuizAnswer,
    QuizAttempt,
    Word,
} from "../entities";
import { In } from "typeorm";
import { QuestionType } from "../entities/Question.entity";
import { AuthResponse } from "../adaptive-reading-module/auth/types/auth-request.type";
import { authMiddleware } from "../adaptive-reading-module/auth/middlewares/auth.middleware";

const quizRepo = db.getRepository(Quiz);
const quizAttemptRepo = db.getRepository(QuizAttempt);
const quizAnswerRepo = db.getRepository(QuizAnswer);
const wordRepo = db.getRepository(Word);
const languageTextTemplateRepo = db.getRepository(LanguageTextTemplate);
const router = Router();

const checkAnswer = (question: Question, answer: string) => {
    const word = question.dictionaryWord?.word;

    if (question.type === QuestionType.SourceToTargetTranslate) {
        return word?.translation.toLowerCase() === answer.toLowerCase();
    } else if (question.type === QuestionType.TargetToSourceTranslate) {
        return word?.sourceText.toLowerCase() === answer.toLowerCase();
    }

    return false;
};

const applyTemplate = (template: string, params: Record<string, string>) =>
    template.replace(/{{\s*(\w+)\s*}}/g, (_, key) => {
        return params[key] || "";
    });

router.use(authMiddleware);

router.get("/", async (req, res: AuthResponse) => {
    try {
        const userId = res.locals.user.id;
        const quizzes = await quizRepo.find({
            where: { dictionary: { user: { id: userId } } },
            relations: {
                dictionary: {
                    languagePair: {
                        targetLanguage: true,
                        sourceLanguage: true,
                    },
                },
                questions: true,
                quizAttempts: {
                    quizAnswers: true,
                },
            },
        });

        res.json(
            quizzes.map((quiz) => ({
                id: quiz.id,
                attempts: quiz.quizAttempts.map((attempt) => ({
                    id: attempt.id,
                    completedAt: attempt.completedAt,
                    createdAt: attempt.createdAt,
                    correct: attempt.quizAnswers.filter((a) => a.isCorrect)
                        .length,
                    total: quiz.questions.length,
                })),
                sourceLanguage: quiz.dictionary.languagePair.sourceLanguage,
                targetLanguage: quiz.dictionary.languagePair.targetLanguage,
            }))
        );
    } catch (error) {
        console.error("Error fetching quizzes:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get("/:id", async (req, res: AuthResponse) => {
    try {
        const quizId = req.params.id;
        const userId = res.locals.user.id;

        if (!quizId) {
            return res.status(400).json({ error: "Invalid quiz ID" });
        }

        const quiz = await quizRepo.findOne({
            where: { id: quizId, dictionary: { user: { id: userId } } },
            relations: {
                questions: {
                    textTemplate: true,
                    dictionaryWord: {
                        word: true,
                    },
                },
                dictionary: {
                    languagePair: {
                        targetLanguage: true,
                        sourceLanguage: true,
                    },
                },
            },
        });
        const words = await wordRepo.find({
            where: { languagePair: { id: quiz?.dictionary.languagePair.id } },
        });
        const answers = await quizAnswerRepo.find({
            where: { quizAttempt: { quiz: { id: quizId } } },
        });
        const templateIds = quiz?.questions.map((q) => q.textTemplate.id) || [];
        const templates = await languageTextTemplateRepo.find({
            where: {
                language: {
                    id: quiz?.dictionary.languagePair.targetLanguage.id,
                },
                textTemplate: { id: In(templateIds) },
            },
            relations: {
                textTemplate: true,
            },
        });

        if (!quiz) {
            return res.status(404).json({ error: "Quiz not found" });
        }

        const sourceLanguage = quiz.dictionary.languagePair.sourceLanguage.name;
        const targetLanguage = quiz.dictionary.languagePair.targetLanguage.name;

        const getOptions = (question: Question, answered: boolean) => {
            if (answered) {
                return [];
            }

            const word =
                question.type === QuestionType.SourceToTargetTranslate
                    ? question.dictionaryWord?.word.translation
                    : question.dictionaryWord?.word.sourceText;
            const src = words.slice();
            const options = Array.from({ length: 5 }, () => {
                const randomWord = src.splice(
                    Math.floor(Math.random() * src.length),
                    1
                )[0];
                const text =
                    question.type === QuestionType.SourceToTargetTranslate
                        ? randomWord.translation
                        : randomWord.sourceText;

                return { text };
            });

            options.push({ text: word ?? "" });
            options.sort(() => Math.random() - 0.5);

            return options;
        };

        res.json({
            id: quiz.id,
            sourceLanguage: {
                name: quiz.dictionary.languagePair.sourceLanguage.name,
                code: quiz.dictionary.languagePair.sourceLanguage.code,
            },
            targetLanguage: {
                name: quiz.dictionary.languagePair.targetLanguage.name,
                code: quiz.dictionary.languagePair.targetLanguage.code,
            },
            questions: quiz.questions.map((q) => {
                const template =
                    templates.find(
                        (t) => t.textTemplate.id === q.textTemplate.id
                    )?.template ??
                    templates[0]?.template ??
                    "";
                const word =
                    q.type === QuestionType.SourceToTargetTranslate
                        ? q.dictionaryWord?.word.translation
                        : q.dictionaryWord?.word.sourceText;
                const text = applyTemplate(template, {
                    sourceLanguage,
                    targetLanguage,
                    word: word ?? "",
                });
                const answer = answers.find((a) => a.question.id === q.id);
                const answered = !!answer;

                return {
                    id: q.id,
                    type: q.type,
                    text,
                    answered,
                    isCorrect: answered ? answer?.isCorrect : undefined,
                    options: getOptions(q, answered),
                };
            }),
        });
    } catch (error) {
        console.error("Error fetching quiz:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.post("/:id/:questionId/answer", async (req, res) => {
    try {
        const quizId = req.params.id;
        const questionId = req.params.questionId;
        const { answer } = req.body;

        if (!quizId || !questionId || !answer) {
            return res.status(400).json({ error: "Invalid request data" });
        }

        const quiz = await quizRepo.findOne({
            where: { id: quizId },
            relations: { questions: true },
        });

        if (!quiz) {
            return res.status(404).json({ error: "Quiz not found" });
        }

        const question = quiz.questions.find((q) => q.id === questionId);

        if (!question) {
            return res
                .status(404)
                .json({ error: "Question not found in quiz" });
        }

        const quizAttempt =
            (await quizAttemptRepo.findOneBy({ quiz: { id: quizId } })) ||
            quizAttemptRepo.create({ quiz });

        if (quizAttempt.completedAt) {
            return res
                .status(400)
                .json({ error: "Quiz attempt already completed" });
        }

        if (!quizAttempt.id) {
            await quizAttemptRepo.save(quizAttempt);
        }

        const isCorrect = checkAnswer(question, answer);

        const quizAnswer = quizAnswerRepo.create({
            quizAttempt,
            question,
            answer,
            isCorrect,
        });

        await quizAnswerRepo.save(quizAnswer);

        res.json({ isCorrect });
    } catch (error) {
        console.error("Error submitting answer:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.post("/:id/complete", async (req, res) => {
    try {
        const quizId = req.params.id;

        if (!quizId) {
            return res.status(400).json({ error: "Invalid quiz ID" });
        }

        const quizAttempt = await quizAttemptRepo.findOne({
            where: { quiz: { id: quizId } },
        });

        if (!quizAttempt) {
            return res.status(404).json({ error: "Quiz attempt not found" });
        }

        quizAttempt.completedAt = new Date();
        await quizAttemptRepo.save(quizAttempt);

        const correctAnswers = await quizAnswerRepo.count({
            where: { quizAttempt: { id: quizAttempt.id }, isCorrect: true },
        });

        const totalQuestions = await quizAnswerRepo.count({
            where: { quizAttempt: { id: quizAttempt.id } },
        });

        res.json({
            message: "Quiz attempt completed",
            correctAnswers,
            totalQuestions,
        });
    } catch (error) {
        console.error("Error completing quiz attempt:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
