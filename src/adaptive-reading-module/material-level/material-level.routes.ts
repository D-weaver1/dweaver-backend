import { Router } from "express";
import db from "../../data-source";
import { authMiddleware } from "../auth/middlewares/auth.middleware";
import { MaterialLevelController } from "./material-level.controller";
import { MaterialLevelService } from "./material-level.service";
import { MaterialLevelRepository } from "./repositories/material-level.repository";

const router = Router();

const materialLevelRepository = new MaterialLevelRepository(db);

const materialLevelService = new MaterialLevelService(materialLevelRepository);

const materialLevelController = new MaterialLevelController(
    materialLevelService
);

router.get(
    "/progress-summary",
    authMiddleware,
    materialLevelController.getMaterialsProgressSummary.bind(
        materialLevelController
    )
);

router.get(
    "/:materialId/levels",
    authMiddleware,
    materialLevelController.getLevels.bind(materialLevelController)
);

router.get(
    "/:materialId/levels/:levelId/reading",
    authMiddleware,
    materialLevelController.getReading.bind(materialLevelController)
);

router.post(
    "/:materialId/levels/:levelId/start",
    authMiddleware,
    materialLevelController.startLevel.bind(materialLevelController)
);

router.patch(
    "/:materialId/levels/:levelId/complete",
    authMiddleware,
    materialLevelController.completeLevel.bind(materialLevelController)
);

export default router;
