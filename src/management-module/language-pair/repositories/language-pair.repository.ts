import { Repository } from "typeorm";
import db from "../../../data-source";
import { Language, LanguagePair } from "../../../entities";

export class LanguagePairRepository {
    private readonly languageRepository: Repository<Language>;
    private readonly languagePairRepository: Repository<LanguagePair>;

    constructor() {
        this.languageRepository = db.getRepository(Language);
        this.languagePairRepository = db.getRepository(LanguagePair);
    }

    async findAll(): Promise<LanguagePair[]> {
        return this.languagePairRepository.find({
            relations: {
                sourceLanguage: true,
                targetLanguage: true,
            },
            order: {
                sourceLanguage: {
                    name: "ASC",
                },
                targetLanguage: {
                    name: "ASC",
                },
            },
        });
    }

    async findLanguageById(id: string): Promise<Language | null> {
        return this.languageRepository.findOne({
            where: {
                id,
            },
        });
    }

    async findExistingPair(
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

    async create(
        sourceLanguage: Language,
        targetLanguage: Language
    ): Promise<LanguagePair> {
        const languagePair = this.languagePairRepository.create({
            sourceLanguage,
            targetLanguage,
        });

        return this.languagePairRepository.save(languagePair);
    }
}