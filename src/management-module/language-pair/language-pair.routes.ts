import { Router } from "express";
import { LanguagePairController } from "./language-pair.controller";
import { LanguagePairService } from "./language-pair.service";
import { LanguagePairRepository } from "./repositories/language-pair.repository";
import { authMiddleware } from "../../adaptive-reading-module/auth/middlewares/auth.middleware";
import { rolesMiddleware } from "../../adaptive-reading-module/auth/middlewares/roles.middleware";
import { UserRole } from "../../entities/enums";

const router = Router();

const languagePairRepository = new LanguagePairRepository();
const languagePairService = new LanguagePairService(languagePairRepository);
const languagePairController = new LanguagePairController(languagePairService);

router.get("/", languagePairController.getAll);

router.post(
    "/",
    authMiddleware,
    rolesMiddleware(UserRole.ADMIN),
    languagePairController.create
);

export default router;
