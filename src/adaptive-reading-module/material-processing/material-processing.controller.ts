import { Request, Response } from "express";
import { MaterialProcessingService } from "./material-processing.service";
import { CreateMaterialProcessingDto } from "./dto/create-material-processing.dto";

export class MaterialProcessingController {
    constructor(
        private readonly materialProcessingService: MaterialProcessingService
    ) {}

    create = async (req: Request, res: Response): Promise<void> => {
        try {
            const dto = req.body as CreateMaterialProcessingDto;

            const result =
                await this.materialProcessingService.createMaterialFromJson(
                    dto
                );

            res.status(201).json(result);
        } catch (error) {
            console.error(error);

            res.status(500).json({
                message: "Failed to process material",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    };
}
