import { Router } from "express";
import db from "../../data-source";
import { MaterialProcessingController } from "./material-processing.controller";
import { MaterialProcessingService } from "./material-processing.service";
import { LanguagePairRepository } from "./repositories/language-pair.repository";
import { MaterialProcessingRepository } from "./repositories/material-processing.repository";

const router = Router();

const languagePairRepository = new LanguagePairRepository();
const materialProcessingRepository = new MaterialProcessingRepository();

const materialProcessingService = new MaterialProcessingService(
    db,
    languagePairRepository,
    materialProcessingRepository
);

const materialProcessingController = new MaterialProcessingController(
    materialProcessingService
);

router.post("/", materialProcessingController.create);

export default router;
