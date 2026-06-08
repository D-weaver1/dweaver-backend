import { Router } from "express";
import db from "../../data-source";
import {
    LanguageTextTemplate,
    Question,
    Quiz,
    QuizAnswer,
    QuizAttempt,
    Word,
} from "../../entities";
import { In, IsNull, Not } from "typeorm";
import { QuestionType } from "../../entities/Question.entity";
import { AuthResponse } from "../../adaptive-reading-module/auth/types/auth-request.type";
import { authMiddleware } from "../../adaptive-reading-module/auth/middlewares/auth.middleware";
import {
    quizAnswerBodySchema,
    quizAnswerParamsSchema,
    quizIdParamsSchema,
} from "./schemas";

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
    } else if (question.type === QuestionType.SourceToTargetInput) {
        const correctAnswer = word?.translation.toLowerCase();
        const normalizedAnswer = answer
            .toLowerCase()
            .replace(/[^a-zA-Z0-9]+/g, "");
        const normalizedCorrect = correctAnswer?.replace(/[^a-zA-Z0-9]+/g, "");

        return normalizedAnswer === normalizedCorrect;
    }

    return false;
};

const applyTemplate = (template: string, params: Record<string, string>) =>
    template.replace(/{{\s*(\w+)\s*}}/g, (_, key) => {
        return params[key] || "";
    });

const toPercent = (part: number, total: number) => {
    if (!total) {
        return 0;
    }

    return Math.round((part / total) * 10000) / 100;
};

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
                title: quiz.title,
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

router.get("/stats", async (req, res: AuthResponse) => {
    try {
        const userId = res.locals.user.id;
        const quizzes = await quizRepo.find({
            where: { dictionary: { user: { id: userId } } },
            relations: {
                questions: true,
                dictionary: {
                    languagePair: {
                        sourceLanguage: true,
                        targetLanguage: true,
                    },
                },
                quizAttempts: {
                    quizAnswers: {
                        question: true,
                    },
                },
            },
        });

        const allAttempts = quizzes.flatMap((quiz) =>
            quiz.quizAttempts
                .filter((attempt) => !!attempt.completedAt)
                .map((attempt) => {
                    const correct = attempt.quizAnswers.filter(
                        (a) => a.isCorrect
                    ).length;
                    const total =
                        quiz.questions.length || attempt.quizAnswers.length;
                    const scorePct = toPercent(correct, total);
                    const effectiveDate =
                        attempt.completedAt ?? attempt.createdAt;

                    return {
                        attemptId: attempt.id,
                        quizId: quiz.id,
                        quizTitle: quiz.title ?? "Untitled quiz",
                        sourceLanguageCode:
                            quiz.dictionary.languagePair.sourceLanguage.code,
                        targetLanguageCode:
                            quiz.dictionary.languagePair.targetLanguage.code,
                        languagePair: `${quiz.dictionary.languagePair.sourceLanguage.code.toUpperCase()}-${quiz.dictionary.languagePair.targetLanguage.code.toUpperCase()}`,
                        correct,
                        total,
                        scorePct,
                        date: effectiveDate.toISOString().slice(0, 10),
                        timestamp: effectiveDate.toISOString(),
                        answers: attempt.quizAnswers.map((answer) => ({
                            questionType: answer.question.type,
                            isCorrect: answer.isCorrect,
                        })),
                    };
                })
        );

        allAttempts.sort(
            (a, b) =>
                new Date(a.timestamp).getTime() -
                new Date(b.timestamp).getTime()
        );

        const scoreTimelineData = allAttempts.map((attempt, index, arr) => {
            const from = Math.max(0, index - 4);
            const window = arr.slice(from, index + 1);
            const avg =
                window.reduce((sum, item) => sum + item.scorePct, 0) /
                window.length;

            return {
                ...attempt,
                movingAvgPct: Math.round(avg * 100) / 100,
            };
        });

        const buckets = [
            { label: "0-20", min: 0, max: 20 },
            { label: "21-40", min: 21, max: 40 },
            { label: "41-60", min: 41, max: 60 },
            { label: "61-80", min: 61, max: 80 },
            { label: "81-100", min: 81, max: 100 },
        ];

        const scoreDistributionData = buckets.map((bucket) => ({
            bucket: bucket.label,
            attempts: allAttempts.filter(
                (attempt) =>
                    attempt.scorePct >= bucket.min &&
                    attempt.scorePct <= bucket.max
            ).length,
        }));

        const perQuizMap = new Map<
            string,
            {
                quizId: string;
                quizTitle: string;
                attempts: number;
                scoreSum: number;
                correctSum: number;
                totalSum: number;
            }
        >();

        for (const attempt of allAttempts) {
            const current = perQuizMap.get(attempt.quizId) ?? {
                quizId: attempt.quizId,
                quizTitle: attempt.quizTitle,
                attempts: 0,
                scoreSum: 0,
                correctSum: 0,
                totalSum: 0,
            };

            current.attempts += 1;
            current.scoreSum += attempt.scorePct;
            current.correctSum += attempt.correct;
            current.totalSum += attempt.total;
            perQuizMap.set(attempt.quizId, current);
        }

        const quizPerformanceData = Array.from(perQuizMap.values())
            .map((item) => ({
                quizId: item.quizId,
                quizTitle: item.quizTitle,
                attempts: item.attempts,
                avgScorePct:
                    Math.round((item.scoreSum / item.attempts) * 100) / 100,
                accuracyPct: toPercent(item.correctSum, item.totalSum),
            }))
            .sort((a, b) => b.attempts - a.attempts);

        const perLanguagePairMap = new Map<
            string,
            {
                languagePair: string;
                attempts: number;
                correctSum: number;
                totalSum: number;
            }
        >();

        for (const attempt of allAttempts) {
            const current = perLanguagePairMap.get(attempt.languagePair) ?? {
                languagePair: attempt.languagePair,
                attempts: 0,
                correctSum: 0,
                totalSum: 0,
            };

            current.attempts += 1;
            current.correctSum += attempt.correct;
            current.totalSum += attempt.total;
            perLanguagePairMap.set(attempt.languagePair, current);
        }

        const languagePairData = Array.from(perLanguagePairMap.values()).map(
            (item) => ({
                languagePair: item.languagePair,
                attempts: item.attempts,
                accuracyPct: toPercent(item.correctSum, item.totalSum),
            })
        );

        void languagePairData;

        const questionTypeMap = new Map<
            string,
            { count: number; correct: number }
        >();

        for (const attempt of allAttempts) {
            for (const answer of attempt.answers) {
                const key = answer.questionType;
                const current = questionTypeMap.get(key) ?? {
                    count: 0,
                    correct: 0,
                };

                current.count += 1;
                if (answer.isCorrect) {
                    current.correct += 1;
                }

                questionTypeMap.set(key, current);
            }
        }

        const questionTypeData = Array.from(questionTypeMap.entries()).map(
            ([type, values]) => ({
                questionType: type,
                attempts: values.count,
                accuracyPct: toPercent(values.correct, values.count),
            })
        );

        const totalAttempts = allAttempts.length;
        const totalCorrectAnswers = allAttempts.reduce(
            (sum, attempt) => sum + attempt.correct,
            0
        );
        const totalAnswers = allAttempts.reduce(
            (sum, attempt) => sum + attempt.total,
            0
        );
        const avgScorePct =
            totalAttempts > 0
                ? Math.round(
                      (allAttempts.reduce((sum, a) => sum + a.scorePct, 0) /
                          totalAttempts) *
                          100
                  ) / 100
                : 0;
        const bestScorePct =
            totalAttempts > 0
                ? Math.max(...allAttempts.map((attempt) => attempt.scorePct))
                : 0;

        res.json({
            summary: {
                totalAttempts,
                avgScorePct,
                bestScorePct,
                overallAccuracyPct: toPercent(
                    totalCorrectAnswers,
                    totalAnswers
                ),
            },
            charts: {
                scoreTimeline: {
                    chartType: "line",
                    xKey: "date",
                    series: [
                        { key: "scorePct", label: "Score %" },
                        // {
                        //     key: "movingAvgPct",
                        //     label: "5-attempt moving avg %",
                        // },
                    ],
                    data: scoreTimelineData,
                },
                scoreDistribution: {
                    chartType: "bar",
                    xKey: "bucket",
                    series: [{ key: "attempts", label: "Attempts" }],
                    data: scoreDistributionData,
                },
                quizPerformance: {
                    chartType: "bar",
                    xKey: "quizTitle",
                    series: [
                        { key: "avgScorePct", label: "Average score %" },
                        { key: "attempts", label: "Attempts" },
                    ],
                    data: quizPerformanceData,
                },
                // languagePairPerformance: {
                //     chartType: "radar",
                //     xKey: "languagePair",
                //     series: [
                //         { key: "accuracyPct", label: "Accuracy %" },
                //         { key: "attempts", label: "Attempts" },
                //     ],
                //     data: languagePairData,
                // },
                questionTypeAccuracy: {
                    chartType: "donut",
                    xKey: "questionType",
                    series: [{ key: "accuracyPct", label: "Accuracy %" }],
                    data: questionTypeData,
                },
            },
            chartIdeas: [
                {
                    id: "trend-line",
                    title: "Progress trend",
                    recommendedChart: "line",
                    dataPath: "charts.scoreTimeline",
                    description:
                        "Track score percentage by attempt date with a moving average to show learning trend.",
                },
                {
                    id: "score-histogram",
                    title: "Score distribution",
                    recommendedChart: "bar",
                    dataPath: "charts.scoreDistribution",
                    description:
                        "Show how often scores land in each range from low to high performance.",
                },
                {
                    id: "quiz-comparison",
                    title: "Quiz comparison",
                    recommendedChart: "grouped-bar",
                    dataPath: "charts.quizPerformance",
                    description:
                        "Compare average score and attempts per quiz to identify hard quizzes and study volume.",
                },
                {
                    id: "language-pair-radar",
                    title: "Language pair strengths",
                    recommendedChart: "radar",
                    dataPath: "charts.languagePairPerformance",
                    description:
                        "Visualize which source-target language pairs are strongest or weakest.",
                },
                {
                    id: "question-type-donut",
                    title: "Question type mastery",
                    recommendedChart: "donut",
                    dataPath: "charts.questionTypeAccuracy",
                    description:
                        "Display accuracy split by question type to reveal where user struggles.",
                },
            ],
        });
    } catch (error) {
        console.error("Error fetching quiz stats:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get("/:id", async (req, res: AuthResponse) => {
    try {
        const userId = res.locals.user.id;
        const paramsResult = quizIdParamsSchema.safeParse(req.params);

        if (!paramsResult.success) {
            return res.status(400).json({
                message: "Invalid request params",
                error: paramsResult.error.flatten(),
            });
        }

        const { id: quizId } = paramsResult.data;

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
        const paramsResult = quizAnswerParamsSchema.safeParse(req.params);
        const bodyResult = quizAnswerBodySchema.safeParse(req.body);

        if (!paramsResult.success) {
            return res.status(400).json({
                message: "Invalid request params",
                error: paramsResult.error.flatten(),
            });
        }

        if (!bodyResult.success) {
            return res.status(400).json({
                message: "Invalid request body",
                error: bodyResult.error.flatten(),
            });
        }

        const { id: quizId, questionId } = paramsResult.data;
        const { answer } = bodyResult.data;

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
        const paramsResult = quizIdParamsSchema.safeParse(req.params);

        if (!paramsResult.success) {
            return res.status(400).json({
                message: "Invalid request params",
                error: paramsResult.error.flatten(),
            });
        }

        const { id: quizId } = paramsResult.data;

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
