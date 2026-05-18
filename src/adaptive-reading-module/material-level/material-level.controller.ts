import { Request, Response } from "express";
import { MaterialLevelService } from "./material-level.service";

export class MaterialLevelController {
    constructor(private readonly materialLevelService: MaterialLevelService) {}

    getLevels = async (req: Request, res: Response): Promise<void> => {
        try {
            const { materialId } = req.params;

            const result =
                await this.materialLevelService.getMaterialLevels(materialId);

            res.status(200).json(result);
        } catch (error) {
            console.error(error);

            res.status(500).json({
                message: "Failed to get material levels",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    };

    getReading = async (req: Request, res: Response): Promise<void> => {
        try {
            const { materialId, levelId } = req.params;

            const result =
                await this.materialLevelService.getMaterialLevelReading(
                    materialId,
                    levelId
                );

            res.status(200).json(result);
        } catch (error) {
            console.error(error);

            res.status(500).json({
                message: "Failed to get material level reading",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    };
}
