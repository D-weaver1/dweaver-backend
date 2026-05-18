import { In, Not } from "typeorm";
import db from "../../data-source";
import { LanguagePair } from "../../entities/LanguagePair.entity";
import { User } from "../../entities/User.entity";
import { UserLanguagePair } from "../../entities/UserLanguagePair.entity";
import { UserLanguagePairStatus } from "../../entities/enums";
import { AddUserLanguagePairDto } from "./dto/add-user-language-pair.dto";

export class UserLanguagePairService {
    private userRepository = db.getRepository(User);
    private languagePairRepository = db.getRepository(LanguagePair);
    private userLanguagePairRepository = db.getRepository(UserLanguagePair);

    private buildUserLanguagePairResponse(userLanguagePair: UserLanguagePair) {
        return {
            id: userLanguagePair.id,
            status: userLanguagePair.status,
            lastUsed: userLanguagePair.lastUsed,
            languagePair: this.buildLanguagePairResponse(
                userLanguagePair.languagePair
            ),
        };
    }

    private buildLanguagePairResponse(languagePair: LanguagePair) {
        return {
            id: languagePair.id,
            sourceLanguage: {
                id: languagePair.sourceLanguage.id,
                name: languagePair.sourceLanguage.name,
                code: languagePair.sourceLanguage.code,
            },
            targetLanguage: {
                id: languagePair.targetLanguage.id,
                name: languagePair.targetLanguage.name,
                code: languagePair.targetLanguage.code,
            },
        };
    }

    async getState(userId: string) {
        const selectedPairs = await this.userLanguagePairRepository.find({
            where: {
                user: { id: userId },
                status: UserLanguagePairStatus.ACTIVE,
            },
            relations: {
                languagePair: {
                    sourceLanguage: true,
                    targetLanguage: true,
                },
            },
            order: {
                lastUsed: "DESC",
            },
        });

        const currentPair =
            selectedPairs.find((item) => item.lastUsed !== null) ?? null;

        return {
            shouldChooseLanguagePair: currentPair === null,
            currentLanguagePair: currentPair
                ? this.buildLanguagePairResponse(currentPair.languagePair)
                : null,
            selectedLanguagePairs: selectedPairs.map((item) =>
                this.buildUserLanguagePairResponse(item)
            ),
        };
    }

    async addLanguagePair(userId: string, dto: AddUserLanguagePairDto) {
        const languagePairId = dto.languagePairId?.trim();

        if (!languagePairId) {
            throw new Error("Language pair id is required");
        }

        const user = await this.userRepository.findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new Error("User not found");
        }

        const languagePair = await this.languagePairRepository.findOne({
            where: { id: languagePairId },
            relations: {
                sourceLanguage: true,
                targetLanguage: true,
            },
        });

        if (!languagePair) {
            throw new Error("Language pair not found");
        }

        const existingUserLanguagePair =
            await this.userLanguagePairRepository.findOne({
                where: {
                    user: { id: userId },
                    languagePair: { id: languagePairId },
                },
                relations: {
                    languagePair: {
                        sourceLanguage: true,
                        targetLanguage: true,
                    },
                },
            });

        if (
            existingUserLanguagePair &&
            existingUserLanguagePair.status === UserLanguagePairStatus.ACTIVE
        ) {
            throw new Error("Language pair is already selected");
        }

        if (
            existingUserLanguagePair &&
            existingUserLanguagePair.status === UserLanguagePairStatus.HIDDEN
        ) {
            existingUserLanguagePair.status = UserLanguagePairStatus.ACTIVE;

            await this.userLanguagePairRepository.save(
                existingUserLanguagePair
            );

            return this.getState(userId);
        }

        const activePairsCount = await this.userLanguagePairRepository.count({
            where: {
                user: { id: userId },
                status: UserLanguagePairStatus.ACTIVE,
            },
        });

        const userLanguagePair = this.userLanguagePairRepository.create({
            user,
            languagePair,
            status: UserLanguagePairStatus.ACTIVE,
            lastUsed: activePairsCount === 0 ? new Date() : null,
        });

        await this.userLanguagePairRepository.save(userLanguagePair);

        return this.getState(userId);
    }
    async getAvailableLanguagePairs(userId: string) {
        const selectedPairs = await this.userLanguagePairRepository.find({
            where: {
                user: { id: userId },
                status: UserLanguagePairStatus.ACTIVE,
            },
            relations: {
                languagePair: true,
            },
        });

        const selectedLanguagePairIds = selectedPairs.map(
            (item) => item.languagePair.id
        );

        const where =
            selectedLanguagePairIds.length > 0
                ? { id: Not(In(selectedLanguagePairIds)) }
                : {};

        const languagePairs = await this.languagePairRepository.find({
            where,
            relations: {
                sourceLanguage: true,
                targetLanguage: true,
            },
        });

        return languagePairs.map((languagePair) =>
            this.buildLanguagePairResponse(languagePair)
        );
    }

    async selectLanguagePair(userId: string, languagePairId: string) {
        const userLanguagePair = await this.userLanguagePairRepository.findOne({
            where: {
                user: { id: userId },
                languagePair: { id: languagePairId },
                status: UserLanguagePairStatus.ACTIVE,
            },
        });

        if (!userLanguagePair) {
            throw new Error("User language pair not found");
        }

        userLanguagePair.lastUsed = new Date();

        await this.userLanguagePairRepository.save(userLanguagePair);

        return this.getState(userId);
    }

    async getCurrentLanguagePairId(userId: string): Promise<string | null> {
        const activePairs = await this.userLanguagePairRepository.find({
            where: {
                user: { id: userId },
                status: UserLanguagePairStatus.ACTIVE,
            },
            relations: {
                languagePair: true,
            },
            order: {
                lastUsed: "DESC",
            },
        });

        const currentPair =
            activePairs.find((item) => item.lastUsed !== null) ?? null;

        return currentPair?.languagePair.id ?? null;
    }

    async getSettingsState(userId: string) {
        const userLanguagePairs = await this.userLanguagePairRepository.find({
            where: {
                user: { id: userId },
            },
            relations: {
                languagePair: {
                    sourceLanguage: true,
                    targetLanguage: true,
                },
            },
            order: {
                lastUsed: "DESC",
            },
        });

        const activePairs = userLanguagePairs.filter(
            (item) => item.status === UserLanguagePairStatus.ACTIVE
        );

        const currentPair =
            activePairs.find((item) => item.lastUsed !== null) ?? null;

        return {
            shouldChooseLanguagePair: currentPair === null,
            currentLanguagePair: currentPair
                ? this.buildLanguagePairResponse(currentPair.languagePair)
                : null,
            userLanguagePairs: userLanguagePairs.map((item) =>
                this.buildUserLanguagePairResponse(item)
            ),
        };
    }

    private async changeLanguagePairStatus(
        userId: string,
        languagePairId: string,
        status: UserLanguagePairStatus
    ) {
        const userLanguagePair = await this.userLanguagePairRepository.findOne({
            where: {
                user: { id: userId },
                languagePair: { id: languagePairId },
            },
        });

        if (!userLanguagePair) {
            throw new Error("User language pair not found");
        }

        userLanguagePair.status = status;

        await this.userLanguagePairRepository.save(userLanguagePair);

        return this.getSettingsState(userId);
    }

    async activateLanguagePair(userId: string, languagePairId: string) {
        return this.changeLanguagePairStatus(
            userId,
            languagePairId,
            UserLanguagePairStatus.ACTIVE
        );
    }

    async hideLanguagePair(userId: string, languagePairId: string) {
        const userLanguagePair = await this.userLanguagePairRepository.findOne({
            where: {
                user: { id: userId },
                languagePair: { id: languagePairId },
            },
        });

        if (!userLanguagePair) {
            throw new Error("User language pair not found");
        }

        userLanguagePair.status = UserLanguagePairStatus.HIDDEN;

        if (userLanguagePair.lastUsed !== null) {
            userLanguagePair.lastUsed = null;
        }

        await this.userLanguagePairRepository.save(userLanguagePair);

        return this.getSettingsState(userId);
    }

    async removeLanguagePair(userId: string, languagePairId: string) {
        const userLanguagePair = await this.userLanguagePairRepository.findOne({
            where: {
                user: { id: userId },
                languagePair: { id: languagePairId },
            },
        });

        if (!userLanguagePair) {
            throw new Error("User language pair not found");
        }

        await this.userLanguagePairRepository.remove(userLanguagePair);

        return this.getSettingsState(userId);
    }
}
