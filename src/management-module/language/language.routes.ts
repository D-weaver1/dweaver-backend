import { Router } from "express";
import { LanguageController } from "./language.controller";
import { LanguageService } from "./language.service";
import { LanguageRepository } from "./repositories/language.repository";
import { authMiddleware } from "../../adaptive-reading-module/auth/middlewares/auth.middleware";
import { rolesMiddleware } from "../../adaptive-reading-module/auth/middlewares/roles.middleware";
import { UserRole } from "../../entities/enums";

const router = Router();

const languageRepository = new LanguageRepository();
const languageService = new LanguageService(languageRepository);
const languageController = new LanguageController(languageService);

router.get("/", languageController.getAll);

router.post(
    "/",
    authMiddleware,
    rolesMiddleware(UserRole.ADMIN),
    languageController.create
);

export default router;
