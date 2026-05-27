import { Router } from "express";
import { AuthResponse } from "../adaptive-reading-module/auth/types/auth-request.type";
import { authMiddleware } from "../adaptive-reading-module/auth/middlewares/auth.middleware";
import db from "../data-source";
import { Dictionary, DictionaryWord, Word } from "../entities";
import { QuizService } from "./services";

const dictionaryRepo = db.getRepository(Dictionary);
const dictionaryWordRepo = db.getRepository(DictionaryWord);
const wordRepo = db.getRepository(Word);
const router = Router();

router.get("/", authMiddleware, async (req, res: AuthResponse) => {
    const user = res.locals.user;

    try {
        const dictionaries = await dictionaryRepo.find({
            where: { user: { id: user.id } },
            relations: {
                languagePair: {
                    sourceLanguage: true,
                    targetLanguage: true,
                },
            },
        });

        return res.json(
            dictionaries.map((d) => ({
                id: d.id,
                source: {
                    id: d.languagePair.sourceLanguage.id,
                    name: d.languagePair.sourceLanguage.name,
                    code: d.languagePair.sourceLanguage.code,
                },
                target: {
                    id: d.languagePair.targetLanguage.id,
                    name: d.languagePair.targetLanguage.name,
                    code: d.languagePair.targetLanguage.code,
                },
            }))
        );
    } catch (error) {
        console.error("Error fetching dictionaries:", error);
        return res.status(500).json({ error: "Failed to fetch dictionaries" });
    }
});

router.get(
    "/:languagePairId/words",
    authMiddleware,
    async (req, res: AuthResponse) => {
        const user = res.locals.user;
        const languagePairId = req.params.languagePairId;

        if (!languagePairId) {
            return res.status(400).json({ error: "Invalid dictionary ID" });
        }

        const dictionary = await dictionaryRepo.findOne({
            where: {
                languagePair: { id: languagePairId },
                user: { id: user.id },
            },
            relations: {
                user: true,
            },
        });

        if (!dictionary) {
            return res.status(404).json({ error: "Dictionary not found" });
        }

        if (dictionary.user.id !== user.id) {
            return res.status(403).json({ error: "Access denied" });
        }

        try {
            const dictionaryWords = await dictionaryWordRepo.find({
                where: { dictionary: { id: dictionary.id } },
                relations: { word: true },
            });

            return res.json(
                dictionaryWords.map((dw) => ({
                    id: dw.word.id,
                    sourceText: dw.word.sourceText,
                    translation: dw.word.translation,
                }))
            );
        } catch (error) {
            console.error("Error fetching dictionary words:", error);
            return res
                .status(500)
                .json({ error: "Failed to fetch dictionary words" });
        }
    }
);

router.post(
    "/:id/generate-quiz",
    authMiddleware,
    async (req, res: AuthResponse) => {
        const user = res.locals.user;
        const dictionaryId = req.params.id;

        if (!dictionaryId) {
            return res.status(400).json({ error: "Invalid dictionary ID" });
        }

        const dictionary = await dictionaryRepo.findOne({
            where: { id: dictionaryId },
            relations: {
                user: true,
            },
        });

        if (!dictionary) {
            return res.status(404).json({ error: "Dictionary not found" });
        }

        if (dictionary.user.id !== user.id) {
            return res.status(403).json({ error: "Access denied" });
        }

        const quizService = new QuizService(dictionary);

        try {
            const quiz = await quizService.generate();

            return res.status(201).json({ id: quiz.id });
        } catch (error) {
            console.error("Error generating quiz:", error);
            return res.status(500).json({ error: "Failed to generate quiz" });
        }
    }
);

router.post("/add-word", authMiddleware, async (req, res: AuthResponse) => {
    const user = res.locals.user;
    const { wordId, languagePairId } = req.body;

    if (!languagePairId || !wordId) {
        return res
            .status(400)
            .json({ error: "Invalid dictionary ID or word ID" });
    }

    const existing = await dictionaryWordRepo.findOne({
        where: {
            dictionary: {
                languagePair: { id: languagePairId },
                user: { id: user.id },
            },
            word: { id: wordId },
        },
    });

    if (existing) {
        return res
            .status(409)
            .json({ error: "Word already exists in the dictionary" });
    }

    const word = await wordRepo.findOne({
        where: { id: wordId },
        relations: {
            languagePair: true,
        },
    });
    const dictionary = await dictionaryRepo.findOne({
        where: { languagePair: { id: languagePairId }, user: { id: user.id } },
        relations: {
            user: true,
            languagePair: true,
        },
    });

    if (!word || !dictionary) {
        return res.status(404).json({ error: "Word or dictionary not found" });
    }

    dictionaryWordRepo.create({
        dictionary,
        word,
    });

    try {
        await dictionaryWordRepo.save(
            dictionaryWordRepo.create({
                dictionary,
                word,
            })
        );

        return res.status(201).json({ message: "Word added to dictionary" });
    } catch (error) {
        console.error("Error adding word to dictionary:", error);
        return res
            .status(500)
            .json({ error: "Failed to add word to dictionary" });
    }
});

export default router;
