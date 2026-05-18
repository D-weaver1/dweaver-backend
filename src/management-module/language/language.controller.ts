import { Request, Response } from "express";
import { LanguageService } from "./language.service";
import { CreateLanguageDto } from "./dto/create-language.dto";

export class LanguageController {
    constructor(private readonly languageService: LanguageService) {}

    getAll = async (_req: Request, res: Response): Promise<void> => {
        try {
            const languages = await this.languageService.getAll();

            res.status(200).json(languages);
        } catch (error) {
            console.error(error);

            res.status(500).json({
                message: "Failed to get languages",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    };

    create = async (req: Request, res: Response): Promise<void> => {
        try {
            const dto = req.body as CreateLanguageDto;

            const language = await this.languageService.create(dto);

            res.status(201).json(language);
        } catch (error) {
            console.error(error);

            const message =
                error instanceof Error ? error.message : "Unknown error";

            if (
                message.includes("required") ||
                message.includes("already exists")
            ) {
                res.status(400).json({
                    message: "Failed to create language",
                    error: message,
                });
                return;
            }

            res.status(500).json({
                message: "Failed to create language",
                error: message,
            });
        }
    };
}