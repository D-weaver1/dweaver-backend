import { Response } from "express";
import { AuthRequest } from "../auth/types/auth-request.type";
import { MaterialLevelService } from "./material-level.service";

export class MaterialLevelController {
    constructor(private readonly materialLevelService: MaterialLevelService) {}

    getLevels = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const userId = req.user?.id;

            if (!userId) {
                res.status(401).json({
                    message: "Unauthorized",
                });
                return;
            }

            const { materialId } = req.params;

            const result = await this.materialLevelService.getMaterialLevels(
                materialId,
                userId
            );

            res.status(200).json(result);
        } catch (error) {
            console.error(error);

            res.status(400).json({
                message:
                    error instanceof Error
                        ? error.message
                        : "Failed to get material levels",
            });
        }
    };

    getReading = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const userId = req.user?.id;

            if (!userId) {
                res.status(401).json({
                    message: "Unauthorized",
                });
                return;
            }

            const { materialId, levelId } = req.params;

            const result =
                await this.materialLevelService.getMaterialLevelReading(
                    materialId,
                    levelId,
                    userId
                );

            res.status(200).json(result);
        } catch (error) {
            console.error(error);

            res.status(400).json({
                message:
                    error instanceof Error
                        ? error.message
                        : "Failed to get material level reading",
            });
        }
    };

    startLevel = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const userId = req.user?.id;

            if (!userId) {
                res.status(401).json({
                    message: "Unauthorized",
                });
                return;
            }

            const { materialId, levelId } = req.params;

            const result = await this.materialLevelService.startMaterialLevel(
                materialId,
                levelId,
                userId
            );

            res.status(200).json(result);
        } catch (error) {
            console.error(error);

            res.status(400).json({
                message:
                    error instanceof Error
                        ? error.message
                        : "Failed to start material level",
            });
        }
    };

    completeLevel = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const userId = req.user?.id;

            if (!userId) {
                res.status(401).json({
                    message: "Unauthorized",
                });
                return;
            }

            const { materialId, levelId } = req.params;

            const result =
                await this.materialLevelService.completeMaterialLevel(
                    materialId,
                    levelId,
                    userId
                );

            res.status(200).json(result);
        } catch (error) {
            console.error(error);

            res.status(400).json({
                message:
                    error instanceof Error
                        ? error.message
                        : "Failed to complete material level",
            });
        }
    };

    getMaterialsProgressSummary = async (
        req: AuthRequest,
        res: Response
    ): Promise<void> => {
        try {
            const userId = req.user?.id;

            if (!userId) {
                res.status(401).json({
                    message: "Unauthorized",
                });
                return;
            }

            const materialIdsQuery = req.query.materialIds;

            const materialIds =
                typeof materialIdsQuery === "string" &&
                materialIdsQuery.trim().length > 0
                    ? materialIdsQuery
                          .split(",")
                          .map((id) => id.trim())
                          .filter(Boolean)
                    : undefined;

            const result =
                await this.materialLevelService.getMaterialsProgressSummary(
                    userId,
                    materialIds
                );

            res.status(200).json(result);
        } catch (error) {
            console.error(error);

            res.status(400).json({
                message:
                    error instanceof Error
                        ? error.message
                        : "Failed to get materials progress summary",
            });
        }
    };
}
