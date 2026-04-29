import { Router } from "express";
import { MaterialProcessingController } from "./material-processing.controller";
import { MaterialProcessingService } from "./material-processing.service";

const router = Router();

const materialProcessingService = new MaterialProcessingService();

const materialProcessingController = new MaterialProcessingController(
    materialProcessingService
);

router.post("/", materialProcessingController.create);

export default router;
