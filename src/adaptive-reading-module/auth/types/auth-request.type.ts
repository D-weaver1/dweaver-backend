import { Request, Response } from "express";
import { UserRole } from "../../../entities/enums";

export interface AuthUser {
    id: string;
    role: UserRole;
}

export interface AuthRequest extends Request {
    user?: AuthUser;
}

export type AuthResponse<ResBody = unknown> = Response<
    ResBody,
    { user: AuthUser }
>;
