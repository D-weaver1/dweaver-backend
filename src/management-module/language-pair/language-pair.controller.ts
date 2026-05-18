import { Request, Response } from "express";
import { LanguagePairService } from "./language-pair.service";
import { CreateLanguagePairDto } from "./dto/create-language-pair.dto";

export class LanguagePairController {
    constructor(
        private readonly languagePairService: LanguagePairService
    ) {}

    getAll = async (_req: Request, res: Response): Promise<void> => {
        try {
            const languagePair = await this.languagePairService.getAll();

            res.status(200).json(languagePair);
        } catch (error) {
            console.error(error);

            res.status(500).json({
                message: "Failed to get language pairs",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    };

    create = async (req: Request, res: Response): Promise<void> => {
        try {
            const dto = req.body as CreateLanguagePairDto;

            const languagePair = await this.languagePairService.create(dto);

            res.status(201).json(languagePair);
        } catch (error) {
            console.error(error);

            const message =
                error instanceof Error ? error.message : "Unknown error";

            if (
                message.includes("required") ||
                message.includes("not found") ||
                message.includes("already exists") ||
                message.includes("must be different")
            ) {
                res.status(400).json({
                    message: "Failed to create language pair",
                    error: message,
                });
                return;
            }

            res.status(500).json({
                message: "Failed to create language pair",
                error: message,
            });
        }
    };
}