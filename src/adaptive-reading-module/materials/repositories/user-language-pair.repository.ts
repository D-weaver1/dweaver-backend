import { EntityManager } from "typeorm";
import { UserLanguagePair } from "../../../entities";

export class UserLanguagePairRepository {
    async findCurrentLanguagePairId(
        manager: EntityManager,
        userId: string
    ): Promise<string> {
        const result = await manager
            .getRepository(UserLanguagePair)
            .createQueryBuilder("userLanguagePair")
            .select("userLanguagePair.language_pair_id", "languagePairId")
            .where("userLanguagePair.user_id = :userId", { userId })
            .orderBy("userLanguagePair.last_used", "DESC", "NULLS LAST")
            .getRawOne<{ languagePairId: string }>();

        if (!result) {
            throw new Error("Current language pair not selected");
        }

        return result.languagePairId;
    }
}
