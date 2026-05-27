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
import { In, IsNull, Not } from "typeorm";
import { QuestionType } from "../entities/Question.entity";
import { AuthResponse } from "../adaptive-reading-module/auth/types/auth-request.type";
import { authMiddleware } from "../adaptive-reading-module/auth/middlewares/auth.middleware";

const quizRepo = db.getRepository(Quiz);
const quizAttemptRepo = db.getRepository(QuizAttempt);
const quizAnswerRepo = db.getRepository(QuizAnswer);
const questionRepo = db.getRepository(Question);
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
                attempts: quiz.quizAttempts
                    .map((attempt) => ({
                        id: attempt.id,
                        completedAt: attempt.completedAt,
                        createdAt: attempt.createdAt,
                        correct: attempt.quizAnswers.filter((a) => a.isCorrect)
                            .length,
                        total: quiz.questions.length,
                    }))
                    .sort(
                        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
                    ),
                sourceLanguage: quiz.dictionary.languagePair.sourceLanguage,
                targetLanguage: quiz.dictionary.languagePair.targetLanguage,
                total: quiz.questions.length,
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
        const attempt = await quizAttemptRepo.findOne({
            where: { quiz: { id: quizId }, completedAt: IsNull() },
        });
        const words = await wordRepo.find({
            where: {
                languagePair: { id: quiz?.dictionary.languagePair.id },
                sourceText: Not(In([".", ",", "!", "?", ":", ";"])),
            },
        });
        const answers = attempt
            ? await quizAnswerRepo.find({
                  where: { quizAttempt: { id: attempt.id } },
                  relations: { question: true },
              })
            : [];
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
            const src = words
                .slice()
                .filter((w) => w.id !== question.dictionaryWord?.word.id);
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

        const questionsRaw = quiz.questions.map((q) => {
            const template =
                templates.find((t) => t.textTemplate.id === q.textTemplate.id)
                    ?.template ??
                templates[0]?.template ??
                "";
            const word =
                q.type === QuestionType.SourceToTargetTranslate
                    ? q.dictionaryWord?.word.sourceText
                    : q.dictionaryWord?.word.translation;
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
        });

        const answered = questionsRaw.filter((q) => q.answered);
        const notAnswered = questionsRaw.filter((q) => !q.answered);
        const questions = [
            ...answered,
            ...notAnswered.sort(() => Math.random() - 0.5),
        ];

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
            questions,
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
        });

        if (!quiz) {
            return res.status(404).json({ error: "Quiz not found" });
        }

        const question = await questionRepo.findOne({
            where: { id: questionId, quiz: { id: quizId } },
            relations: {
                dictionaryWord: {
                    word: true,
                },
            },
        });

        if (!question) {
            return res
                .status(404)
                .json({ error: "Question not found in quiz" });
        }

        const quizAttempt =
            (await quizAttemptRepo.findOneBy({
                quiz: { id: quizId },
                completedAt: IsNull(),
            })) || quizAttemptRepo.create({ quiz });

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
            where: { quiz: { id: quizId }, completedAt: IsNull() },
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
