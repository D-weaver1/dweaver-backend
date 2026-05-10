import { CookieOptions, Response } from "express";
import {
    REFRESH_COOKIE_NAME,
    REFRESH_TOKEN_EXPIRES_DAYS,
} from "../constants/auth.constants";

function getRefreshCookieOptions(): CookieOptions {
    const isProduction = process.env.NODE_ENV === "production";

    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        path: "/auth",
        maxAge: REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
    };
}

export function setRefreshCookie(res: Response, refreshToken: string): void {
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions());
}

export function clearRefreshCookie(res: Response): void {
    res.clearCookie(REFRESH_COOKIE_NAME, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/auth",
    });
}
