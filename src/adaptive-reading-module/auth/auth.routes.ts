import { Router } from "express";
import { AuthController } from "./auth.controller";
import { authMiddleware } from "./middlewares/auth.middleware";

const router = Router();
const authController = new AuthController();

router.post("/register", authController.register.bind(authController));
router.post("/login", authController.login.bind(authController));
router.post("/refresh", authController.refresh.bind(authController));
router.post("/logout", authController.logout.bind(authController));
router.get("/me", authMiddleware, authController.me.bind(authController));

export default router;
