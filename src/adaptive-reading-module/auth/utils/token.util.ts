import crypto from "crypto";
import jwt from "jsonwebtoken";
import {
    ACCESS_TOKEN_EXPIRES_IN,
    ACCESS_TOKEN_SECRET,
} from "../constants/auth.constants";
import { JwtPayload } from "../types/jwt-payload.type";
import { UserRole } from "../../../entities/enums";

export function createAccessToken(userId: string, role: UserRole): string {
    const payload: JwtPayload = {
        sub: userId,
        role,
    };

    return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
        expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    });
}

export function verifyAccessToken(token: string): JwtPayload {
    return jwt.verify(token, ACCESS_TOKEN_SECRET) as JwtPayload;
}

export function generateRefreshToken(): string {
    return crypto.randomBytes(64).toString("hex");
}

export function hashRefreshToken(refreshToken: string): string {
    return crypto.createHash("sha256").update(refreshToken).digest("hex");
}
