import { EntityManager } from "typeorm";
import { Language, LanguagePair } from "../../../entities";

export class LanguagePairRepository {
    async findLanguagePairId(
        manager: EntityManager,
        sourceLanguage: string,
        targetLanguage: string
    ): Promise<string> {
        const languageRepository = manager.getRepository(Language);
        const languagePairRepository = manager.getRepository(LanguagePair);

        const sourceLanguageEntity = await languageRepository.findOne({
            where: [{ name: sourceLanguage }, { code: sourceLanguage }],
        });

        if (!sourceLanguageEntity) {
            throw new Error(`Source language not found: ${sourceLanguage}`);
        }

        const targetLanguageEntity = await languageRepository.findOne({
            where: [{ name: targetLanguage }, { code: targetLanguage }],
        });

        if (!targetLanguageEntity) {
            throw new Error(`Target language not found: ${targetLanguage}`);
        }

        const languagePair = await languagePairRepository.findOne({
            where: {
                sourceLanguage: {
                    id: sourceLanguageEntity.id,
                },
                targetLanguage: {
                    id: targetLanguageEntity.id,
                },
            },
        });

        if (!languagePair) {
            throw new Error(
                `Language pair not found: ${sourceLanguage} -> ${targetLanguage}`
            );
        }

        return languagePair.id;
    }
}
