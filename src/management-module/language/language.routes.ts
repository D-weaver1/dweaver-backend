import { Router } from "express";
import { LanguageController } from "./language.controller";
import { LanguageService } from "./language.service";
import { LanguageRepository } from "./repositories/language.repository";

const router = Router();

const languageRepository = new LanguageRepository();
const languageService = new LanguageService(languageRepository);
const languageController = new LanguageController(languageService);

router.get("/", languageController.getAll);
router.post("/", languageController.create);

export default router;