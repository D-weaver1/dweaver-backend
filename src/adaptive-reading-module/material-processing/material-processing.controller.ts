import { Request, Response } from "express";
import { MaterialProcessingService } from "./material-processing.service";
import { CreateMaterialProcessingDto } from "./dto/create-material-processing.dto";

export class MaterialProcessingController {
    constructor(
        private readonly materialProcessingService: MaterialProcessingService
    ) {}

    create = (req: Request, res: Response): void => {
        try {
            const dto = req.body as CreateMaterialProcessingDto;

            const result =
                this.materialProcessingService.createMaterialFromJson(dto);

            res.status(201).json(result);
        } catch {
            res.status(500).json({
                message: "Failed to process material",
            });
        }
    };
}
