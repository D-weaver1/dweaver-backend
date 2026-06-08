import { Router } from "express";
import { authMiddleware } from "../../adaptive-reading-module/auth/middlewares/auth.middleware";
import { rolesMiddleware } from "../../adaptive-reading-module/auth/middlewares/roles.middleware";
import {
    Language,
    LanguageTextTemplate,
    TextTemplate,
    UserRole,
} from "../../entities";
import db from "../../data-source";
import { upsertTemplateBodySchema } from "./schemas";

const router = Router();
const textTemplateRepo = db.getRepository(TextTemplate);
const languageTextTemplateRepo = db.getRepository(LanguageTextTemplate);
const languageRepo = db.getRepository(Language);

router.get(
    "/",
    authMiddleware,
    rolesMiddleware(UserRole.ADMIN),
    async (req, res) => {
        const languages = await languageRepo.find();
        const templates = await textTemplateRepo.find({
            relations: {
                languageTextTemplates: {
                    language: true,
                },
            },
        });

        const result = templates.map((template) => ({
            id: template.id,
            questionType: template.questionType,
            languageTextTemplates: languages.map((language) => {
                const ltt = template.languageTextTemplates.find(
                    (ltt) => ltt.language.id === language.id
                );

                return {
                    languageId: language.id,
                    languageName: language.name,
                    languageCode: language.code,
                    template: ltt ? ltt.template : "",
                };
            }),
        }));

        res.json(result);
    }
);

router.post(
    "/",
    authMiddleware,
    rolesMiddleware(UserRole.ADMIN),
    async (req, res) => {
        try {
            const bodyResult = upsertTemplateBodySchema.safeParse(req.body);

            if (!bodyResult.success) {
                res.status(400).json({
                    message: "Invalid request body",
                    error: bodyResult.error.flatten(),
                });
                return;
            }

            const { questionType, languageTextTemplates } = bodyResult.data;

            let textTemplate = await textTemplateRepo.findOne({
                where: { questionType },
                relations: { languageTextTemplates: true },
            });

            if (!textTemplate) {
                textTemplate = textTemplateRepo.create({ questionType });
                await textTemplateRepo.save(textTemplate);
            }

            for (const ltt of languageTextTemplates) {
                let languageTextTemplate =
                    await languageTextTemplateRepo.findOne({
                        where: {
                            textTemplate: { id: textTemplate.id },
                            language: { id: ltt.languageId },
                        },
                    });

                if (!languageTextTemplate) {
                    languageTextTemplate = languageTextTemplateRepo.create({
                        textTemplate,
                        language: { id: ltt.languageId },
                        template: ltt.template,
                    });
                } else {
                    languageTextTemplate.template = ltt.template;
                }

                await languageTextTemplateRepo.save(languageTextTemplate);
            }

            res.json({ ok: true });
        } catch (error) {
            res.status(500).json({
                ok: false,
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
);

export default router;
