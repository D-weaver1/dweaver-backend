import { Router } from "express";
import { LanguagePairController } from "./language-pair.controller";
import { LanguagePairService } from "./language-pair.service";
import { LanguagePairRepository } from "./repositories/language-pair.repository";

const router = Router();

const languagePairRepository = new LanguagePairRepository();
const languagePairService = new LanguagePairService(languagePairRepository);
const languagePairController = new LanguagePairController(languagePairService);

router.get("/", languagePairController.getAll);
router.post("/", languagePairController.create);

export default router;