import { AiLanguagePairRepository } from "../repositories/ai-language-pair.repository";

export class LanguagePairValidatorService {
    constructor(
        private readonly aiLanguagePairRepository: AiLanguagePairRepository
    ) {}

    async validate(sourceLanguage: string, targetLanguage: string): Promise<{
        sourceLanguageId: string;
        targetLanguageId: string;
        languagePairId: string;
    }> {
        const sourceLanguageEntity =
            await this.aiLanguagePairRepository.findLanguageByNameOrCode(
                sourceLanguage
            );

        if (!sourceLanguageEntity) {
            throw new Error(`Source language not found: ${sourceLanguage}`);
        }

        const targetLanguageEntity =
            await this.aiLanguagePairRepository.findLanguageByNameOrCode(
                targetLanguage
            );

        if (!targetLanguageEntity) {
            throw new Error(`Target language not found: ${targetLanguage}`);
        }

        if (sourceLanguageEntity.id === targetLanguageEntity.id) {
            throw new Error(
                "Source language and target language must be different"
            );
        }

        const languagePair = await this.aiLanguagePairRepository.findLanguagePair(
            sourceLanguageEntity.id,
            targetLanguageEntity.id
        );

        if (!languagePair) {
            throw new Error(
                `Language pair not found: ${sourceLanguage} -> ${targetLanguage}`
            );
        }

        return {
            sourceLanguageId: sourceLanguageEntity.id,
            targetLanguageId: targetLanguageEntity.id,
            languagePairId: languagePair.id,
        };
    }
}