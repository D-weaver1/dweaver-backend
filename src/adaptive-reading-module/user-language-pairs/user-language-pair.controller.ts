import { Response } from "express";
import { AuthRequest } from "../auth/types/auth-request.type";
import { UserLanguagePairService } from "./user-language-pair.service";

const userLanguagePairService = new UserLanguagePairService();

export class UserLanguagePairController {
    async getState(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({
                    message: "Unauthorized",
                });
            }

            const result = await userLanguagePairService.getState(userId);

            return res.status(200).json(result);
        } catch (error) {
            return res.status(400).json({
                message:
                    error instanceof Error
                        ? error.message
                        : "Failed to get language pair state",
            });
        }
    }

    async getAvailableLanguagePairs(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({
                    message: "Unauthorized",
                });
            }

            const result =
                await userLanguagePairService.getAvailableLanguagePairs(userId);

            return res.status(200).json(result);
        } catch (error) {
            return res.status(400).json({
                message:
                    error instanceof Error
                        ? error.message
                        : "Failed to get available language pairs",
            });
        }
    }

    async addLanguagePair(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({
                    message: "Unauthorized",
                });
            }

            const result = await userLanguagePairService.addLanguagePair(
                userId,
                req.body
            );

            return res.status(201).json(result);
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Failed to add language pair";

            const statusCode =
                message === "Language pair is already selected" ? 409 : 400;

            return res.status(statusCode).json({
                message,
            });
        }
    }

    async selectLanguagePair(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({
                    message: "Unauthorized",
                });
            }

            const result = await userLanguagePairService.selectLanguagePair(
                userId,
                req.params.languagePairId
            );

            return res.status(200).json(result);
        } catch (error) {
            return res.status(404).json({
                message:
                    error instanceof Error
                        ? error.message
                        : "Failed to select language pair",
            });
        }
    }
    async getSettingsState(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({
                    message: "Unauthorized",
                });
            }

            const result =
                await userLanguagePairService.getSettingsState(userId);

            return res.status(200).json(result);
        } catch (error) {
            return res.status(400).json({
                message:
                    error instanceof Error
                        ? error.message
                        : "Failed to get language pair settings state",
            });
        }
    }

    async activateLanguagePair(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({
                    message: "Unauthorized",
                });
            }

            const result = await userLanguagePairService.activateLanguagePair(
                userId,
                req.params.languagePairId
            );

            return res.status(200).json(result);
        } catch (error) {
            return res.status(404).json({
                message:
                    error instanceof Error
                        ? error.message
                        : "Failed to activate language pair",
            });
        }
    }

    async hideLanguagePair(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({
                    message: "Unauthorized",
                });
            }

            const result = await userLanguagePairService.hideLanguagePair(
                userId,
                req.params.languagePairId
            );

            return res.status(200).json(result);
        } catch (error) {
            return res.status(404).json({
                message:
                    error instanceof Error
                        ? error.message
                        : "Failed to hide language pair",
            });
        }
    }

    async removeLanguagePair(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({
                    message: "Unauthorized",
                });
            }

            const result = await userLanguagePairService.removeLanguagePair(
                userId,
                req.params.languagePairId
            );

            return res.status(200).json(result);
        } catch (error) {
            return res.status(404).json({
                message:
                    error instanceof Error
                        ? error.message
                        : "Failed to remove language pair",
            });
        }
    }
}
