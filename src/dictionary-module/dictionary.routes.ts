import { Router } from "express";
import { AuthResponse } from "../adaptive-reading-module/auth/types/auth-request.type";
import { authMiddleware } from "../adaptive-reading-module/auth/middlewares/auth.middleware";
import db from "../data-source";
import { Dictionary } from "../entities";
import { QuizService } from "./services";

const dictionaryRepo = db.getRepository(Dictionary);
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
                    name: d.languagePair.sourceLanguage.name,
                    code: d.languagePair.sourceLanguage.code,
                },
                target: {
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

export default router;
