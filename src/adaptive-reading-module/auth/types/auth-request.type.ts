import { Request } from "express";
import { UserRole } from "../../../entities/enums";

export interface AuthUser {
    id: string;
    role: UserRole;
}

export interface AuthRequest extends Request {
    user?: AuthUser;
}
