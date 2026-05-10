import { IsNull, MoreThan } from "typeorm";
import db from "../../data-source";
import { User } from "../../entities/User.entity";
import { UserRole } from "../../entities/enums";
import { RefreshToken } from "../../entities/Refresh-token.entity";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { REFRESH_TOKEN_EXPIRES_DAYS } from "./constants/auth.constants";
import { comparePassword, hashPassword } from "./utils/password.util";
import {
    createAccessToken,
    generateRefreshToken,
    hashRefreshToken,
} from "./utils/token.util";

export class AuthService {
    private userRepository = db.getRepository(User);
    private refreshTokenRepository = db.getRepository(RefreshToken);

    async register(dto: RegisterDto) {
        const name = dto.name?.trim();
        const email = dto.email?.trim().toLowerCase();
        const password = dto.password;

        if (!name || !email || !password) {
            throw new Error("Name, email and password are required");
        }

        if (password.length < 6) {
            throw new Error("Password must be at least 6 characters");
        }

        const existingUser = await this.userRepository.findOne({
            where: { email },
        });

        if (existingUser) {
            throw new Error("User with this email already exists");
        }

        const passwordHash = await hashPassword(password);

        const user = this.userRepository.create({
            name,
            email,
            passwordHash,
            role: UserRole.USER,
        });

        const savedUser = await this.userRepository.save(user);

        return this.buildUserResponse(savedUser);
    }

    async login(dto: LoginDto) {
        const email = dto.email?.trim().toLowerCase();
        const password = dto.password;

        if (!email || !password) {
            throw new Error("Email and password are required");
        }

        const user = await this.userRepository
            .createQueryBuilder("user")
            .addSelect("user.passwordHash")
            .where("user.email = :email", { email })
            .getOne();

        if (!user) {
            throw new Error("Invalid email or password");
        }

        const isPasswordValid = await comparePassword(
            password,
            user.passwordHash
        );

        if (!isPasswordValid) {
            throw new Error("Invalid email or password");
        }

        const accessToken = createAccessToken(user.id, user.role);
        const refreshToken = await this.createRefreshToken(user);

        return {
            accessToken,
            refreshToken,
            user: this.buildUserResponse(user),
        };
    }

    async refresh(refreshToken: string | undefined) {
        if (!refreshToken) {
            throw new Error("Refresh token is missing");
        }

        const tokenHash = hashRefreshToken(refreshToken);

        const savedToken = await this.refreshTokenRepository.findOne({
            where: {
                tokenHash,
                revokedAt: IsNull(),
                expiresAt: MoreThan(new Date()),
            },
            relations: {
                user: true,
            },
        });

        if (!savedToken) {
            throw new Error("Invalid refresh token");
        }

        savedToken.revokedAt = new Date();
        await this.refreshTokenRepository.save(savedToken);

        const newAccessToken = createAccessToken(
            savedToken.user.id,
            savedToken.user.role
        );

        const newRefreshToken = await this.createRefreshToken(savedToken.user);

        return {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            user: this.buildUserResponse(savedToken.user),
        };
    }

    async logout(refreshToken: string | undefined): Promise<void> {
        if (!refreshToken) {
            return;
        }

        const tokenHash = hashRefreshToken(refreshToken);

        const savedToken = await this.refreshTokenRepository.findOne({
            where: {
                tokenHash,
                revokedAt: IsNull(),
            },
        });

        if (!savedToken) {
            return;
        }

        savedToken.revokedAt = new Date();
        await this.refreshTokenRepository.save(savedToken);
    }

    private async createRefreshToken(user: User): Promise<string> {
        const refreshToken = generateRefreshToken();
        const tokenHash = hashRefreshToken(refreshToken);

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);

        const tokenEntity = this.refreshTokenRepository.create({
            tokenHash,
            user,
            expiresAt,
            revokedAt: null,
        });

        await this.refreshTokenRepository.save(tokenEntity);

        return refreshToken;
    }

    private buildUserResponse(user: User) {
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        };
    }
}
