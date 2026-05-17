import { Request, Response } from "express";
import { MaterialService } from "./material.service";
import { GetMaterialsQueryDto } from "./dto/get-materials-query.dto";

type AuthenticatedRequest = Request & {
    user?: {
        id: string;
    };
};

export class MaterialController {
    constructor(private readonly materialService: MaterialService) {}

    getAll = async (
        req: AuthenticatedRequest,
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

            const dto = req.query as GetMaterialsQueryDto;

            const result = await this.materialService.getMaterials(userId, dto);

            res.status(200).json(result);
        } catch (error) {
            console.error(error);

            res.status(this.getStatusCode(error)).json({
                message: "Failed to load materials",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    };

    private getStatusCode(error: unknown): number {
        if (!(error instanceof Error)) {
            return 500;
        }

        if (
            error.message === "Current language pair not selected" ||
            error.message.startsWith("Invalid material level filter")
        ) {
            return 400;
        }

        return 500;
    }
}
