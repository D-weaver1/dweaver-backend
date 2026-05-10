import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { REFRESH_COOKIE_NAME } from "./constants/auth.constants";
import { clearRefreshCookie, setRefreshCookie } from "./utils/cookie.util";
import { AuthRequest } from "./types/auth-request.type";

const authService = new AuthService();

export class AuthController {
    async register(req: Request, res: Response) {
        try {
            const user = await authService.register(req.body);

            return res.status(201).json({
                user,
            });
        } catch (error) {
            return res.status(400).json({
                message:
                    error instanceof Error
                        ? error.message
                        : "Registration failed",
            });
        }
    }

    async login(req: Request, res: Response) {
        try {
            const result = await authService.login(req.body);

            setRefreshCookie(res, result.refreshToken);

            return res.status(200).json({
                accessToken: result.accessToken,
                user: result.user,
            });
        } catch (error) {
            return res.status(401).json({
                message:
                    error instanceof Error ? error.message : "Login failed",
            });
        }
    }

    async refresh(req: Request, res: Response) {
        try {
            const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

            const result = await authService.refresh(refreshToken);

            setRefreshCookie(res, result.refreshToken);

            return res.status(200).json({
                accessToken: result.accessToken,
                user: result.user,
            });
        } catch (error) {
            clearRefreshCookie(res);

            return res.status(401).json({
                message:
                    error instanceof Error ? error.message : "Refresh failed",
            });
        }
    }

    async logout(req: Request, res: Response) {
        const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

        await authService.logout(refreshToken);

        clearRefreshCookie(res);

        return res.status(200).json({
            message: "Logged out successfully",
        });
    }

    async me(req: AuthRequest, res: Response) {
        return res.status(200).json({
            user: req.user,
        });
    }
}
