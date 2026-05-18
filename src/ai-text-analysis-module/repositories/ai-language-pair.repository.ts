import { DataSource, Repository } from "typeorm";
import { Language, LanguagePair } from "../../entities";

export class AiLanguagePairRepository {
    private readonly languageRepository: Repository<Language>;
    private readonly languagePairRepository: Repository<LanguagePair>;

    constructor(private readonly dataSource: DataSource) {
        this.languageRepository = this.dataSource.getRepository(Language);
        this.languagePairRepository =
            this.dataSource.getRepository(LanguagePair);
    }

    async findLanguageByNameOrCode(value: string): Promise<Language | null> {
        const normalizedValue = value.trim();

        return this.languageRepository.findOne({
            where: [{ name: normalizedValue }, { code: normalizedValue }],
        });
    }

    async findLanguagePair(
        sourceLanguageId: string,
        targetLanguageId: string
    ): Promise<LanguagePair | null> {
        return this.languagePairRepository.findOne({
            where: {
                sourceLanguage: {
                    id: sourceLanguageId,
                },
                targetLanguage: {
                    id: targetLanguageId,
                },
            },
            relations: {
                sourceLanguage: true,
                targetLanguage: true,
            },
        });
    }
}