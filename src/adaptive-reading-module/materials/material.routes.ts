import { Router } from "express";
import db from "../../data-source";
import { MaterialController } from "./material.controller";
import { MaterialService } from "./material.service";
import { MaterialRepository } from "./repositories/material.repository";
import { UserLanguagePairRepository } from "./repositories/user-language-pair.repository";

const router = Router();

const userLanguagePairRepository = new UserLanguagePairRepository();
const materialRepository = new MaterialRepository();

const materialService = new MaterialService(
    db,
    userLanguagePairRepository,
    materialRepository
);

const materialController = new MaterialController(materialService);

router.get("/", materialController.getAll);

export default router;
