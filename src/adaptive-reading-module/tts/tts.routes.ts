import { Router } from "express";
import { authMiddleware } from "../auth/middlewares/auth.middleware";
import { TtsController } from "./tts.controller";

const router = Router();
const ttsController = new TtsController();

router.post(
    "/pronunciation",
    authMiddleware,
    ttsController.pronunciation.bind(ttsController)
);

export default router;
