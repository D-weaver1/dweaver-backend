import { Router } from "express";
import { authMiddleware } from "../auth/middlewares/auth.middleware";
import { UserLanguagePairController } from "./user-language-pair.controller";

const router = Router();
const userLanguagePairController = new UserLanguagePairController();

router.get(
    "/state",
    authMiddleware,
    userLanguagePairController.getState.bind(userLanguagePairController)
);

router.get(
    "/available",
    authMiddleware,
    userLanguagePairController.getAvailableLanguagePairs.bind(
        userLanguagePairController
    )
);

router.post(
    "/",
    authMiddleware,
    userLanguagePairController.addLanguagePair.bind(userLanguagePairController)
);

router.patch(
    "/:languagePairId/select",
    authMiddleware,
    userLanguagePairController.selectLanguagePair.bind(
        userLanguagePairController
    )
);

export default router;
