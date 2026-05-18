import { Router } from "express";
import db from "../../data-source";
import { MaterialLevelController } from "./material-level.controller";
import { MaterialLevelService } from "./material-level.service";
import { MaterialLevelRepository } from "./repositories/material-level.repository";

const router = Router();

const materialLevelRepository = new MaterialLevelRepository(db);

const materialLevelService = new MaterialLevelService(materialLevelRepository);

const materialLevelController = new MaterialLevelController(
    materialLevelService
);

router.get("/:materialId/levels", materialLevelController.getLevels);

router.get(
    "/:materialId/levels/:levelId/reading",
    materialLevelController.getReading
);

export default router;
