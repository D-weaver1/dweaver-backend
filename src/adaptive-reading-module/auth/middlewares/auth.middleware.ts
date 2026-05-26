import { NextFunction, Response } from "express";
import { AuthRequest } from "../types/auth-request.type";
import { verifyAccessToken } from "../utils/token.util";

export function authMiddleware(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            message: "Authorization header is missing",
        });
    }

    const [type, token] = authHeader.split(" ");

    if (type !== "Bearer" || !token) {
        return res.status(401).json({
            message: "Invalid authorization header",
        });
    }

    try {
        const payload = verifyAccessToken(token);

        res.locals.user = {
            id: payload.sub,
            role: payload.role,
        };
        req.user = {
            id: payload.sub,
            role: payload.role,
        };

        return next();
    } catch {
        return res.status(401).json({
            message: "Invalid or expired access token",
        });
    }
}
