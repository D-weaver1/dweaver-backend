import { NextFunction, Response } from "express";
import { UserRole } from "../../../entities/enums";
import { AuthRequest } from "../types/auth-request.type";

export function rolesMiddleware(...allowedRoles: UserRole[]) {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: "Forbidden",
            });
        }

        return next();
    };
}
